# OSE system issues found while building OSE Animations

Running list for bug reports to [NecroticGnome/ose-foundry-core](https://github.com/NecroticGnome/ose-foundry-core). OSE 3.0.1, Foundry 14.369. Line numbers refer to `dist/ose.js`.

## Bugs

### 1. Formula rolls use the Item as the chat speaker
`OseItem.rollFormula` (line 3950) passes `speaker: ChatMessage.getSpeaker({ actor: this })`, where `this` is the Item (OSE's own code has a lint comment about it). `getSpeaker` doesn't recognise an Item, so it falls back to the selected token: casting Magic Missile from Hazrad's sheet while Morningstar is selected posts "Magic Missile roll" as Morningstar.
**Fix:** `ChatMessage.getSpeaker({ actor: this.actor, token: this.actor?.token })`.
**Workaround in OSE Animations:** `preCreateChatMessage` corrects the speaker.

### 2. Chat cards identify the item only by item id
`item-card.html`, `roll-result.html` and `roll-attack.html` carry `data-actor-id` and `data-item-id`, and attack messages add `flags.ose.itemId`. For an unlinked token, the item lives on the token's synthetic actor, so the actor id plus item id point at the base actor's copy (or at nothing, for items added to the token). Modules that read chat cards (Automated Animations, damage appliers) can't reliably find the item.
**Fix:** add `flags.ose.itemUuid` (and the token UUID) to every item chat message.
**Workaround:** OSE Animations searches canvas tokens for the item.

### 3. Item card speaker has no scene
`OseItem.show()` (line 4176) builds `speaker` by hand (`{ actor, token: this.actor?.token, alias }`) instead of `ChatMessage.getSpeaker`, so `speaker.scene` is null on item cards. Anything that resolves the speaker's token through the scene fails.
**Fix:** use `ChatMessage.getSpeaker({ actor: this.actor, token: this.actor?.token })`.

### 4. Chat card buttons fail for spells added to an unlinked token
`OseItem._onChatCardAction` (line 4203) finds the card's actor with `_getChatCardActor`, which uses the card's `data-token-id` and otherwise falls back to `game.actors.get(data-actor-id)`. `roll-result.html` cards (every spell with a roll formula, e.g. Fire Ball) never get a `tokenId`, so the fallback always picks the sidebar actor. If the spell was added to an unlinked token rather than the sidebar actor, the item isn't there. Every button (Save, Roll) then fails with "The requested Item … no longer exists on Actor …", before the selected tokens are even considered.
**Reproduce:** put an unlinked token on a scene, drag Fire Ball onto the token's sheet, cast it, select any token, and click "Spells Rods Staves – Save".
**Fix:** pass `tokenId` (`sceneId.tokenId`) to the roll-result template the way `show()` does for item cards. Bug #2's UUID would also cover it.
**Workaround in OSE Animations:** wraps `_getChatCardActor` to fall back to the speaker token, then the tokens on the map.

## Feature requests

### 5. Area of effect on spells, and template placement
Spells have only free-text range and duration. Areas exist only in the description, so nothing can place a measured template. Foundry v14's `canvas.regions.placeRegion()` makes placement easy once the data exists.
**Suggestion:** add `area: { shape, size, width }` to the spell data model, show it on the sheet, and offer to place the template when the spell is cast. The Advanced Fantasy compendium would need the data filled in.
**Workaround:** OSE Animations ships an area table for the Advanced Fantasy spells and places templates itself.

## Checked, not bugs
- Abilities without a roll formula throw "This Item does not have a formula to roll!" from `rollFormula`. The sheet only marks abilities rollable when they have a formula, so players never hit it.
- `item-card.html` has "Attack" and "Damage" buttons, and `_onChatCardAction` has a "damage" branch calling `item.rollDamage` (which only exists on the Actor; OSE's own comment notes this). The buttons depend on `hasAttack` / `hasDamage`, which OseItem never defines, so they never appear. That's dead code, not a live bug; worth mentioning as cleanup.
