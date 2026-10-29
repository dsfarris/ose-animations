"""Build the OSE and 5e spell lists from the LevelDB dumps in data/.

Dumps come from build/dump_packs.sh (Foundry's bundled classic-level, run on copies).
Writes data/ose_spells.json and data/dnd5e_spells.json.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def load(name):
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


def docs(dump, prefix="!items!"):
    return [v for k, v in dump.items() if k.startswith(prefix)]


def embedded_items(dump):
    """Items embedded in actors, keyed '!actors.items!<actor>.<item>'."""
    return [v for k, v in dump.items() if k.startswith("!actors.items!")]


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or "")).strip()


def ose_spells():
    out = {}
    sources = [
        ("ose-advancedfantasytome.spells", docs(load("ose-spells"))),
        ("world items", docs(load("ose-world-items"))),
        ("world actors", embedded_items(load("ose-world-actors"))),
        ("AFT monsters", embedded_items(load("ose-monsters"))),
    ]
    for src, items in sources:
        for it in items:
            if it.get("type") != "spell":
                continue
            s = it["system"]
            key = it["name"].strip()
            rec = out.setdefault(key, {
                "name": key,
                "classes": set(),
                "levels": set(),
                "range": s.get("range", ""),
                "duration": s.get("duration", ""),
                "save": s.get("save", ""),
                "sources": set(),
                "summary": strip_html(s.get("description"))[:240],
            })
            if s.get("class"):
                rec["classes"].add(s["class"])
            if s.get("lvl"):
                rec["levels"].add(int(s["lvl"]))
            rec["sources"].add(src)
    for r in out.values():
        for k in ("classes", "levels", "sources"):
            r[k] = sorted(r[k])
    return sorted(out.values(), key=lambda r: r["name"])


def dnd5e_spells():
    out = {}
    for src, name in [("dnd5e.spells (SRD 2014)", "5e-srd-spells"),
                      ("dnd5e.spells24 (SRD 2024)", "5e-spells24"),
                      ("dnd-players-handbook.spells (PHB 2024)", "5e-phb-spells")]:
        for it in docs(load(name)):
            if it.get("type") != "spell":
                continue
            s = it["system"]
            key = it["name"].strip()
            rng = s.get("range") or {}
            tgt = (s.get("target") or {}).get("template") or {}
            act = [a.get("type") for a in (s.get("activities") or {}).values()]
            rec = out.setdefault(key, {
                "name": key,
                "level": s.get("level"),
                "school": s.get("school"),
                "range": f"{rng.get('value') or ''} {rng.get('units') or ''}".strip(),
                "template": f"{tgt.get('size') or ''} {tgt.get('type') or ''}".strip(),
                "activities": sorted(set(filter(None, act))),
                "sources": set(),
                "summary": strip_html(s.get("description", {}).get("value"))[:240],
            })
            rec["sources"].add(src)
    for r in out.values():
        r["sources"] = sorted(r["sources"])
    return sorted(out.values(), key=lambda r: r["name"])


if __name__ == "__main__":
    o = ose_spells()
    d = dnd5e_spells()
    (DATA / "ose_spells.json").write_text(json.dumps(o, indent=1), encoding="utf-8")
    (DATA / "dnd5e_spells.json").write_text(json.dumps(d, indent=1), encoding="utf-8")
    by = defaultdict(int)
    for r in o:
        for c in r["classes"]:
            by[c] += 1
    print(f"OSE: {len(o)} unique spells {dict(by)}")
    print(f"5e: {len(d)} unique spells")
