// Play any OSE Animations preset from the selected token at your targets,
// without casting the spell or rolling an attack. Template spells play their token version.
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Select the token that should play the animation.");
const autorec = await (await fetch("modules/ose-animations/module/autorec.json")).json();
const NT = " §";
const entries = ["melee", "range", "ontoken", "templatefx", "preset"]
	.flatMap((m) => autorec[m].map((e) => e))
	.filter((e) => !e.label.endsWith(NT));
const groups = {};
for (const e of entries) (groups[e.metaData.oseGroup] ??= []).push(e.label);
const options = Object.entries(groups).map(([g, labels]) =>
	`<optgroup label="${g}">${labels.sort().map((l) => `<option value="${l}">${l}</option>`).join("")}</optgroup>`).join("");
const label = await foundry.applications.api.DialogV2.prompt({
	window: { title: "Preview OSE Animation" },
	content: `<div class="form-group"><label>Animation</label><select name="label" autofocus>${options}</select></div>
		<p class="hint">Targets: ${game.user.targets.size || "none (self effects only)"}</p>`,
	ok: { label: "Play", callback: (_event, button) => button.form.elements.label.value },
	rejectClose: false
});
if (!label) return;
const hasTwin = entries.some((e) => e.label === label && e.metaData.oseTemplate);
const name = hasTwin ? label + NT : label;
const item = new CONFIG.Item.documentClass({ name, type: "spell" }, { parent: token.actor });
AutomatedAnimations.playAnimation(token, item, { targets: Array.from(game.user.targets) });
