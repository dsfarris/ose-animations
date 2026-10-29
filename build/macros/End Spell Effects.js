// End lasting spell effects (such as a Floating Disc) on the selected tokens.
// OSE doesn't track spell durations, so use this when the spell runs out or is dismissed.
const tokens = canvas.tokens.controlled.length ? canvas.tokens.controlled : canvas.tokens.placeables.filter((t) => oseAnimations.lastingEffects(t).length);
const rows = tokens.flatMap((t) => oseAnimations.lastingEffects(t).map((e) => ({ token: t, ...e })));
if (!rows.length) return ui.notifications.info("No lasting spell effects on the selected tokens.");
const content = rows.map((r, i) => `<div class="form-group"><label><input type="checkbox" name="e${i}" checked> ${r.spell} (${r.token.name})</label></div>`).join("");
const chosen = await foundry.applications.api.DialogV2.prompt({
	window: { title: "End Spell Effects" },
	content,
	ok: { label: "End", callback: (_event, button) => rows.filter((_r, i) => button.form.elements[`e${i}`].checked) },
	rejectClose: false
});
for (const r of chosen ?? []) await oseAnimations.endSpellEffects(r.token, [r.name]);
