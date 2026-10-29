// Fits Automated Animations' built-in OSE support to how the OSE system posts chat cards.
//
// AA's OSE handler animates every chat message that carries an item id. In OSE that means:
//  - attack rolls (one message per target, damage already rolled inside) - wanted
//  - item cards from casting a spell or using an item - wanted for spells, abilities, items
//  - item cards for weapons and armour (clicking the name to show it) - not wanted
//  - damage rolls from a card's button - would replay the attack animation
// Area spells use the template placed when casting (templates.js); without one they play on
// the target token or around the caster.

const MODULE_ID = "ose-animations";
const NT = " §"; // label suffix of the token-based twin of a template animation (see build_autorec.py)
const CARD_TYPES = ["spell", "ability", "item"];
const BREATH_TYPES = [
	["Fire", /\b(red|fire|flame|hell|salamander|magma|chimera)/i],
	["Cold", /\b(white|cold|frost|ice|winter)/i],
	["Lightning", /\b(blue|lightning|storm|electric)/i],
	["Acid", /\b(black|acid)/i],
	["Poison", /\b(green|poison|gas|gorgon|chlorine)/i],
];

function setting(key) {
	return game.settings.get(MODULE_ID, key);
}

function debug(...args) {
	if (setting("debug")) console.log("OSE Animations |", ...args);
}

function chatDom(msg) {
	const div = document.createElement("div");
	div.innerHTML = msg.content ?? "";
	return div;
}

function classify(msg, dom) {
	if (msg.flags?.ose?.roll === "attack") return "attack";
	if (dom.querySelector(".chat-card.item-card")) return "card";
	return "roll";
}

function isDamageRoll(dom) {
	const title = dom.querySelector(".chat-title h2")?.textContent?.trim() ?? "";
	return title.endsWith(`- ${game.i18n.localize("OSE.Damage")}`);
}

function breathType(item, actor) {
	const haystack = `${item.name} ${actor?.name ?? ""} ${item.system?.description ?? ""}`;
	return BREATH_TYPES.find(([, re]) => re.test(haystack))?.[0];
}

// "Breath (Fire)" etc. for a monster's untyped breath weapon, or null.
function breathLabel(item) {
	if (!/^breath\b/i.test(item?.name ?? "") || item.name.includes("(")) return null;
	const type = breathType(item, item.actor);
	return type ? `Breath (${type})` : null;
}

// OSE formula rolls (Magic Missile, Cure Light Wounds...) use the Item as the chat speaker, and
// items on unlinked tokens live on synthetic actors, so AA's own lookup often comes back empty.
// Find the token whose actor owns the item named on the card, preferring the user's own tokens.
function resolveItem(msg, dom) {
	const card = dom.querySelector(".chat-card[data-item-id]");
	const itemId = msg.flags?.ose?.itemId || card?.dataset.itemId;
	if (!itemId) return null;
	const actorId = card?.dataset.actorId;
	const speakerToken = msg.speaker?.token ? canvas.tokens?.get(msg.speaker.token) : null;
	const candidates = [
		speakerToken,
		...(canvas.tokens?.controlled ?? []),
		...(canvas.tokens?.placeables ?? []).filter((t) => t.actor?.id === actorId),
		...(canvas.tokens?.placeables ?? []),
	].filter(Boolean);
	for (const token of candidates) {
		const item = token.actor?.items.get(itemId);
		if (item) return { item, token };
	}
	const item = game.actors.get(actorId)?.items.get(itemId);
	return item ? { item, token: null } : null;
}

function syntheticItem(actor, name, type = "weapon") {
	const cls = CONFIG.Item.documentClass;
	return new cls({ name, type, img: "icons/skills/melee/unarmed-punch-fist.webp" }, { parent: actor });
}

Hooks.once("ready", () => {
	if (game.system.id !== "ose") return;

	// OSE's chat card buttons (Save, Roll) find the card's actor by token when the card records one, and
	// otherwise by actor id. Formula roll cards don't record the token, so for an unlinked token whose
	// item isn't on the sidebar actor (a spell added to the token only) the buttons fail with
	// "The requested Item ... no longer exists". Fall back to the speaker token, then the tokens on the map.
	const OseItem = CONFIG.Item.documentClass;
	const getChatCardActor = OseItem._getChatCardActor;
	if (typeof getChatCardActor === "function") {
		OseItem._getChatCardActor = function (card) {
			const actor = getChatCardActor.call(this, card);
			const itemId = card?.dataset?.itemId;
			if (!itemId || actor?.items.get(itemId)) return actor;
			const msg = game.messages.get(card.closest("[data-message-id]")?.dataset.messageId);
			const speaker = msg?.speaker;
			const speakerActor = speaker?.token ? game.scenes.get(speaker.scene)?.tokens.get(speaker.token)?.actor : null;
			if (speakerActor?.items.get(itemId)) return speakerActor;
			const found = resolveItem(msg ?? { speaker: {}, flags: {} }, card.parentElement ?? card);
			if (found?.item?.actor) {
				debug("chat card actor found on token", found.item.actor.name);
				return found.item.actor;
			}
			return actor;
		};
	}

	// The Enhanced Character Sheet (osc-character-sheet) has quick "ATK" buttons that roll a bare d20 and post
	// their own card ("Attack" + weapon name + HIT/MISS), without OSE or an item link, so Automated Animations
	// can't see them. Find the attack by name on the speaker and play it here.
	const oscAttack = (msg) => {
		if (!msg.flags?.["osc-character-sheet"]) return null;
		const dom = chatDom(msg);
		const title = dom.querySelector(".rc-title")?.textContent?.trim();
		const weapon = dom.querySelector(".rc-weapon")?.textContent?.trim();
		if (title !== "Attack" || !weapon) return null;
		const token = (msg.speaker?.token && canvas.tokens?.get(msg.speaker.token))
			|| canvas.tokens?.controlled.find((t) => t.actor?.id === msg.speaker?.actor)
			|| canvas.tokens?.placeables.find((t) => t.actor?.id === msg.speaker?.actor);
		const item = token?.actor?.items.find((i) => i.name === weapon);
		return item ? { dom, token, item } : null;
	};

	// A breath doesn't roll to hit in OSE (everyone in the area saves), so drop that sheet's d20 card and
	// place the breath instead. Returning false from preCreateChatMessage cancels the message.
	Hooks.on("preCreateChatMessage", (msg) => {
		const attack = oscAttack(msg);
		if (!attack || !oseAnimations.breathsFor?.(attack.item).length || !setting("placeTemplates")) return;
		setTimeout(() => oseAnimations.useBreath(attack.item), 0);
		return false;
	});

	Hooks.on("createChatMessage", async (msg) => {
		if (msg.author?.id !== game.user.id) return;
		const attack = oscAttack(msg);
		if (!attack) return;
		const { dom, token, item } = attack;
		const targets = Array.from(game.user.targets);
		const verdict = dom.querySelector(".rc-verdict");
		const options = { targets };
		if (verdict && setting("playMisses")) {
			options.playOnMiss = true;
			options.hitTargets = verdict.classList.contains("is-hit") ? targets : [];
		}
		debug("Enhanced Character Sheet attack", weapon, options);
		AutomatedAnimations.playAnimation(token, item, options);
	});

	// OSE formula rolls name the Item (or whichever token is selected) as the speaker. Name the caster.
	Hooks.on("preCreateChatMessage", (msg) => {
		const dom = chatDom(msg);
		const actorId = dom.querySelector(".chat-card[data-actor-id]")?.dataset.actorId;
		if (!actorId || msg.speaker?.actor === actorId) return;
		const found = resolveItem(msg, dom);
		const actor = found?.item?.actor ?? game.actors.get(actorId);
		if (!actor) return;
		msg.updateSource({ speaker: ChatMessage.getSpeaker({ actor, token: found?.token?.document }) });
		debug("corrected speaker to", actor.name);
	});

	// Runs inside AA's getRequiredData, before the autorec menus are searched.
	Hooks.on("aa.getRequiredData", (data) => {
		const msg = data.workflow;
		if (!(msg instanceof ChatMessage)) return;
		const dom = chatDom(msg);
		const kind = classify(msg, dom);
		if (!data.item || data.item.actor && data.token?.actor && data.item.actor !== data.token.actor) {
			const found = resolveItem(msg, dom);
			if (found) {
				data.item = found.item;
				if (found.token) data.token = found.token;
			}
		}
		const actor = data.item?.actor ?? data.token?.actor ?? game.actors.get(msg.speaker?.actor);

		if (kind === "roll" && isDamageRoll(dom) && !setting("animateDamageRolls")) {
			debug("skipping damage roll", msg.id);
			data.item = null;
			return;
		}
		if (data.item?.type === "spell" && !oseAnimations.wasJustCast(data.item)) {
			debug("spell posted to chat without casting", data.item.name);
			data.item = null;
			return;
		}
		// Weapon cards are only shown, not used, except a weapon-type breath posted while it's being used.
		if (kind === "card" && data.item && !CARD_TYPES.includes(data.item.type) && !oseAnimations.animFor?.(data.item)) {
			debug("skipping item card for", data.item.type, data.item.name);
			data.item = null;
			return;
		}

		if (kind === "attack") {
			if (!data.item && actor) data.item = syntheticItem(actor, "Unarmed Strike");
			// OSE posts one attack message per target; animate only that target.
			const victim = dom.querySelector(".chat-target")?.dataset.id;
			const victimToken = victim ? fromUuidSync(victim)?.object : null;
			if (victimToken) data.targets = [victimToken];
			if (setting("playMisses") && victimToken) {
				const hit = !!dom.querySelector(".damage-roll");
				data.playOnMiss = true;
				data.hitTargets = hit ? data.targets : [];
			}
		}
		if (!data.item) return;

		const names = [data.item.name];
		const breath = oseAnimations.animFor?.(data.item) ?? breathLabel(data.item);
		if (breath) names.unshift(breath);

		const template = setting("useTemplates") ? oseAnimations.templateFor(data.item, names) : null;
		if (template?.skip) {
			debug("already animated this cast's template", data.item.name);
			data.item = null;
		} else if (template) {
			data.templateData = template.region;
			data.isTemplate = true;
			if (names.length > 1) data.overrideNames = [names[0]];
			debug("using template", template.region.id, "for", data.item.name);
		} else {
			// Prefer the token-based twin; names without one fall through to the normal entry.
			data.overrideNames = names.map((n) => n + NT);
		}
	});

	// Runs after the menus were searched; adjust the targets for single-point area effects.
	Hooks.on("AutomatedAnimations-WorkflowStart", (data, animation) => {
		if (!animation?.metaData?.oseSingleTarget || !(data.workflow instanceof ChatMessage)) return;
		if (data.targets?.length > 1) data.targets = data.targets.slice(0, 1);
	});

	// Area sizes are authored for 5 ft squares; rescale to the scene's grid.
	Hooks.on("aa.preDataSanitize", (_handler, data) => {
		if (!data?.metaData?.oseArea || !setting("scaleAreas")) return;
		const grid = canvas.scene?.grid;
		if (!grid?.distance || !/^(ft|feet|')/i.test(grid.units || "ft")) return;
		const factor = 5 / grid.distance;
		if (factor === 1) return;
		for (const part of [data.primary, data.secondary]) {
			if (part?.options?.isRadius && Number.isFinite(part.options.size)) part.options.size *= factor;
		}
	});
});

//#region Startup checks and update prompt
Hooks.once("ready", async () => {
	console.log(`OSE Animations v${game.modules.get(MODULE_ID).version} loaded.`);
	if (game.system.id !== "ose") {
		ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.notifications.wrongSystem`));
		return;
	}
	if (!game.user.isGM) return;
	if (!(await checkForModulesAndWarn())) return;

	const version = game.modules.get(MODULE_ID).version;
	if (setting("version-previous") !== version) {
		ui.notifications.info(game.i18n.format(`${MODULE_ID}.notifications.update`, { version }));
		await game.settings.set(MODULE_ID, "version-previous", version);
		if (setting("autoUpdate")) oseAnimations.openUpdateMenu();
	}
});

async function checkForModulesAndWarn() {
	if (setting("show-popup") === false) return true;
	const jb2a = game.modules.get("jb2a_patreon")?.active || game.modules.get("JB2A_DnD5e")?.active;
	const psfx = game.modules.get("psfx-patreon")?.active || game.modules.get("psfx")?.active;
	if (jb2a && psfx) return true;
	const missing = [!jb2a && "JB2A", !psfx && "PSFX"].filter(Boolean).join(", ");
	const choice = await foundry.applications.api.DialogV2.prompt({
		window: { title: "OSE Animations" },
		content: `<p>${game.i18n.format(`${MODULE_ID}.notifications.noDependencies`, { modules: missing })}</p>`,
		ok: { label: game.i18n.localize(`${MODULE_ID}.notifications.understand`) },
		buttons: [{ label: game.i18n.localize(`${MODULE_ID}.notifications.dontShow`), action: "dont" }],
		rejectClose: false
	});
	if (choice === "dont") await game.settings.set(MODULE_ID, "show-popup", false);
	return true;
}
//#endregion

globalThis.oseAnimations ??= {};
Object.assign(globalThis.oseAnimations, { NT, breathLabel });
