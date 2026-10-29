"""Areas of effect for OSE spells and breath weapons, from the Advanced Fantasy text.

Drives the template placed when an area spell is cast (module/areas.json) and the size of the
token-based "§" animations. Distances are in feet.

shape:
  circle   r = radius
  rect     side = width of a square (an OSE "20' cube" is a 20' square on the map)
  cone     length, width = width at the far end (OSE gives cones this way)
  line     length, width
at:
  point    the caster places it (default)
  caster   centred on the caster, no placement needed
note: where the caster chooses the shape (walls, "3,000 square feet", "10' cube per level"),
the default is a typical layout; it can be rotated while placing and edited after.
"""

AREAS = {
    # Cleric
    "Bless": {"shape": "rect", "side": 20},
    "Blight": {"shape": "rect", "side": 20},
    "Continual Light": {"shape": "circle", "r": 30},
    "Continual Darkness": {"shape": "circle", "r": 30},
    "Light": {"shape": "circle", "r": 15},
    "Darkness": {"shape": "circle", "r": 15},
    "Silence 15' Radius": {"shape": "circle", "r": 15},
    "Protection from Evil 10' Radius": {"shape": "circle", "r": 10, "at": "caster"},
    "Insect Plague": {"shape": "circle", "r": 30},
    # Druid
    "Entangle": {"shape": "circle", "r": 20},
    "Obscuring Mist": {"shape": "circle", "r": 20, "at": "caster", "note": "10' per caster level; 20' shown"},
    "Call Lightning": {"shape": "circle", "r": 10},
    "Growth of Nature": {"shape": "circle", "r": 30, "note": "up to 3,000 sq ft"},
    "Temperature Control": {"shape": "circle", "r": 10, "at": "caster"},
    "Transmute Rock to Mud": {"shape": "circle", "r": 30, "note": "up to 3,000 sq ft"},
    "Transmute Mud to Rock": {"shape": "circle", "r": 30, "note": "up to 3,000 sq ft"},
    "Wall of Thorns": {"shape": "line", "length": 60, "width": 10, "note": "up to 1,200 sq ft"},
    # Illusionist
    "Colour Spray": {"shape": "cone", "length": 20, "width": 20},
    "Wall of Fog": {"shape": "rect", "side": 20, "note": "10' cube per caster level"},
    "Hypnotic Pattern": {"shape": "rect", "side": 30, "at": "caster"},
    "Blacklight": {"shape": "circle", "r": 15},
    "Dispel Illusion": {"shape": "rect", "side": 20},
    "Fear": {"shape": "cone", "length": 60, "width": 30},
    "Hallucinatory Terrain": {"shape": "circle", "r": 30},
    "Invisibility 10' Radius": {"shape": "circle", "r": 10},
    "Paralysation": {"shape": "rect", "side": 20},
    "Spectral Force": {"shape": "rect", "side": 20},
    "Emotion": {"shape": "rect", "side": 40},
    "Massmorph": {"shape": "circle", "r": 120},
    "Rainbow Pattern": {"shape": "rect", "side": 30, "at": "caster"},
    "Solid Fog": {"shape": "rect", "side": 20, "note": "10' cube per caster level"},
    "Veil of Abandonment": {"shape": "circle", "r": 30},
    "Chaos": {"shape": "circle", "r": 30},
    "Illusion": {"shape": "rect", "side": 20},
    "Improved Phantasmal Force": {"shape": "rect", "side": 20},
    "Acid Fog": {"shape": "rect", "side": 20, "note": "10' cube per caster level"},
    "Permanent Illusion": {"shape": "rect", "side": 20},
    "Triggered Illusion": {"shape": "rect", "side": 20},
    # Magic-User
    "Web": {"shape": "rect", "side": 10},
    "Fire Ball": {"shape": "circle", "r": 20},
    "Haste": {"shape": "circle", "r": 30},
    "Lightning Bolt": {"shape": "line", "length": 60, "width": 5},
    "Confusion": {"shape": "circle", "r": 30},
    "Dispel Magic": {"shape": "rect", "side": 20},
    "Growth of Plants": {"shape": "circle", "r": 30, "note": "up to 3,000 sq ft"},
    "Wall of Fire": {"shape": "line", "length": 60, "width": 5, "note": "up to 1,200 sq ft"},
    "Wall of Ice": {"shape": "line", "length": 60, "width": 5, "note": "up to 1,200 sq ft"},
    "Cloudkill": {"shape": "circle", "r": 15},
    "Pass-Wall": {"shape": "circle", "r": 2.5},
    "Wall of Stone": {"shape": "line", "length": 50, "width": 5, "note": "1,000 cubic ft"},
    "Anti-Magic Shell": {"shape": "circle", "r": 10, "at": "caster"},
    "Death Spell": {"shape": "rect", "side": 60},
    "Lower Water": {"shape": "circle", "r": 50, "note": "up to 10,000 sq ft"},
    "Part Water": {"shape": "line", "length": 120, "width": 10},
}

# What happens to creatures caught in an area spell, from the spell text. Rolled and applied by the GM's client.
#   save      OSE save key (death, wand, paralysis, breath, spell); omitted = no save
#   damage    roll formula; (@level)d6 = 1d6 per caster level (or HD), @hp = caster's current hp, @ac = the target's AC
#   perTarget roll damage separately for each target (default: one roll for everyone)
#   onSave    "half" = half damage on a successful save, "none" = no damage on a save; omitted = damage regardless
#   onFail    "die" = a failed save sets hp to 0
#   maxHD     only creatures with fewer HD than this must save (others are unaffected by the save effect)
#   minHD     creatures with fewer HD than this get no save (automatically fail)
#   hdPool    roll this many HD; the weakest creatures are affected first until the pool runs out
#   effect    what a failed save means, for the chat card
#   status    Foundry status marker for a failed save
RESOLVE = {
    "Fire Ball": {"save": "spell", "damage": "(@level)d6", "onSave": "half", "type": "fire"},
    "Lightning Bolt": {"save": "spell", "damage": "(@level)d6", "onSave": "half", "type": "lightning"},
    "Call Lightning": {"save": "spell", "damage": "8d6", "onSave": "half", "type": "lightning"},
    "Wall of Thorns": {"damage": "1d8 + @ac", "perTarget": True, "effect": "caught where the wall appears"},
    "Death Spell": {"save": "death", "onFail": "die", "hdPool": "4d8", "effect": "dies"},
    "Cloudkill": {"save": "death", "damage": "1", "onFail": "die", "maxHD": 5, "effect": "dies (under 5 HD)", "type": "poison"},
    "Fear": {"save": "spell", "effect": "flees for 1 round per caster level", "status": "fear"},
    "Entangle": {"save": "spell", "effect": "entangled (on a save: half movement through the area)", "status": "restrain"},
    "Hypnotic Pattern": {"save": "spell", "effect": "hypnotised", "status": "stun"},
    "Rainbow Pattern": {"save": "spell", "effect": "hypnotised", "status": "stun"},
    "Paralysation": {"save": "spell", "effect": "paralysed", "status": "paralysis"},
    "Emotion": {"save": "spell", "effect": "afflicted by the chosen emotion"},
    "Blight": {"save": "spell", "effect": "-1 to morale, attack and damage rolls"},
    "Confusion": {"save": "spell", "minHD": 3, "effect": "confused (under 2+1 HD: no save)", "status": "stun"},
}

# Breath weapons by monster (Advanced Fantasy text). "match" is tested against the monster's name; a
# monster with several options asks which breath to use. Shapes as in AREAS, plus
#   box  length × width rectangle (OSE dragon clouds are 50' long, 40' wide)
# "anim" is the animation label to play.
_HP_HALF = {"save": "breath", "damage": "@hp", "onSave": "half"}
_FIRE_CONE = {"label": "Fire", "anim": "Breath (Fire)", "shape": "cone", "length": 90, "width": 30, **_HP_HALF, "type": "fire"}
_COLD_CONE = {"label": "Cold", "anim": "Breath (Cold)", "shape": "cone", "length": 80, "width": 30, **_HP_HALF, "type": "cold"}
_LIGHTNING_LINE = {"label": "Lightning", "anim": "Breath (Lightning)", "shape": "line", "length": 100, "width": 5, **_HP_HALF, "type": "lightning"}
_ACID_LINE = {"label": "Acid", "anim": "Breath (Acid)", "shape": "line", "length": 60, "width": 5, **_HP_HALF, "type": "acid"}
_CHLORINE = {"label": "Chlorine gas", "anim": "Breath (Poison)", "shape": "box", "length": 50, "width": 40, **_HP_HALF, "type": "poison"}


def _gas(label, effect, status=None):
    g = {"label": label, "anim": "Breath (Poison)", "shape": "box", "length": 50, "width": 40, "save": "breath", "effect": effect}
    if status:
        g["status"] = status
    return g


BREATHS = [
    {"match": "multichromatic", "options": [
        {**_FIRE_CONE, "label": "Red head (fire)"}, {**_COLD_CONE, "label": "White head (cold)"},
        {**_LIGHTNING_LINE, "label": "Blue head (lightning)"}, {**_ACID_LINE, "label": "Black head (acid)"},
        {**_CHLORINE, "label": "Green head (chlorine gas)"}]},
    {"match": "dragon turtle", "options": [{"label": "Steam", "anim": "Breath (Fire)", "shape": "box", "length": 90, "width": 30, **_HP_HALF, "type": "fire"}]},
    {"match": "sea dragon", "options": [{"label": "Poison spittle", "anim": "Breath (Poison)", "shape": "circle", "r": 10, "save": "breath", "onFail": "die", "effect": "dies", "type": "poison"}]},
    {"match": "red dragon", "options": [_FIRE_CONE]},
    {"match": "white dragon", "options": [_COLD_CONE]},
    {"match": "blue dragon", "options": [_LIGHTNING_LINE]},
    {"match": "black dragon", "options": [_ACID_LINE]},
    {"match": "green dragon", "options": [_CHLORINE]},
    {"match": "gold dragon", "options": [_FIRE_CONE, _CHLORINE]},
    {"match": "silver dragon", "options": [_COLD_CONE, _gas("Paralysing gas", "paralysed for 9 turns", "paralysis")]},
    {"match": "bronze dragon", "options": [_LIGHTNING_LINE, _gas("Repulsion gas", "pushed 60' away each round for 6 rounds")]},
    {"match": "copper dragon", "options": [_ACID_LINE, _gas("Slow gas", "half speed, acts every 2nd round for 6 rounds")]},
    {"match": "brass dragon", "options": [
        {"label": "Sleep gas", "anim": "Breath (Poison)", "shape": "cone", "length": 70, "width": 30, "save": "breath", "effect": "asleep for 4d4 turns", "status": "sleep"},
        _gas("Fear gas", "flees for 2 turns", "fear")]},
    {"match": "chimera", "options": [{"label": "Fire", "anim": "Breath (Fire)", "shape": "cone", "length": 50, "width": 10, "save": "breath", "damage": "3d6", "onSave": "half", "type": "fire", "note": "the text gives no save; the usual save vs breath for half is applied"}]},
    {"match": "flame lizard", "options": [{"label": "Fire", "anim": "Breath (Fire)", "shape": "cone", "length": 15, "width": 15, "save": "breath", "damage": "2d6", "onSave": "half", "type": "fire"}]},
    {"match": "iron golem", "options": [{"label": "Poison gas", "anim": "Breath (Poison)", "shape": "rect", "side": 10, "save": "death", "onFail": "die", "effect": "dies", "type": "poison"}]},
]

# Spells that create a light source. Cast at a spot (a light at the template's centre) or on a creature
# or object (that token gives off the light). Radius in feet, from the spell text.
LIGHTS = {
    "Light": {"radius": 15, "color": "#fff1c4", "note": "6 turns + 1 per caster level"},
    "Continual Light": {"radius": 30, "color": "#fff8e6", "note": "permanent"},
}

# Spells that leave a lasting visual on the caster while they last (Sequencer effect attached to the token,
# so it follows them). Ended with the "End Spell Effects" macro.
#   sizeFt  width in feet (converted to the scene's grid)   offset  distance beside the token, in squares
#   intro/outro  optional clips played when it appears and ends (skipped if this JB2A doesn't have them)
#   scaleY  squash vertically (1 = round)   bob  float up and down (px)
LASTING = {
    # Round from above: OSE's disc is a shallow 3' bowl, so top-down it's a circle (shown 4' across to read clearly).
    "Floating Disc": {"file": "jb2a.markers.bubble.loop.blue", "intro": "jb2a.markers.bubble.intro.blue",
                      "outro": "jb2a.markers.bubble.outro.blue", "sizeFt": 4, "offset": 0.85, "opacity": 0.9,
                      "bob": 4, "note": "6 turns; carries up to 5,000 coins"},
}

# Spells that are single-target or have no area in OSE, even though 5e or D&D5e Animations treat them as areas.
NO_TEMPLATE = {"Sleep", "Faerie Fire", "Detect Magic", "Detect Evil", "Purify Food and Water", "Create Water",
               "Minor Creation", "Major Creation"}


def radius_ft(area):
    """Half the largest extent, used to size circular token animations."""
    s = area["shape"]
    if s == "circle":
        return area["r"]
    if s == "rect":
        return area["side"] / 2
    return area["length"] / 2
