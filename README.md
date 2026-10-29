# OSE Animations (project)

Builds the `ose-animations` Foundry module: Automated Animations presets for Old-School Essentials, derived from D&D5e Animations. The module's own instructions are in [module/ose-animations/README.md](module/ose-animations/README.md).

## Layout
| Path | What |
|---|---|
| `build/spell_map.py` | Every OSE spell → closest 5e spell, match grade, which D&D5e Animations preset it's built from |
| `build/attack_map.py` | Weapons, unarmed, natural attacks, monster specials |
| `build/build_autorec.py` | Clones/renames the presets, makes token "§" twins of template spells, validates every video/sound path |
| `build/macros/*.js` | Macro compendium sources (compiled by `compile_packs.cjs`) |
| `build/extract_spells.py`, `dump_packs.sh` | Spell lists from the world/compendium LevelDBs |
| `data/` | LevelDB dumps and the Sequencer path export used for validation (local only, contains licensed content) |
| `reports/` | `ose_spells.md`, `dnd5e_spells.md`, `spell_comparison.md` |
| `module/ose-animations/` | The module itself |
| `dist/ose-animations.zip` | Installable zip |

## Build
```bash
python build/build.py --zip
```
This regenerates `autorec.json`, the macros pack and the reports, syncs into the portable Foundry's `Data/modules`, and zips. While a world is running, Foundry keeps the macros pack open, so pack changes reach Foundry only after you restart the world.

To publish an update: bump `version` in `module/ose-animations/module.json`, commit, then run

```bash
python build/build.py --release
```

It sets the release download address, builds the zip, pushes, and publishes GitHub release `v<version>` with `ose-animations.zip` and `module.json` attached. Foundry servers installed from the manifest URL (`https://github.com/dsfarris/ose-animations/releases/latest/download/module.json`) then see the update. Needs the GitHub CLI signed in.

`data/` (raw compendium dumps, including premium content) is git-ignored and must never be committed.

## Licence
GPLv3 (see LICENSE). The animation presets are adapted from [D&D5e Animations](https://github.com/MrVauxs/dnd5e-animations) by MrVauxs and Sisimshow (GPLv3), which also supplies a few sound and texture files. Graphics come from JB2A and sounds from PSFX, neither included.

`data/sequencer-dbpaths.json` is exported from a running world (`Sequencer.Database.entries`, namespaces autoanimations/jb2a/psfx). Export it again after updating JB2A or PSFX.
