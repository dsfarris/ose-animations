# OSE spells vs 5e spells

196 OSE spells: **75 Identical**, **46 Equivalent**, **67 Similar**, **8 None**.

- **Identical**: same name, same core effect.
- **Equivalent**: same effect, different name or spelling.
- **Similar**: a related 5e spell covers part of the effect.
- **None**: no 5e counterpart; animation borrowed from a close effect.

"+ template" means the spell fills a measured template if one was drawn just before casting, and otherwise plays on the target token (or around the caster).

| OSE spell | Closest 5e spell | Match | Animation from (D&D5e Animations) | Plays as | Note |
|---|---|---|---|---|---|
| Cause Fear | Fear | Similar | Cause Fear | ontoken | 5e Cause Fear (XGE) is not in this world's compendiums. |
| Cause Light Wounds | Inflict Wounds | Equivalent | Inflict Wounds | ontoken |  |
| Cause Serious Wounds | Inflict Wounds | Equivalent | Inflict Wounds | ontoken | Upcast Inflict Wounds. |
| Cure Light Wounds | Cure Wounds | Equivalent | Cure Wounds | ontoken |  |
| Cure Serious Wounds | Cure Wounds | Equivalent | Cure Wounds | ontoken | Upcast Cure Wounds. |
| Detect Evil | Detect Evil and Good | Equivalent | Concentrating: Detect Magic | ontoken |  |
| Detect Magic | Detect Magic | Identical | Concentrating: Detect Magic | ontoken |  |
| Light | Light | Identical | Daylight | templatefx + template | Reverse (Darkness) has its own entry. Creates a light source (see LIGHTS in areas.py). |
| Protection from Evil | Protection from Evil and Good | Equivalent | Protection from Evil and Good | ontoken |  |
| Purify Food and Water | Purify Food and Drink | Equivalent | Purify Food and Drink | templatefx + template |  |
| Remove Fear | Heroism | Similar | Heroism | ontoken | Closest 5e effects: Heroism, Calm Emotions. |
| Resist Cold | Protection from Energy | Similar | Protection from Cold | ontoken |  |
| Bless | Bless | Identical | Bless | ontoken |  |
| Blight | Bane | Equivalent | Bane | ontoken | 5e Blight is a different (necrotic damage) spell; OSE Blight is reversed Bless = 5e Bane. |
| Find Traps | Find Traps | Identical | Find Traps | ontoken |  |
| Hold Person | Hold Person | Identical | Hold Person | ontoken |  |
| Know Alignment | — | None | Detect Thoughts | ontoken |  |
| Resist Fire | Protection from Energy | Similar | Protection from Fire | ontoken |  |
| Silence 15' Radius | Silence | Equivalent | Silence | templatefx + template |  |
| Snake Charm | Animal Friendship | Similar | Animal Friendship | ontoken |  |
| Speak with Animals | Speak with Animals | Identical | Speak with Animals | ontoken |  |
| Continual Light | Daylight | Equivalent | Daylight | templatefx + template | Creates a permanent light source (see LIGHTS in areas.py). |
| Continual Darkness | Darkness | Similar | Darkness | templatefx + template |  |
| Cure Disease | Lesser Restoration | Equivalent | Restoration | ontoken |  |
| Cause Disease | Contagion | Equivalent | Contagion | range |  |
| Growth of Animal | Enlarge/Reduce | Similar | Enlarge/Reduce | ontoken |  |
| Locate Object | Locate Object | Identical | Locate | ontoken |  |
| Remove Curse | Remove Curse | Identical | Remove Curse | ontoken |  |
| Curse | Bestow Curse | Equivalent | Bestow Curse | ontoken | Reverse of Remove Curse. |
| Striking | Magic Weapon | Similar | Magic Weapon | ontoken |  |
| Neutralize Poison | Protection from Poison | Similar | Protection from Poison | ontoken | 5e cures poison with Lesser Restoration / Protection from Poison. |
| Protection from Evil 10' Radius | Magic Circle | Similar | Protection from Evil and Good | ontoken |  |
| Speak with Plants | Speak with Plants | Identical | Speak with Plants | ontoken |  |
| Sticks to Snakes | Conjure Animals | Similar | Conjure Animals | ontoken |  |
| Commune | Commune | Identical | Commune | ontoken |  |
| Create Food | Create Food and Water | Equivalent | Create Food and Water | ontoken |  |
| Dispel Evil | Dispel Evil and Good | Equivalent | Dispel Evil and Good | ontoken |  |
| Insect Plague | Insect Plague | Identical | Insect Plague | templatefx + template |  |
| Quest | Geas | Equivalent | Geas | ontoken |  |
| Remove Quest | Remove Curse | Similar | Remove Curse | ontoken | 5e ends a geas with Remove Curse / Greater Restoration. |
| Raise Dead | Raise Dead | Identical | Raise Dead | ontoken |  |
| Finger of Death | Finger of Death | Identical | Finger of Death | range | Reverse of Raise Dead. |
| Animal Friendship | Animal Friendship | Identical | Animal Friendship | ontoken |  |
| Detect Danger | — | None | Detect Thoughts | ontoken | Nearest: Foresight / Detect Poison and Disease. |
| Entangle | Entangle | Identical | Entangle | templatefx + template |  |
| Faerie Fire | Faerie Fire | Identical | Faerie Fire | templatefx + template |  |
| Invisibility to Animals | Invisibility | Similar | Invisibility | ontoken | Also close to Pass without Trace. |
| Locate Plant or Animal | Locate Animals or Plants | Equivalent | Locate | ontoken |  |
| Predict Weather | — | None | Druidcraft | ontoken | Nearest: Druidcraft. |
| Barkskin | Barkskin | Identical | Barkskin | ontoken |  |
| Create Water | Create or Destroy Water | Equivalent | Create or Destroy Water | templatefx + template |  |
| Heat Metal | Heat Metal | Identical | Heat Metal | ontoken |  |
| Obscuring Mist | Fog Cloud | Equivalent | Fog Cloud | templatefx + template |  |
| Produce Flame | Produce Flame | Identical | Produce Flame | range |  |
| Slow Poison | Protection from Poison | Similar | Protection from Poison | ontoken |  |
| Warp Wood | — | None | Fabricate | ontoken |  |
| Air Breathing | Water Breathing | Similar | Water Breathing | ontoken | The reverse of Water Breathing. |
| Call Lightning | Call Lightning | Identical | Call Lightning | templatefx + template |  |
| Dispel Magic | Dispel Magic | Identical | Dispel Magic | ontoken |  |
| Growth of Nature | Plant Growth | Similar | Plant Growth | templatefx + template |  |
| Hold Animal | Hold Monster | Similar | Hold Monster | ontoken | Also close to Hold Person / Dominate Beast. |
| Protection from Poison | Protection from Poison | Identical | Protection from Poison | ontoken |  |
| Tree Shape | Tree Stride | Similar | Tree Stride | ontoken |  |
| Water Breathing | Water Breathing | Identical | Water Breathing | ontoken |  |
| Protection from Fire and Lightning | Protection from Energy | Similar | Protection from Lightning | ontoken |  |
| Summon Animals | Conjure Animals | Equivalent | Conjure Animals | ontoken |  |
| Temperature Control | — | None | Heat Aura | templatefx + template |  |
| Commune with Nature | Commune with Nature | Identical | Commune with Nature | ontoken |  |
| Control Weather | Control Weather | Identical | Control Weather | ontoken |  |
| Pass Plant | Transport via Plants | Equivalent | Transport via Plants | ontoken |  |
| Protection from Plants and Animals | Antilife Shell | Similar | Concentrating: Antilife Shell | ontoken |  |
| Transmute Rock to Mud | — | Similar | Transmute Rock | templatefx + template | 5e Transmute Rock (XGE) is not in this world's compendiums. |
| Transmute Mud to Rock | — | Similar | Transmute Rock | templatefx + template | Reverse of Transmute Rock to Mud. |
| Wall of Thorns | Wall of Thorns | Identical | Wall of Thorns | templatefx + template |  |
| Auditory Illusion | Minor Illusion | Similar | Minor Illusion | ontoken |  |
| Chromatic Orb | Chromatic Orb | Identical | Chromatic Orb | range |  |
| Colour Spray | Color Spray | Equivalent | Color Spray | templatefx + template |  |
| Dancing Lights | Dancing Lights | Identical | Dancing Lights | ontoken |  |
| Darkness | Darkness | Identical | Darkness | templatefx + template |  |
| Detect Illusion | See Invisibility | Similar | See Invisibility | ontoken | Also close to True Seeing. |
| Glamour | Disguise Self | Equivalent | Disguise Self | ontoken |  |
| Hypnotism | Suggestion | Similar | Suggestion | ontoken |  |
| Phantasmal Force | Silent Image | Equivalent | Silent Image | ontoken | 5e Phantasmal Force shares the name but works differently (an illusion inside one mind). |
| Read Magic | Identify | Similar | Identify | ontoken |  |
| Spook | Fear | Similar | Cause Fear | ontoken |  |
| Wall of Fog | Fog Cloud | Similar | Fog Cloud | templatefx + template |  |
| Blindness/Deafness | Blindness/Deafness | Identical | Blindness/Deafness | ontoken |  |
| Blur | Blur | Identical | Concentrating: Blur | ontoken |  |
| False Aura | Nystul's Magic Aura | Equivalent | Magic Aura | ontoken |  |
| Fascinate | Enthrall | Similar | Enthrall | ontoken |  |
| Hypnotic Pattern | Hypnotic Pattern | Identical | Hypnotic Pattern | templatefx + template |  |
| Improved Phantasmal Force | Major Image | Equivalent | Major Image | ontoken |  |
| Invisibility | Invisibility | Identical | Invisibility | ontoken |  |
| Magic Mouth | Magic Mouth | Identical | Magic Mouth | ontoken |  |
| Mirror Image | Mirror Image | Identical | Mirror Image | ontoken |  |
| Quasimorph | Alter Self | Similar | Alter Self | ontoken |  |
| Whispering Wind | Sending | Similar | Sending | ontoken | Also close to Message. |
| Blacklight | Darkness | Similar | Darkness | templatefx + template |  |
| Dispel Illusion | Dispel Magic | Similar | Dispel Magic | ontoken |  |
| Fear | Fear | Identical | Fear | templatefx + template |  |
| Hallucinatory Terrain | Hallucinatory Terrain | Identical | Hallucinatory Terrain | templatefx + template |  |
| Invisibility 10' Radius | Invisibility | Similar | Invisibility | ontoken |  |
| Nondetection | Nondetection | Identical | Nondetection | ontoken |  |
| Paralysation | Hold Monster | Similar | Hold Monster | ontoken |  |
| Phantom Steed | Phantom Steed | Identical | Phantom Steed | ontoken |  |
| Rope Trick | Rope Trick | Identical | Rope Trick | ontoken |  |
| Spectral Force | Major Image | Similar | Major Image | ontoken |  |
| Suggestion | Suggestion | Identical | Suggestion | ontoken |  |
| Wraithform | Gaseous Form | Similar | Gaseous Form | ontoken |  |
| Confusion | Confusion | Identical | Confusion | ontoken |  |
| Emotion | Calm Emotions | Similar | Calm Emotions | templatefx + template | Also close to Crown of Madness. |
| Illusory Stamina | False Life | Similar | False Life | ontoken |  |
| Improved Invisibility | Greater Invisibility | Equivalent | Greater Invisibility | ontoken |  |
| Massmorph | Seeming | Similar | Seeming | ontoken | Also close to Mirage Arcane. |
| Minor Creation | Creation | Similar | Creation | templatefx + template |  |
| Phantasmal Killer | Phantasmal Killer | Identical | Phantasmal Killer | ontoken |  |
| Rainbow Pattern | Hypnotic Pattern | Similar | Hypnotic Pattern | templatefx + template |  |
| Shadow Monsters | Summon Shadowspawn | Similar | Summon Shadowspawn | ontoken | Summon Shadowspawn (TCE) is not in this world's compendiums. |
| Solid Fog | Fog Cloud | Similar | Fog Cloud | templatefx + template |  |
| Veil of Abandonment | Mirage Arcane | None | Mirage Arcane | templatefx + template |  |
| Chaos | Confusion | Equivalent | Confusion | templatefx + template |  |
| Demi-Shadow Monsters | Summon Shadowspawn | Similar | Summon Shadowspawn | ontoken |  |
| Illusion | Major Image | Similar | Major Image | ontoken |  |
| Looking Glass | Scrying | Similar | Scrying | ontoken |  |
| Major Creation | Creation | Equivalent | Creation | templatefx + template |  |
| Maze of Mirrors | Maze | Similar | Maze | range |  |
| Projected Image | Project Image | Equivalent | Project Image | ontoken |  |
| Seeming | Seeming | Identical | Seeming | ontoken |  |
| Shadowcast | Shadow Blade | None | Shadow Blade | ontoken |  |
| Shadowy Transformation | Shadow of Moil | Similar | Shadow of Moil | ontoken |  |
| Time Flow | Haste | Similar | Haste | ontoken | Also close to Slow. |
| Visitation | Dream | Similar | Dream | ontoken |  |
| Acid Fog | Cloudkill | Similar | Cloudkill | templatefx + template |  |
| Dream Quest | Geas | Similar | Geas | ontoken |  |
| Impersonation | Disguise Self | Similar | Disguise Self | ontoken |  |
| Manifest Dream | Dream | Similar | Dream | ontoken |  |
| Mass Suggestion | Mass Suggestion | Identical | Suggestion | ontoken |  |
| Mislead | Mislead | Identical | Mislead | ontoken |  |
| Permanent Illusion | Programmed Illusion | Similar | Programmed Illusion | templatefx + template |  |
| Shades | Summon Shadowspawn | Similar | Summon Shadowspawn | ontoken |  |
| Through the Looking Glass | Arcane Gate | Similar | Arcane Gate | ontoken |  |
| Triggered Illusion | Programmed Illusion | Equivalent | Programmed Illusion | templatefx + template |  |
| True Seeing | True Seeing | Identical | True Seeing | ontoken |  |
| Vision | Divination | Similar | Divination | ontoken | Also close to Legend Lore. |
| Charm Person | Charm Person | Identical | Charm Person | ontoken |  |
| Floating Disc | Tenser's Floating Disk | Equivalent | Floating Disk | ontoken |  |
| Hold Portal | Arcane Lock | Similar | Arcane Lock | ontoken |  |
| Magic Missile | Magic Missile | Identical | Magic Missile | range |  |
| Read Languages | Comprehend Languages | Equivalent | Comprehend Languages | ontoken |  |
| Shield | Shield | Identical | Shield | ontoken |  |
| Sleep | Sleep | Identical | Sleep | preset + template |  |
| Ventriloquism | Thaumaturgy | None | Thaumaturgy | ontoken | Also close to Minor Illusion. |
| Detect Invisible | See Invisibility | Equivalent | See Invisibility | ontoken |  |
| ESP | Detect Thoughts | Equivalent | Detect Thoughts | ontoken |  |
| Knock | Knock | Identical | Knock | ontoken |  |
| Levitate | Levitate | Identical | Levitate | ontoken |  |
| Web | Web | Identical | Web | templatefx + template |  |
| Wizard Lock | Arcane Lock | Equivalent | Arcane Lock | ontoken |  |
| Clairvoyance | Clairvoyance | Identical | Clairvoyance | ontoken |  |
| Fire Ball | Fireball | Equivalent | Fireball | preset + template | Same spell; OSE spells it as two words. |
| Fly | Fly | Identical | Fly | ontoken |  |
| Haste | Haste | Identical | Haste | ontoken |  |
| Infravision | Darkvision | Equivalent | Darkvision | ontoken |  |
| Lightning Bolt | Lightning Bolt | Identical | Lightning Bolt | templatefx + template |  |
| Protection from Normal Missiles | Warding Wind | Similar | Shield | ontoken | Also close to Wind Wall. |
| Charm Monster | Charm Monster | Identical | Charm Monster | ontoken |  |
| Dimension Door | Dimension Door | Identical | Dimension Door | preset |  |
| Growth of Plants | Plant Growth | Equivalent | Plant Growth | templatefx + template |  |
| Polymorph Others | Polymorph | Equivalent | Polymorph | ontoken |  |
| Polymorph Self | Polymorph | Equivalent | Polymorph | ontoken |  |
| Wall of Fire | Wall of Fire | Identical | Wall of Fire | templatefx + template |  |
| Wall of Ice | Wall of Ice | Identical | Wall of Ice | templatefx + template |  |
| Wizard Eye | Arcane Eye | Equivalent | Arcane Eye | ontoken |  |
| Animate Dead | Animate Dead | Identical | Animate Dead | ontoken |  |
| Cloudkill | Cloudkill | Identical | Cloudkill | templatefx + template |  |
| Conjure Elemental | Conjure Elemental | Identical | Conjure Elemental | ontoken |  |
| Contact Higher Plane | Contact Other Plane | Equivalent | Contact Other Plane | ontoken |  |
| Feeblemind | Feeblemind | Identical | Feeblemind | range |  |
| Hold Monster | Hold Monster | Identical | Hold Monster | ontoken |  |
| Magic Jar | Magic Jar | Identical | Magic Jar | ontoken |  |
| Pass-Wall | Passwall | Equivalent | Passwall | ontoken |  |
| Telekinesis | Telekinesis | Identical | Telekinesis | ontoken |  |
| Teleport | Teleport | Identical | Teleport | preset |  |
| Wall of Stone | Wall of Stone | Identical | Wall of Stone | templatefx + template |  |
| Anti-Magic Shell | Antimagic Field | Equivalent | Concentrating: Antimagic Field | ontoken |  |
| Death Spell | Circle of Death | Similar | Circle of Death | templatefx + template |  |
| Disintegrate | Disintegrate | Identical | Disintegrate | range |  |
| Flesh to Stone | Flesh to Stone | Identical | Flesh to Stone | ontoken |  |
| Stone to Flesh | Greater Restoration | Similar | Restoration | ontoken | Reverse of Flesh to Stone; 5e has no Stone to Flesh, Greater Restoration ends petrification. |
| Geas | Geas | Identical | Geas | ontoken |  |
| Remove Geas | Remove Curse | Similar | Remove Curse | ontoken |  |
| Invisible Stalker | Conjure Elemental | Similar | Conjure Elemental | ontoken | Air elemental servant; also close to Summon Elemental. |
| Lower Water | Control Water | Similar | Control Water | templatefx + template |  |
| Part Water | Control Water | Similar | Control Water | templatefx + template |  |
| Move Earth | Move Earth | Identical | Move Earth | ontoken |  |
| Reincarnation | Reincarnate | Equivalent | Reincarnate | ontoken |  |
