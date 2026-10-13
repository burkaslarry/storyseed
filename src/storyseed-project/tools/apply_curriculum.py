# -*- coding: utf-8 -*-
"""將新課程（5 單元 × 3 堂）寫入 client/src/pages/Home.tsx。"""
import json, re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from curriculum_data import LESSONS_ZH, LESSONS_EN, ACTIVITIES_ZH, ACTIVITIES_EN

HOME = str(Path(__file__).resolve().parents[1] / "client" / "src" / "pages" / "Home.tsx")
with open(HOME, "r", encoding="utf-8") as f:
    src = f.read()

# ---------- 1. lessons 數組 ----------
def ts_tuple3(items):
    rows = []
    for a, b, c in items:
        rows.append("    [%s, %s, %s]" % (json.dumps(a, ensure_ascii=False), json.dumps(b, ensure_ascii=False), json.dumps(c, ensure_ascii=False)))
    return rows

new_lessons = (
    "const lessons: Record<Lang, readonly (readonly [string, string, string])[]> = {\n"
    "  zh: [\n" + ",\n".join(ts_tuple3(LESSONS_ZH)) + ",\n  ],\n"
    "  en: [\n" + ",\n".join(ts_tuple3(LESSONS_EN)) + ",\n  ],\n"
    "};\n"
)

i0 = src.index("const lessons: Record<Lang")
j0 = src.index("\n};\n", i0) + len("\n};\n")
src = src[:i0] + new_lessons + src[j0:]

# ---------- 2. lessonActivitiesZh / En ----------
def ts_activity(n, a):
    L = []
    kind = a["kind"]; cycle = a["cycle"]
    L.append(f"{n}: {{")
    L.append(f"  kind: \"{kind}\", cycle: {cycle},")
    if a.get("p5"):
        L.append("  p5: { pieceTitle: %s, pieceTitleEn: %s }," % (json.dumps(a["p5"]["pieceTitle"], ensure_ascii=False), json.dumps(a["p5"]["pieceTitleEn"], ensure_ascii=False)))
    if a.get("p6"):
        L.append("  p6: { pieceTitle: %s, pieceTitleEn: %s }," % (json.dumps(a["p6"]["pieceTitle"], ensure_ascii=False), json.dumps(a["p6"]["pieceTitleEn"], ensure_ascii=False)))
    L.append("  goals: [")
    for g in a["goals"]:
        L.append("    %s," % json.dumps(g, ensure_ascii=False))
    L.append("  ],")
    L.append("  bigIdea: %s," % json.dumps(a["bigIdea"], ensure_ascii=False))
    L.append("  guidedTasks: [")
    for t in a["guidedTasks"]:
        L.append("    { id: %s, label: %s, hint: %s }," % (json.dumps(t["id"]), json.dumps(t["label"], ensure_ascii=False), json.dumps(t["hint"], ensure_ascii=False)))
    L.append("  ],")
    L.append("  writingTask: %s," % json.dumps(a["writingTask"], ensure_ascii=False))
    L.append("  aiStarter: %s," % json.dumps(a["aiStarter"], ensure_ascii=False))
    L.append("  parts: [")
    for p in a["parts"]:
        L.append("    { title: %s, kind: \"%s\"," % (json.dumps(p["title"], ensure_ascii=False), p["kind"]))
        if p["kind"] == "pairs":
            L.append("      pairs: [")
            for pr in p["pairs"]:
                L.append("        { label: %s, value: %s }," % (json.dumps(pr["label"], ensure_ascii=False), json.dumps(pr["value"], ensure_ascii=False)))
            L.append("      ] },")
        elif p["kind"] == "list":
            L.append("      items: [")
            for it in p["items"]:
                L.append("        %s," % json.dumps(it, ensure_ascii=False))
            L.append("      ] },")
        else:
            L.append("      text: %s }," % json.dumps(p["text"], ensure_ascii=False))
    L.append("  ],")
    L.append("  checklist: [")
    for c in a["checklist"]:
        L.append("    %s," % json.dumps(c, ensure_ascii=False))
    L.append("  ],")
    L.append("  exitTicket: [")
    for e in a["exitTicket"]:
        L.append("    %s," % json.dumps(e, ensure_ascii=False))
    L.append("  ],")
    L.append("},")
    return "\n".join(L)

def ts_activities(ACT):
    body = "\n".join(ts_activity(n, ACT[n]) for n in sorted(ACT))
    return "const lessonActivitiesZh: Record<number, LessonActivity> = {\n" + body + "\n};\n" if ACT is ACTIVITIES_ZH else "const lessonActivitiesEn: Record<number, LessonActivity> = {\n" + body + "\n};\n"

new_acts = ts_activities(ACTIVITIES_ZH) + "\n" + ts_activities(ACTIVITIES_EN) + "\n"

a0 = src.index("const lessonActivitiesZh: Record<number, LessonActivity> = {")
a1 = src.index("const lessonActivities: Record<Lang, Record<number, LessonActivity>> = {")
src = src[:a0] + new_acts + src[a1:]

# Update data only; keep application UI/auth/persistence intact.
with open(HOME, "w", encoding="utf-8") as f:
    f.write(src)
print("Updated curriculum data; UI/API integrations preserved.")
