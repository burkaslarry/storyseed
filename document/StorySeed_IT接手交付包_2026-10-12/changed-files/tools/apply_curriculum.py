# -*- coding: utf-8 -*-
"""將新課程（5 單元 × 3 堂）寫入 client/src/pages/Home.tsx。"""
import json, re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from curriculum_data import LESSONS_ZH, LESSONS_EN, ACTIVITIES_ZH, ACTIVITIES_EN

HOME = r"C:\Users\user1\Doubao\chats\2026-10-12\new-chat\StorySeed_SourceCode_2026-10-08\client\src\pages\Home.tsx"
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

# ---------- 3. UNIT_PIECE ----------
old_up = "const UNIT_PIECE: Record<number, number> = { 1: 3, 2: 7, 3: 9, 4: 12, 5: 13 };"
new_up = "const UNIT_PIECE: Record<number, number> = { 1: 3, 2: 6, 3: 9, 4: 12, 5: 15 };"
assert old_up in src, "UNIT_PIECE 未搵到"
src = src.replace(old_up, new_up)

# ---------- 4. journeySteps 統一 6 步（每堂融入完整流程） ----------
pat = re.compile(r'const journeySteps = \(lessonKindOf\(selectedLesson\) === "piece" \? .*?\) as \[string, string, string\]\[\];', re.S)
new_js = ('const journeySteps = ([["idea", "stageIdea", "stepIdeaHint"], ["improve", "stepImprove", "stepImproveHint"], ["outline", "stageOutline", "stepOutlineHint"], ["draft", "stageDraft", "stepDraftHint"], ["revision", "stageRevision", "stepRevisionHint"], ["submitted", "stageSubmit", "stepSubmitHint"]]) as [string, string, string][];')
src, cnt = pat.subn(new_js, src)
assert cnt == 1, f"journeySteps 替換次數 {cnt}"

# ---------- 5. unit 名稱翻譯 ----------
zh_units = {
    'unit1: "課題 1 · 故事種子"': 'unit1: "課題 1 · 校園描寫"',
    'unit2: "課題 2 · 完整故事"': 'unit2: "課題 2 · 難忘經歷"',
    'unit3: "課題 3 · 畫面寫作"': 'unit3: "課題 3 · 人物寫作"',
    'unit4: "課題 4 · 文體實驗"': 'unit4: "課題 4 · 想像寫作"',
    'unit5: "課題 5 · 出版"': 'unit5: "課題 5 · 成長與出版"',
}
en_units = {
    'unit1: "Unit 1 · Story Seeds"': 'unit1: "Unit 1 · My School"',
    'unit2: "Unit 2 · Full Stories"': 'unit2: "Unit 2 · Memorable Experiences"',
    'unit3: "Unit 3 · Writing with Pictures"': 'unit3: "Unit 3 · Writing About People"',
    'unit4: "Unit 4 · Genre Experiments"': 'unit4: "Unit 4 · Imagination"',
    'unit5: "Unit 5 · Publication"': 'unit5: "Unit 5 · Growth & Publishing"',
}
for old, new in {**zh_units, **en_units}.items():
    assert old in src, f"未搵到: {old}"
    src = src.replace(old, new)

# ---------- 6. 課程文案更新 ----------
zh_course = {
    'courseH2: "每一堂都有一個作品"': 'courseH2: "每個單元一篇正式作文"',
    'courseSub: "由構思開始，逐步走到 final manuscript；每份小作品都會成為你的 Writer’s Journey。"': 'courseSub: "五個單元，每單元三堂：兩堂學技巧、融入創作流程，第三堂作文日提交正式作文。每篇作文都可以俾老師篩選出版。"',
    'journeyText: "每堂只需完成一個小輸出，例如角色卡、感官描寫或出版稿。這些不是零碎功課，而是最後作品集的創作足跡。"': 'journeyText: "每個單元：頭兩堂完成構思與大綱，第三堂作文日完成正式作文。每一篇都係你嘅創作足跡，亦有機會入選作品集。"',
}
en_course = {
    'courseH2: "One piece of work every lesson"': 'courseH2: "One formal essay per unit"',
    'courseSub: "Start from ideas and move all the way to the final manuscript; every small piece becomes part of your Writer\'s Journey."': 'courseSub: "Five units, three lessons each: two lessons of skills and planning, one writing day for a formal essay. Every essay can be selected by the teacher for publication."',
    'journeyText: "Complete one small output per lesson, such as a character card, sensory writing or a publication draft. These are not loose homework — they are the footsteps of your final anthology."': 'journeyText: "In each unit you finish a formal essay: idea and outline in the first two lessons, the full essay on writing day. Every piece can be selected for the anthology."',
}
for old, new in {**zh_course, **en_course}.items():
    assert old in src, f"未搵到: {old[:50]}"
    src = src.replace(old, new)

# ---------- 寫出 ----------
with open(HOME, "w", encoding="utf-8") as f:
    f.write(src)

print("OK 替換完成")
