"""Build OSE Animations.

  python build/build.py           generate autorec.json, macros pack and reports, sync to Foundry
  python build/build.py --zip     also write dist/ose-animations.zip
  python build/build.py --no-sync skip copying into Foundry's Data/modules
  python build/build.py --release zip and publish GitHub release v<version> (bump the version and commit first)

The LevelDB dumps in data/ come from build/dump_packs.sh (run it again if the worlds change).
"""
import json
import os
import shutil
import subprocess
import sys
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
MOD = ROOT / "module" / "ose-animations"
FOUNDRY = ROOT.parent / "FoundryVTT-WindowsPortable-14.369"
APP = FOUNDRY / "App"
DATA = FOUNDRY / "Data"
REPORTS = ROOT / "reports"

sys.path.insert(0, str(BUILD))


def run_py(script):
    subprocess.run([sys.executable, str(BUILD / script)], check=True, env={**os.environ, "PYTHONUTF8": "1"})


def compile_packs():
    env = {**os.environ, "ELECTRON_RUN_AS_NODE": "1",
           "CL": str(APP / "resources" / "app" / "node_modules" / "classic-level")}
    subprocess.run([str(APP / "Foundry Virtual Tabletop.exe"), str(BUILD / "compile_packs.cjs"),
                    str(BUILD / "macros"), str(MOD / "packs" / "macros")], check=True, env=env)


def md_table(rows, cols):
    out = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for r in rows:
        out.append("| " + " | ".join(str(r.get(c, "")).replace("|", "/") for c in cols) + " |")
    return "\n".join(out)


def write_reports():
    REPORTS.mkdir(exist_ok=True)
    ose = json.loads((ROOT / "data" / "ose_spells.json").read_text(encoding="utf-8"))
    dnd = json.loads((ROOT / "data" / "dnd5e_spells.json").read_text(encoding="utf-8"))
    rep = json.loads((ROOT / "data" / "spell_report.json").read_text(encoding="utf-8"))

    # OSE list (Nixie charm/blank are monster abilities stored as spells; listed but not animated)
    rows = [{"Spell": r["name"], "Class": ", ".join(r["classes"]), "Level": ", ".join(map(str, r["levels"])),
             "Range": r["range"], "Duration": r["duration"], "Source": "; ".join(r["sources"])} for r in ose]
    (REPORTS / "ose_spells.md").write_text(
        f"# Old School Essentials world: spells ({len(ose)})\n\n"
        "From `ose-advancedfantasytome.spells` plus spells on world items, world actors and Advanced Fantasy monsters.\n\n"
        + md_table(rows, ["Spell", "Class", "Level", "Range", "Duration", "Source"]) + "\n", encoding="utf-8")

    rows = [{"Spell": r["name"], "Level": r["level"], "School": r["school"], "Range": r["range"],
             "Area": r["template"], "Source": "; ".join(s.split(" ")[0] for s in r["sources"])} for r in dnd]
    (REPORTS / "dnd5e_spells.md").write_text(
        f"# 5e World: spells ({len(dnd)})\n\n"
        "From `dnd5e.spells` (SRD 2014), `dnd5e.spells24` (SRD 2024) and `dnd-players-handbook.spells` (PHB 2024), de-duplicated by name.\n\n"
        + md_table(rows, ["Spell", "Level", "School", "Range", "Area", "Source"]) + "\n", encoding="utf-8")

    grades = Counter(r["match"] for r in rep)
    rows = [{"OSE spell": r["ose"], "Closest 5e spell": r["dnd5e"] or "—", "Match": r["match"],
             "Animation from (D&D5e Animations)": r["animation"].split(":", 1)[-1],
             "Plays as": r["menu"] + (" + template" if r["template"] else ""), "Note": r["note"]} for r in rep]
    (REPORTS / "spell_comparison.md").write_text(
        "# OSE spells vs 5e spells\n\n"
        f"{len(rep)} OSE spells: " + ", ".join(f"**{grades[g]} {g}**" for g in ["Identical", "Equivalent", "Similar", "None"])
        + ".\n\n- **Identical**: same name, same core effect.\n- **Equivalent**: same effect, different name or spelling.\n"
          "- **Similar**: a related 5e spell covers part of the effect.\n- **None**: no 5e counterpart; animation borrowed from a close effect.\n\n"
          "\"+ template\" means the spell fills a measured template if one was drawn just before casting, "
          "and otherwise plays on the target token (or around the caster).\n\n"
        + md_table(rows, ["OSE spell", "Closest 5e spell", "Match", "Animation from (D&D5e Animations)", "Plays as", "Note"]) + "\n",
        encoding="utf-8")
    print(f"reports: {len(ose)} OSE spells, {len(dnd)} 5e spells, grades {dict(grades)}")


def sync():
    """Copy the module into Foundry. A running world keeps its compendium LevelDB open, so packs
    are only replaced when Foundry isn't holding them (macro changes then need a world restart)."""
    dst = DATA / "modules" / "ose-animations"
    pack_dst = dst / "packs" / "macros"
    packs_locked = False
    if pack_dst.exists():
        try:
            shutil.rmtree(pack_dst)
        except PermissionError:
            packs_locked = True
    for f in MOD.rglob("*"):
        if not f.is_file() or f.name == "LOCK":
            continue
        rel = f.relative_to(MOD)
        if packs_locked and rel.parts[0] == "packs":
            continue
        (dst / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dst / rel)
    print(f"synced -> {dst}" + (" (packs in use by Foundry, left as they were)" if packs_locked else ""))


REPO = "dsfarris/ose-animations"
GH = shutil.which("gh") or r"C:\Program Files\GitHub CLI\gh.exe"


def module_version():
    return json.loads((MOD / "module.json").read_text(encoding="utf-8"))["version"]


def set_download_url():
    """module.json's download address must name this version's release zip."""
    path = MOD / "module.json"
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    url = f"https://github.com/{REPO}/releases/download/v{data['version']}/ose-animations.zip"
    if data.get("download") != url:
        path.write_text(text.replace(f'"download": "{data["download"]}"', f'"download": "{url}"'), encoding="utf-8")
        print(f"download -> {url}")


def release():
    """Publish dist/ose-animations.zip and module.json as GitHub release v<version>.
    Foundry's manifest URL points at the latest release's module.json, so servers see the update."""
    version = module_version()
    if subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True).stdout.strip():
        sys.exit("Commit your changes before releasing (git status isn't clean).")
    subprocess.run(["git", "push", "origin", "HEAD"], cwd=ROOT, check=True)
    subprocess.run([GH, "release", "create", f"v{version}", str(ROOT / "dist" / "ose-animations.zip"), str(MOD / "module.json"),
                    "--repo", REPO, "--title", f"OSE Animations {version}", "--generate-notes"], cwd=ROOT, check=True)
    print(f"released v{version}")


def zip_module():
    out = ROOT / "dist" / "ose-animations.zip"
    out.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(MOD.rglob("*")):
            if f.is_file() and f.name != "LOCK":
                z.write(f, f.relative_to(MOD))  # module.json at the zip root, as Foundry expects
    print(f"zip -> {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    set_download_url()
    run_py("extract_spells.py")
    run_py("build_autorec.py")
    compile_packs()
    shutil.copy2(DATA / "modules" / "dnd5e-animations" / "LICENSE", MOD / "LICENSE")
    write_reports()
    if "--no-sync" not in sys.argv:
        sync()
    if "--zip" in sys.argv or "--release" in sys.argv:
        zip_module()
    if "--release" in sys.argv:
        release()
