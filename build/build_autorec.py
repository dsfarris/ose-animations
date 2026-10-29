"""Generate module/ose-animations/module/autorec.json from the spell and attack maps.

Sources:
  D&D5e Animations autorec.json (GPLv3) - the presets we clone and rename
  data/sequencer-dbpaths.json           - every Sequencer path in this world (autoanimations, jb2a, psfx),
                                          exported from Foundry; used to validate every video and sound
"""
import copy
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOUNDRY_DATA = ROOT.parent / "FoundryVTT-WindowsPortable-14.369" / "Data"
D5A = FOUNDRY_DATA / "modules" / "dnd5e-animations"
MOD = ROOT / "module" / "ose-animations"
MODULE_ID = "ose-animations"
META_NAME = "OSE Animations"

sys.path.insert(0, str(Path(__file__).parent))
from spell_map import S, ALIASES as SPELL_ALIASES, EXCLUDED_TERMS  # noqa: E402
from attack_map import A, ALIASES as ATTACK_ALIASES  # noqa: E402
from areas import AREAS, BREATHS, NO_TEMPLATE, RESOLVE, radius_ft  # noqa: E402

MENUS = ["melee", "range", "ontoken", "templatefx", "preset", "aura", "aefx"]
NT = " §"  # suffix of the token-based twin of a template spell (no letters, so it never matches a real name)
GRID_FT = 5  # area sizes are authored for 5 ft squares; the module rescales at runtime per scene


def module_version():
    return json.loads((MOD / "module.json").read_text(encoding="utf-8"))["version"]


def version_number(v):
    a, b, c = (int(x) for x in v.split("."))
    return a * 1_000_000 + b * 1_000 + c


class Builder:
    def __init__(self):
        self.d5a = json.loads((D5A / "module" / "autorec.json").read_text(encoding="utf-8"))
        db = json.loads((ROOT / "data" / "sequencer-dbpaths.json").read_text(encoding="utf-8"))
        self.dbpaths = {ns: set(v) for ns, v in db.items()}
        self.prefixes = set()
        for paths in self.dbpaths.values():
            for p in paths:
                parts = p.split(".")
                for i in range(2, len(parts) + 1):
                    self.prefixes.add(".".join(parts[:i]))
        self.out = {m: [] for m in MENUS}
        self.labels = {}
        self.assets = set()
        self.errors = []
        self.report = []
        self.mv = module_version()
        self.vnum = version_number(self.mv)

    # ---------- lookup ----------
    def find(self, src):
        menu, _, label = src.partition(":")
        if not label:
            menu, label = None, src
        for m in ([menu] if menu else MENUS):
            for e in self.d5a.get(m, []):
                if isinstance(e, dict) and e.get("label") == label:
                    return copy.deepcopy(e)
        raise KeyError(f"D&D5e Animations has no autorec entry '{src}'")

    def skeleton(self, menu):
        return self.find({"ontoken": "ontoken:Cure Wounds", "range": "range:Magic Missile"}[menu])

    # ---------- video helpers ----------
    @staticmethod
    def video_key(v):
        if v.get("enableCustom") and v.get("customPath"):
            return v["customPath"]
        return f"autoanimations.{v['dbSection']}.{v['menuType']}.{v['animation']}.{v['variant']}.{v['color']}"

    def as_custom(self, v):
        key = self.video_key(v)
        return {**{k: v.get(k) for k in ("dbSection", "menuType", "animation", "variant", "color")},
                "enableCustom": True, "customPath": key}

    def shape_of(self, v):
        key = self.video_key(v).lower()
        if v.get("dbSection") == "templatefx" and not v.get("enableCustom"):
            return v["menuType"]
        if "cone" in key or "breath" in key:
            return "cone"
        if "line" in key or ".ray." in key or "lightningbolt" in key:
            return "ray"
        return "circle"

    # ---------- entry construction ----------
    def finish(self, entry, label, group, extra_meta=None):
        entry["label"] = label
        entry["id"] = hashlib.md5(label.encode("utf-8")).hexdigest()[:16]
        entry.pop("levels3d", None)
        entry["metaData"] = {
            "name": META_NAME,
            "moduleVersion": self.mv,
            "version": self.vnum,
            "label": label,
            "menu": entry["menu"],
            "oseGroup": group,
            **(extra_meta or {}),
        }
        if label.lower() in self.labels:
            self.errors.append(f"duplicate label {label!r}")
        self.labels[label.lower()] = entry
        self.out[entry["menu"]].append(entry)
        return entry

    def aefx_to_ontoken(self, e):
        if e.get("activeEffectType") == "aura":
            o = self.skeleton("ontoken")
            o["primary"]["video"] = self.as_custom(e["primary"]["video"])
            o["primary"]["sound"] = {**o["primary"]["sound"], **(e["primary"].get("sound") or {})}
            o["primary"]["options"].update(playOn="source", isRadius=True, addTokenWidth=True,
                                           size=e["primary"]["options"].get("size", 2),
                                           opacity=e["primary"]["options"].get("opacity", 1), persistent=False)
            o["label"] = e["label"]
            return o
        if e.get("activeEffectType") not in (None, "ontoken"):
            raise ValueError(f"{e['label']}: aefx type {e.get('activeEffectType')} can't become ontoken")
        e["menu"] = "ontoken"
        e.pop("activeEffectType", None)
        e.pop("advanced", None)
        e["primary"]["options"]["persistent"] = False
        e["primary"]["options"].setdefault("playOn", "default")
        for k in ("target",):
            e.setdefault(k, copy.deepcopy(self.skeleton("ontoken")[k]))
        return e

    @staticmethod
    def apply_mods(e, spec):
        if "primary" not in e:  # presets keep their own data block
            return
        po = e["primary"]["options"]
        if "size" in spec:
            po["size"] = spec["size"]
        if "playOn" in spec:
            po["playOn"] = spec["playOn"]
        if "persistent" in spec:
            po["persistent"] = spec["persistent"]
        if "tint" in spec:
            po["tint"] = True
            po["tintColor"] = spec["tint"]
        if "custom" in spec:
            e["primary"]["video"]["enableCustom"] = True
            e["primary"]["video"]["customPath"] = spec["custom"]
        if "sound" in spec:
            e["primary"]["sound"].update(enable=True, file=spec["sound"])

    def token_twin(self, src_entry, spec):
        """A token-based copy of a template animation: no MeasuredTemplate/Region needed."""
        area = spec.get("area", 20)
        on = spec.get("on", "target")
        menu = src_entry["menu"]
        preset_type = src_entry.get("presetType")
        if menu == "preset" and preset_type == "proToTemp":
            d = src_entry["data"]
            e = self.skeleton("range")
            e["primary"]["video"] = self.as_custom(d["projectile"])
            e["primary"]["sound"] = {**e["primary"]["sound"], **d["projectile"].get("sound", {})}
            e["primary"]["options"].update(repeat=1, isWait=True)
            e["secondary"]["enable"] = True
            e["secondary"]["video"] = self.as_custom(d["explosion"])
            e["secondary"]["sound"] = {**e["secondary"]["sound"], **d["explosion"].get("sound", {})}
            e["secondary"]["options"].update(isRadius=True, size=area / GRID_FT, delay=0, repeat=1)
            return e, {"oseArea": True, "oseSingleTarget": True}
        if menu == "preset" and preset_type == "thunderwave":
            d = src_entry["data"]
            e = self.skeleton("ontoken")
            e["primary"]["video"] = self.as_custom(d["video"])
            e["primary"]["sound"] = {**e["primary"]["sound"], **d.get("sound", {})}
            e["primary"]["options"].update(playOn="source", isRadius=True, addTokenWidth=True, size=area / GRID_FT)
            return e, {"oseArea": True}
        if menu != "templatefx":
            raise ValueError(f"{src_entry['label']}: can't build a token twin from {menu}/{preset_type}")
        p = src_entry["primary"]
        shape = self.shape_of(p["video"])
        if shape in ("cone", "ray"):
            e = self.skeleton("range")
            e["primary"]["video"] = self.as_custom(p["video"])
            e["primary"]["sound"] = {**e["primary"]["sound"], **p.get("sound", {})}
            e["primary"]["options"].update(repeat=1, opacity=p["options"].get("opacity") or 1)
            return e, {"oseSingleTarget": True}
        e = self.skeleton("ontoken")
        e["primary"]["video"] = self.as_custom(p["video"])
        e["primary"]["sound"] = {**e["primary"]["sound"], **p.get("sound", {})}
        e["primary"]["options"].update(
            playOn="source" if on == "source" else "target",
            isRadius=True, addTokenWidth=on == "source", size=area / GRID_FT,
            opacity=p["options"].get("opacity") or 1, persistent=False,
        )
        return e, {"oseArea": True, "oseSingleTarget": on != "source"}

    def add(self, name, spec, group, aliases=(), excluded=None):
        if isinstance(spec, str):
            spec = {"src": spec}
        if "area" in spec and name in AREAS:  # the book's area wins over the authored animation size
            spec = {**spec, "area": radius_ft(AREAS[name])}
            if AREAS[name].get("at") == "caster":
                spec["on"] = "source"
        src = self.find(spec["src"])
        is_template = src["menu"] == "templatefx" or (
            src["menu"] == "preset" and src.get("presetType") in ("proToTemp", "thunderwave"))
        made = []
        for label in [name, *aliases]:
            if is_template:
                main = copy.deepcopy(src)
                if main["menu"] == "templatefx":
                    self.apply_mods(main, {k: v for k, v in spec.items() if k == "tint"})
                    main["primary"]["options"]["removeTemplate"] = False
                self.finish(main, label, group, {"oseTemplate": True})
                twin, meta = self.token_twin(src, spec)
                self.apply_mods(twin, {k: v for k, v in spec.items() if k in ("tint", "sound")})
                self.finish(twin, label + NT, group, {**meta, "oseTwinOf": label})
                made.append(main)
            else:
                e = copy.deepcopy(src)
                if e["menu"] == "aefx":
                    e = self.aefx_to_ontoken(e)
                if e["menu"] == "preset" and e.get("presetType") not in ("teleportation",):
                    raise ValueError(f"{name}: unsupported preset {e.get('presetType')}")
                self.apply_mods(e, spec)
                meta = {}
                if "area" in spec and e["menu"] == "ontoken":
                    on = spec.get("on", "target")
                    e["primary"]["options"].update(
                        playOn="source" if on == "source" else "target", isRadius=True,
                        addTokenWidth=on == "source", size=spec["area"] / GRID_FT)
                    meta = {"oseArea": True}
                if excluded:
                    e["advanced"] = {"exactMatch": False, "excludedTerms": excluded,
                                     "excludedType": {"enabled": False, "path": "", "property": ""}}
                self.finish(e, label, group, meta)
                made.append(e)
        return made

    # ---------- validation ----------
    def check_video(self, where, v):
        if not v:
            return
        key = self.video_key(v)
        if key.startswith("modules/"):
            self.assets.add(key)
            return
        if key.endswith(".random"):  # AA picks a colour at runtime
            key = key[: -len(".random")]
        if key not in self.prefixes:
            self.errors.append(f"{where}: unknown video {key}")

    def check_sound(self, where, s):
        if not s or not s.get("enable") or not s.get("file"):
            return
        f = s["file"]
        if f.startswith("modules/"):
            self.assets.add(f)
        elif f not in self.prefixes:
            self.errors.append(f"{where}: unknown sound {f}")

    def validate(self):
        for menu, entries in self.out.items():
            for e in entries:
                w = f"{menu}/{e['label']}"
                for sec in ("primary", "secondary", "source", "target"):
                    part = e.get(sec)
                    if not part or (sec != "primary" and not part.get("enable")):
                        continue
                    self.check_video(f"{w}.{sec}", part.get("video"))
                    self.check_sound(f"{w}.{sec}", part.get("sound"))
                if e.get("meleeSwitch", {}).get("options", {}).get("switchType") == "on":
                    self.check_video(f"{w}.meleeSwitch", e["meleeSwitch"].get("video") and {**e["meleeSwitch"]["video"], "enableCustom": False})
                    self.check_sound(f"{w}.meleeSwitch", e["meleeSwitch"].get("sound"))
                self.check_sound(f"{w}.soundOnly", e.get("soundOnly", {}).get("sound"))
                d = e.get("data") or {}
                for part in ("projectile", "explosion", "preExplosion", "start", "between", "end", "video"):
                    p = d.get(part) if part != "video" else d
                    if not isinstance(p, dict):
                        continue
                    if part in ("preExplosion", "between", "start", "end") and not p.get("enable"):
                        continue
                    vid = p.get("video") if part == "video" else p
                    if vid and vid.get("dbSection"):
                        self.check_video(f"{w}.data.{part}", vid)
                    self.check_sound(f"{w}.data.{part}", p.get("sound"))
                self.check_sound(f"{w}.data.sound", d.get("sound"))

    # ---------- asset localisation ----------
    def localise_assets(self):
        """Copy D&D5e Animations' own sound/graphic files we reference and point at our copy."""
        text = json.dumps(self.out)
        for a in sorted(self.assets):
            if not a.startswith("modules/dnd5e-animations/"):
                self.errors.append(f"asset outside dnd5e-animations: {a}")
                continue
            rel = a[len("modules/dnd5e-animations/"):]
            files = sorted(D5A.glob(rel)) if "*" in rel else [D5A / rel]  # Sequencer accepts wildcards
            files = [f for f in files if f.is_file()]
            if not files:
                self.errors.append(f"missing asset {a}")
                continue
            for srcf in files:
                dst = MOD / srcf.relative_to(D5A)
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(srcf, dst)
        text = text.replace("modules/dnd5e-animations/", f"modules/{MODULE_ID}/")
        self.out = json.loads(text)

    def build(self):
        for name, eq, grade, spec, note in S:
            made = self.add(name, spec, "Spell", SPELL_ALIASES.get(name, ()), EXCLUDED_TERMS.get(name) or None)
            src = spec if isinstance(spec, str) else spec["src"]
            self.report.append({"ose": name, "dnd5e": eq, "match": grade, "animation": src,
                                "menu": made[0]["menu"], "template": bool(made[0]["metaData"].get("oseTemplate")),
                                "note": note})
        for label, spec, group in A:
            self.add(label, spec, group, ATTACK_ALIASES.get(label, ()))
        self.validate()
        self.localise_assets()
        for m in self.out:
            self.out[m].sort(key=lambda e: e["label"].lower())
        self.out["version"] = 5
        return self


if __name__ == "__main__":
    b = Builder().build()
    if b.errors:
        print("\n".join(b.errors))
        sys.exit(1)
    dst = MOD / "module" / "autorec.json"
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(b.out, indent=1, ensure_ascii=False), encoding="utf-8")
    areas = dict(AREAS)
    for name, aliases in {**SPELL_ALIASES, **ATTACK_ALIASES}.items():
        for alias in aliases:
            if name in AREAS:
                areas[alias] = AREAS[name]
    template_labels = sorted(e["label"] for m in MENUS for e in b.out[m] if e["metaData"].get("oseTemplate"))
    resolve = dict(RESOLVE)
    for name, aliases in SPELL_ALIASES.items():
        for alias in aliases:
            if name in RESOLVE:
                resolve[alias] = RESOLVE[name]
    unknown = [n for n in AREAS if n.lower() not in b.labels]
    unknown += [f"resolve:{n}" for n in RESOLVE if n not in AREAS]
    unknown += [f"breath anim:{o['anim']}" for br in BREATHS for o in br["options"] if o["anim"].lower() not in b.labels]
    if unknown:
        print("areas without an animation entry:", unknown)
        sys.exit(1)
    (MOD / "module" / "areas.json").write_text(json.dumps(
        {"areas": areas, "resolve": resolve, "breaths": BREATHS, "noTemplate": sorted(NO_TEMPLATE), "templateLabels": template_labels},
        indent=1, ensure_ascii=False), encoding="utf-8")
    (ROOT / "data" / "spell_report.json").write_text(json.dumps(b.report, indent=1), encoding="utf-8")
    counts = {m: len(b.out[m]) for m in MENUS}
    print(f"autorec.json: {sum(counts.values())} entries {counts}; assets copied: {len(b.assets)}")
