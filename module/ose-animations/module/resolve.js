// Saves and damage for creatures caught in an area spell or breath weapon.
//
// The caster's client places the template and collects the tokens inside it; the GM's client rolls the
// saves and damage, updates hit points (players can't edit monsters) and posts one results card.
// The rules for each spell and breath come from module/areas.json (built from the Advanced Fantasy text).

const MODULE_ID = "ose-animations";
let socket = null;

function setting(key) {
	return game.settings.get(MODULE_ID, key);
}

function esc(s) {
	return foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s ?? "")) : String(s ?? "").replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

// Characters use their level; monsters their Hit Dice ("10d8" or "3d8+3" -> 10 or 3).
function levelOf(actor) {
	if (!actor) return 1;
	if (actor.type === "character") return Number(actor.system.details?.level) || 1;
	return Number.parseInt(String(actor.system.hp?.hd ?? "1"), 10) || 1;
}

function acOf(actor) {
	if (game.settings.get("ose", "ascendingAC")) return 19 - (Number(actor.system.aac?.value) || 10);
	return Number(actor.system.ac?.value) || 9;
}

// Characters add their WIS modifier and magic bonus to saves against magic, as OSE's own save roll offers.
function saveBonus(actor, save) {
	if (actor.type !== "character" || !["spell", "wand"].includes(save)) return 0;
	return (Number(actor.system.scores?.wis?.mod) || 0) + (Number(actor.system.details?.magic?.bonus) || 0);
}

async function roll(formula, data = {}) {
	const r = new Roll(String(formula), data);
	await r.evaluate();
	return r;
}

async function setStatus(actor, id, overlay = false) {
	if (!setting("applyConditions") || !id) return;
	if (!CONFIG.statusEffects.some((e) => e.id === id)) return;
	if (actor.statuses?.has(id)) return;
	await actor.toggleStatusEffect(id, { active: true, overlay });
}

const SAVE_KEYS = ["death", "wand", "paralysis", "breath", "spell"];
const t = (key, data) => (data ? game.i18n.format(`${MODULE_ID}.${key}`, data) : game.i18n.localize(`${MODULE_ID}.${key}`));

function formData(form) {
	const FDE = foundry.applications.ux?.FormDataExtended ?? globalThis.FormDataExtended;
	return new FDE(form).object;
}

function options(list, selected) {
	return list.map(([value, label]) => `<option value="${esc(value)}" ${String(value) === String(selected ?? "") ? "selected" : ""}>${esc(label)}</option>`).join("");
}

// The damage formula with the caster's level and hp filled in, so the GM sees "(4)d6", not "(@level)d6".
function displayFormula(formula, level, hp) {
	return String(formula ?? "").replaceAll("@level", String(level)).replaceAll("@hp", String(hp));
}

/**
 * One review window. Resolves to {action: "next"|"apply", data} or null when cancelled.
 * "Apply as rolled" keeps this window's edits and skips the remaining windows.
 */
async function review({ title, step, content, render }) {
	const result = await foundry.applications.api.DialogV2.wait({
		window: { title: `${title}: ${t(`review.${step}.title`)}` },
		position: { width: 620 },
		classes: ["ose-animations-review"],
		content: `<p class="ose-animations-review-hint">${t(`review.${step}.hint`)}</p>${content}`,
		render: render ? (_event, dialog) => render(dialog.element) : undefined,
		buttons: [
			{ action: "next", label: t("review.next"), icon: "fa-solid fa-arrow-right", default: true, callback: (_e, button) => ({ action: "next", data: formData(button.form) }) },
			{ action: "apply", label: t("review.applyRest"), icon: "fa-solid fa-forward", callback: (_e, button) => ({ action: "apply", data: formData(button.form) }) },
			{ action: "cancel", label: t("review.cancel"), icon: "fa-solid fa-xmark", callback: () => null }
		],
		rejectClose: false
	});
	return result ?? null;
}

async function reviewSetup(name, spec, ctx) {
	const statuses = [["", t("review.none")], ...CONFIG.statusEffects.map((e) => [e.id, game.i18n.localize(e.name ?? e.label ?? e.id)])];
	const saves = [["", t("review.noSaveOption")], ...SAVE_KEYS.map((k) => [k, game.i18n.localize(`OSE.saves.${k}.long`)])];
	const onSave = [["half", t("review.onSave.half")], ["none", t("review.onSave.none")], ["full", t("review.onSave.full")]];
	const modes = [["roll", t("review.mode.roll")], ["autoSave", t("review.mode.autoSave")], ["autoFail", t("review.mode.autoFail")], ["immune", t("review.mode.immune")]];
	const rows = ctx.targets.map((x, i) => `<tr>
		<td><input type="checkbox" name="inc_${i}" ${x.include ? "checked" : ""}></td>
		<td>${esc(x.name)}</td><td class="ose-animations-num">${x.hd}</td>
		<td><select name="mode_${i}">${options(modes, x.mode)}</select></td>
		<td><input type="number" name="mod_${i}" value="${x.mod}" step="1" class="ose-animations-small"></td></tr>`).join("");
	const content = `
		<div class="form-group"><label>${t("review.save")}</label><select name="save">${options(saves, spec.save)}</select></div>
		<div class="form-group"><label>${t("review.damageFormula")}</label><input type="text" name="damage" value="${esc(displayFormula(spec.damage, ctx.level, ctx.casterHp))}" placeholder="${t("review.noDamage")}"></div>
		<div class="form-group"><label>${t("review.onSaveLabel")}</label><select name="onSave">${options(onSave, spec.onSave ?? "full")}</select></div>
		<div class="form-group"><label>${t("review.kills")}</label><input type="checkbox" name="die" ${spec.onFail === "die" ? "checked" : ""}></div>
		${spec.hdPool !== undefined ? `<div class="form-group"><label>${t("review.hdPool")}</label><input type="text" name="hdPool" value="${esc(spec.hdPool)}"></div>` : ""}
		<div class="form-group"><label>${t("review.status")}</label><select name="status">${options(statuses, spec.status)}</select></div>
		<div class="form-group"><label>${t("review.effect")}</label><input type="text" name="effect" value="${esc(spec.effect ?? "")}"></div>
		<table class="ose-animations-review-table"><thead><tr><th></th><th>${t("resolve.target")}</th><th>HD</th><th>${t("review.saveMode")}</th><th>${t("review.saveMod")}</th></tr></thead><tbody>${rows || `<tr><td colspan="5">${t("resolve.nobody")}</td></tr>`}</tbody></table>`;
	const r = await review({ title: name, step: "setup", content });
	if (!r) return null;
	const d = r.data;
	const next = {
		...spec, save: d.save || undefined, damage: String(d.damage ?? "").trim() || undefined, onSave: d.onSave,
		onFail: d.die ? "die" : undefined, status: d.status || undefined, effect: String(d.effect ?? "").trim() || undefined
	};
	if (spec.hdPool !== undefined) next.hdPool = String(d.hdPool ?? "").trim() || undefined;
	if (next.onSave === "full") delete next.onSave;
	const before = { ...spec, damage: displayFormula(spec.damage, ctx.level, ctx.casterHp) };
	let changed = ["save", "damage", "onSave", "onFail", "status", "effect", "hdPool"].some((k) => String(next[k] ?? "") !== String(before[k] ?? ""));
	ctx.targets.forEach((x, i) => {
		const inc = !!d[`inc_${i}`], mode = d[`mode_${i}`] ?? "roll", mod = Number(d[`mod_${i}`]) || 0;
		if (inc !== x.include || mode !== x.mode || mod !== x.mod) changed = true;
		Object.assign(x, { include: inc, mode, mod });
	});
	return { action: r.action, spec: next, changed };
}

async function reviewSaves(name, spec, list) {
	const results = [["auto", t("review.result.auto")], ["saved", t("resolve.saved")], ["failed", t("resolve.failed")]];
	const rows = list.map((x, i) => `<tr>
		<td>${esc(x.name)}</td>
		<td>${x.saveRoll !== undefined ? `<input type="number" name="roll_${i}" value="${x.saveRoll}" class="ose-animations-small">` : esc(x.saveText ?? "—")}</td>
		<td>${x.saveRoll !== undefined ? `<input type="number" name="need_${i}" value="${x.need}" class="ose-animations-small">` : ""}</td>
		<td><select name="res_${i}">${options(results, "auto")}</select></td>
		<td>${esc(t(`resolve.${x.saved ? "saved" : "failed"}`))}</td></tr>`).join("");
	const content = `<p>${t("review.savesLine", { save: game.i18n.localize(`OSE.saves.${spec.save}.long`) })}</p>
		<table class="ose-animations-review-table"><thead><tr><th>${t("resolve.target")}</th><th>${t("review.roll")}</th><th>${t("review.need")}</th><th>${t("review.override")}</th><th>${t("review.rolled")}</th></tr></thead><tbody>${rows}</tbody></table>`;
	const r = await review({ title: name, step: "saves", content });
	if (!r) return null;
	let changed = false;
	list.forEach((x, i) => {
		const res = r.data[`res_${i}`] ?? "auto";
		if (x.saveRoll !== undefined) {
			const rolled = Number(r.data[`roll_${i}`]), need = Number(r.data[`need_${i}`]);
			if (rolled !== x.saveRoll || need !== x.need) changed = true;
			Object.assign(x, { saveRoll: rolled, need, saveText: `${rolled} / ${need}`, saved: rolled >= need });
		}
		if (res !== "auto") {
			changed = true;
			x.saved = res === "saved";
			x.saveText = `${x.saveText ?? ""} (${t("review.gm")})`.trim();
		}
	});
	return { action: r.action, changed };
}

async function reviewDamage(name, spec, list, shared) {
	const rule = (x) => (x.saved && spec.onSave === "half" ? "half" : x.saved && spec.onSave === "none" ? "none" : "full");
	const rows = list.map((x, i) => `<tr>
		<td>${esc(x.name)}</td><td>${x.mustSave ? esc(t(`resolve.${x.saved ? "saved" : "failed"}`)) : "—"}</td>
		<td>${spec.perTarget ? esc(x.baseFormula ?? "") : esc(t(`review.rule.${rule(x)}`))}</td>
		<td><input type="number" name="dmg_${i}" value="${x.damage}" min="0" class="ose-animations-small" data-rule="${spec.perTarget ? "own" : rule(x)}"></td>
		<td class="ose-animations-num">${x.hp}</td></tr>`).join("");
	const content = `${shared ? `<div class="form-group"><label>${t("review.total")} (${esc(shared.formula)} = ${shared.total})</label><input type="number" name="total" value="${shared.total}" min="0"></div>` : ""}
		<table class="ose-animations-review-table"><thead><tr><th>${t("resolve.target")}</th><th>${t("resolve.saveCol")}</th><th>${t("review.ruleCol")}</th><th>${t("review.amount")}</th><th>HP</th></tr></thead><tbody>${rows}</tbody></table>`;
	// Changing the total recalculates every amount that hasn't been edited by hand.
	const render = (el) => {
		const total = el.querySelector('input[name="total"]');
		const amounts = [...el.querySelectorAll('input[name^="dmg_"]')];
		amounts.forEach((a) => a.addEventListener("input", () => { a.dataset.edited = "1"; }));
		total?.addEventListener("input", () => {
			const v = Math.max(0, Number(total.value) || 0);
			for (const a of amounts) {
				if (a.dataset.edited || a.dataset.rule === "own") continue;
				a.value = a.dataset.rule === "half" ? Math.floor(v / 2) : a.dataset.rule === "none" ? 0 : v;
			}
		});
	};
	const r = await review({ title: name, step: "damage", content, render });
	if (!r) return null;
	let changed = false;
	if (shared && Number(r.data.total) !== shared.total) { changed = true; shared.adjusted = Number(r.data.total); }
	list.forEach((x, i) => {
		const v = Math.max(0, Number(r.data[`dmg_${i}`]) || 0);
		if (v !== x.damage) changed = true;
		x.damage = v;
	});
	return { action: r.action, changed };
}

function cancelled(name) {
	ui.notifications.info(t("review.cancelled", { name }));
	return { cancelled: true };
}

/**
 * Runs on the GM's client. With "GM Reviews Area Results" on, it stops after each step (setup, saves,
 * damage) so the GM can change the rules, the rolls or the amounts before anything is applied.
 * @param {object} p
 * @param {string} p.name         spell or breath name for the card
 * @param {object} p.spec         the rules entry (save, damage, onSave, onFail, ...)
 * @param {string} p.casterUuid   caster TokenDocument (or Actor) uuid
 * @param {string[]} p.targetUuids TokenDocument uuids of the creatures in the area
 */
async function resolveArea({ name, spec, casterUuid, targetUuids }) {
	const casterDoc = casterUuid ? await fromUuid(casterUuid) : null;
	const caster = casterDoc?.actor ?? casterDoc;
	const ctx = { level: levelOf(caster), casterHp: Number(caster?.system?.hp?.value) || 0, targets: [] };
	for (const uuid of targetUuids ?? []) {
		const token = await fromUuid(uuid);
		if (token?.actor) ctx.targets.push({ token, actor: token.actor, name: token.name, hd: levelOf(token.actor), include: true, mode: "roll", mod: 0 });
	}
	const { level, casterHp } = ctx;
	let reviewing = setting("reviewAreas");
	let adjusted = false;
	spec = { ...spec };

	// Step 1: the rules and who's affected.
	if (reviewing) {
		const r = await reviewSetup(name, spec, ctx);
		if (!r) return cancelled(name);
		spec = r.spec;
		adjusted ||= r.changed;
		reviewing = r.action === "next";
	}
	const targets = ctx.targets.filter((x) => x.include);
	const rolls = [];
	const saveLabel = spec.save ? game.i18n.localize(`OSE.saves.${spec.save}.long`) : "";

	// Death Spell: a pool of Hit Dice, weakest creatures first.
	let pool = null;
	if (spec.hdPool) {
		pool = await roll(spec.hdPool);
		rolls.push(pool);
		let left = pool.total;
		for (const x of targets.filter((y) => y.mode !== "immune").sort((a, b) => a.hd - b.hd)) {
			if (x.hd <= left) left -= x.hd;
			else x.outOfPool = true;
		}
	}

	// Step 2: saves.
	for (const x of targets) {
		if (x.outOfPool || x.mode === "immune") continue;
		x.mustSave = !!spec.save && !(spec.maxHD && x.hd >= spec.maxHD);
		if (!x.mustSave) continue;
		if (x.mode === "autoSave" || x.mode === "autoFail") {
			x.saved = x.mode === "autoSave";
			x.saveText = t(`review.mode.${x.mode}`);
		} else if (spec.minHD && x.hd < spec.minHD) {
			x.saved = false;
			x.saveText = t("resolve.noSave");
		} else {
			x.need = Number(x.actor.system.saves?.[spec.save]?.value) || 20;
			const bonus = saveBonus(x.actor, spec.save) + x.mod;
			const r = await roll(bonus ? `1d20 + ${bonus}` : "1d20");
			rolls.push(r);
			x.saveRoll = r.total;
			x.saved = r.total >= x.need;
			x.saveText = `${r.total} / ${x.need}`;
		}
	}
	const saving = targets.filter((x) => x.mustSave);
	if (reviewing && saving.length) {
		const r = await reviewSaves(name, spec, saving);
		if (!r) return cancelled(name);
		adjusted ||= r.changed;
		reviewing = r.action === "next";
	}

	// Step 3: damage. One roll for everyone unless the damage depends on the target.
	let shared = null;
	const hurt = targets.filter((x) => !x.outOfPool && x.mode !== "immune");
	if (spec.damage) {
		if (!spec.perTarget) {
			shared = await roll(spec.damage, { level, hp: casterHp });
			rolls.push(shared);
		}
		for (const x of hurt) {
			const base = spec.perTarget ? await roll(spec.damage, { level, hp: casterHp, ac: acOf(x.actor) }) : shared;
			if (spec.perTarget) {
				rolls.push(base);
				x.baseFormula = `${base.formula} = ${base.total}`;
			}
			x.damage = base.total;
			if (x.saved && spec.onSave === "half") x.damage = Math.floor(x.damage / 2);
			if (x.saved && spec.onSave === "none") x.damage = 0;
			x.hp = Number(x.actor.system.hp?.value) || 0;
		}
		if (reviewing && hurt.length) {
			const r = await reviewDamage(name, spec, hurt, shared);
			if (!r) return cancelled(name);
			adjusted ||= r.changed;
		}
	}

	// Apply.
	for (const x of targets) {
		if (x.outOfPool) { x.result = t("resolve.outOfPool"); continue; }
		if (x.mode === "immune") { x.result = t("review.mode.immune"); continue; }
		const damage = x.damage ?? 0;
		const dies = x.mustSave && x.saved === false && spec.onFail === "die";
		const hpBefore = Number(x.actor.system.hp?.value) || 0;
		if (dies) await x.actor.update({ "system.hp.value": 0 });
		else if (damage > 0) await x.actor.applyDamage(damage, 1);
		const hpAfter = Number(x.actor.system.hp?.value) || 0;
		if (dies || (hpBefore > 0 && hpAfter <= 0)) await setStatus(x.actor, "dead", true);
		else if (x.mustSave && x.saved === false) await setStatus(x.actor, spec.status);

		const parts = [];
		if (x.mustSave) parts.push(t(`resolve.${x.saved ? "saved" : "failed"}`));
		if (damage > 0) parts.push(t("resolve.damage", { damage }));
		if (dies) parts.push(t("resolve.dies"));
		else if (hpBefore > 0 && hpAfter <= 0) parts.push(t("resolve.down"));
		else if (x.mustSave && x.saved === false && spec.effect && !spec.damage) parts.push(spec.effect);
		x.result = parts.join(" · ") || "—";
	}

	// Results card
	const lines = [];
	if (shared) lines.push(t("resolve.damageLine", { formula: shared.formula, total: shared.adjusted !== undefined ? `${shared.total} → ${shared.adjusted}` : shared.total, type: spec.type ?? "" }));
	if (pool) lines.push(t("resolve.poolLine", { formula: pool.formula, total: pool.total }));
	if (spec.save) {
		const how = spec.onSave === "half" ? "half" : spec.onFail === "die" ? "die" : spec.damage ? "full" : "effect";
		lines.push(t(`resolve.save.${how}`, { save: saveLabel, effect: spec.effect ?? "" }));
	}
	if (spec.perTarget) lines.push(esc(spec.effect ?? ""));
	if (spec.note) lines.push(`<i>${esc(spec.note)}</i>`);
	if (adjusted) lines.push(`<i>${t("review.adjustedNote")}</i>`);
	const rows = targets.map((x) => `<tr><td>${esc(x.name)}</td><td class="ose-animations-num">${esc(x.saveText ?? "—")}</td><td>${esc(x.result)}</td></tr>`).join("");
	const content = `<div class="ose-animations-resolution">
		<h3>${esc(name)}</h3>
		${lines.map((l) => `<p>${l}</p>`).join("")}
		${targets.length
		? `<table><thead><tr><th>${t("resolve.target")}</th><th>${t("resolve.saveCol")}</th><th>${t("resolve.result")}</th></tr></thead><tbody>${rows}</tbody></table>`
		: `<p>${t("resolve.nobody")}</p>`}
	</div>`;
	await ChatMessage.create({
		content,
		rolls,
		sound: rolls.length ? CONFIG.sounds.dice : undefined,
		speaker: casterDoc?.documentName === "Token"
			? ChatMessage.getSpeaker({ token: casterDoc, actor: caster })
			: ChatMessage.getSpeaker({ actor: caster }),
		flags: { [MODULE_ID]: { resolution: true, adjusted } }
	});
	return targets.map((x) => ({ name: x.name, saved: x.saved ?? null, result: x.result }));
}

/** Called on the caster's client after the template is placed. */
async function requestResolution({ name, spec, caster, region, targets }) {
	if (!setting("automateAreas") || !spec) return null;
	const tokens = targets ?? [...(region?.tokens ?? [])];
	const payload = {
		name,
		spec,
		casterUuid: (caster?.document ?? caster)?.uuid ?? null,
		targetUuids: tokens.map((t) => (t.document ?? t).uuid).filter((u) => u && u !== (caster?.document ?? caster)?.uuid)
	};
	if (game.user.isGM) return resolveArea(payload);
	if (!game.users.activeGM) {
		ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.resolve.noGM`));
		return null;
	}
	if (!socket) {
		ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.resolve.noSocket`));
		return null;
	}
	if (setting("reviewAreas")) ui.notifications.info(t("review.waiting", { name }));
	return socket.executeAsGM("resolveArea", payload);
}

/**
 * Runs on the GM's client: a light source for Light or Continual Light, at a spot or on a token.
 * Players can't create lights or edit other people's tokens, so this goes through the GM like damage.
 */
async function createLight({ name, light, sceneId, x, y, tokenUuid }) {
	// The spell's full radius, with a bright core and a soft rim so it doesn't look like a hard disc.
	const config = { bright: Math.round(light.radius * 0.7), dim: light.radius, color: light.color, alpha: 0.3, luminosity: 0.5, attenuation: 0.6, animation: { type: null } };
	const flags = { [MODULE_ID]: { spell: name } };
	if (tokenUuid) {
		const token = await fromUuid(tokenUuid);
		if (!token) return null;
		const prior = token.getFlag(MODULE_ID, "priorLight") ?? token.toObject().light;
		await token.update({ light: config, [`flags.${MODULE_ID}.priorLight`]: prior, [`flags.${MODULE_ID}.lightSpell`]: name });
		return { token: token.name };
	}
	const scene = game.scenes.get(sceneId);
	if (!scene) return null;
	const [doc] = await scene.createEmbeddedDocuments("AmbientLight", [{ x, y, config, flags }]);
	return { light: doc?.id };
}

// Ending a lasting spell effect. Sequencer only lets Assistants and GMs delete effects by default, so a
// player's request is run by the GM's client.
function endEffectsGM(names) {
	for (const name of names ?? []) Sequencer.EffectManager.endEffects({ name });
	return true;
}

/** End lasting spell effects on a token (all of them, or only the named ones). */
async function endSpellEffects(token, names = null) {
	const list = names ?? oseAnimations.lastingEffects?.(token).map((e) => e.name) ?? [];
	if (!list.length) return false;
	if (game.user.isGM || game.user.role >= (game.settings.get("sequencer", "permissions-effect-delete") ?? 4) + 1) return endEffectsGM(list);
	if (!game.users.activeGM || !socket) {
		ui.notifications.warn(t("lasting.noGM"));
		return false;
	}
	return socket.executeAsGM("endEffects", list);
}

/** Called on the caster's client. */
async function requestLight(payload) {
	if (game.user.isGM) return createLight(payload);
	if (!game.users.activeGM || !socket) {
		ui.notifications.warn(t("lights.noGM", { name: payload.name }));
		return null;
	}
	return socket.executeAsGM("createLight", payload);
}

Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerModule(MODULE_ID);
	socket.register("resolveArea", resolveArea);
	socket.register("createLight", createLight);
	socket.register("endEffects", endEffectsGM);
});

globalThis.oseAnimations ??= {};
Object.assign(globalThis.oseAnimations, { requestResolution, resolveArea, requestLight, endSpellEffects, levelOf });
