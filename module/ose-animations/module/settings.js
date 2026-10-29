Hooks.once("init", () => {
	const MODULE_ID = "ose-animations";
	const t = (key) => game.i18n.localize(`${MODULE_ID}.settings.${key}`);

	game.settings.registerMenu(MODULE_ID, "autorecUpdate", {
		name: t("autorecUpdate.name"),
		label: t("autorecUpdate.label"),
		hint: t("autorecUpdate.hint"),
		icon: "fa-solid fa-wrench",
		type: OseAnimationsUpdateLauncher,
		restricted: true
	});

	//#region Settings
	game.settings.register(MODULE_ID, "autoUpdate", {
		scope: "world",
		config: true,
		name: t("autoUpdate.name"),
		hint: t("autoUpdate.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "playMisses", {
		scope: "world",
		config: true,
		name: t("playMisses.name"),
		hint: t("playMisses.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "placeTemplates", {
		scope: "world",
		config: true,
		name: t("placeTemplates.name"),
		hint: t("placeTemplates.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "autoTarget", {
		scope: "world",
		config: true,
		name: t("autoTarget.name"),
		hint: t("autoTarget.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "automateAreas", {
		scope: "world",
		config: true,
		name: t("automateAreas.name"),
		hint: t("automateAreas.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "createLights", {
		scope: "world",
		config: true,
		name: t("createLights.name"),
		hint: t("createLights.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "reviewAreas", {
		scope: "world",
		config: true,
		name: t("reviewAreas.name"),
		hint: t("reviewAreas.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "applyConditions", {
		scope: "world",
		config: true,
		name: t("applyConditions.name"),
		hint: t("applyConditions.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "removeInstantTemplates", {
		scope: "world",
		config: true,
		name: t("removeInstantTemplates.name"),
		hint: t("removeInstantTemplates.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "useTemplates", {
		scope: "world",
		config: true,
		name: t("useTemplates.name"),
		hint: t("useTemplates.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "templateWindow", {
		scope: "world",
		config: true,
		name: t("templateWindow.name"),
		hint: t("templateWindow.hint"),
		type: Number,
		range: { min: 5, max: 300, step: 5 },
		default: 30
	});
	game.settings.register(MODULE_ID, "scaleAreas", {
		scope: "world",
		config: true,
		name: t("scaleAreas.name"),
		hint: t("scaleAreas.hint"),
		type: Boolean,
		default: true
	});
	game.settings.register(MODULE_ID, "animateDamageRolls", {
		scope: "world",
		config: true,
		name: t("animateDamageRolls.name"),
		hint: t("animateDamageRolls.hint"),
		type: Boolean,
		default: false
	});
	game.settings.register(MODULE_ID, "debug", {
		scope: "client",
		config: true,
		name: t("debug.name"),
		hint: t("debug.hint"),
		type: Boolean,
		default: false
	});
	//#endregion

	//#region Data Storage
	game.settings.register(MODULE_ID, "version-previous", {
		scope: "world",
		type: String,
		default: "0"
	});
	game.settings.register(MODULE_ID, "blacklist", {
		scope: "world",
		type: Object,
		default: {
			menu: [],
			entries: [],
		}
	});
	game.settings.register(MODULE_ID, "show-popup", {
		scope: "world",
		type: Boolean,
		default: true
	});
	//#endregion
});

// registerMenu needs an Application class; this one just opens the update dialog and closes.
class OseAnimationsUpdateLauncher extends foundry.applications.api.ApplicationV2 {
	async render() {
		oseAnimations.openUpdateMenu();
		return this;
	}
}
