// Compile build/macros/*.js into the module's LevelDB Macro compendium.
// Run with Foundry's bundled Electron as Node (see build.py): no extra installs needed.
//   ELECTRON_RUN_AS_NODE=1 CL=<path to classic-level> "Foundry Virtual Tabletop.exe" compile_packs.cjs <macroDir> <packDir>
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ClassicLevel } = require(process.env.CL);

const [macroDir, packDir] = process.argv.slice(2);
const ICONS = {
	"Open Update Menu": "icons/svg/upgrade.svg",
	"Open Automatic Recognition Menu": "icons/svg/book.svg",
	"Export Autorec JSON": "icons/svg/down.svg",
	"Preview Animation": "icons/svg/explosion.svg",
};

function docId(name) {
	const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	const bytes = crypto.createHash("sha256").update(`ose-animations.macros.${name}`).digest();
	return Array.from(bytes.subarray(0, 16), (b) => alphabet[b % alphabet.length]).join("");
}

(async () => {
	fs.rmSync(packDir, { recursive: true, force: true });
	fs.mkdirSync(packDir, { recursive: true });
	const db = new ClassicLevel(packDir, { valueEncoding: "json" });
	const files = fs.readdirSync(macroDir).filter((f) => f.endsWith(".js")).sort();
	let sort = 0;
	for (const f of files) {
		const name = path.basename(f, ".js");
		const _id = docId(name);
		await db.put(`!macros!${_id}`, {
			_id,
			name,
			type: "script",
			scope: "global",
			author: null,
			img: ICONS[name] ?? "icons/svg/dice-target.svg",
			command: fs.readFileSync(path.join(macroDir, f), "utf8"),
			folder: null,
			sort: (sort += 100000),
			ownership: { default: 0 },
			flags: {},
			_stats: { coreVersion: "14.369", systemId: "ose", systemVersion: "3.0.1" },
		});
	}
	await db.close();
	console.log(`macros: ${files.length} -> ${packDir}`);
})().catch((e) => { console.error(e); process.exit(1); });
