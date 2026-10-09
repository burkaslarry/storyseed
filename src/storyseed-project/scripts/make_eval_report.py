import json
from pathlib import Path
from collections import Counter

root = Path('/home/ubuntu/chung-sing-ai-writing')
results = json.loads((root / 'test-samples' / 'p6-evaluation-results.json').read_text(encoding='utf-8'))
lines = [
    '# Proofreading Studio 三篇 P6 測試報告',
    '',
    '> 本報告使用三篇已匿名化的 P6 學生作文，採用同一套形成性評估 rubric。分數只用於教學回饋，不應視為正式校內成績。',
    '',
    '## 一、逐篇結果',
    '',
    '| 樣本 | 題目 | 總分 | Ideas & Voice | Structure | Language | Revision |',
    '|---|---|---:|---:|---:|---:|---:|',
]
for item in results:
    s = item['scores']
    lines.append(f"| {item['sampleCode']} | {item['title']} | {item['overall']}/100 | {s['ideasVoice']}/20 | {s['structure']}/20 | {s['language']}/20 | {s['revision']}/20 |")

all_issues = Counter()
for item in results:
    lines += ['', f"### {item['sampleCode']}｜{item['title']}", '', '**優點**']
    lines += [f'- {x}' for x in item['strengths']]
    lines += ['', '**下一步**']
    lines += [f'- {x}' for x in item['nextSteps']]
    lines += ['', '**Proofreading 分類**', '', '| 分類 | 原文片段 | 教學建議 |', '|---|---|---|']
    for issue in item['issues']:
        all_issues[issue['category']] += 1
        lines.append(f"| {issue['category']} | {issue['fragment'].replace('|', '\\|')} | {issue['advice'].replace('|', '\\|')} |")

lines += ['', '## 二、三篇共同觀察', '']
lines.append(f"三篇總共標記 {sum(all_issues.values())} 個可教學處理的問題。最常見分類如下：")
lines += ['', '| 分類 | 次數 | 解讀 |', '|---|---:|---|']
interpret = {
    'grammar': '主語與動詞一致、時態及介詞等基礎準確度。',
    'word_choice': '自然搭配、重複用語及更精準的動詞／片語。',
    'clarity': '句子意思或表達關係需要更清楚。',
    'structure': '句子重複、段落流暢度及事件組織。',
    'punctuation': '直接稱呼、標點及句子連接。',
}
for cat, count in all_issues.most_common():
    lines.append(f"| {cat} | {count} | {interpret.get(cat, '需要教師按作品語境判斷。')} |")

lines += ['', '## 三、對網站的調整建議', '']
lines += [
    '第一，Proofreading Studio 應把 AI 回饋分成「必須先修正」與「可選擇改善」兩層，避免小學生看到太多紅色問題而失去信心。',
    '第二，Rubric 分數應固定顯示為形成性評估，並同時展示兩項作品優點及兩至三個下一步；不要只顯示一個總分。',
    '第三，系統應允許導師關閉不適合當堂課的分類。例如 P5 課堂可先集中 grammar、word choice 及 punctuation，P6 再加入 structure 與 clarity。',
    '第四，AI 不應自動把建議改寫回學生作品。學生必須自行修改，再保存為新版本，這樣才能保留原創聲音及修訂紀錄。',
    '第五，三篇樣本都是 P6，尚不足以驗證 P5／P6 的跨年級公平性；下一輪應加入至少一篇 P5，並用相同 rubric 比較評分差異。',
]

(root / 'test-samples' / 'p6-proofreading-test-report.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('created', root / 'test-samples' / 'p6-proofreading-test-report.md')
