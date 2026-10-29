// Download your current Automatic Recognition menu as JSON (a backup, or to share).
// Automated Animations can import the file again from its own menu.
const menus = ["melee", "range", "ontoken", "templatefx", "preset", "aura", "aefx"];
const settings = {};
for (const key of menus) settings[key] = game.settings.get("autoanimations", `aaAutorec-${key}`);
settings.version = game.settings.get("autoanimations", "aaAutorec").version;
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
foundry.utils.saveDataToFile(JSON.stringify(settings, null, "\t"), "application/json", `autorec-${game.world.id}-${stamp}.json`);
