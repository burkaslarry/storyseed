# -*- coding: utf-8 -*-
"""StorySeed 新課程數據：5 單元 × 3 堂 = 15 堂。
每單元：頭 2 堂教學（融入創作流程步驟）＋第 3 堂作文日（完整流程出正式作文）。
P5/P6 作文題目唔同（題材相近、課題唔同）。刪除詩作/短詩等非正式作文輸出。
"""

LESSONS_ZH = [
    # (標題, 描述, 本堂輸出)
    ("觀察校園角落", "用五感觀察校園，收集《我的學校》嘅寫作素材。", "構思筆記"),
    ("文章結構：開頭、主體、結尾", "用「開頭—主體—結尾」安排校園作文。", "作文大綱"),
    ("作文日：我的學校", "完成《我的學校》（P5）或《關於我的學校》（P6）全文。", "正式作文"),
    ("記敘六要素", "用時間、地點、人物、事件構思一件難忘經歷。", "構思筆記"),
    ("故事山與詳略", "用故事山安排經歷嘅開端、發展、高潮與結局。", "作文大綱"),
    ("作文日：一次旅行", "完成《一次旅行》（P5）或《那次難忘的旅程》（P6）。", "正式作文"),
    ("人物描寫四寶", "用外貌、動作、語言、事例描寫一個人。", "構思筆記"),
    ("事例與情感", "揀一個有力事例，安排人物作文結構。", "作文大綱"),
    ("作文日：我想感謝的人", "完成《我最想感謝的人》（P5）或《一位影響我的人》（P6）。", "正式作文"),
    ("想像與夢想", "將夢想變成具體、可見嘅畫面。", "構思筆記"),
    ("虛構結構", "用「願望—努力—困難—成果」安排想像作文。", "作文大綱"),
    ("作文日：我的夢想", "完成《我的夢想》（P5）或《二十年後的我》（P6）。", "正式作文"),
    ("選材與回顧", "回顧成長，揀一件值得寫嘅事。", "構思筆記"),
    ("結構整合與修訂", "整合全學期技巧，訂立修訂策略。", "作文大綱"),
    ("作文日：我成長的故事", "完成最後一篇作文，可被老師篩選出版。", "正式作文"),
]

LESSONS_EN = [
    ("Observing School Corners", "Use your five senses to collect details for your school essay.", "Idea Notes"),
    ("Essay Structure: Beginning, Body, Ending", "Arrange your school essay with three clear parts.", "Essay Outline"),
    ("Writing Day: My School", "Write your full essay: P5 \u201cMy School\u201d / P6 \u201cAll About My School\u201d.", "Final Essay"),
    ("Six Elements of a Story", "Use time, place, people and events to shape a memorable experience.", "Idea Notes"),
    ("Story Mountain & Detail Choices", "Plan the beginning, build-up, climax and ending of your experience.", "Essay Outline"),
    ("Writing Day: A Memorable Trip", "Write your full story: P5 \u201cA Memorable Trip\u201d / P6 \u201cAn Unforgettable Journey\u201d.", "Final Essay"),
    ("Describing People", "Use appearance, actions, speech and a real example to describe someone.", "Idea Notes"),
    ("Choosing Evidence & Emotion", "Pick one strong example and plan your people essay.", "Essay Outline"),
    ("Writing Day: The Person I Thank", "Write your full essay: P5 \u201cThe Person I Want to Thank\u201d / P6 \u201cA Person Who Influenced Me\u201d.", "Final Essay"),
    ("Imagination & Dreams", "Turn your dream into a clear, visible scene.", "Idea Notes"),
    ("Structure of an Imagined Story", "Plan with wish, effort, difficulty and success.", "Essay Outline"),
    ("Writing Day: My Dream", "Write your full essay: P5 \u201cMy Dream\u201d / P6 \u201cMe in Twenty Years\u201d.", "Final Essay"),
    ("Choosing Your Growth Story", "Look back and choose one moment worth writing about.", "Idea Notes"),
    ("Bringing It Together & Revising", "Combine everything you learned and plan your revision.", "Essay Outline"),
    ("Writing Day: My Growth Story", "Write your final essay, ready for the anthology.", "Final Essay"),
]

# 每個 activity 用 dict：zh 同 en 各自一份。piece 堂含 p5/p6 題目。
ACTIVITIES_ZH = {
    1: {
        "kind": "prep", "cycle": 1,
        "goals": [
            "我能圈出題目嘅關鍵詞，知道要寫甚麼。",
            "我能用五感觀察校園，收集 5 個真實細節。",
            "我能用 AI 問問題，擴闊我嘅觀察角度。",
        ],
        "bigIdea": "好文章由仔細觀察開始。寫學校嘅作文唔係叫你背學校資料，而係揀一個你最有感情嘅角落，用真實細節令讀者「睇得見」。",
        "guidedTasks": [
            {"id": "t1", "label": "讀題目三次，圈出關鍵詞，寫低題目要求你寫咩。", "hint": "例如《我的學校》——重點係「我」同「學校」：寫你眼中嘅學校。"},
            {"id": "t2", "label": "揀校園一個角落，用五感寫低 5 個觀察。", "hint": "睇到咩顏色？聽到咩聲音？聞到咩？摸到咩？"},
            {"id": "t3", "label": "問 AI「關於我的學校，我可以寫咩細節？」記低 3 個新角度。", "hint": "用右邊 AI 夥伴，撳 Starter 或者自己問。"},
        ],
        "writingTask": "構思：寫低你嘅故事方向／種子——揀一個校園角落＋一件令你印象深刻嘅事。",
        "aiStarter": "My school has many places I remember. Ask me 3 questions to help me choose the most memorable corner and one small story about it.",
        "parts": [
            {"title": "Part A · 讀懂題目", "kind": "pairs", "pairs": [
                {"label": "關鍵詞「我的」", "value": "寫我眼中嘅學校，唔係學校簡介冊"},
                {"label": "關鍵詞「學校」", "value": "校園一角＋人＋事，揀你熟悉嘅"},
                {"label": "唔應該寫", "value": "資料式流水賬：校名、班數、歷史，冇感情"},
            ]},
            {"title": "Part B · 五感觀察法", "kind": "pairs", "pairs": [
                {"label": "睇 See", "value": "顏色、形狀、光線、角落"},
                {"label": "聽 Hear", "value": "鐘聲、腳步、笑聲、翻書聲"},
                {"label": "聞 Smell", "value": "圖書館嘅書味、小食部嘅香味"},
                {"label": "觸 Touch", "value": "舊木枱嘅紋理、欄杆嘅冰冷"},
            ]},
            {"title": "Part C · 負責任用 AI", "kind": "list", "items": [
                "我要求三個點子，比較後揀一個改動——負責任。",
                "我複製 AI 成段文字當自己作品——唔負責任。",
                "我唔會喺作文輸入電話、電郵或地址。",
            ]},
            {"title": "Part D · 揀材", "kind": "text", "text": "揀一個角落，寫低：邊度？點解記得？有咩細節最清晰？"},
        ],
        "checklist": [
            "我圈出咗題目關鍵詞",
            "我寫低咗 5 個五感觀察",
            "我問咗 AI 一個問題",
            "我揀定咗一個角落＋一件事",
        ],
        "exitTicket": ["我今堂最有用嘅一個觀察係……"],
    },
    2: {
        "kind": "prep", "cycle": 1,
        "goals": [
            "我能用「開頭—主體—結尾」安排文章段落。",
            "我能寫出一個吸引讀者嘅開頭。",
            "我能寫出有感受嘅結尾。",
        ],
        "bigIdea": "結構令細節有秩序：開頭引入主題，主體每段一個重點，結尾回應開頭並寫出感受。",
        "guidedTasks": [
            {"id": "t1", "label": "寫 3 個唔同開頭：直接點題／設問／場景。", "hint": "直接：「我的學校……」；設問：「你知唔知學校邊個角落最特別？」；場景：「放學鈴聲響起……」"},
            {"id": "t2", "label": "將五感觀察分成 2–3 段主體，每段一個重點。", "hint": "例如：課室一段、操場一段、小食部一段。"},
            {"id": "t3", "label": "用「AI 優化構思」揀一個更好嘅大綱方向。", "hint": "撳「優化我的構思」，睇 A／B／C 三個方向，揀一個加入。"},
        ],
        "writingTask": "大綱：排大綱——開頭／主體段落／結尾，每部分寫一句重點。",
        "aiStarter": "I planned my school essay: opening, body about the library, ending. Give me two questions to make my opening more inviting.",
        "parts": [
            {"title": "Part A · 開頭三式", "kind": "pairs", "pairs": [
                {"label": "直接點題", "value": "簡單清楚，立即入題"},
                {"label": "設問", "value": "引起好奇，讀者想知答案"},
                {"label": "場景", "value": "畫面感最強，好似電影開場"},
            ]},
            {"title": "Part B · 主體分段", "kind": "list", "items": [
                "每段一個重點。",
                "段落之間有順序：空間順序或時間順序。",
                "每段第一句係「主題句」，後面係細節。",
            ]},
            {"title": "Part C · 結尾", "kind": "pairs", "pairs": [
                {"label": "呼應開頭", "value": "首尾呼應，文章完整"},
                {"label": "寫感受", "value": "點解呢個角落對你特別"},
                {"label": "留想像", "value": "一句收結，留低餘韻"},
            ]},
            {"title": "Part D · 結構檢查", "kind": "pairs", "pairs": [
                {"label": "開頭 2–3 句", "value": "引入主題＋吸引讀者"},
                {"label": "主體 2–3 段", "value": "每段一個重點，有順序"},
                {"label": "結尾 2–3 句", "value": "感受／呼應，完整收結"},
            ]},
        ],
        "checklist": [
            "我寫咗 3 個開頭並揀咗最好嗰個",
            "我將觀察分成 2–3 段",
            "我用 AI 優化咗大綱",
            "我嘅結尾有感受",
        ],
        "exitTicket": ["我揀咗邊個開頭？點解？"],
    },
    3: {
        "kind": "piece", "cycle": 1,
        "p5": {"pieceTitle": "我的學校", "pieceTitleEn": "My School"},
        "p6": {"pieceTitle": "關於我的學校", "pieceTitleEn": "All About My School"},
        "goals": [
            "我能跟住大綱完成一篇完整作文。",
            "我能用自我檢查清單修訂自己嘅文章。",
            "我能提交最終版本。",
        ],
        "bigIdea": "今日係作文日：由構思到大綱到草稿，最後自己修訂、提交。AI 會幫你檢查，但每一句都係你自己寫嘅。",
        "guidedTasks": [
            {"id": "t1", "label": "跟住大綱寫草稿，最少 3 段。", "hint": "唔使完美，寫咗先。"},
            {"id": "t2", "label": "用自檢清單檢查：開頭吸引？每段有重點？結尾有感受？", "hint": "逐項打勾，改咗先算完成。"},
            {"id": "t3", "label": "叫 AI 指出一個可以改善嘅地方，你自己改。", "hint": "問：「我嘅草稿邊度可以寫得更清楚？」"},
        ],
        "writingTask": "作文：完成《我的學校》（P5）／《關於我的學校》（P6）全文。",
        "aiStarter": "I finished a draft about my school. Ask me two questions to help me improve one sentence or one detail before I revise.",
        "parts": [
            {"title": "Part A · 寫草稿", "kind": "text", "text": "跟住大綱寫：開頭引入→主體 2–3 段→結尾感受。唔好停低，一口氣寫完先。"},
            {"title": "Part B · 自我修訂", "kind": "pairs", "pairs": [
                {"label": "開頭吸引？", "value": "第一句會唔會令人想繼續讀？"},
                {"label": "每段有重點？", "value": "每段第一句係咪主題句？"},
                {"label": "結尾有感受？", "value": "有冇寫出你對學校嘅感情？"},
            ]},
            {"title": "Part C · AI 校對", "kind": "list", "items": [
                "叫 AI 指出一個小地方。",
                "自己決定點改，唔可以叫 AI 幫你寫新段落。",
            ]},
            {"title": "Part D · 提交", "kind": "text", "text": "最後檢查：分段清楚？標點正確？再讀一次，先提交。"},
        ],
        "checklist": [
            "我完成咗全文（至少 3 段）",
            "我逐項做咗自我檢查",
            "我問咗 AI 一個問題並自己修訂",
            "我提交咗最終版本",
        ],
        "exitTicket": ["我今次最滿意嘅一句係……"],
    },
    4: {
        "kind": "prep", "cycle": 2,
        "goals": [
            "我能用六要素（時間、地點、人物、起因、經過、結果）構思一件難忘經歷。",
            "我能揀一件真實、有轉折嘅事。",
        ],
        "bigIdea": "記敘文要交代清楚「發生咩事」。六要素幫你唔漏嘢，揀一件真係令你印象深刻嘅事，先寫得生動。",
        "guidedTasks": [
            {"id": "t1", "label": "寫低 3 件難忘嘅事，每件用一句。", "hint": "旅行、比賽、第一次、意外……"},
            {"id": "t2", "label": "揀一件，用六要素寫低：時間、地點、人物、起因、經過、結果。", "hint": "經過最重要：邊一刻最緊張／最開心？"},
            {"id": "t3", "label": "問 AI「點樣將一件事講得生動？」記低 3 個建議。", "hint": "用右邊 AI 夥伴。"},
        ],
        "writingTask": "構思：寫低你嘅故事方向／種子——揀定一件事＋六要素。",
        "aiStarter": "I want to write about a trip I remember. Ask me three questions about what happened that made it special.",
        "parts": [
            {"title": "Part A · 六要素", "kind": "pairs", "pairs": [
                {"label": "時間 Time", "value": "邊個時候？"},
                {"label": "地點 Place", "value": "邊度發生？"},
                {"label": "人物 People", "value": "邊啲人喺度？"},
                {"label": "起因 Cause", "value": "點解會發生？"},
                {"label": "經過 Events", "value": "發生咗咩？最重要！"},
                {"label": "結果 Result", "value": "最後點樣？"},
            ]},
            {"title": "Part B · 揀材", "kind": "pairs", "pairs": [
                {"label": "真實", "value": "親身經歷先有細節同感受"},
                {"label": "有轉折", "value": "有意外／改變／高潮先吸引"},
                {"label": "有感受", "value": "你記得當時嘅心情，先寫得出"},
            ]},
            {"title": "Part C · AI 引導", "kind": "list", "items": [
                "叫 AI 問你問題，幫你記返細節。",
                "AI 只負責問，答案同寫作都係你嘅。",
            ]},
        ],
        "checklist": [
            "我寫低咗 3 件難忘嘅事",
            "我揀咗一件並寫齊六要素",
            "我問咗 AI 一個問題",
        ],
        "exitTicket": ["我揀咗邊件事？佢最難忘嘅一刻係……"],
    },
    5: {
        "kind": "prep", "cycle": 2,
        "goals": [
            "我能用故事山（開端→發展→高潮→結局）排大綱。",
            "我能決定邊部分詳寫、邊部分略寫。",
        ],
        "bigIdea": "故事山將一件事變成有起有伏嘅文章：開端交代背景，發展推前，高潮最緊張，結局收返。高潮位要詳寫。",
        "guidedTasks": [
            {"id": "t1", "label": "將六要素排成故事山大綱：開端、發展、高潮、結局。", "hint": "每部分用一句寫低。"},
            {"id": "t2", "label": "標記高潮位，決定邊度詳寫、邊度略寫。", "hint": "高潮詳寫（多細節），開端略寫（快入題）。"},
            {"id": "t3", "label": "用「AI 優化構思」睇三個方向，揀一個加入大綱。", "hint": "撳「優化我的構思」。"},
        ],
        "writingTask": "大綱：排大綱——開端／發展／高潮／結局＋詳略標記。",
        "aiStarter": "Here is my trip outline. Give me two questions about the climax so I can make it more vivid.",
        "parts": [
            {"title": "Part A · 故事山", "kind": "pairs", "pairs": [
                {"label": "開端 Beginning", "value": "交代時間地點人物，快入題"},
                {"label": "發展 Build-up", "value": "事情一步一步推前"},
                {"label": "高潮 Climax", "value": "最緊張／最感動嘅一刻"},
                {"label": "結局 Ending", "value": "結果＋感受"},
            ]},
            {"title": "Part B · 詳略", "kind": "pairs", "pairs": [
                {"label": "詳寫", "value": "高潮位：加動作、對話、感受"},
                {"label": "略寫", "value": "背景同過場：一句帶過"},
            ]},
            {"title": "Part C · 結構檢查", "kind": "list", "items": [
                "六要素有冇交代清楚？",
                "高潮位係咪最詳？",
                "結局有冇感受？",
            ]},
        ],
        "checklist": [
            "我排好咗故事山大綱",
            "我標記咗高潮位",
            "我決定咗詳略",
            "我用 AI 優化咗大綱",
        ],
        "exitTicket": ["我嘅高潮位係……"],
    },
    6: {
        "kind": "piece", "cycle": 2,
        "p5": {"pieceTitle": "一次旅行", "pieceTitleEn": "A Memorable Trip"},
        "p6": {"pieceTitle": "那次難忘的旅程", "pieceTitleEn": "An Unforgettable Journey"},
        "goals": [
            "我能跟住故事山大綱完成完整記敘文。",
            "我能用自檢清單修訂並提交。",
        ],
        "bigIdea": "作文日：將你嘅難忘經歷寫成一篇完整文章。記住：高潮詳寫、順序清楚、結局有感受。",
        "guidedTasks": [
            {"id": "t1", "label": "跟住大綱寫草稿。", "hint": "開端快入題，高潮慢慢寫。"},
            {"id": "t2", "label": "自檢：六要素齊？高潮詳寫？順序清楚？", "hint": "逐項打勾。"},
            {"id": "t3", "label": "叫 AI 指出一個改善位，你自己改。", "hint": "問：「我嘅高潮部分夠唔夠生動？」"},
        ],
        "writingTask": "作文：完成《一次旅行》（P5）／《那次難忘的旅程》（P6）全文。",
        "aiStarter": "I drafted my trip story. Ask me two questions about the most exciting part before I revise.",
        "parts": [
            {"title": "Part A · 寫草稿", "kind": "text", "text": "跟住大綱：開端→發展→高潮→結局。高潮位寫得最仔細。"},
            {"title": "Part B · 自我修訂", "kind": "pairs", "pairs": [
                {"label": "六要素齊？", "value": "時間、地點、人物、事件清楚"},
                {"label": "高潮詳寫？", "value": "最緊張一刻有動作同感受？"},
                {"label": "順序清楚？", "value": "讀者跟得到邊先邊後？"},
            ]},
            {"title": "Part C · AI 校對", "kind": "list", "items": [
                "叫 AI 指出一個小地方。",
                "自己修訂，AI 唔代寫。",
            ]},
        ],
        "checklist": [
            "我完成咗全文",
            "六要素交代清楚",
            "高潮位詳寫",
            "我提交咗最終版本",
        ],
        "exitTicket": ["我今次學到咗……"],
    },
    7: {
        "kind": "prep", "cycle": 3,
        "goals": [
            "我能用外貌、動作、語言、事例描寫一個人。",
            "我能揀一位想感謝／影響我嘅人。",
        ],
        "bigIdea": "寫人作文最忌「佢好好人」一句講完。用外貌、動作、語言加一個真實事例，讀者先「睇得見」嗰個人。",
        "guidedTasks": [
            {"id": "t1", "label": "揀一位想感謝／影響你嘅人，寫低 3 件佢為你做嘅事。", "hint": "唔好揀「佢成日對我好」咁空泛，揀具體一件事。"},
            {"id": "t2", "label": "用外貌、動作、語言寫低 5 個觀察。", "hint": "佢點樣笑？講嘢咩語氣？有咩小動作？"},
            {"id": "t3", "label": "問 AI「點樣描寫一個人更有畫面？」記低 3 個建議。", "hint": "用右邊 AI 夥伴。"},
        ],
        "writingTask": "構思：寫低你嘅故事方向／種子——揀定人物＋一個具體事例。",
        "aiStarter": "I want to thank my grandmother. Ask me three questions to help me choose one memory that shows her kindness.",
        "parts": [
            {"title": "Part A · 人物描寫四寶", "kind": "pairs", "pairs": [
                {"label": "外貌 Appearance", "value": "身形、面容、衣著——揀有特點嘅"},
                {"label": "動作 Actions", "value": "習慣性小動作最見性格"},
                {"label": "語言 Speech", "value": "佢成日講咩？咩語氣？"},
                {"label": "事例 Example", "value": "一件事證明佢係點嘅人"},
            ]},
            {"title": "Part B · 揀人", "kind": "pairs", "pairs": [
                {"label": "家人", "value": "父母、祖父母、兄弟姊妹"},
                {"label": "師長朋友", "value": "老師、同學、鄰居"},
                {"label": "要具體", "value": "有真實事例嘅人，先寫得深"},
            ]},
            {"title": "Part C · AI 引導", "kind": "list", "items": [
                "叫 AI 問你問題，幫你記返人物細節。",
                "AI 只負責問，最後由你揀同寫。",
            ]},
        ],
        "checklist": [
            "我揀咗一位想感謝嘅人",
            "我寫低咗 3 件事例",
            "我用四寶寫低咗觀察",
            "我問咗 AI 一個問題",
        ],
        "exitTicket": ["我揀咗邊個人？佢最令我記得嘅動作／說話係……"],
    },
    8: {
        "kind": "prep", "cycle": 3,
        "goals": [
            "我能揀一個最有力嘅事例做詳寫。",
            "我能安排人物作文嘅結構並加入情感。",
        ],
        "bigIdea": "一篇寫人作文，一個好事例就夠。揀最能證明佢性格嘅嗰件，詳寫經過，再加你嘅感受，讀者自然明白點解你感謝佢。",
        "guidedTasks": [
            {"id": "t1", "label": "由 3 件事例揀一件最有力嘅，寫低點解揀佢。", "hint": "邊件事最能令人「睇到」佢係點嘅人？"},
            {"id": "t2", "label": "排大綱：開頭引入人物→事例經過→我的感受→結尾感謝。", "hint": "事例經過用故事山：開始→發展→高潮→結束。"},
            {"id": "t3", "label": "用「AI 優化構思」睇三個方向，揀一個加入。", "hint": "撳「優化我的構思」。"},
        ],
        "writingTask": "大綱：人物作文大綱——開頭／事例／感受／結尾。",
        "aiStarter": "My essay about a person: opening, one key memory, how I felt, ending. Ask me two questions to make the memory vivid.",
        "parts": [
            {"title": "Part A · 揀事例", "kind": "pairs", "pairs": [
                {"label": "有力", "value": "最能證明佢性格"},
                {"label": "具體", "value": "有時間、地點、細節"},
                {"label": "有轉折", "value": "佢做咗件事改變咗你"},
            ]},
            {"title": "Part B · 結構", "kind": "pairs", "pairs": [
                {"label": "開頭", "value": "一句介紹人物＋點解佢重要"},
                {"label": "事例經過", "value": "詳寫：動作、對話、場景"},
                {"label": "我的感受", "value": "嗰一刻你諗咩、feel 到咩"},
                {"label": "結尾", "value": "感謝／佢點影響你"},
            ]},
            {"title": "Part C · 情感", "kind": "list", "items": [
                "情感要「寫出嚟」，唔好淨係「講出嚟」。",
                "用感受代替形容：唔好寫「好感動」，寫嗰刻你嘅反應。",
            ]},
        ],
        "checklist": [
            "我揀咗一件最有力嘅事例",
            "我排好咗大綱",
            "我加入咗情感",
            "我用 AI 優化咗大綱",
        ],
        "exitTicket": ["我揀咗邊件事例？點解佢最有力？"],
    },
    9: {
        "kind": "piece", "cycle": 3,
        "p5": {"pieceTitle": "我最想感謝的人", "pieceTitleEn": "The Person I Want to Thank"},
        "p6": {"pieceTitle": "一位影響我的人", "pieceTitleEn": "A Person Who Influenced Me"},
        "goals": [
            "我能完成一篇完整嘅寫人作文。",
            "我能用四寶同事例寫出人物。",
            "我能修訂並提交。",
        ],
        "bigIdea": "作文日：用一個真實事例，將你想感謝嘅人寫活。記住：描寫要有畫面，感受要寫出嚟。",
        "guidedTasks": [
            {"id": "t1", "label": "跟住大綱寫草稿。", "hint": "事例經過寫得最詳細。"},
            {"id": "t2", "label": "自檢：有四寶？事例具體？有情感？", "hint": "逐項打勾。"},
            {"id": "t3", "label": "叫 AI 指出一個改善位，你自己改。", "hint": "問：「我嘅人物描寫夠唔夠畫面？」"},
        ],
        "writingTask": "作文：完成《我最想感謝的人》（P5）／《一位影響我的人》（P6）全文。",
        "aiStarter": "I drafted my essay about a person I thank. Ask me two questions about the key memory before I revise.",
        "parts": [
            {"title": "Part A · 寫草稿", "kind": "text", "text": "開頭引入人物→事例經過（詳寫）→感受→結尾感謝。"},
            {"title": "Part B · 自我修訂", "kind": "pairs", "pairs": [
                {"label": "有四寶？", "value": "外貌／動作／語言／事例"},
                {"label": "事例具體？", "value": "讀者跟得到成件事？"},
                {"label": "有情感？", "value": "感受寫咗出嚟？"},
            ]},
            {"title": "Part C · AI 校對", "kind": "list", "items": [
                "叫 AI 指出一個小地方。",
                "自己修訂，AI 唔代寫。",
            ]},
        ],
        "checklist": [
            "我完成咗全文",
            "人物有四寶描寫",
            "事例具體",
            "我提交咗最終版本",
        ],
        "exitTicket": ["我最想寫好嘅一句係……"],
    },
    10: {
        "kind": "prep", "cycle": 4,
        "goals": [
            "我能將夢想變成具體畫面（邊度／做咩／點解）。",
            "我能將真實細節加入想像。",
        ],
        "bigIdea": "想像作文唔係「發夢」，而係用真實細節砌出一個可信嘅世界。你嘅夢想係咩？喺邊度發生？你做緊咩？",
        "guidedTasks": [
            {"id": "t1", "label": "寫低你嘅夢想，用一句。", "hint": "例如：「我想做獸醫。」"},
            {"id": "t2", "label": "將夢想變成畫面：時間、地點、人物、做緊咩。", "hint": "閉眼諗十秒：你見到咩？"},
            {"id": "t3", "label": "問 AI「點樣令想像作文有真實感？」記低 3 個建議。", "hint": "用右邊 AI 夥伴。"},
        ],
        "writingTask": "構思：寫低你嘅故事方向／種子——夢想畫面（邊度／做咩／點解）。",
        "aiStarter": "My dream is to become a vet. Ask me three questions to turn this into a scene I can see.",
        "parts": [
            {"title": "Part A · 夢想畫面", "kind": "pairs", "pairs": [
                {"label": "邊度 Where", "value": "場景：醫院？太空？學校？"},
                {"label": "做咩 What", "value": "你一日做緊咩？"},
                {"label": "點解 Why", "value": "點解呢個係你嘅夢想？"},
            ]},
            {"title": "Part B · 真實細節", "kind": "pairs", "pairs": [
                {"label": "真實", "value": "用你見過、聽過、feel 過嘅細節"},
                {"label": "想像", "value": "喺真實基礎上加一點超越現實"},
            ]},
            {"title": "Part C · AI 引導", "kind": "list", "items": [
                "叫 AI 問你問題，幫你諗清楚畫面。",
                "AI 只負責問，最後由你揀同寫。",
            ]},
        ],
        "checklist": [
            "我寫低咗夢想",
            "我將夢想變成畫面",
            "我加入咗真實細節",
            "我問咗 AI 一個問題",
        ],
        "exitTicket": ["我嘅夢想畫面係……"],
    },
    11: {
        "kind": "prep", "cycle": 4,
        "goals": [
            "我能用「願望—努力—困難—成果」排想像作文。",
            "我能將真實細節融入想像場景。",
        ],
        "bigIdea": "想像作文都要有結構：主角有願望，為咗願望努力，遇到困難，最後有成果。結構穩，想像先唔會散。",
        "guidedTasks": [
            {"id": "t1", "label": "排大綱：願望、努力、困難、成果。", "hint": "每部分一句。"},
            {"id": "t2", "label": "喺大綱加入 2 個真實細節。", "hint": "例如：真係摸過嘅質感、真係聽過嘅聲音。"},
            {"id": "t3", "label": "用「AI 優化構思」睇三個方向，揀一個加入。", "hint": "撳「優化我的構思」。"},
        ],
        "writingTask": "大綱：想像作文大綱——願望／努力／困難／成果。",
        "aiStarter": "My future-story outline: dream, effort, difficulty, success. Ask me two questions about the difficulty part.",
        "parts": [
            {"title": "Part A · 結構", "kind": "pairs", "pairs": [
                {"label": "願望 Wish", "value": "主角想得到／做到咩"},
                {"label": "努力 Effort", "value": "佢點樣一步步行近"},
                {"label": "困難 Difficulty", "value": "遇到咩阻礙？點克服？"},
                {"label": "成果 Success", "value": "最後點樣？有咩改變？"},
            ]},
            {"title": "Part B · 真實＋想像", "kind": "pairs", "pairs": [
                {"label": "真實細節", "value": "令讀者信得過呢個世界"},
                {"label": "想像元素", "value": "令文章有驚喜"},
            ]},
            {"title": "Part C · 結構檢查", "kind": "list", "items": [
                "四部分齊唔齊？",
                "困難部分係咪最緊張？",
                "成果有冇回應願望？",
            ]},
        ],
        "checklist": [
            "我排好咗四部分大綱",
            "我加入咗 2 個真實細節",
            "我用 AI 優化咗大綱",
        ],
        "exitTicket": ["我嘅想像世界有一個真實細節係……"],
    },
    12: {
        "kind": "piece", "cycle": 4,
        "p5": {"pieceTitle": "我的夢想", "pieceTitleEn": "My Dream"},
        "p6": {"pieceTitle": "二十年後的我", "pieceTitleEn": "Me in Twenty Years"},
        "goals": [
            "我能完成一篇完整嘅想像作文。",
            "我能用真實細節令想像可信。",
            "我能修訂並提交。",
        ],
        "bigIdea": "作文日：寫你嘅夢想世界。結構穩（願望→努力→困難→成果），細節真，想像先有力。",
        "guidedTasks": [
            {"id": "t1", "label": "跟住大綱寫草稿。", "hint": "困難部分寫得最仔細。"},
            {"id": "t2", "label": "自檢：結構齊？有真實細節？結局回應願望？", "hint": "逐項打勾。"},
            {"id": "t3", "label": "叫 AI 指出一個改善位，你自己改。", "hint": "問：「我嘅想像場景夠唔夠清楚？」"},
        ],
        "writingTask": "作文：完成《我的夢想》（P5）／《二十年後的我》（P6）全文。",
        "aiStarter": "I drafted my dream essay. Ask me two questions to make my imagined scene clearer.",
        "parts": [
            {"title": "Part A · 寫草稿", "kind": "text", "text": "願望→努力→困難→成果。想像場景用五感寫。"},
            {"title": "Part B · 自我修訂", "kind": "pairs", "pairs": [
                {"label": "結構齊？", "value": "四部分齊全"},
                {"label": "細節真？", "value": "有真實細節令讀者信服"},
                {"label": "回應願望？", "value": "成果有冇回應開頭嘅願望？"},
            ]},
            {"title": "Part C · AI 校對", "kind": "list", "items": [
                "叫 AI 指出一個小地方。",
                "自己修訂，AI 唔代寫。",
            ]},
        ],
        "checklist": [
            "我完成咗全文",
            "結構四部分齊全",
            "有真實細節",
            "我提交咗最終版本",
        ],
        "exitTicket": ["我嘅想像世界最得意嘅一樣嘢係……"],
    },
    13: {
        "kind": "prep", "cycle": 5,
        "goals": [
            "我能回顧自己嘅成長，揀一件事做題材。",
            "我能將之前學過嘅技巧應用喺新題目。",
        ],
        "bigIdea": "最後一個單元：寫你嘅成長故事。回想由開學到而家，邊一刻令你變咗？揀嗰件事，用返六要素嚟構思。",
        "guidedTasks": [
            {"id": "t1", "label": "寫低 3 件成長嘅事（第一次／失敗／改變）。", "hint": "第一次自己返學？第一次比賽？"},
            {"id": "t2", "label": "揀一件，寫低六要素。", "hint": "呢件事點樣令你成長？"},
            {"id": "t3", "label": "問 AI「點樣寫成長故事？」記低 3 個建議。", "hint": "用右邊 AI 夥伴。"},
        ],
        "writingTask": "構思：寫低你嘅故事方向／種子——揀定一件成長嘅事＋六要素。",
        "aiStarter": "I want to write about a time I grew. Ask me three questions to find the moment I changed.",
        "parts": [
            {"title": "Part A · 回顧成長", "kind": "pairs", "pairs": [
                {"label": "第一次", "value": "第一次做某件事"},
                {"label": "失敗", "value": "失敗之後點樣企返起身"},
                {"label": "改變", "value": "有一刻你發現自己唔同咗"},
            ]},
            {"title": "Part B · 揀材", "kind": "pairs", "pairs": [
                {"label": "有改變", "value": "呢件事令你成長咗"},
                {"label": "有細節", "value": "你記得當時嘅畫面同感受"},
            ]},
            {"title": "Part C · AI 引導", "kind": "list", "items": [
                "叫 AI 問你問題，幫你記返細節。",
                "AI 只負責問，最後由你揀同寫。",
            ]},
        ],
        "checklist": [
            "我寫低咗 3 件成長嘅事",
            "我揀咗一件並寫齊六要素",
            "我問咗 AI 一個問題",
        ],
        "exitTicket": ["我揀咗邊件成長嘅事？"],
    },
    14: {
        "kind": "prep", "cycle": 5,
        "goals": [
            "我能整合全學期技巧排大綱。",
            "我能訂立修訂策略（檢查清單）。",
        ],
        "bigIdea": "最後一篇作文，將全學期學過嘅都用返：五感、結構、故事山、人物描寫、真實細節。今日排好大綱，作文日就順。",
        "guidedTasks": [
            {"id": "t1", "label": "排完整大綱：開端→發展→高潮→結局。", "hint": "用故事山，標記高潮位。"},
            {"id": "t2", "label": "寫低你嘅修訂策略：邊部分要特別留意？", "hint": "例如：「結尾要多啲感受」「高潮要加動作」"},
            {"id": "t3", "label": "用「AI 優化構思」睇三個方向，揀一個加入。", "hint": "撳「優化我的構思」。"},
        ],
        "writingTask": "大綱：成長故事大綱＋修訂策略。",
        "aiStarter": "My growth-story outline is ready. Ask me two questions about the turning point.",
        "parts": [
            {"title": "Part A · 全學期工具箱", "kind": "pairs", "pairs": [
                {"label": "五感", "value": "細節有畫面"},
                {"label": "故事山", "value": "有起有伏"},
                {"label": "人物描寫", "value": "人物立體"},
                {"label": "真實細節", "value": "令讀者信服"},
            ]},
            {"title": "Part B · 修訂策略", "kind": "list", "items": [
                "寫低 2 個你要特別留意嘅地方。",
                "作文日跟住呢張清單檢查。",
            ]},
            {"title": "Part C · AI 引導", "kind": "list", "items": [
                "叫 AI 問你問題，幫你睇轉折位。",
                "AI 只負責問，最後由你揀同寫。",
            ]},
        ],
        "checklist": [
            "我排好咗完整大綱",
            "我標記咗高潮位",
            "我寫低咗修訂策略",
            "我用 AI 優化咗大綱",
        ],
        "exitTicket": ["我嘅修訂策略係……"],
    },
    15: {
        "kind": "piece", "cycle": 5,
        "p5": {"pieceTitle": "一件令我難忘的事", "pieceTitleEn": "An Unforgettable Moment"},
        "p6": {"pieceTitle": "我成長的故事", "pieceTitleEn": "My Story of Growing Up"},
        "goals": [
            "我能完成最後一篇正式作文並提交。",
            "我能運用全學期技巧寫出完整文章。",
            "我能為作品準備出版（可被老師篩選）。",
        ],
        "bigIdea": "最後一篇作文：用全學期學過嘅技巧，寫你嘅成長故事。完成之後，老師會篩選作品用唔用嚟出版——你嘅文章有機會入選集！",
        "guidedTasks": [
            {"id": "t1", "label": "跟住大綱寫草稿，運用全學期技巧。", "hint": "五感、故事山、人物、細節，全部用得著。"},
            {"id": "t2", "label": "跟住修訂策略自檢，再叫 AI 指出一個改善位。", "hint": "先自己改，再問 AI。"},
            {"id": "t3", "label": "檢查標題、開頭、結尾，提交最終版本。", "hint": "你嘅作品會進入老師嘅篩選佇列。"},
        ],
        "writingTask": "作文：完成《一件令我難忘的事》（P5）／《我成長的故事》（P6）全文。",
        "aiStarter": "This is my final piece. Ask me two questions to polish the ending before I submit.",
        "parts": [
            {"title": "Part A · 寫草稿", "kind": "text", "text": "跟住大綱：開端→發展→高潮→結局。用全學期嘅工具箱寫。"},
            {"title": "Part B · 自我修訂", "kind": "pairs", "pairs": [
                {"label": "結構完整？", "value": "開頭、主體、結尾齊"},
                {"label": "細節有畫面？", "value": "五感＋真實細節"},
                {"label": "情感寫出嚟？", "value": "感受具體"},
            ]},
            {"title": "Part C · 出版準備", "kind": "list", "items": [
                "題目清楚。",
                "開頭吸引人。",
                "結尾有力。",
                "老師會睇呢篇文決定用唔用嚟出版。",
            ]},
        ],
        "checklist": [
            "我完成咗全文",
            "我跟住修訂策略自檢",
            "我叫 AI 幫我睇咗一個位",
            "我提交咗最終版本",
        ],
        "exitTicket": ["寫完呢篇文，我最自豪嘅係……"],
    },
}

ACTIVITIES_EN = {
    1: {
        "kind": "prep", "cycle": 1,
        "goals": [
            "I can find the key words of the topic and know what to write.",
            "I can observe my school with five senses and collect 5 real details.",
            "I can ask AI questions to widen my observation.",
        ],
        "bigIdea": "Good writing starts with careful observation. Writing about your school is not about listing facts — choose the corner you care about most and use real details the reader can see.",
        "guidedTasks": [
            {"id": "t1", "label": "Read the topic three times. Circle the key words and write what the topic asks you to write.", "hint": "In \u201cMy School\u201d, the key words are \u201cmy\u201d and \u201cschool\u201d: write about the school you see."},
            {"id": "t2", "label": "Choose one corner of the school and write 5 observations using five senses.", "hint": "Colours? Sounds? Smells? Textures?"},
            {"id": "t3", "label": "Ask AI: \u201cWhat details can I write about my school?\u201d Note down 3 new angles.", "hint": "Use the AI partner on the right."},
        ],
        "writingTask": "Idea: write your story direction / seed — choose one school corner + one thing you remember.",
        "aiStarter": "My school has many places I remember. Ask me 3 questions to help me choose the most memorable corner and one small story about it.",
        "parts": [
            {"title": "Part A · Understand the Topic", "kind": "pairs", "pairs": [
                {"label": "Key word \u201cmy\u201d", "value": "Write the school you see, not a brochure"},
                {"label": "Key word \u201cschool\u201d", "value": "A corner + people + events you know"},
                {"label": "Avoid", "value": "A fact list: name, classes, history, no feeling"},
            ]},
            {"title": "Part B · Five Senses", "kind": "pairs", "pairs": [
                {"label": "See", "value": "colours, shapes, light, corners"},
                {"label": "Hear", "value": "bells, footsteps, laughter, pages"},
                {"label": "Smell", "value": "library books, snacks"},
                {"label": "Touch", "value": "old desks, cold rails"},
            ]},
            {"title": "Part C · Responsible AI Use", "kind": "list", "items": [
                "I ask for three ideas, compare and change my favourite — responsible.",
                "I copy AI text as my own work — not responsible.",
                "I never put phone numbers, emails or addresses in my writing.",
            ]},
            {"title": "Part D · Choosing Material", "kind": "text", "text": "Pick one corner. Write: where? why do you remember it? which detail is clearest?"},
        ],
        "checklist": [
            "I circled the key words",
            "I wrote 5 five-sense observations",
            "I asked AI one question",
            "I chose one corner + one event",
        ],
        "exitTicket": ["My most useful observation today is \u2026"],
    },
    2: {
        "kind": "prep", "cycle": 1,
        "goals": [
            "I can arrange paragraphs with beginning, body and ending.",
            "I can write an opening that makes readers want to continue.",
            "I can write an ending with feeling.",
        ],
        "bigIdea": "Structure gives order to details: the opening introduces, each body paragraph has one focus, and the ending responds to the opening with feeling.",
        "guidedTasks": [
            {"id": "t1", "label": "Write 3 different openings: direct / question / scene.", "hint": "Direct: \u201cMy school\u2026\u201d Question: \u201cDo you know the most special corner in my school?\u201d Scene: \u201cThe bell rang\u2026\u201d"},
            {"id": "t2", "label": "Divide your observations into 2\u20133 body paragraphs, one focus each.", "hint": "For example: classroom, playground, snack bar."},
            {"id": "t3", "label": "Use \u201cImprove My Plan\u201d to choose a better direction for your outline.", "hint": "Press \u201cImprove my plan\u201d and read directions A/B/C."},
        ],
        "writingTask": "Outline: plan — opening / body paragraphs / ending, one key point each.",
        "aiStarter": "I planned my school essay: opening, body about the library, ending. Give me two questions to make my opening more inviting.",
        "parts": [
            {"title": "Part A · Three Openings", "kind": "pairs", "pairs": [
                {"label": "Direct", "value": "simple, clear, straight in"},
                {"label": "Question", "value": "makes readers curious"},
                {"label": "Scene", "value": "strongest picture, like a film opening"},
            ]},
            {"title": "Part B · Body Paragraphs", "kind": "list", "items": [
                "One focus per paragraph.",
                "Order: space or time order.",
                "First sentence is a topic sentence, then details.",
            ]},
            {"title": "Part C · Endings", "kind": "pairs", "pairs": [
                {"label": "Echo the opening", "value": "full circle, complete"},
                {"label": "Write feeling", "value": "why this corner matters to you"},
                {"label": "Leave an image", "value": "one line that stays with the reader"},
            ]},
            {"title": "Part D · Structure Check", "kind": "pairs", "pairs": [
                {"label": "Opening 2\u20133 lines", "value": "introduce + attract"},
                {"label": "Body 2\u20133 paragraphs", "value": "one focus each, in order"},
                {"label": "Ending 2\u20133 lines", "value": "feeling / echo, complete"},
            ]},
        ],
        "checklist": [
            "I wrote 3 openings and chose the best",
            "I divided my observations into 2\u20133 paragraphs",
            "I used AI to improve my outline",
            "My ending has feeling",
        ],
        "exitTicket": ["Which opening did I choose? Why?"],
    },
    3: {
        "kind": "piece", "cycle": 1,
        "p5": {"pieceTitle": "My School", "pieceTitleEn": "My School"},
        "p6": {"pieceTitle": "All About My School", "pieceTitleEn": "All About My School"},
        "goals": [
            "I can write a complete essay following my outline.",
            "I can revise my essay with a self-check list.",
            "I can submit my final version.",
        ],
        "bigIdea": "Writing day: from idea to outline to draft, then revise and submit by yourself. AI helps you check, but every sentence is yours.",
        "guidedTasks": [
            {"id": "t1", "label": "Write your draft from the outline, at least 3 paragraphs.", "hint": "It does not need to be perfect — write first."},
            {"id": "t2", "label": "Self-check: is the opening inviting? Does each paragraph have a focus? Does the ending have feeling?", "hint": "Tick each item, revise if needed."},
            {"id": "t3", "label": "Ask AI to point out one place to improve, then revise it yourself.", "hint": "Ask: \u201cWhere in my draft can I write more clearly?\u201d"},
        ],
        "writingTask": "Essay: complete \u201cMy School\u201d (P5) / \u201cAll About My School\u201d (P6).",
        "aiStarter": "I finished a draft about my school. Ask me two questions to help me improve one sentence or one detail before I revise.",
        "parts": [
            {"title": "Part A · Write the Draft", "kind": "text", "text": "Follow your outline: opening → 2\u20133 body paragraphs → ending with feeling. Do not stop — finish it first."},
            {"title": "Part B · Self-Revision", "kind": "pairs", "pairs": [
                {"label": "Inviting opening?", "value": "Does the first line make you want to read on?"},
                {"label": "One focus per paragraph?", "value": "Is the first sentence a topic sentence?"},
                {"label": "Feeling in the ending?", "value": "Did you show your feeling about the school?"},
            ]},
            {"title": "Part C · AI Proofreading", "kind": "list", "items": [
                "Ask AI to point out one small place.",
                "Decide how to revise — AI does not write new paragraphs for you.",
            ]},
            {"title": "Part D · Submit", "kind": "text", "text": "Final check: clear paragraphs? correct punctuation? Read once more before submitting."},
        ],
        "checklist": [
            "I finished the whole essay (at least 3 paragraphs)",
            "I did the self-check item by item",
            "I asked AI one question and revised myself",
            "I submitted my final version",
        ],
        "exitTicket": ["My favourite sentence this time is \u2026"],
    },
    4: {
        "kind": "prep", "cycle": 2,
        "goals": [
            "I can use the six elements (time, place, people, cause, events, result) to shape a memorable experience.",
            "I can choose a real event with a turning point.",
        ],
        "bigIdea": "A narrative must make clear what happened. Six elements help you miss nothing; choose something you really remember so it comes alive.",
        "guidedTasks": [
            {"id": "t1", "label": "Write 3 memorable events, one sentence each.", "hint": "A trip, a match, a first time, a surprise\u2026"},
            {"id": "t2", "label": "Choose one and write the six elements: time, place, people, cause, events, result.", "hint": "The events matter most: which moment was the most exciting?"},
            {"id": "t3", "label": "Ask AI \u201cHow can I tell an event vividly?\u201d Note down 3 suggestions.", "hint": "Use the AI partner on the right."},
        ],
        "writingTask": "Idea: write your story direction / seed — choose one event + six elements.",
        "aiStarter": "I want to write about a trip I remember. Ask me three questions about what happened that made it special.",
        "parts": [
            {"title": "Part A · Six Elements", "kind": "pairs", "pairs": [
                {"label": "Time", "value": "When did it happen?"},
                {"label": "Place", "value": "Where did it happen?"},
                {"label": "People", "value": "Who was there?"},
                {"label": "Cause", "value": "Why did it happen?"},
                {"label": "Events", "value": "What happened? Most important!"},
                {"label": "Result", "value": "How did it end?"},
            ]},
            {"title": "Part B · Choosing Material", "kind": "pairs", "pairs": [
                {"label": "Real", "value": "You lived it, so you have details and feelings"},
                {"label": "Turning point", "value": "A surprise or change keeps readers interested"},
                {"label": "With feeling", "value": "You remember how you felt"},
            ]},
            {"title": "Part C · AI Guidance", "kind": "list", "items": [
                "Ask AI questions to help you recall details.",
                "AI only asks — the answers and the writing are yours.",
            ]},
        ],
        "checklist": [
            "I wrote 3 memorable events",
            "I chose one and wrote all six elements",
            "I asked AI one question",
        ],
        "exitTicket": ["The event I chose is \u2026 The most unforgettable moment is \u2026"],
    },
    5: {
        "kind": "prep", "cycle": 2,
        "goals": [
            "I can use the story mountain (beginning, build-up, climax, ending) to plan.",
            "I can decide which part to write in detail and which to skim.",
        ],
        "bigIdea": "The story mountain turns one event into a story with ups and downs: beginning sets the scene, build-up pushes forward, climax is the most tense, ending closes. Write the climax in detail.",
        "guidedTasks": [
            {"id": "t1", "label": "Turn your six elements into a story mountain outline: beginning, build-up, climax, ending.", "hint": "One sentence per part."},
            {"id": "t2", "label": "Mark the climax and decide what to write in detail and what to skim.", "hint": "Climax in detail (more action, dialogue, feeling); beginning short and quick."},
            {"id": "t3", "label": "Use \u201cImprove My Plan\u201d to see three directions and choose one.", "hint": "Press \u201cImprove my plan\u201d."},
        ],
        "writingTask": "Outline: plan — beginning / build-up / climax / ending with detail marks.",
        "aiStarter": "Here is my trip outline. Give me two questions about the climax so I can make it more vivid.",
        "parts": [
            {"title": "Part A · Story Mountain", "kind": "pairs", "pairs": [
                {"label": "Beginning", "value": "Set time, place, people; enter quickly"},
                {"label": "Build-up", "value": "Events step by step"},
                {"label": "Climax", "value": "The most tense / touching moment"},
                {"label": "Ending", "value": "Result + feeling"},
            ]},
            {"title": "Part B · Detail Choices", "kind": "pairs", "pairs": [
                {"label": "In detail", "value": "Climax: add action, dialogue, feeling"},
                {"label": "Skim", "value": "Background and transitions: one line"},
            ]},
            {"title": "Part C · Structure Check", "kind": "list", "items": [
                "Are the six elements clear?",
                "Is the climax the most detailed?",
                "Does the ending carry feeling?",
            ]},
        ],
        "checklist": [
            "I planned the story mountain",
            "I marked the climax",
            "I decided the details",
            "I used AI to improve my outline",
        ],
        "exitTicket": ["My climax is \u2026"],
    },
    6: {
        "kind": "piece", "cycle": 2,
        "p5": {"pieceTitle": "A Memorable Trip", "pieceTitleEn": "A Memorable Trip"},
        "p6": {"pieceTitle": "An Unforgettable Journey", "pieceTitleEn": "An Unforgettable Journey"},
        "goals": [
            "I can write a complete narrative following my story mountain.",
            "I can revise with a self-check list and submit.",
        ],
        "bigIdea": "Writing day: turn your memorable experience into a complete story. Remember: climax in detail, clear order, ending with feeling.",
        "guidedTasks": [
            {"id": "t1", "label": "Write your draft from the outline.", "hint": "Enter quickly; write the climax slowly with details."},
            {"id": "t2", "label": "Self-check: six elements clear? climax detailed? order clear?", "hint": "Tick each item."},
            {"id": "t3", "label": "Ask AI to point out one place to improve, then revise it yourself.", "hint": "Ask: \u201cIs my climax vivid enough?\u201d"},
        ],
        "writingTask": "Essay: complete \u201cA Memorable Trip\u201d (P5) / \u201cAn Unforgettable Journey\u201d (P6).",
        "aiStarter": "I drafted my trip story. Ask me two questions about the most exciting part before I revise.",
        "parts": [
            {"title": "Part A · Write the Draft", "kind": "text", "text": "Follow the outline: beginning → build-up → climax → ending. Write the climax with the most detail."},
            {"title": "Part B · Self-Revision", "kind": "pairs", "pairs": [
                {"label": "Six elements clear?", "value": "Time, place, people, events"},
                {"label": "Climax detailed?", "value": "Action and feeling in the tensest moment?"},
                {"label": "Order clear?", "value": "Can a reader follow what happened first and next?"},
            ]},
            {"title": "Part C · AI Proofreading", "kind": "list", "items": [
                "Ask AI to point out one small place.",
                "Revise yourself — AI does not write for you.",
            ]},
        ],
        "checklist": [
            "I finished the whole story",
            "Six elements are clear",
            "The climax is detailed",
            "I submitted my final version",
        ],
        "exitTicket": ["What I learned this time is \u2026"],
    },
    7: {
        "kind": "prep", "cycle": 3,
        "goals": [
            "I can describe a person with appearance, actions, speech and a real example.",
            "I can choose someone I want to thank / who influenced me.",
        ],
        "bigIdea": "Writing about people fails when you just say \u201cshe is very kind\u201d. Use appearance, actions, speech and one real example so the reader can see the person.",
        "guidedTasks": [
            {"id": "t1", "label": "Choose someone you want to thank / who influenced you. Write 3 things they did for you.", "hint": "Avoid vague \u201calways nice to me\u201d — choose one concrete event."},
            {"id": "t2", "label": "Write 5 observations using appearance, actions and speech.", "hint": "How do they smile? What tone do they use? Any small habits?"},
            {"id": "t3", "label": "Ask AI \u201cHow can I describe a person more vividly?\u201d Note down 3 suggestions.", "hint": "Use the AI partner on the right."},
        ],
        "writingTask": "Idea: write your story direction / seed — choose a person + one concrete example.",
        "aiStarter": "I want to thank my grandmother. Ask me three questions to help me choose one memory that shows her kindness.",
        "parts": [
            {"title": "Part A · Four Ways to Describe People", "kind": "pairs", "pairs": [
                {"label": "Appearance", "value": "build, face, clothes — choose what stands out"},
                {"label": "Actions", "value": "small habits show personality"},
                {"label": "Speech", "value": "What do they often say? What tone?"},
                {"label": "Example", "value": "One event that proves who they are"},
            ]},
            {"title": "Part B · Choosing the Person", "kind": "pairs", "pairs": [
                {"label": "Family", "value": "parents, grandparents, siblings"},
                {"label": "Teachers and friends", "value": "teachers, classmates, neighbours"},
                {"label": "Be concrete", "value": "Someone with a real example writes best"},
            ]},
            {"title": "Part C · AI Guidance", "kind": "list", "items": [
                "Ask AI questions to help you recall details about the person.",
                "AI only asks — you choose and write.",
            ]},
        ],
        "checklist": [
            "I chose a person to thank",
            "I wrote 3 examples",
            "I wrote observations with the four ways",
            "I asked AI one question",
        ],
        "exitTicket": ["The person I chose is \u2026 The action / words I remember most are \u2026"],
    },
    8: {
        "kind": "prep", "cycle": 3,
        "goals": [
            "I can choose the strongest example to write in detail.",
            "I can plan my people essay and add emotion.",
        ],
        "bigIdea": "One good example is enough for a people essay. Choose the one that best shows their character, write it in detail, add your feeling — readers understand why you thank them.",
        "guidedTasks": [
            {"id": "t1", "label": "Choose the strongest of your 3 examples and write why you chose it.", "hint": "Which one lets readers \u201csee\u201d who they are?"},
            {"id": "t2", "label": "Plan: opening introducing the person → the example → my feeling → ending of thanks.", "hint": "Use the story mountain for the example: start, build-up, climax, end."},
            {"id": "t3", "label": "Use \u201cImprove My Plan\u201d to see three directions and choose one.", "hint": "Press \u201cImprove my plan\u201d."},
        ],
        "writingTask": "Outline: people essay — opening / example / feeling / ending.",
        "aiStarter": "My essay about a person: opening, one key memory, how I felt, ending. Ask me two questions to make the memory vivid.",
        "parts": [
            {"title": "Part A · Choosing the Example", "kind": "pairs", "pairs": [
                {"label": "Strong", "value": "best proves their character"},
                {"label": "Concrete", "value": "has time, place and details"},
                {"label": "With change", "value": "they did something that changed you"},
            ]},
            {"title": "Part B · Structure", "kind": "pairs", "pairs": [
                {"label": "Opening", "value": "one line introducing the person + why they matter"},
                {"label": "The example", "value": "detailed: action, dialogue, scene"},
                {"label": "My feeling", "value": "what you thought and felt at that moment"},
                {"label": "Ending", "value": "thanks / how they influenced you"},
            ]},
            {"title": "Part C · Emotion", "kind": "list", "items": [
                "Show emotion, do not just name it.",
                "Instead of \u201cI was moved\u201d, write what you did at that moment.",
            ]},
        ],
        "checklist": [
            "I chose the strongest example",
            "I planned my outline",
            "I added emotion",
            "I used AI to improve my outline",
        ],
        "exitTicket": ["The example I chose is \u2026 Why is it the strongest?"],
    },
    9: {
        "kind": "piece", "cycle": 3,
        "p5": {"pieceTitle": "The Person I Want to Thank", "pieceTitleEn": "The Person I Want to Thank"},
        "p6": {"pieceTitle": "A Person Who Influenced Me", "pieceTitleEn": "A Person Who Influenced Me"},
        "goals": [
            "I can write a complete people essay.",
            "I can use the four ways and one real example.",
            "I can revise and submit.",
        ],
        "bigIdea": "Writing day: bring the person you thank to life with one real example. Remember: description with pictures, feeling shown not named.",
        "guidedTasks": [
            {"id": "t1", "label": "Write your draft from the outline.", "hint": "Write the example in the most detail."},
            {"id": "t2", "label": "Self-check: four ways? concrete example? emotion?", "hint": "Tick each item."},
            {"id": "t3", "label": "Ask AI to point out one place to improve, then revise it yourself.", "hint": "Ask: \u201cIs my description vivid enough?\u201d"},
        ],
        "writingTask": "Essay: complete \u201cThe Person I Want to Thank\u201d (P5) / \u201cA Person Who Influenced Me\u201d (P6).",
        "aiStarter": "I drafted my essay about a person I thank. Ask me two questions about the key memory before I revise.",
        "parts": [
            {"title": "Part A · Write the Draft", "kind": "text", "text": "Opening introducing the person → the example (in detail) → feeling → ending of thanks."},
            {"title": "Part B · Self-Revision", "kind": "pairs", "pairs": [
                {"label": "Four ways used?", "value": "appearance / actions / speech / example"},
                {"label": "Example concrete?", "value": "Can the reader follow the whole event?"},
                {"label": "Emotion shown?", "value": "Did you show your feeling?"},
            ]},
            {"title": "Part C · AI Proofreading", "kind": "list", "items": [
                "Ask AI to point out one small place.",
                "Revise yourself — AI does not write for you.",
            ]},
        ],
        "checklist": [
            "I finished the whole essay",
            "The person is described with the four ways",
            "The example is concrete",
            "I submitted my final version",
        ],
        "exitTicket": ["The sentence I most wanted to get right is \u2026"],
    },
    10: {
        "kind": "prep", "cycle": 4,
        "goals": [
            "I can turn my dream into a concrete scene (where / what / why).",
            "I can add real details to imagination.",
        ],
        "bigIdea": "Imagination writing is not \u201cdreaming\u201d — it builds a believable world with real details. What is your dream? Where does it happen? What are you doing?",
        "guidedTasks": [
            {"id": "t1", "label": "Write your dream in one sentence.", "hint": "For example: \u201cI want to be a vet.\u201d"},
            {"id": "t2", "label": "Turn your dream into a scene: time, place, people, what you are doing.", "hint": "Close your eyes for ten seconds: what do you see?"},
            {"id": "t3", "label": "Ask AI \u201cHow can I make imagination writing feel real?\u201d Note down 3 suggestions.", "hint": "Use the AI partner on the right."},
        ],
        "writingTask": "Idea: write your story direction / seed — dream scene (where / what / why).",
        "aiStarter": "My dream is to become a vet. Ask me three questions to turn this into a scene I can see.",
        "parts": [
            {"title": "Part A · Dream Scene", "kind": "pairs", "pairs": [
                {"label": "Where", "value": "the setting: hospital? space? school?"},
                {"label": "What", "value": "what are you doing all day?"},
                {"label": "Why", "value": "why is this your dream?"},
            ]},
            {"title": "Part B · Real Details", "kind": "pairs", "pairs": [
                {"label": "Real", "value": "details you have seen, heard or felt"},
                {"label": "Imagined", "value": "add something beyond reality on that base"},
            ]},
            {"title": "Part C · AI Guidance", "kind": "list", "items": [
                "Ask AI questions to help you think through the scene.",
                "AI only asks — you choose and write.",
            ]},
        ],
        "checklist": [
            "I wrote my dream",
            "I turned my dream into a scene",
            "I added real details",
            "I asked AI one question",
        ],
        "exitTicket": ["My dream scene is \u2026"],
    },
    11: {
        "kind": "prep", "cycle": 4,
        "goals": [
            "I can plan an imagined story with wish, effort, difficulty and success.",
            "I can mix real details into the imagined setting.",
        ],
        "bigIdea": "Imagination writing needs structure too: the character has a wish, works for it, meets difficulty, and reaches success. A steady structure keeps imagination from drifting.",
        "guidedTasks": [
            {"id": "t1", "label": "Plan your outline: wish, effort, difficulty, success.", "hint": "One sentence per part."},
            {"id": "t2", "label": "Add 2 real details to your outline.", "hint": "A texture you really touched, a sound you really heard."},
            {"id": "t3", "label": "Use \u201cImprove My Plan\u201d to see three directions and choose one.", "hint": "Press \u201cImprove my plan\u201d."},
        ],
        "writingTask": "Outline: imagined story — wish / effort / difficulty / success.",
        "aiStarter": "My future-story outline: dream, effort, difficulty, success. Ask me two questions about the difficulty part.",
        "parts": [
            {"title": "Part A · Structure", "kind": "pairs", "pairs": [
                {"label": "Wish", "value": "what the character wants to get or do"},
                {"label": "Effort", "value": "steps toward it"},
                {"label": "Difficulty", "value": "what blocks them? how do they overcome it?"},
                {"label": "Success", "value": "how does it end? what changed?"},
            ]},
            {"title": "Part B · Real + Imagined", "kind": "pairs", "pairs": [
                {"label": "Real details", "value": "make the world believable"},
                {"label": "Imagined elements", "value": "bring surprise"},
            ]},
            {"title": "Part C · Structure Check", "kind": "list", "items": [
                "Are all four parts there?",
                "Is the difficulty the most tense part?",
                "Does the success answer the wish?",
            ]},
        ],
        "checklist": [
            "I planned the four parts",
            "I added 2 real details",
            "I used AI to improve my outline",
        ],
        "exitTicket": ["One real detail in my imagined world is \u2026"],
    },
    12: {
        "kind": "piece", "cycle": 4,
        "p5": {"pieceTitle": "My Dream", "pieceTitleEn": "My Dream"},
        "p6": {"pieceTitle": "Me in Twenty Years", "pieceTitleEn": "Me in Twenty Years"},
        "goals": [
            "I can write a complete imagination essay.",
            "I can use real details to make imagination believable.",
            "I can revise and submit.",
        ],
        "bigIdea": "Writing day: write your dream world. Steady structure (wish → effort → difficulty → success), true details — then imagination has power.",
        "guidedTasks": [
            {"id": "t1", "label": "Write your draft from the outline.", "hint": "Write the difficulty part with the most detail."},
            {"id": "t2", "label": "Self-check: structure complete? real details? success answers the wish?", "hint": "Tick each item."},
            {"id": "t3", "label": "Ask AI to point out one place to improve, then revise it yourself.", "hint": "Ask: \u201cIs my imagined scene clear enough?\u201d"},
        ],
        "writingTask": "Essay: complete \u201cMy Dream\u201d (P5) / \u201cMe in Twenty Years\u201d (P6).",
        "aiStarter": "I drafted my dream essay. Ask me two questions to make my imagined scene clearer.",
        "parts": [
            {"title": "Part A · Write the Draft", "kind": "text", "text": "Wish → effort → difficulty → success. Write the imagined scene with five senses."},
            {"title": "Part B · Self-Revision", "kind": "pairs", "pairs": [
                {"label": "Structure complete?", "value": "all four parts"},
                {"label": "Details real?", "value": "real details make it believable"},
                {"label": "Answers the wish?", "value": "does the success answer the opening wish?"},
            ]},
            {"title": "Part C · AI Proofreading", "kind": "list", "items": [
                "Ask AI to point out one small place.",
                "Revise yourself — AI does not write for you.",
            ]},
        ],
        "checklist": [
            "I finished the whole essay",
            "All four structure parts are there",
            "I used real details",
            "I submitted my final version",
        ],
        "exitTicket": ["The most interesting thing in my imagined world is \u2026"],
    },
    13: {
        "kind": "prep", "cycle": 5,
        "goals": [
            "I can look back at my growth and choose one event to write about.",
            "I can apply the skills I learned to a new topic.",
        ],
        "bigIdea": "The final unit: write your growth story. Think back from the start of the course to now — which moment changed you? Choose it and shape it with the six elements.",
        "guidedTasks": [
            {"id": "t1", "label": "Write 3 growth moments (a first time / a failure / a change).", "hint": "First time going to school alone? First competition?"},
            {"id": "t2", "label": "Choose one and write the six elements.", "hint": "How did this event make you grow?"},
            {"id": "t3", "label": "Ask AI \u201cHow do I write a growth story?\u201d Note down 3 suggestions.", "hint": "Use the AI partner on the right."},
        ],
        "writingTask": "Idea: write your story direction / seed — choose one growth event + six elements.",
        "aiStarter": "I want to write about a time I grew. Ask me three questions to find the moment I changed.",
        "parts": [
            {"title": "Part A · Looking Back", "kind": "pairs", "pairs": [
                {"label": "A first time", "value": "the first time you did something"},
                {"label": "A failure", "value": "how you stood up after failing"},
                {"label": "A change", "value": "a moment you realised you were different"},
            ]},
            {"title": "Part B · Choosing Material", "kind": "pairs", "pairs": [
                {"label": "With change", "value": "this event helped you grow"},
                {"label": "With details", "value": "you remember the picture and the feeling"},
            ]},
            {"title": "Part C · AI Guidance", "kind": "list", "items": [
                "Ask AI questions to help you recall details.",
                "AI only asks — you choose and write.",
            ]},
        ],
        "checklist": [
            "I wrote 3 growth moments",
            "I chose one and wrote the six elements",
            "I asked AI one question",
        ],
        "exitTicket": ["The growth event I chose is \u2026"],
    },
    14: {
        "kind": "prep", "cycle": 5,
        "goals": [
            "I can combine everything I learned into one outline.",
            "I can set a revision strategy (check list).",
        ],
        "bigIdea": "For your final essay, use everything from the whole course: five senses, structure, story mountain, people description, real details. Plan today, and writing day goes smoothly.",
        "guidedTasks": [
            {"id": "t1", "label": "Plan the full outline: beginning → build-up → climax → ending.", "hint": "Use the story mountain and mark the climax."},
            {"id": "t2", "label": "Write your revision strategy: which parts need special attention?", "hint": "For example: \u201cmore feeling in the ending\u201d, \u201cadd action to the climax\u201d"},
            {"id": "t3", "label": "Use \u201cImprove My Plan\u201d to see three directions and choose one.", "hint": "Press \u201cImprove my plan\u201d."},
        ],
        "writingTask": "Outline: growth story outline + revision strategy.",
        "aiStarter": "My growth-story outline is ready. Ask me two questions about the turning point.",
        "parts": [
            {"title": "Part A · The Whole-Term Toolbox", "kind": "pairs", "pairs": [
                {"label": "Five senses", "value": "details with pictures"},
                {"label": "Story mountain", "value": "ups and downs"},
                {"label": "Describing people", "value": "lifelike characters"},
                {"label": "Real details", "value": "believability"},
            ]},
            {"title": "Part B · Revision Strategy", "kind": "list", "items": [
                "Write down 2 places you need to check carefully.",
                "Follow this list on writing day.",
            ]},
            {"title": "Part C · AI Guidance", "kind": "list", "items": [
                "Ask AI questions to help you look at the turning point.",
                "AI only asks — you choose and write.",
            ]},
        ],
        "checklist": [
            "I planned the full outline",
            "I marked the climax",
            "I wrote my revision strategy",
            "I used AI to improve my outline",
        ],
        "exitTicket": ["My revision strategy is \u2026"],
    },
    15: {
        "kind": "piece", "cycle": 5,
        "p5": {"pieceTitle": "An Unforgettable Moment", "pieceTitleEn": "An Unforgettable Moment"},
        "p6": {"pieceTitle": "My Story of Growing Up", "pieceTitleEn": "My Story of Growing Up"},
        "goals": [
            "I can write and submit my final formal essay.",
            "I can use the whole-term skills in one complete piece.",
            "I can prepare my work for publication (teacher selection).",
        ],
        "bigIdea": "The final essay: use every skill from the course to write your growth story. After you finish, your teacher will select work for publication — your piece could be in the anthology!",
        "guidedTasks": [
            {"id": "t1", "label": "Write your draft from the outline, using the whole-term skills.", "hint": "Five senses, story mountain, people, details — all of it applies."},
            {"id": "t2", "label": "Follow your revision strategy, then ask AI to point out one place to improve.", "hint": "Revise yourself first, then ask AI."},
            {"id": "t3", "label": "Check your title, opening and ending, then submit the final version.", "hint": "Your piece will enter your teacher's selection queue."},
        ],
        "writingTask": "Essay: complete \u201cAn Unforgettable Moment\u201d (P5) / \u201cMy Story of Growing Up\u201d (P6).",
        "aiStarter": "This is my final piece. Ask me two questions to polish the ending before I submit.",
        "parts": [
            {"title": "Part A · Write the Draft", "kind": "text", "text": "Follow the outline: beginning → build-up → climax → ending. Use the whole-term toolbox."},
            {"title": "Part B · Self-Revision", "kind": "pairs", "pairs": [
                {"label": "Structure complete?", "value": "opening, body and ending all there"},
                {"label": "Details with pictures?", "value": "five senses + real details"},
                {"label": "Emotion shown?", "value": "feelings are concrete"},
            ]},
            {"title": "Part C · Publication Prep", "kind": "list", "items": [
                "A clear title.",
                "An inviting opening.",
                "A strong ending.",
                "Your teacher will read this piece to decide on publication.",
            ]},
        ],
        "checklist": [
            "I finished the whole essay",
            "I followed my revision strategy",
            "I asked AI to check one place",
            "I submitted my final version",
        ],
        "exitTicket": ["After finishing this piece, I am most proud of \u2026"],
    },
}
