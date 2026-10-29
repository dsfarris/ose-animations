#!/bin/sh
# Re-dump the compendiums and world data that the spell lists and maps are built from.
# Copies each LevelDB first (skipping LOCK) so a running Foundry is never touched.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/.."
F="$ROOT/../FoundryVTT-WindowsPortable-14.369"; D="$F/Data"; A="$F/App"
TMP="${TMPDIR:-/tmp}/ose-anim-dbcopy"; mkdir -p "$TMP"
export ELECTRON_RUN_AS_NODE=1 CL="$(cygpath -w "$A/resources/app/node_modules/classic-level")"
dump() {
  rm -rf "$TMP/$1"; mkdir -p "$TMP/$1"
  for f in "$2"/*; do [ "$(basename "$f")" = LOCK ] || cp "$f" "$TMP/$1/"; done
  "$A/Foundry Virtual Tabletop.exe" "$(cygpath -w "$HERE/dump_pack.cjs")" "$(cygpath -w "$TMP/$1")" "$(cygpath -w "$ROOT/data/$1.json")"
}
dump ose-spells "$D/modules/ose-advancedfantasytome/packs/oseSpells"
dump ose-equipment "$D/modules/ose-advancedfantasytome/packs/oseItems"
dump ose-monsters "$D/modules/ose-advancedfantasytome/packs/ose-monsters"
dump ose-animals "$D/modules/ose-advancedfantasytome/packs/oseAnimals"
dump ose-world-items "$D/worlds/old-school-essentials/data/items"
dump ose-world-actors "$D/worlds/old-school-essentials/data/actors"
dump 5e-srd-spells "$D/systems/dnd5e/packs/spells"
dump 5e-spells24 "$D/systems/dnd5e/packs/spells24"
dump 5e-phb-spells "$D/modules/dnd-players-handbook/packs/spells"
