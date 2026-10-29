# OSE Animations

Automated Animations presets for **Old-School Essentials** in Foundry VTT v14. It's built the way D&D5e Animations is: the module carries a ready-made Automatic Recognition menu and merges it into Automated Animations for you.

## What you get
- **All 196 Advanced Fantasy spells** (Cleric, Druid, Illusionist and Magic-User), each matched to its closest 5e spell and animated with that spell's D&D5e Animations preset (or a close effect when 5e has no counterpart).
- **Weapons:** everything on the OSE equipment list (sword, two-handed sword, battle axe, polearm, long bow, crossbow, sling, javelin, holy water, burning oil...) plus common extras. Thrown weapons switch to a projectile when the target is out of reach.
- **Unarmed:** punch, fist, kick, grab, constrict and others. An attack made with no weapon plays as an unarmed strike.
- **Natural attacks:** bite, claw, talon, beak, gore, horn, tusk, hoof, trample, tail, sting, pincer, tentacle, touch and more.
- **Monster specials:** breath weapons (the dragon's type picks fire, cold, lightning, acid or poison), spit, spores, swarm, gaze, eye rays.
- **Macros** (compendium "OSE Animations Macros"): Open Update Menu, Open Automatic Recognition Menu, Export Autorec JSON, Preview Animation, End Spell Effects.

## Requirements
- Foundry VTT v14, Old-School Essentials system 3.0+
- Automated Animations 7+, Sequencer, socketlib
- JB2A and PSFX for graphics and sound. The Patreon versions are recommended; the free versions work, but some animations will be missing.

## Install
1. In Foundry's Setup screen, go to **Add-on Modules → Install Module**, paste this into **Manifest URL** at the bottom, and click **Install**:
   ```
   https://github.com/dsfarris/ose-animations/releases/latest/download/module.json
   ```
   Foundry offers to install the required modules (Automated Animations, Sequencer, socketlib) and the recommended free JB2A and PSFX if they're missing. Skip the free JB2A and PSFX if you already have the Patreon versions.
   (Or by hand: make a folder `Data/modules/ose-animations/`, unzip `ose-animations.zip` from the [latest release](https://github.com/dsfarris/ose-animations/releases/latest) into it, and restart Foundry.)
2. In your OSE world, enable **OSE Animations** under *Manage Modules*.
3. The **update menu** opens automatically for the GM. It lists what will be added, updated or removed. Click **Update**.
   You can open it again from *Configure Settings → OSE Animations → Update Menu*, or with the *Open Update Menu* macro.

New versions: Foundry's **Update** button on the Add-on Modules tab picks up new releases, and the update menu opens again in the world.

Animations you made yourself are never overwritten: an entry with the same name that OSE Animations didn't create is listed and skipped. Generic Automated Animations defaults are replaced, as D&D5e Animations does. Export a backup first with the *Export Autorec JSON* macro if you have custom work.

## How it plays in OSE
- **Attacks** animate once per target when the attack is rolled. Misses play as misses; turn this off with *Show Misses*.
- **Spells** animate when cast from the sheet. Posting a spell to chat without casting it doesn't animate.
- **Damage buttons** on chat cards don't replay the animation (see *Animate Damage Rolls*). Showing a weapon or armour card in chat doesn't animate.
- **Area spells place a template**, the way the D&D 5e system does. Casting Fire Ball, Lightning Bolt, Web, Bless and the other area spells shows the area at your cursor: left-click to place it, Ctrl + mouse wheel to rotate (Shift + wheel for bigger steps), right-click or Esc to skip. Sizes come from the Advanced Fantasy text (Fire Ball: 20' radius; Lightning Bolt: 60' × 5'; Fear: 60' cone, 30' wide at the end). Spells centred on the caster (Hypnotic Pattern, Protection from Evil 10' Radius) appear around the caster without a click.
  - Tokens inside the area are targeted (*Target Tokens in the Area*).
  - The animation fills the template. If you skip placement, it plays on the target token or around the caster instead.
  - Templates of instantaneous spells are removed after 10 seconds; lasting ones (Web, Cloudkill, Darkness) stay until you delete them.
  - When the caster picks the shape (walls, "3,000 square feet", "10' cube per level") you get a typical layout to rotate and adjust.
  - Dragon breath works the same way: a red dragon's breath places a 90' fire cone.
  - A template you draw yourself just before casting is used too.
- **Saves and damage are rolled for you** once the template is placed (*Roll Saves and Apply Damage in Areas*). The GM's client rolls a save for every creature in the area, rolls the damage once, applies full or half damage (or the spell's effect) to each creature's hit points, and posts one results card. Players' casts are handed to the GM automatically, so a GM must be logged in. The rules come from the spell text:
  - Fire Ball and Lightning Bolt: 1d6 per caster level (monsters use their HD), half on a save vs spells. Call Lightning: 8d6, half on a save.
  - Death Spell: 4d8 Hit Dice of creatures, weakest first, save vs death or die. Cloudkill: 1 damage to everyone; creatures under 5 HD save vs death or die. Wall of Thorns: 1d8 + AC to each creature where it appears.
  - Fear, Entangle, Hypnotic and Rainbow Pattern, Paralysation, Emotion, Blight, Confusion: save or be affected.
  - Dragon breath: damage equal to the dragon's current hit points, half on a save vs breath. Dragons with two breaths (gold, silver, bronze, copper, brass, multichromatic) ask which one first; the gas clouds are save-or-be-affected (sleep, paralysis, fear, slow, repulsion). Also the Chimera, Flame Lizard, Dragon Turtle, Sea Dragon and Iron Golem.
  - Creatures that fail get a status marker (asleep, paralysed, frightened, entangled, dead) when *Mark Conditions on Failed Saves* is on.
  - If you skip the template, OSE handles the cast as usual and nothing is rolled automatically.
- **The GM reviews each step** (*GM Reviews Area Results*, on by default) for homebrew rules and special cases. Nothing is applied until the GM finishes:
  1. **Setup:** change the save, the damage formula (caster level already filled in), what a save does, whether a failed save kills, the marker and the effect. For each creature: leave it out, give it a save modifier, or set it to auto-save, auto-fail or immune.
  2. **Saves:** change any roll or target number, or force Saved or Failed.
  3. **Damage:** change the total (amounts you haven't edited follow it) or any creature's amount.
  - **Next** goes to the next step, **Apply as rolled** accepts everything from there on, and **Cancel** stops with nothing applied. The results card says "Adjusted by the GM" when anything was changed. A player casting waits while the GM reviews.
- **Light and Continual Light create real light.** When cast, choose *At a spot* (place the area, and a light source appears there, 15' or 30') or *On a creature or object* (the target, or the caster, gives off the light). The GM's client creates it. Delete it from the Lighting layer, or the token's Light settings, when the spell ends.
- **Floating Disc** leaves a shimmering blue disc of force (round from above, about 4' across) floating beside the caster that follows them until the spell ends. With the Patreon JB2A it swells in when cast and pops when ended. OSE doesn't track durations, so end it with the **End Spell Effects** macro (select the caster's token and run it). Track what the disc carries in a note: OSE counts container contents toward the carrier's load.
- **Enhanced Character Sheet** (`osc-character-sheet`): its monster ATK buttons and character Attack buttons animate too, and a weapon-type breath (the Red Dragon's "Breath") places its cone and resolves from ATK. That sheet counts attacks per round, so ATK greys out once a monster's attacks are used; *New round* resets it.
- On OSE's own monster sheet, a dragon's breath can be used by clicking its picture (or the eye icon).
- Area animations without a template are sized in feet and rescaled to the scene's grid, so 10 ft dungeon squares work.
- Formula spells (Magic Missile, Cure Light Wounds…) are posted under the caster's name, even when another token is selected.

## Customising
Everything lands in Automated Animations' Automatic Recognition menu: open it with the macro and edit any entry. Entries ending in **§** are the token versions of template spells; the module picks them automatically when there's no template.

## Credits and licence
GPLv3. The animation configurations are adapted from **D&D5e Animations** by MrVauxs and Sisimshow (GPLv3), and a few of its sound files are included. Graphics by JB2A, sounds by PSFX. Built on Automated Animations by Otigon and theripper93.
