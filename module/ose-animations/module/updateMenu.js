// Merges module/autorec.json into the Automated Animations global menus.
// Ported from D&D5e Animations (GPLv3): entries we added before are updated, entries the GM made
// or changed under the same name are left alone, and our entries that no longer exist are removed.

const OSE_ANIM = "ose-animations";
const OSE_META_NAME = "OSE Animations";
const AA_MENUS = ["melee", "range", "ontoken", "templatefx", "preset", "aura", "aefx"];

function emptyByMenu() {
	return Object.fromEntries(AA_MENUS.map((m) => [m, []]));
}

function isOurs(entry) {
	return entry?.metaData?.name === OSE_META_NAME || !!entry?.metaData?.default;
}

async function generateAutorecUpdate(quiet = true) {
	if (quiet) console.group("OSE Animations | Autorecognition Menu Check");
	const autorec = await (await fetch(`modules/${OSE_ANIM}/module/autorec.json`)).json();
	const blacklist = game.settings.get(OSE_ANIM, "blacklist");
	const current = {};
	for (const key of AA_MENUS) {
		current[key] = [...new Map(game.settings.get("autoanimations", `aaAutorec-${key}`).map((v) => [v.id, v])).values()];
	}

	const added = emptyByMenu(), updated = emptyByMenu(), custom = emptyByMenu(), same = emptyByMenu(),
		customNew = emptyByMenu(), removed = emptyByMenu(), blacklisted = emptyByMenu();

	for (const key of AA_MENUS) {
		const ours = autorec[key] ?? [];
		const byLabel = new Map(current[key].map((e) => [e.label, e]));
		const ourLabels = new Set(ours.map((e) => e.label));
		for (const entry of ours) {
			const existing = byLabel.get(entry.label);
			const isBlacklisted = blacklist.menu.includes(key) || blacklist.entries.includes(entry.label);
			if (!existing) {
				if (!isBlacklisted) added[key].push(entry);
			} else if (!isOurs(existing)) {
				custom[key].push(existing);
			} else if (isBlacklisted) {
				blacklisted[key].push(existing);
			} else if ((existing.metaData?.version ?? 0) >= entry.metaData.version && !existing.metaData?.default) {
				same[key].push(existing);
			} else {
				updated[key].push(entry);
			}
		}
		for (const existing of current[key]) {
			if (ourLabels.has(existing.label)) continue;
			if (isOurs(existing)) removed[key].push(existing);
			else customNew[key].push(existing);
		}
	}

	if (quiet) {
		console.info("Will be ADDED", added);
		console.info("Will be UPDATED", updated);
		console.info("Will be DELETED (older OSE Animations or Automated Animations defaults)", removed);
		console.info("Same name, made by someone else: IGNORED", custom);
		console.info("Not from OSE Animations: KEPT", customNew);
		console.info("No changes", same);
		console.info("Blacklisted", blacklisted);
		console.groupEnd();
	}

	const list = (byMenu) => AA_MENUS.flatMap((k) => byMenu[k].map((x) => `${x.label} <i class="ose-animations-muted">(${k})</i>`)).sort();
	const newSettings = {};
	for (const key of AA_MENUS) {
		const merged = [...added[key], ...updated[key], ...custom[key], ...same[key], ...customNew[key]];
		newSettings[key] = [...new Map(merged.map((v) => [v.id, v])).values()]
			.sort((a, b) => (a.label || "").localeCompare(b.label || ""))
			.map((x) => {
				x.metaData = x.metaData ?? {};
				x.metaData.label = x.label;
				x.metaData.menu = x.menu;
				return x;
			});
	}
	// Keep AA's schema version so its migration code leaves the merged menus alone.
	newSettings.version = game.settings.get("autoanimations", "aaAutorec").version;
	return {
		newSettings,
		added: list(added),
		updated: list(updated),
		custom: list(custom),
		removed: list(removed),
		customNew: list(customNew),
		blacklisted: list(blacklisted)
	};
}

function section(textKey, items, hintKey) {
	if (!items.length) return "";
	const t = (k) => game.i18n.localize(`${OSE_ANIM}.updateMenu.${k}`);
	return `
	<div class="ose-animations-autorec-update-child">
		<p class="ose-animations-autorec-update-text">${t(textKey)} <b>(${items.length})</b></p>
		${hintKey ? `<p class="ose-animations-autorec-update-text">${t(hintKey)}</p>` : ""}
		<ul class="ose-animations-autorec-update-ul ${items.length % 3 === 0 ? "ose-animations-columns-3" : ""}">
			${items.map((x) => `<li>${x}</li>`).join("")}
		</ul>
	</div>`;
}

async function openUpdateMenu() {
	if (!game.user.isGM) return;
	const diff = await generateAutorecUpdate(false);
	const changes = diff.added.length + diff.updated.length + diff.removed.length + diff.blacklisted.length;
	const debug = game.settings.get(OSE_ANIM, "debug");
	let content = `<div class="ose-animations-autorec-update">`;
	if (changes || diff.custom.length) {
		content += section("deleted", diff.removed);
		content += section("added", diff.added);
		content += section("custom", diff.custom, "customHint");
		content += section("updated", diff.updated);
		content += section("blacklisted", diff.blacklisted);
		if (debug) content += section("debugCustom", diff.customNew);
		if (changes) content += `<p class="ose-animations-warning">${game.i18n.localize(`${OSE_ANIM}.updateMenu.warning`)}</p>`;
	} else {
		content += `<p class="ose-animations-autorec-update-text">${game.i18n.localize(`${OSE_ANIM}.updateMenu.nothing`)}</p>`;
	}
	content += `</div>`;

	const buttons = [{ action: "cancel", label: game.i18n.localize("Cancel"), icon: "fa-solid fa-xmark" }];
	if (changes) buttons.unshift({ action: "update", label: game.i18n.localize(`${OSE_ANIM}.updateMenu.apply`), icon: "fa-solid fa-check", default: true });

	const choice = await foundry.applications.api.DialogV2.wait({
		window: { title: game.i18n.localize(`${OSE_ANIM}.updateMenu.title`) },
		position: { width: 720 },
		content,
		buttons,
		rejectClose: false
	});
	if (choice !== "update") return false;

	console.group("OSE Animations | Autorecognition Menu Update");
	const fresh = await generateAutorecUpdate();
	await AutomatedAnimations.AutorecManager.overwriteMenus(JSON.stringify(fresh.newSettings), { submitAll: true });
	ui.notifications.info(game.i18n.format(`${OSE_ANIM}.notifications.applied`, {
		added: fresh.added.length, updated: fresh.updated.length, removed: fresh.removed.length
	}));
	console.groupEnd();
	return true;
}

globalThis.oseAnimations ??= {};
Object.assign(globalThis.oseAnimations, { generateAutorecUpdate, openUpdateMenu });
