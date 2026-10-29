// Measured templates for OSE area spells and breath weapons.
//
// OSE spells have no area data and the system never places templates, so this keeps an area table
// (module/areas.json, built from the Advanced Fantasy text) and asks the caster to place the area
// when an area spell is cast, the way the dnd5e system does. Tokens inside are targeted, the
// animation plays in the template (ose-integration.js), and resolve.js rolls saves and damage.

const MODULE_ID = "ose-animations";
const rinse = (s) => String(s ?? "").replace(/\s+/g, "").replace(/[’‘]/g, "'").toLowerCase();

const table = { areas: new Map(), resolve: new Map(), breaths: [], noTemplate: new Set(), templateLabels: new Set() };
// The template placed for the current cast, and whether its animation already played.
const current = { id: null, sceneId: null, itemId: null, manual: false, time: 0, usedAt: 0, animLabel: null };
// Spells cast through spendSpell, by item uuid. Posting a spell to chat without casting it shouldn't animate.
const casts = new Map();

function wasJustCast(item) {
	const time = casts.get(item?.uuid);
	return !!time && Date.now() - time < 15000;
}

function setting(key) {
	return game.settings.get(MODULE_ID, key);
}

function areaFor(name) {
	return table.areas.get(rinse(name)) ?? null;
}

function resolveFor(name) {
	return table.resolve.get(rinse(name)) ?? null;
}

function hasTemplateAnimation(name) {
	return table.templateLabels.has(rinse(name));
}

// Breath options for a monster, matched on its name ("Red Dragon", "Dragon, Multichromatic", ...).
function breathsFor(item) {
	if (!/^breath\b/i.test(item?.name ?? "")) return [];
	const names = `${item.actor?.name ?? ""} ${item.actor?.prototypeToken?.name ?? ""}`.toLowerCase();
	return table.breaths.find((b) => names.includes(b.match))?.options ?? [];
}

// The animation label chosen for the current breath (fire, cold...), for ose-integration.js.
function animFor(item) {
	if (!current.animLabel || current.itemId !== item?.id) return null;
	return Date.now() - current.time < setting("templateWindow") * 1000 ? current.animLabel : null;
}

// Scene units per foot (1 for feet scenes; metres etc. are converted roughly).
function unitsPerFoot() {
	const units = (canvas.scene?.grid.units || "ft").toLowerCase();
	if (/^(ft|feet|foot|')/.test(units)) return 1;
	if (/^(m|meter|metre)/.test(units)) return 0.3;
	return 1;
}

function shapeData(area) {
	const px = canvas.dimensions.distancePixels * unitsPerFoot();
	const base = { x: 0, y: 0, rotation: 0 };
	switch (area.shape) {
		case "circle": return { ...base, type: "circle", radius: area.r * px };
		case "rect": return { ...base, type: "rectangle", width: area.side * px, height: area.side * px };
		case "box": return { ...base, type: "rectangle", width: area.length * px, height: area.width * px };
		case "line": return { ...base, type: "line", length: area.length * px, width: area.width * px };
		case "cone": {
			const angle = Math.toDegrees(2 * Math.atan(area.width / 2 / area.length));
			return { ...base, type: "cone", radius: area.length * px, angle: Math.round(angle) };
		}
	}
	return null;
}

function casterToken(item) {
	const actor = item.actor;
	return canvas.tokens.controlled.find((t) => t.actor === actor)
		?? actor?.getActiveTokens(true, false).find((t) => t.scene === canvas.scene)?.object
		?? actor?.getActiveTokens()[0] ?? null;
}

function regionData(item, shape) {
	return {
		name: `${item.name} [${game.user.name}]`,
		color: game.user.color?.css ?? game.user.color,
		shapes: [shape],
		...(canvas.level ? { levels: [canvas.level.id] } : {}),
		displayMeasurements: true,
		highlightMode: "coverage",
		visibility: CONST.REGION_VISIBILITY.ALWAYS,
		flags: { core: { MeasuredTemplate: true }, [MODULE_ID]: { item: item.uuid } }
	};
}

// Tokens inside the region (except the caster); targets them when "Target Tokens in the Area" is on.
async function tokensIn(region, caster) {
	// The region's token set updates once the new region has been drawn.
	await new Promise((r) => setTimeout(r, 150));
	const inside = [...(region.tokens ?? [])].map((t) => t.object).filter((t) => t && t !== caster);
	if (setting("autoTarget")) {
		for (const t of game.user.targets) t.setTarget(false, { releaseOthers: false, groupSelection: true });
		for (const t of inside) t.setTarget(true, { releaseOthers: false, groupSelection: true });
		game.user.broadcastActivity({ targets: game.user.targets.ids });
	}
	return inside;
}

/**
 * Ask the user to place an area. Resolves to {region, caster, targets}, or null when placement is
 * off or not possible, or the user skipped it.
 */
async function placeArea(item, area, { animLabel = null } = {}) {
	if (!area || !setting("placeTemplates") || !canvas.ready || !canvas.scene) return null;
	if (!game.user.can("REGION_CREATE")) return null;
	// Foundry doesn't let players place templates while the game is paused.
	if (game.paused && !game.user.isGM) {
		ui.notifications.warn(game.i18n.format(`${MODULE_ID}.templates.paused`, { name: item.name }));
		return null;
	}
	const shape = shapeData(area);
	if (!shape) return null;
	const caster = casterToken(item);
	let region = null;
	try {
		if (area.at === "caster" && caster) {
			const c = caster.center;
			if (shape.type === "rectangle") Object.assign(shape, { x: c.x - shape.width / 2, y: c.y - shape.height / 2 });
			else Object.assign(shape, { x: c.x, y: c.y });
			[region] = await canvas.scene.createEmbeddedDocuments("Region", [regionData(item, shape)]);
		} else {
			ui.notifications.info(game.i18n.format(`${MODULE_ID}.templates.place`, { name: item.name }));
			region = await canvas.regions.placeRegion(regionData(item, shape), { create: true });
		}
	} catch (err) {
		console.error("OSE Animations | template placement failed", err);
		return null;
	}
	if (!region) return null;
	Object.assign(current, { id: region.id, sceneId: region.parent?.id, itemId: item.id, manual: false, time: Date.now(), usedAt: 0, animLabel });
	const targets = await tokensIn(region, caster);
	const instant = /instant/i.test(item.system?.duration ?? "") || /^breath/i.test(item.name);
	if (instant && setting("removeInstantTemplates")) {
		setTimeout(() => region.parent?.regions.get(region.id)?.delete(), 10000);
	}
	return { region, caster, targets };
}

/** Place the area of a spell, from the area table. */
function placeTemplateFor(item) {
	return placeArea(item, areaFor(item.name));
}

/** Choose (if the monster has several) and place a breath weapon. Resolves to {region, caster, targets, option} or null. */
async function placeBreath(item) {
	const options = breathsFor(item);
	if (!options.length || !setting("placeTemplates")) return null;
	let option = options[0];
	if (options.length > 1) {
		const choice = await foundry.applications.api.DialogV2.wait({
			window: { title: game.i18n.format(`${MODULE_ID}.templates.chooseBreath`, { name: item.actor?.name ?? item.name }) },
			content: `<p>${game.i18n.localize(`${MODULE_ID}.templates.chooseBreathHint`)}</p>`,
			buttons: options.map((o, i) => ({ action: String(i), label: o.label, default: i === 0 })),
			rejectClose: false
		});
		if (choice === null || choice === undefined) return null;
		option = options[Number(choice)];
	}
	const placed = await placeArea(item, option, { animLabel: option.anim });
	return placed ? { ...placed, option } : null;
}

/**
 * The template to animate for this item, if there is one: the template placed for this cast, or one
 * the user drew by hand just before. Returns {region} to animate in it, {skip: true} for repeat
 * messages of a cast that already animated, or null.
 */
function templateFor(item, names) {
	if (!current.id || current.sceneId !== canvas.scene?.id) return null;
	const forThisCast = current.itemId === item.id || current.manual;
	if (!forThisCast) return null;
	if (Date.now() - current.time > setting("templateWindow") * 1000) return null;
	if (current.usedAt) return current.itemId === item.id && Date.now() - current.usedAt < 10000 ? { skip: true } : null;
	if (!names.some(hasTemplateAnimation)) return null;
	const region = canvas.scene.regions.get(current.id);
	if (!region) return null;
	current.usedAt = Date.now();
	return { region };
}

Hooks.once("ready", async () => {
	if (game.system.id !== "ose") return;
	try {
		const data = await (await fetch(`modules/${MODULE_ID}/module/areas.json`)).json();
		for (const [name, area] of Object.entries(data.areas)) table.areas.set(rinse(name), area);
		for (const [name, spec] of Object.entries(data.resolve ?? {})) table.resolve.set(rinse(name), spec);
		table.breaths = data.breaths ?? [];
		data.noTemplate.forEach((n) => table.noTemplate.add(rinse(n)));
		data.templateLabels.forEach((n) => table.templateLabels.add(rinse(n)));
	} catch (err) {
		console.error("OSE Animations | could not load areas.json", err);
	}

	// A template drawn by hand counts for the next cast of any item.
	Hooks.on("createRegion", (region, _options, userId) => {
		if (userId !== game.user.id || region.getFlag(MODULE_ID, "item")) return;
		Object.assign(current, { id: region.id, sceneId: region.parent?.id, itemId: null, manual: true, time: Date.now(), usedAt: 0, animLabel: null });
	});

	const proto = CONFIG.Item.documentClass.prototype;
	const { spendSpell, rollWeapon, rollFormula, show } = proto;
	const automate = (placed, spec) => placed && spec && setting("automateAreas");

	// Spells place their area first. When saves and damage are automated, the spell is spent and its
	// card posted here instead of OSE rolling the bare damage formula (Fire Ball's "1d6"), and the GM's
	// client resolves the area.
	proto.spendSpell = async function (...args) {
		const placed = await placeTemplateFor(this);
		casts.set(this.uuid, Date.now());
		const spec = resolveFor(this.name);
		if (!automate(placed, spec)) return spendSpell.apply(this, args);
		await this.update({ "system.cast": (this.system.cast ?? 0) - 1 });
		await show.call(this, { skipDialog: true });
		await oseAnimations.requestResolution({ name: this.name, spec, ...placed });
	};

	// Breath weapons are weapon items on some monsters and ability items on others (the Advanced
	// Fantasy dragons). Abilities with a formula are rolled with rollFormula; the dragons' breath has
	// none, so it's used by posting it to chat (show), which is also what roll() does for it.
	const resolveBreath = (item, placed) => automate(placed, placed?.option) && oseAnimations.requestResolution({
		name: `${item.actor?.name ?? item.name}: ${placed.option.label}`, spec: placed.option, ...placed
	});
	proto.rollWeapon = async function (...args) {
		const placed = await placeBreath(this);
		// A resolved breath replaces OSE's attack roll against each target; post the card for the animation.
		if (automate(placed, placed?.option)) {
			await show.call(this);
			return resolveBreath(this, placed);
		}
		return rollWeapon.apply(this, args);
	};
	proto.rollFormula = async function (...args) {
		const placed = this.type !== "spell" ? await placeBreath(this) : null;
		const result = await rollFormula.apply(this, args);
		await resolveBreath(this, placed);
		return result;
	};
	proto.show = async function (...args) {
		const placed = this.type !== "spell" ? await placeBreath(this) : null;
		const result = await show.apply(this, args);
		await resolveBreath(this, placed);
		return result;
	};
});

globalThis.oseAnimations ??= {};
Object.assign(globalThis.oseAnimations, { areaFor, resolveFor, breathsFor, animFor, hasTemplateAnimation, placeTemplateFor, placeBreath, templateFor, wasJustCast, currentTemplate: current });
