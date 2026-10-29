import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BookOpen, Check, ChevronDown, ChevronUp, ClipboardCheck, Download, FileText, GraduationCap, LayoutTemplate, LockKeyhole, MessageCircle, PenLine, SearchCheck, Send, Sparkles, Star, Target, Users, WandSparkles, ArrowRight } from "lucide-react";

type Studio = "proofreading" | "course" | "anthology" | "accounts" | "overview";
type Stage = "idea" | "outline" | "draft" | "revision" | "submitted";
type Lang = "zh" | "en";

const lessons: Record<Lang, readonly (readonly [string, string, string])[]> = {
  zh: [
    ["觀察校園角落", "用五感觀察校園，收集《我的學校》嘅寫作素材。", "構思筆記"],
    ["文章結構：開頭、主體、結尾", "用「開頭—主體—結尾」安排校園作文。", "作文大綱"],
    ["作文日：我的學校", "完成《我的學校》（P5）或《關於我的學校》（P6）全文。", "正式作文"],
    ["記敘六要素", "用時間、地點、人物、事件構思一件難忘經歷。", "構思筆記"],
    ["故事山與詳略", "用故事山安排經歷嘅開端、發展、高潮與結局。", "作文大綱"],
    ["作文日：一次旅行", "完成《一次旅行》（P5）或《那次難忘的旅程》（P6）。", "正式作文"],
    ["人物描寫四寶", "用外貌、動作、語言、事例描寫一個人。", "構思筆記"],
    ["事例與情感", "揀一個有力事例，安排人物作文結構。", "作文大綱"],
    ["作文日：我想感謝的人", "完成《我最想感謝的人》（P5）或《一位影響我的人》（P6）。", "正式作文"],
    ["想像與夢想", "將夢想變成具體、可見嘅畫面。", "構思筆記"],
    ["虛構結構", "用「願望—努力—困難—成果」安排想像作文。", "作文大綱"],
    ["作文日：我的夢想", "完成《我的夢想》（P5）或《二十年後的我》（P6）。", "正式作文"],
    ["選材與回顧", "回顧成長，揀一件值得寫嘅事。", "構思筆記"],
    ["結構整合與修訂", "整合全學期技巧，訂立修訂策略。", "作文大綱"],
    ["作文日：我成長的故事", "完成最後一篇作文，可被老師篩選出版。", "正式作文"],
  ],
  en: [
    ["Observing School Corners", "Use your five senses to collect details for your school essay.", "Idea Notes"],
    ["Essay Structure: Beginning, Body, Ending", "Arrange your school essay with three clear parts.", "Essay Outline"],
    ["Writing Day: My School", "Write your full essay: P5 “My School” / P6 “All About My School”.", "Final Essay"],
    ["Six Elements of a Story", "Use time, place, people and events to shape a memorable experience.", "Idea Notes"],
    ["Story Mountain & Detail Choices", "Plan the beginning, build-up, climax and ending of your experience.", "Essay Outline"],
    ["Writing Day: A Memorable Trip", "Write your full story: P5 “A Memorable Trip” / P6 “An Unforgettable Journey”.", "Final Essay"],
    ["Describing People", "Use appearance, actions, speech and a real example to describe someone.", "Idea Notes"],
    ["Choosing Evidence & Emotion", "Pick one strong example and plan your people essay.", "Essay Outline"],
    ["Writing Day: The Person I Thank", "Write your full essay: P5 “The Person I Want to Thank” / P6 “A Person Who Influenced Me”.", "Final Essay"],
    ["Imagination & Dreams", "Turn your dream into a clear, visible scene.", "Idea Notes"],
    ["Structure of an Imagined Story", "Plan with wish, effort, difficulty and success.", "Essay Outline"],
    ["Writing Day: My Dream", "Write your full essay: P5 “My Dream” / P6 “Me in Twenty Years”.", "Final Essay"],
    ["Choosing Your Growth Story", "Look back and choose one moment worth writing about.", "Idea Notes"],
    ["Bringing It Together & Revising", "Combine everything you learned and plan your revision.", "Essay Outline"],
    ["Writing Day: My Growth Story", "Write your final essay, ready for the anthology.", "Final Essay"],
  ],
};

// 每堂的結構化活動內容，對照真實課程（報價單 15 課大綱 + 課堂筆記），
// 讓每一堂都有明確的平台活動及可保存產出。平台原則：AI 不代寫。
type LessonPart = { title: string; kind: "pairs" | "list" | "text" | "plan"; pairs?: { label: string; value: string }[]; items?: string[]; text?: string };
type GuidedTask = {
  id: string;
  label: string;
  hint?: string;
};
type LessonActivity = {
  kind: "prep" | "piece";
  guidedTasks: GuidedTask[];
  cycle: number;
  pieceTitle?: string;
  pieceTitleEn?: string;
  goals: string[];
  bigIdea: string;
  parts: LessonPart[];
  checklist: string[];
  exitTicket: string[];
  writingTask: string;
  aiStarter: string;
  p5?: Partial<LessonActivity>;
  p6?: Partial<LessonActivity>;
};
const lessonActivitiesZh: Record<number, LessonActivity> = {
1: {
  kind: "prep", cycle: 1,
  goals: [
    "我能圈出題目嘅關鍵詞，知道要寫甚麼。",
    "我能用五感觀察校園，收集 5 個真實細節。",
    "我能用 AI 問問題，擴闊我嘅觀察角度。",
  ],
  bigIdea: "好文章由仔細觀察開始。寫學校嘅作文唔係叫你背學校資料，而係揀一個你最有感情嘅角落，用真實細節令讀者「睇得見」。",
  guidedTasks: [
    { id: "t1", label: "讀題目三次，圈出關鍵詞，寫低題目要求你寫咩。", hint: "例如《我的學校》——重點係「我」同「學校」：寫你眼中嘅學校。" },
    { id: "t2", label: "揀校園一個角落，用五感寫低 5 個觀察。", hint: "睇到咩顏色？聽到咩聲音？聞到咩？摸到咩？" },
    { id: "t3", label: "問 AI「關於我的學校，我可以寫咩細節？」記低 3 個新角度。", hint: "用右邊 AI 夥伴，撳 Starter 或者自己問。" },
  ],
  writingTask: "構思：寫低你嘅故事方向／種子——揀一個校園角落＋一件令你印象深刻嘅事。",
  aiStarter: "My school has many places I remember. Ask me 3 questions to help me choose the most memorable corner and one small story about it.",
  parts: [
    { title: "Part A · 讀懂題目", kind: "pairs",
      pairs: [
        { label: "關鍵詞「我的」", value: "寫我眼中嘅學校，唔係學校簡介冊" },
        { label: "關鍵詞「學校」", value: "校園一角＋人＋事，揀你熟悉嘅" },
        { label: "唔應該寫", value: "資料式流水賬：校名、班數、歷史，冇感情" },
      ] },
    { title: "Part B · 五感觀察法", kind: "pairs",
      pairs: [
        { label: "睇 See", value: "顏色、形狀、光線、角落" },
        { label: "聽 Hear", value: "鐘聲、腳步、笑聲、翻書聲" },
        { label: "聞 Smell", value: "圖書館嘅書味、小食部嘅香味" },
        { label: "觸 Touch", value: "舊木枱嘅紋理、欄杆嘅冰冷" },
      ] },
    { title: "Part C · 負責任用 AI", kind: "list",
      items: [
        "我要求三個點子，比較後揀一個改動——負責任。",
        "我複製 AI 成段文字當自己作品——唔負責任。",
        "我唔會喺作文輸入電話、電郵或地址。",
      ] },
    { title: "Part D · 揀材", kind: "text",
      text: "揀一個角落，寫低：邊度？點解記得？有咩細節最清晰？" },
  ],
  checklist: [
    "我圈出咗題目關鍵詞",
    "我寫低咗 5 個五感觀察",
    "我問咗 AI 一個問題",
    "我揀定咗一個角落＋一件事",
  ],
  exitTicket: [
    "我今堂最有用嘅一個觀察係……",
  ],
},
2: {
  kind: "prep", cycle: 1,
  goals: [
    "我能用「開頭—主體—結尾」安排文章段落。",
    "我能寫出一個吸引讀者嘅開頭。",
    "我能寫出有感受嘅結尾。",
  ],
  bigIdea: "結構令細節有秩序：開頭引入主題，主體每段一個重點，結尾回應開頭並寫出感受。",
  guidedTasks: [
    { id: "t1", label: "寫 3 個唔同開頭：直接點題／設問／場景。", hint: "直接：「我的學校……」；設問：「你知唔知學校邊個角落最特別？」；場景：「放學鈴聲響起……」" },
    { id: "t2", label: "將五感觀察分成 2–3 段主體，每段一個重點。", hint: "例如：課室一段、操場一段、小食部一段。" },
    { id: "t3", label: "用「AI 優化構思」揀一個更好嘅大綱方向。", hint: "撳「優化我的構思」，睇 A／B／C 三個方向，揀一個加入。" },
  ],
  writingTask: "大綱：排大綱——開頭／主體段落／結尾，每部分寫一句重點。",
  aiStarter: "I planned my school essay: opening, body about the library, ending. Give me two questions to make my opening more inviting.",
  parts: [
    { title: "Part A · 開頭三式", kind: "pairs",
      pairs: [
        { label: "直接點題", value: "簡單清楚，立即入題" },
        { label: "設問", value: "引起好奇，讀者想知答案" },
        { label: "場景", value: "畫面感最強，好似電影開場" },
      ] },
    { title: "Part B · 主體分段", kind: "list",
      items: [
        "每段一個重點。",
        "段落之間有順序：空間順序或時間順序。",
        "每段第一句係「主題句」，後面係細節。",
      ] },
    { title: "Part C · 結尾", kind: "pairs",
      pairs: [
        { label: "呼應開頭", value: "首尾呼應，文章完整" },
        { label: "寫感受", value: "點解呢個角落對你特別" },
        { label: "留想像", value: "一句收結，留低餘韻" },
      ] },
    { title: "Part D · 結構檢查", kind: "pairs",
      pairs: [
        { label: "開頭 2–3 句", value: "引入主題＋吸引讀者" },
        { label: "主體 2–3 段", value: "每段一個重點，有順序" },
        { label: "結尾 2–3 句", value: "感受／呼應，完整收結" },
      ] },
  ],
  checklist: [
    "我寫咗 3 個開頭並揀咗最好嗰個",
    "我將觀察分成 2–3 段",
    "我用 AI 優化咗大綱",
    "我嘅結尾有感受",
  ],
  exitTicket: [
    "我揀咗邊個開頭？點解？",
  ],
},
3: {
  kind: "piece", cycle: 1,
  p5: { pieceTitle: "我的學校", pieceTitleEn: "My School" },
  p6: { pieceTitle: "關於我的學校", pieceTitleEn: "All About My School" },
  goals: [
    "我能跟住大綱完成一篇完整作文。",
    "我能用自我檢查清單修訂自己嘅文章。",
    "我能提交最終版本。",
  ],
  bigIdea: "今日係作文日：由構思到大綱到草稿，最後自己修訂、提交。AI 會幫你檢查，但每一句都係你自己寫嘅。",
  guidedTasks: [
    { id: "t1", label: "跟住大綱寫草稿，最少 3 段。", hint: "唔使完美，寫咗先。" },
    { id: "t2", label: "用自檢清單檢查：開頭吸引？每段有重點？結尾有感受？", hint: "逐項打勾，改咗先算完成。" },
    { id: "t3", label: "叫 AI 指出一個可以改善嘅地方，你自己改。", hint: "問：「我嘅草稿邊度可以寫得更清楚？」" },
  ],
  writingTask: "作文：完成《我的學校》（P5）／《關於我的學校》（P6）全文。",
  aiStarter: "I finished a draft about my school. Ask me two questions to help me improve one sentence or one detail before I revise.",
  parts: [
    { title: "Part A · 寫草稿", kind: "text",
      text: "跟住大綱寫：開頭引入→主體 2–3 段→結尾感受。唔好停低，一口氣寫完先。" },
    { title: "Part B · 自我修訂", kind: "pairs",
      pairs: [
        { label: "開頭吸引？", value: "第一句會唔會令人想繼續讀？" },
        { label: "每段有重點？", value: "每段第一句係咪主題句？" },
        { label: "結尾有感受？", value: "有冇寫出你對學校嘅感情？" },
      ] },
    { title: "Part C · AI 校對", kind: "list",
      items: [
        "叫 AI 指出一個小地方。",
        "自己決定點改，唔可以叫 AI 幫你寫新段落。",
      ] },
    { title: "Part D · 提交", kind: "text",
      text: "最後檢查：分段清楚？標點正確？再讀一次，先提交。" },
  ],
  checklist: [
    "我完成咗全文（至少 3 段）",
    "我逐項做咗自我檢查",
    "我問咗 AI 一個問題並自己修訂",
    "我提交咗最終版本",
  ],
  exitTicket: [
    "我今次最滿意嘅一句係……",
  ],
},
4: {
  kind: "prep", cycle: 2,
  goals: [
    "我能用六要素（時間、地點、人物、起因、經過、結果）構思一件難忘經歷。",
    "我能揀一件真實、有轉折嘅事。",
  ],
  bigIdea: "記敘文要交代清楚「發生咩事」。六要素幫你唔漏嘢，揀一件真係令你印象深刻嘅事，先寫得生動。",
  guidedTasks: [
    { id: "t1", label: "寫低 3 件難忘嘅事，每件用一句。", hint: "旅行、比賽、第一次、意外……" },
    { id: "t2", label: "揀一件，用六要素寫低：時間、地點、人物、起因、經過、結果。", hint: "經過最重要：邊一刻最緊張／最開心？" },
    { id: "t3", label: "問 AI「點樣將一件事講得生動？」記低 3 個建議。", hint: "用右邊 AI 夥伴。" },
  ],
  writingTask: "構思：寫低你嘅故事方向／種子——揀定一件事＋六要素。",
  aiStarter: "I want to write about a trip I remember. Ask me three questions about what happened that made it special.",
  parts: [
    { title: "Part A · 六要素", kind: "pairs",
      pairs: [
        { label: "時間 Time", value: "邊個時候？" },
        { label: "地點 Place", value: "邊度發生？" },
        { label: "人物 People", value: "邊啲人喺度？" },
        { label: "起因 Cause", value: "點解會發生？" },
        { label: "經過 Events", value: "發生咗咩？最重要！" },
        { label: "結果 Result", value: "最後點樣？" },
      ] },
    { title: "Part B · 揀材", kind: "pairs",
      pairs: [
        { label: "真實", value: "親身經歷先有細節同感受" },
        { label: "有轉折", value: "有意外／改變／高潮先吸引" },
        { label: "有感受", value: "你記得當時嘅心情，先寫得出" },
      ] },
    { title: "Part C · AI 引導", kind: "list",
      items: [
        "叫 AI 問你問題，幫你記返細節。",
        "AI 只負責問，答案同寫作都係你嘅。",
      ] },
  ],
  checklist: [
    "我寫低咗 3 件難忘嘅事",
    "我揀咗一件並寫齊六要素",
    "我問咗 AI 一個問題",
  ],
  exitTicket: [
    "我揀咗邊件事？佢最難忘嘅一刻係……",
  ],
},
5: {
  kind: "prep", cycle: 2,
  goals: [
    "我能用故事山（開端→發展→高潮→結局）排大綱。",
    "我能決定邊部分詳寫、邊部分略寫。",
  ],
  bigIdea: "故事山將一件事變成有起有伏嘅文章：開端交代背景，發展推前，高潮最緊張，結局收返。高潮位要詳寫。",
  guidedTasks: [
    { id: "t1", label: "將六要素排成故事山大綱：開端、發展、高潮、結局。", hint: "每部分用一句寫低。" },
    { id: "t2", label: "標記高潮位，決定邊度詳寫、邊度略寫。", hint: "高潮詳寫（多細節），開端略寫（快入題）。" },
    { id: "t3", label: "用「AI 優化構思」睇三個方向，揀一個加入大綱。", hint: "撳「優化我的構思」。" },
  ],
  writingTask: "大綱：排大綱——開端／發展／高潮／結局＋詳略標記。",
  aiStarter: "Here is my trip outline. Give me two questions about the climax so I can make it more vivid.",
  parts: [
    { title: "Part A · 故事山", kind: "pairs",
      pairs: [
        { label: "開端 Beginning", value: "交代時間地點人物，快入題" },
        { label: "發展 Build-up", value: "事情一步一步推前" },
        { label: "高潮 Climax", value: "最緊張／最感動嘅一刻" },
        { label: "結局 Ending", value: "結果＋感受" },
      ] },
    { title: "Part B · 詳略", kind: "pairs",
      pairs: [
        { label: "詳寫", value: "高潮位：加動作、對話、感受" },
        { label: "略寫", value: "背景同過場：一句帶過" },
      ] },
    { title: "Part C · 結構檢查", kind: "list",
      items: [
        "六要素有冇交代清楚？",
        "高潮位係咪最詳？",
        "結局有冇感受？",
      ] },
  ],
  checklist: [
    "我排好咗故事山大綱",
    "我標記咗高潮位",
    "我決定咗詳略",
    "我用 AI 優化咗大綱",
  ],
  exitTicket: [
    "我嘅高潮位係……",
  ],
},
6: {
  kind: "piece", cycle: 2,
  p5: { pieceTitle: "一次旅行", pieceTitleEn: "A Memorable Trip" },
  p6: { pieceTitle: "那次難忘的旅程", pieceTitleEn: "An Unforgettable Journey" },
  goals: [
    "我能跟住故事山大綱完成完整記敘文。",
    "我能用自檢清單修訂並提交。",
  ],
  bigIdea: "作文日：將你嘅難忘經歷寫成一篇完整文章。記住：高潮詳寫、順序清楚、結局有感受。",
  guidedTasks: [
    { id: "t1", label: "跟住大綱寫草稿。", hint: "開端快入題，高潮慢慢寫。" },
    { id: "t2", label: "自檢：六要素齊？高潮詳寫？順序清楚？", hint: "逐項打勾。" },
    { id: "t3", label: "叫 AI 指出一個改善位，你自己改。", hint: "問：「我嘅高潮部分夠唔夠生動？」" },
  ],
  writingTask: "作文：完成《一次旅行》（P5）／《那次難忘的旅程》（P6）全文。",
  aiStarter: "I drafted my trip story. Ask me two questions about the most exciting part before I revise.",
  parts: [
    { title: "Part A · 寫草稿", kind: "text",
      text: "跟住大綱：開端→發展→高潮→結局。高潮位寫得最仔細。" },
    { title: "Part B · 自我修訂", kind: "pairs",
      pairs: [
        { label: "六要素齊？", value: "時間、地點、人物、事件清楚" },
        { label: "高潮詳寫？", value: "最緊張一刻有動作同感受？" },
        { label: "順序清楚？", value: "讀者跟得到邊先邊後？" },
      ] },
    { title: "Part C · AI 校對", kind: "list",
      items: [
        "叫 AI 指出一個小地方。",
        "自己修訂，AI 唔代寫。",
      ] },
  ],
  checklist: [
    "我完成咗全文",
    "六要素交代清楚",
    "高潮位詳寫",
    "我提交咗最終版本",
  ],
  exitTicket: [
    "我今次學到咗……",
  ],
},
7: {
  kind: "prep", cycle: 3,
  goals: [
    "我能用外貌、動作、語言、事例描寫一個人。",
    "我能揀一位想感謝／影響我嘅人。",
  ],
  bigIdea: "寫人作文最忌「佢好好人」一句講完。用外貌、動作、語言加一個真實事例，讀者先「睇得見」嗰個人。",
  guidedTasks: [
    { id: "t1", label: "揀一位想感謝／影響你嘅人，寫低 3 件佢為你做嘅事。", hint: "唔好揀「佢成日對我好」咁空泛，揀具體一件事。" },
    { id: "t2", label: "用外貌、動作、語言寫低 5 個觀察。", hint: "佢點樣笑？講嘢咩語氣？有咩小動作？" },
    { id: "t3", label: "問 AI「點樣描寫一個人更有畫面？」記低 3 個建議。", hint: "用右邊 AI 夥伴。" },
  ],
  writingTask: "構思：寫低你嘅故事方向／種子——揀定人物＋一個具體事例。",
  aiStarter: "I want to thank my grandmother. Ask me three questions to help me choose one memory that shows her kindness.",
  parts: [
    { title: "Part A · 人物描寫四寶", kind: "pairs",
      pairs: [
        { label: "外貌 Appearance", value: "身形、面容、衣著——揀有特點嘅" },
        { label: "動作 Actions", value: "習慣性小動作最見性格" },
        { label: "語言 Speech", value: "佢成日講咩？咩語氣？" },
        { label: "事例 Example", value: "一件事證明佢係點嘅人" },
      ] },
    { title: "Part B · 揀人", kind: "pairs",
      pairs: [
        { label: "家人", value: "父母、祖父母、兄弟姊妹" },
        { label: "師長朋友", value: "老師、同學、鄰居" },
        { label: "要具體", value: "有真實事例嘅人，先寫得深" },
      ] },
    { title: "Part C · AI 引導", kind: "list",
      items: [
        "叫 AI 問你問題，幫你記返人物細節。",
        "AI 只負責問，最後由你揀同寫。",
      ] },
  ],
  checklist: [
    "我揀咗一位想感謝嘅人",
    "我寫低咗 3 件事例",
    "我用四寶寫低咗觀察",
    "我問咗 AI 一個問題",
  ],
  exitTicket: [
    "我揀咗邊個人？佢最令我記得嘅動作／說話係……",
  ],
},
8: {
  kind: "prep", cycle: 3,
  goals: [
    "我能揀一個最有力嘅事例做詳寫。",
    "我能安排人物作文嘅結構並加入情感。",
  ],
  bigIdea: "一篇寫人作文，一個好事例就夠。揀最能證明佢性格嘅嗰件，詳寫經過，再加你嘅感受，讀者自然明白點解你感謝佢。",
  guidedTasks: [
    { id: "t1", label: "由 3 件事例揀一件最有力嘅，寫低點解揀佢。", hint: "邊件事最能令人「睇到」佢係點嘅人？" },
    { id: "t2", label: "排大綱：開頭引入人物→事例經過→我的感受→結尾感謝。", hint: "事例經過用故事山：開始→發展→高潮→結束。" },
    { id: "t3", label: "用「AI 優化構思」睇三個方向，揀一個加入。", hint: "撳「優化我的構思」。" },
  ],
  writingTask: "大綱：人物作文大綱——開頭／事例／感受／結尾。",
  aiStarter: "My essay about a person: opening, one key memory, how I felt, ending. Ask me two questions to make the memory vivid.",
  parts: [
    { title: "Part A · 揀事例", kind: "pairs",
      pairs: [
        { label: "有力", value: "最能證明佢性格" },
        { label: "具體", value: "有時間、地點、細節" },
        { label: "有轉折", value: "佢做咗件事改變咗你" },
      ] },
    { title: "Part B · 結構", kind: "pairs",
      pairs: [
        { label: "開頭", value: "一句介紹人物＋點解佢重要" },
        { label: "事例經過", value: "詳寫：動作、對話、場景" },
        { label: "我的感受", value: "嗰一刻你諗咩、feel 到咩" },
        { label: "結尾", value: "感謝／佢點影響你" },
      ] },
    { title: "Part C · 情感", kind: "list",
      items: [
        "情感要「寫出嚟」，唔好淨係「講出嚟」。",
        "用感受代替形容：唔好寫「好感動」，寫嗰刻你嘅反應。",
      ] },
  ],
  checklist: [
    "我揀咗一件最有力嘅事例",
    "我排好咗大綱",
    "我加入咗情感",
    "我用 AI 優化咗大綱",
  ],
  exitTicket: [
    "我揀咗邊件事例？點解佢最有力？",
  ],
},
9: {
  kind: "piece", cycle: 3,
  p5: { pieceTitle: "我最想感謝的人", pieceTitleEn: "The Person I Want to Thank" },
  p6: { pieceTitle: "一位影響我的人", pieceTitleEn: "A Person Who Influenced Me" },
  goals: [
    "我能完成一篇完整嘅寫人作文。",
    "我能用四寶同事例寫出人物。",
    "我能修訂並提交。",
  ],
  bigIdea: "作文日：用一個真實事例，將你想感謝嘅人寫活。記住：描寫要有畫面，感受要寫出嚟。",
  guidedTasks: [
    { id: "t1", label: "跟住大綱寫草稿。", hint: "事例經過寫得最詳細。" },
    { id: "t2", label: "自檢：有四寶？事例具體？有情感？", hint: "逐項打勾。" },
    { id: "t3", label: "叫 AI 指出一個改善位，你自己改。", hint: "問：「我嘅人物描寫夠唔夠畫面？」" },
  ],
  writingTask: "作文：完成《我最想感謝的人》（P5）／《一位影響我的人》（P6）全文。",
  aiStarter: "I drafted my essay about a person I thank. Ask me two questions about the key memory before I revise.",
  parts: [
    { title: "Part A · 寫草稿", kind: "text",
      text: "開頭引入人物→事例經過（詳寫）→感受→結尾感謝。" },
    { title: "Part B · 自我修訂", kind: "pairs",
      pairs: [
        { label: "有四寶？", value: "外貌／動作／語言／事例" },
        { label: "事例具體？", value: "讀者跟得到成件事？" },
        { label: "有情感？", value: "感受寫咗出嚟？" },
      ] },
    { title: "Part C · AI 校對", kind: "list",
      items: [
        "叫 AI 指出一個小地方。",
        "自己修訂，AI 唔代寫。",
      ] },
  ],
  checklist: [
    "我完成咗全文",
    "人物有四寶描寫",
    "事例具體",
    "我提交咗最終版本",
  ],
  exitTicket: [
    "我最想寫好嘅一句係……",
  ],
},
10: {
  kind: "prep", cycle: 4,
  goals: [
    "我能將夢想變成具體畫面（邊度／做咩／點解）。",
    "我能將真實細節加入想像。",
  ],
  bigIdea: "想像作文唔係「發夢」，而係用真實細節砌出一個可信嘅世界。你嘅夢想係咩？喺邊度發生？你做緊咩？",
  guidedTasks: [
    { id: "t1", label: "寫低你嘅夢想，用一句。", hint: "例如：「我想做獸醫。」" },
    { id: "t2", label: "將夢想變成畫面：時間、地點、人物、做緊咩。", hint: "閉眼諗十秒：你見到咩？" },
    { id: "t3", label: "問 AI「點樣令想像作文有真實感？」記低 3 個建議。", hint: "用右邊 AI 夥伴。" },
  ],
  writingTask: "構思：寫低你嘅故事方向／種子——夢想畫面（邊度／做咩／點解）。",
  aiStarter: "My dream is to become a vet. Ask me three questions to turn this into a scene I can see.",
  parts: [
    { title: "Part A · 夢想畫面", kind: "pairs",
      pairs: [
        { label: "邊度 Where", value: "場景：醫院？太空？學校？" },
        { label: "做咩 What", value: "你一日做緊咩？" },
        { label: "點解 Why", value: "點解呢個係你嘅夢想？" },
      ] },
    { title: "Part B · 真實細節", kind: "pairs",
      pairs: [
        { label: "真實", value: "用你見過、聽過、feel 過嘅細節" },
        { label: "想像", value: "喺真實基礎上加一點超越現實" },
      ] },
    { title: "Part C · AI 引導", kind: "list",
      items: [
        "叫 AI 問你問題，幫你諗清楚畫面。",
        "AI 只負責問，最後由你揀同寫。",
      ] },
  ],
  checklist: [
    "我寫低咗夢想",
    "我將夢想變成畫面",
    "我加入咗真實細節",
    "我問咗 AI 一個問題",
  ],
  exitTicket: [
    "我嘅夢想畫面係……",
  ],
},
11: {
  kind: "prep", cycle: 4,
  goals: [
    "我能用「願望—努力—困難—成果」排想像作文。",
    "我能將真實細節融入想像場景。",
  ],
  bigIdea: "想像作文都要有結構：主角有願望，為咗願望努力，遇到困難，最後有成果。結構穩，想像先唔會散。",
  guidedTasks: [
    { id: "t1", label: "排大綱：願望、努力、困難、成果。", hint: "每部分一句。" },
    { id: "t2", label: "喺大綱加入 2 個真實細節。", hint: "例如：真係摸過嘅質感、真係聽過嘅聲音。" },
    { id: "t3", label: "用「AI 優化構思」睇三個方向，揀一個加入。", hint: "撳「優化我的構思」。" },
  ],
  writingTask: "大綱：想像作文大綱——願望／努力／困難／成果。",
  aiStarter: "My future-story outline: dream, effort, difficulty, success. Ask me two questions about the difficulty part.",
  parts: [
    { title: "Part A · 結構", kind: "pairs",
      pairs: [
        { label: "願望 Wish", value: "主角想得到／做到咩" },
        { label: "努力 Effort", value: "佢點樣一步步行近" },
        { label: "困難 Difficulty", value: "遇到咩阻礙？點克服？" },
        { label: "成果 Success", value: "最後點樣？有咩改變？" },
      ] },
    { title: "Part B · 真實＋想像", kind: "pairs",
      pairs: [
        { label: "真實細節", value: "令讀者信得過呢個世界" },
        { label: "想像元素", value: "令文章有驚喜" },
      ] },
    { title: "Part C · 結構檢查", kind: "list",
      items: [
        "四部分齊唔齊？",
        "困難部分係咪最緊張？",
        "成果有冇回應願望？",
      ] },
  ],
  checklist: [
    "我排好咗四部分大綱",
    "我加入咗 2 個真實細節",
    "我用 AI 優化咗大綱",
  ],
  exitTicket: [
    "我嘅想像世界有一個真實細節係……",
  ],
},
12: {
  kind: "piece", cycle: 4,
  p5: { pieceTitle: "我的夢想", pieceTitleEn: "My Dream" },
  p6: { pieceTitle: "二十年後的我", pieceTitleEn: "Me in Twenty Years" },
  goals: [
    "我能完成一篇完整嘅想像作文。",
    "我能用真實細節令想像可信。",
    "我能修訂並提交。",
  ],
  bigIdea: "作文日：寫你嘅夢想世界。結構穩（願望→努力→困難→成果），細節真，想像先有力。",
  guidedTasks: [
    { id: "t1", label: "跟住大綱寫草稿。", hint: "困難部分寫得最仔細。" },
    { id: "t2", label: "自檢：結構齊？有真實細節？結局回應願望？", hint: "逐項打勾。" },
    { id: "t3", label: "叫 AI 指出一個改善位，你自己改。", hint: "問：「我嘅想像場景夠唔夠清楚？」" },
  ],
  writingTask: "作文：完成《我的夢想》（P5）／《二十年後的我》（P6）全文。",
  aiStarter: "I drafted my dream essay. Ask me two questions to make my imagined scene clearer.",
  parts: [
    { title: "Part A · 寫草稿", kind: "text",
      text: "願望→努力→困難→成果。想像場景用五感寫。" },
    { title: "Part B · 自我修訂", kind: "pairs",
      pairs: [
        { label: "結構齊？", value: "四部分齊全" },
        { label: "細節真？", value: "有真實細節令讀者信服" },
        { label: "回應願望？", value: "成果有冇回應開頭嘅願望？" },
      ] },
    { title: "Part C · AI 校對", kind: "list",
      items: [
        "叫 AI 指出一個小地方。",
        "自己修訂，AI 唔代寫。",
      ] },
  ],
  checklist: [
    "我完成咗全文",
    "結構四部分齊全",
    "有真實細節",
    "我提交咗最終版本",
  ],
  exitTicket: [
    "我嘅想像世界最得意嘅一樣嘢係……",
  ],
},
13: {
  kind: "prep", cycle: 5,
  goals: [
    "我能回顧自己嘅成長，揀一件事做題材。",
    "我能將之前學過嘅技巧應用喺新題目。",
  ],
  bigIdea: "最後一個單元：寫你嘅成長故事。回想由開學到而家，邊一刻令你變咗？揀嗰件事，用返六要素嚟構思。",
  guidedTasks: [
    { id: "t1", label: "寫低 3 件成長嘅事（第一次／失敗／改變）。", hint: "第一次自己返學？第一次比賽？" },
    { id: "t2", label: "揀一件，寫低六要素。", hint: "呢件事點樣令你成長？" },
    { id: "t3", label: "問 AI「點樣寫成長故事？」記低 3 個建議。", hint: "用右邊 AI 夥伴。" },
  ],
  writingTask: "構思：寫低你嘅故事方向／種子——揀定一件成長嘅事＋六要素。",
  aiStarter: "I want to write about a time I grew. Ask me three questions to find the moment I changed.",
  parts: [
    { title: "Part A · 回顧成長", kind: "pairs",
      pairs: [
        { label: "第一次", value: "第一次做某件事" },
        { label: "失敗", value: "失敗之後點樣企返起身" },
        { label: "改變", value: "有一刻你發現自己唔同咗" },
      ] },
    { title: "Part B · 揀材", kind: "pairs",
      pairs: [
        { label: "有改變", value: "呢件事令你成長咗" },
        { label: "有細節", value: "你記得當時嘅畫面同感受" },
      ] },
    { title: "Part C · AI 引導", kind: "list",
      items: [
        "叫 AI 問你問題，幫你記返細節。",
        "AI 只負責問，最後由你揀同寫。",
      ] },
  ],
  checklist: [
    "我寫低咗 3 件成長嘅事",
    "我揀咗一件並寫齊六要素",
    "我問咗 AI 一個問題",
  ],
  exitTicket: [
    "我揀咗邊件成長嘅事？",
  ],
},
14: {
  kind: "prep", cycle: 5,
  goals: [
    "我能整合全學期技巧排大綱。",
    "我能訂立修訂策略（檢查清單）。",
  ],
  bigIdea: "最後一篇作文，將全學期學過嘅都用返：五感、結構、故事山、人物描寫、真實細節。今日排好大綱，作文日就順。",
  guidedTasks: [
    { id: "t1", label: "排完整大綱：開端→發展→高潮→結局。", hint: "用故事山，標記高潮位。" },
    { id: "t2", label: "寫低你嘅修訂策略：邊部分要特別留意？", hint: "例如：「結尾要多啲感受」「高潮要加動作」" },
    { id: "t3", label: "用「AI 優化構思」睇三個方向，揀一個加入。", hint: "撳「優化我的構思」。" },
  ],
  writingTask: "大綱：成長故事大綱＋修訂策略。",
  aiStarter: "My growth-story outline is ready. Ask me two questions about the turning point.",
  parts: [
    { title: "Part A · 全學期工具箱", kind: "pairs",
      pairs: [
        { label: "五感", value: "細節有畫面" },
        { label: "故事山", value: "有起有伏" },
        { label: "人物描寫", value: "人物立體" },
        { label: "真實細節", value: "令讀者信服" },
      ] },
    { title: "Part B · 修訂策略", kind: "list",
      items: [
        "寫低 2 個你要特別留意嘅地方。",
        "作文日跟住呢張清單檢查。",
      ] },
    { title: "Part C · AI 引導", kind: "list",
      items: [
        "叫 AI 問你問題，幫你睇轉折位。",
        "AI 只負責問，最後由你揀同寫。",
      ] },
  ],
  checklist: [
    "我排好咗完整大綱",
    "我標記咗高潮位",
    "我寫低咗修訂策略",
    "我用 AI 優化咗大綱",
  ],
  exitTicket: [
    "我嘅修訂策略係……",
  ],
},
15: {
  kind: "piece", cycle: 5,
  p5: { pieceTitle: "一件令我難忘的事", pieceTitleEn: "An Unforgettable Moment" },
  p6: { pieceTitle: "我成長的故事", pieceTitleEn: "My Story of Growing Up" },
  goals: [
    "我能完成最後一篇正式作文並提交。",
    "我能運用全學期技巧寫出完整文章。",
    "我能為作品準備出版（可被老師篩選）。",
  ],
  bigIdea: "最後一篇作文：用全學期學過嘅技巧，寫你嘅成長故事。完成之後，老師會篩選作品用唔用嚟出版——你嘅文章有機會入選集！",
  guidedTasks: [
    { id: "t1", label: "跟住大綱寫草稿，運用全學期技巧。", hint: "五感、故事山、人物、細節，全部用得著。" },
    { id: "t2", label: "跟住修訂策略自檢，再叫 AI 指出一個改善位。", hint: "先自己改，再問 AI。" },
    { id: "t3", label: "檢查標題、開頭、結尾，提交最終版本。", hint: "你嘅作品會進入老師嘅篩選佇列。" },
  ],
  writingTask: "作文：完成《一件令我難忘的事》（P5）／《我成長的故事》（P6）全文。",
  aiStarter: "This is my final piece. Ask me two questions to polish the ending before I submit.",
  parts: [
    { title: "Part A · 寫草稿", kind: "text",
      text: "跟住大綱：開端→發展→高潮→結局。用全學期嘅工具箱寫。" },
    { title: "Part B · 自我修訂", kind: "pairs",
      pairs: [
        { label: "結構完整？", value: "開頭、主體、結尾齊" },
        { label: "細節有畫面？", value: "五感＋真實細節" },
        { label: "情感寫出嚟？", value: "感受具體" },
      ] },
    { title: "Part C · 出版準備", kind: "list",
      items: [
        "題目清楚。",
        "開頭吸引人。",
        "結尾有力。",
        "老師會睇呢篇文決定用唔用嚟出版。",
      ] },
  ],
  checklist: [
    "我完成咗全文",
    "我跟住修訂策略自檢",
    "我叫 AI 幫我睇咗一個位",
    "我提交咗最終版本",
  ],
  exitTicket: [
    "寫完呢篇文，我最自豪嘅係……",
  ],
},
};

const lessonActivitiesEn: Record<number, LessonActivity> = {
1: {
  kind: "prep", cycle: 1,
  goals: [
    "I can find the key words of the topic and know what to write.",
    "I can observe my school with five senses and collect 5 real details.",
    "I can ask AI questions to widen my observation.",
  ],
  bigIdea: "Good writing starts with careful observation. Writing about your school is not about listing facts — choose the corner you care about most and use real details the reader can see.",
  guidedTasks: [
    { id: "t1", label: "Read the topic three times. Circle the key words and write what the topic asks you to write.", hint: "In “My School”, the key words are “my” and “school”: write about the school you see." },
    { id: "t2", label: "Choose one corner of the school and write 5 observations using five senses.", hint: "Colours? Sounds? Smells? Textures?" },
    { id: "t3", label: "Ask AI: “What details can I write about my school?” Note down 3 new angles.", hint: "Use the AI partner on the right." },
  ],
  writingTask: "Idea: write your story direction / seed — choose one school corner + one thing you remember.",
  aiStarter: "My school has many places I remember. Ask me 3 questions to help me choose the most memorable corner and one small story about it.",
  parts: [
    { title: "Part A · Understand the Topic", kind: "pairs",
      pairs: [
        { label: "Key word “my”", value: "Write the school you see, not a brochure" },
        { label: "Key word “school”", value: "A corner + people + events you know" },
        { label: "Avoid", value: "A fact list: name, classes, history, no feeling" },
      ] },
    { title: "Part B · Five Senses", kind: "pairs",
      pairs: [
        { label: "See", value: "colours, shapes, light, corners" },
        { label: "Hear", value: "bells, footsteps, laughter, pages" },
        { label: "Smell", value: "library books, snacks" },
        { label: "Touch", value: "old desks, cold rails" },
      ] },
    { title: "Part C · Responsible AI Use", kind: "list",
      items: [
        "I ask for three ideas, compare and change my favourite — responsible.",
        "I copy AI text as my own work — not responsible.",
        "I never put phone numbers, emails or addresses in my writing.",
      ] },
    { title: "Part D · Choosing Material", kind: "text",
      text: "Pick one corner. Write: where? why do you remember it? which detail is clearest?" },
  ],
  checklist: [
    "I circled the key words",
    "I wrote 5 five-sense observations",
    "I asked AI one question",
    "I chose one corner + one event",
  ],
  exitTicket: [
    "My most useful observation today is …",
  ],
},
2: {
  kind: "prep", cycle: 1,
  goals: [
    "I can arrange paragraphs with beginning, body and ending.",
    "I can write an opening that makes readers want to continue.",
    "I can write an ending with feeling.",
  ],
  bigIdea: "Structure gives order to details: the opening introduces, each body paragraph has one focus, and the ending responds to the opening with feeling.",
  guidedTasks: [
    { id: "t1", label: "Write 3 different openings: direct / question / scene.", hint: "Direct: “My school…” Question: “Do you know the most special corner in my school?” Scene: “The bell rang…”" },
    { id: "t2", label: "Divide your observations into 2–3 body paragraphs, one focus each.", hint: "For example: classroom, playground, snack bar." },
    { id: "t3", label: "Use “Improve My Plan” to choose a better direction for your outline.", hint: "Press “Improve my plan” and read directions A/B/C." },
  ],
  writingTask: "Outline: plan — opening / body paragraphs / ending, one key point each.",
  aiStarter: "I planned my school essay: opening, body about the library, ending. Give me two questions to make my opening more inviting.",
  parts: [
    { title: "Part A · Three Openings", kind: "pairs",
      pairs: [
        { label: "Direct", value: "simple, clear, straight in" },
        { label: "Question", value: "makes readers curious" },
        { label: "Scene", value: "strongest picture, like a film opening" },
      ] },
    { title: "Part B · Body Paragraphs", kind: "list",
      items: [
        "One focus per paragraph.",
        "Order: space or time order.",
        "First sentence is a topic sentence, then details.",
      ] },
    { title: "Part C · Endings", kind: "pairs",
      pairs: [
        { label: "Echo the opening", value: "full circle, complete" },
        { label: "Write feeling", value: "why this corner matters to you" },
        { label: "Leave an image", value: "one line that stays with the reader" },
      ] },
    { title: "Part D · Structure Check", kind: "pairs",
      pairs: [
        { label: "Opening 2–3 lines", value: "introduce + attract" },
        { label: "Body 2–3 paragraphs", value: "one focus each, in order" },
        { label: "Ending 2–3 lines", value: "feeling / echo, complete" },
      ] },
  ],
  checklist: [
    "I wrote 3 openings and chose the best",
    "I divided my observations into 2–3 paragraphs",
    "I used AI to improve my outline",
    "My ending has feeling",
  ],
  exitTicket: [
    "Which opening did I choose? Why?",
  ],
},
3: {
  kind: "piece", cycle: 1,
  p5: { pieceTitle: "My School", pieceTitleEn: "My School" },
  p6: { pieceTitle: "All About My School", pieceTitleEn: "All About My School" },
  goals: [
    "I can write a complete essay following my outline.",
    "I can revise my essay with a self-check list.",
    "I can submit my final version.",
  ],
  bigIdea: "Writing day: from idea to outline to draft, then revise and submit by yourself. AI helps you check, but every sentence is yours.",
  guidedTasks: [
    { id: "t1", label: "Write your draft from the outline, at least 3 paragraphs.", hint: "It does not need to be perfect — write first." },
    { id: "t2", label: "Self-check: is the opening inviting? Does each paragraph have a focus? Does the ending have feeling?", hint: "Tick each item, revise if needed." },
    { id: "t3", label: "Ask AI to point out one place to improve, then revise it yourself.", hint: "Ask: “Where in my draft can I write more clearly?”" },
  ],
  writingTask: "Essay: complete “My School” (P5) / “All About My School” (P6).",
  aiStarter: "I finished a draft about my school. Ask me two questions to help me improve one sentence or one detail before I revise.",
  parts: [
    { title: "Part A · Write the Draft", kind: "text",
      text: "Follow your outline: opening → 2–3 body paragraphs → ending with feeling. Do not stop — finish it first." },
    { title: "Part B · Self-Revision", kind: "pairs",
      pairs: [
        { label: "Inviting opening?", value: "Does the first line make you want to read on?" },
        { label: "One focus per paragraph?", value: "Is the first sentence a topic sentence?" },
        { label: "Feeling in the ending?", value: "Did you show your feeling about the school?" },
      ] },
    { title: "Part C · AI Proofreading", kind: "list",
      items: [
        "Ask AI to point out one small place.",
        "Decide how to revise — AI does not write new paragraphs for you.",
      ] },
    { title: "Part D · Submit", kind: "text",
      text: "Final check: clear paragraphs? correct punctuation? Read once more before submitting." },
  ],
  checklist: [
    "I finished the whole essay (at least 3 paragraphs)",
    "I did the self-check item by item",
    "I asked AI one question and revised myself",
    "I submitted my final version",
  ],
  exitTicket: [
    "My favourite sentence this time is …",
  ],
},
4: {
  kind: "prep", cycle: 2,
  goals: [
    "I can use the six elements (time, place, people, cause, events, result) to shape a memorable experience.",
    "I can choose a real event with a turning point.",
  ],
  bigIdea: "A narrative must make clear what happened. Six elements help you miss nothing; choose something you really remember so it comes alive.",
  guidedTasks: [
    { id: "t1", label: "Write 3 memorable events, one sentence each.", hint: "A trip, a match, a first time, a surprise…" },
    { id: "t2", label: "Choose one and write the six elements: time, place, people, cause, events, result.", hint: "The events matter most: which moment was the most exciting?" },
    { id: "t3", label: "Ask AI “How can I tell an event vividly?” Note down 3 suggestions.", hint: "Use the AI partner on the right." },
  ],
  writingTask: "Idea: write your story direction / seed — choose one event + six elements.",
  aiStarter: "I want to write about a trip I remember. Ask me three questions about what happened that made it special.",
  parts: [
    { title: "Part A · Six Elements", kind: "pairs",
      pairs: [
        { label: "Time", value: "When did it happen?" },
        { label: "Place", value: "Where did it happen?" },
        { label: "People", value: "Who was there?" },
        { label: "Cause", value: "Why did it happen?" },
        { label: "Events", value: "What happened? Most important!" },
        { label: "Result", value: "How did it end?" },
      ] },
    { title: "Part B · Choosing Material", kind: "pairs",
      pairs: [
        { label: "Real", value: "You lived it, so you have details and feelings" },
        { label: "Turning point", value: "A surprise or change keeps readers interested" },
        { label: "With feeling", value: "You remember how you felt" },
      ] },
    { title: "Part C · AI Guidance", kind: "list",
      items: [
        "Ask AI questions to help you recall details.",
        "AI only asks — the answers and the writing are yours.",
      ] },
  ],
  checklist: [
    "I wrote 3 memorable events",
    "I chose one and wrote all six elements",
    "I asked AI one question",
  ],
  exitTicket: [
    "The event I chose is … The most unforgettable moment is …",
  ],
},
5: {
  kind: "prep", cycle: 2,
  goals: [
    "I can use the story mountain (beginning, build-up, climax, ending) to plan.",
    "I can decide which part to write in detail and which to skim.",
  ],
  bigIdea: "The story mountain turns one event into a story with ups and downs: beginning sets the scene, build-up pushes forward, climax is the most tense, ending closes. Write the climax in detail.",
  guidedTasks: [
    { id: "t1", label: "Turn your six elements into a story mountain outline: beginning, build-up, climax, ending.", hint: "One sentence per part." },
    { id: "t2", label: "Mark the climax and decide what to write in detail and what to skim.", hint: "Climax in detail (more action, dialogue, feeling); beginning short and quick." },
    { id: "t3", label: "Use “Improve My Plan” to see three directions and choose one.", hint: "Press “Improve my plan”." },
  ],
  writingTask: "Outline: plan — beginning / build-up / climax / ending with detail marks.",
  aiStarter: "Here is my trip outline. Give me two questions about the climax so I can make it more vivid.",
  parts: [
    { title: "Part A · Story Mountain", kind: "pairs",
      pairs: [
        { label: "Beginning", value: "Set time, place, people; enter quickly" },
        { label: "Build-up", value: "Events step by step" },
        { label: "Climax", value: "The most tense / touching moment" },
        { label: "Ending", value: "Result + feeling" },
      ] },
    { title: "Part B · Detail Choices", kind: "pairs",
      pairs: [
        { label: "In detail", value: "Climax: add action, dialogue, feeling" },
        { label: "Skim", value: "Background and transitions: one line" },
      ] },
    { title: "Part C · Structure Check", kind: "list",
      items: [
        "Are the six elements clear?",
        "Is the climax the most detailed?",
        "Does the ending carry feeling?",
      ] },
  ],
  checklist: [
    "I planned the story mountain",
    "I marked the climax",
    "I decided the details",
    "I used AI to improve my outline",
  ],
  exitTicket: [
    "My climax is …",
  ],
},
6: {
  kind: "piece", cycle: 2,
  p5: { pieceTitle: "A Memorable Trip", pieceTitleEn: "A Memorable Trip" },
  p6: { pieceTitle: "An Unforgettable Journey", pieceTitleEn: "An Unforgettable Journey" },
  goals: [
    "I can write a complete narrative following my story mountain.",
    "I can revise with a self-check list and submit.",
  ],
  bigIdea: "Writing day: turn your memorable experience into a complete story. Remember: climax in detail, clear order, ending with feeling.",
  guidedTasks: [
    { id: "t1", label: "Write your draft from the outline.", hint: "Enter quickly; write the climax slowly with details." },
    { id: "t2", label: "Self-check: six elements clear? climax detailed? order clear?", hint: "Tick each item." },
    { id: "t3", label: "Ask AI to point out one place to improve, then revise it yourself.", hint: "Ask: “Is my climax vivid enough?”" },
  ],
  writingTask: "Essay: complete “A Memorable Trip” (P5) / “An Unforgettable Journey” (P6).",
  aiStarter: "I drafted my trip story. Ask me two questions about the most exciting part before I revise.",
  parts: [
    { title: "Part A · Write the Draft", kind: "text",
      text: "Follow the outline: beginning → build-up → climax → ending. Write the climax with the most detail." },
    { title: "Part B · Self-Revision", kind: "pairs",
      pairs: [
        { label: "Six elements clear?", value: "Time, place, people, events" },
        { label: "Climax detailed?", value: "Action and feeling in the tensest moment?" },
        { label: "Order clear?", value: "Can a reader follow what happened first and next?" },
      ] },
    { title: "Part C · AI Proofreading", kind: "list",
      items: [
        "Ask AI to point out one small place.",
        "Revise yourself — AI does not write for you.",
      ] },
  ],
  checklist: [
    "I finished the whole story",
    "Six elements are clear",
    "The climax is detailed",
    "I submitted my final version",
  ],
  exitTicket: [
    "What I learned this time is …",
  ],
},
7: {
  kind: "prep", cycle: 3,
  goals: [
    "I can describe a person with appearance, actions, speech and a real example.",
    "I can choose someone I want to thank / who influenced me.",
  ],
  bigIdea: "Writing about people fails when you just say “she is very kind”. Use appearance, actions, speech and one real example so the reader can see the person.",
  guidedTasks: [
    { id: "t1", label: "Choose someone you want to thank / who influenced you. Write 3 things they did for you.", hint: "Avoid vague “always nice to me” — choose one concrete event." },
    { id: "t2", label: "Write 5 observations using appearance, actions and speech.", hint: "How do they smile? What tone do they use? Any small habits?" },
    { id: "t3", label: "Ask AI “How can I describe a person more vividly?” Note down 3 suggestions.", hint: "Use the AI partner on the right." },
  ],
  writingTask: "Idea: write your story direction / seed — choose a person + one concrete example.",
  aiStarter: "I want to thank my grandmother. Ask me three questions to help me choose one memory that shows her kindness.",
  parts: [
    { title: "Part A · Four Ways to Describe People", kind: "pairs",
      pairs: [
        { label: "Appearance", value: "build, face, clothes — choose what stands out" },
        { label: "Actions", value: "small habits show personality" },
        { label: "Speech", value: "What do they often say? What tone?" },
        { label: "Example", value: "One event that proves who they are" },
      ] },
    { title: "Part B · Choosing the Person", kind: "pairs",
      pairs: [
        { label: "Family", value: "parents, grandparents, siblings" },
        { label: "Teachers and friends", value: "teachers, classmates, neighbours" },
        { label: "Be concrete", value: "Someone with a real example writes best" },
      ] },
    { title: "Part C · AI Guidance", kind: "list",
      items: [
        "Ask AI questions to help you recall details about the person.",
        "AI only asks — you choose and write.",
      ] },
  ],
  checklist: [
    "I chose a person to thank",
    "I wrote 3 examples",
    "I wrote observations with the four ways",
    "I asked AI one question",
  ],
  exitTicket: [
    "The person I chose is … The action / words I remember most are …",
  ],
},
8: {
  kind: "prep", cycle: 3,
  goals: [
    "I can choose the strongest example to write in detail.",
    "I can plan my people essay and add emotion.",
  ],
  bigIdea: "One good example is enough for a people essay. Choose the one that best shows their character, write it in detail, add your feeling — readers understand why you thank them.",
  guidedTasks: [
    { id: "t1", label: "Choose the strongest of your 3 examples and write why you chose it.", hint: "Which one lets readers “see” who they are?" },
    { id: "t2", label: "Plan: opening introducing the person → the example → my feeling → ending of thanks.", hint: "Use the story mountain for the example: start, build-up, climax, end." },
    { id: "t3", label: "Use “Improve My Plan” to see three directions and choose one.", hint: "Press “Improve my plan”." },
  ],
  writingTask: "Outline: people essay — opening / example / feeling / ending.",
  aiStarter: "My essay about a person: opening, one key memory, how I felt, ending. Ask me two questions to make the memory vivid.",
  parts: [
    { title: "Part A · Choosing the Example", kind: "pairs",
      pairs: [
        { label: "Strong", value: "best proves their character" },
        { label: "Concrete", value: "has time, place and details" },
        { label: "With change", value: "they did something that changed you" },
      ] },
    { title: "Part B · Structure", kind: "pairs",
      pairs: [
        { label: "Opening", value: "one line introducing the person + why they matter" },
        { label: "The example", value: "detailed: action, dialogue, scene" },
        { label: "My feeling", value: "what you thought and felt at that moment" },
        { label: "Ending", value: "thanks / how they influenced you" },
      ] },
    { title: "Part C · Emotion", kind: "list",
      items: [
        "Show emotion, do not just name it.",
        "Instead of “I was moved”, write what you did at that moment.",
      ] },
  ],
  checklist: [
    "I chose the strongest example",
    "I planned my outline",
    "I added emotion",
    "I used AI to improve my outline",
  ],
  exitTicket: [
    "The example I chose is … Why is it the strongest?",
  ],
},
9: {
  kind: "piece", cycle: 3,
  p5: { pieceTitle: "The Person I Want to Thank", pieceTitleEn: "The Person I Want to Thank" },
  p6: { pieceTitle: "A Person Who Influenced Me", pieceTitleEn: "A Person Who Influenced Me" },
  goals: [
    "I can write a complete people essay.",
    "I can use the four ways and one real example.",
    "I can revise and submit.",
  ],
  bigIdea: "Writing day: bring the person you thank to life with one real example. Remember: description with pictures, feeling shown not named.",
  guidedTasks: [
    { id: "t1", label: "Write your draft from the outline.", hint: "Write the example in the most detail." },
    { id: "t2", label: "Self-check: four ways? concrete example? emotion?", hint: "Tick each item." },
    { id: "t3", label: "Ask AI to point out one place to improve, then revise it yourself.", hint: "Ask: “Is my description vivid enough?”" },
  ],
  writingTask: "Essay: complete “The Person I Want to Thank” (P5) / “A Person Who Influenced Me” (P6).",
  aiStarter: "I drafted my essay about a person I thank. Ask me two questions about the key memory before I revise.",
  parts: [
    { title: "Part A · Write the Draft", kind: "text",
      text: "Opening introducing the person → the example (in detail) → feeling → ending of thanks." },
    { title: "Part B · Self-Revision", kind: "pairs",
      pairs: [
        { label: "Four ways used?", value: "appearance / actions / speech / example" },
        { label: "Example concrete?", value: "Can the reader follow the whole event?" },
        { label: "Emotion shown?", value: "Did you show your feeling?" },
      ] },
    { title: "Part C · AI Proofreading", kind: "list",
      items: [
        "Ask AI to point out one small place.",
        "Revise yourself — AI does not write for you.",
      ] },
  ],
  checklist: [
    "I finished the whole essay",
    "The person is described with the four ways",
    "The example is concrete",
    "I submitted my final version",
  ],
  exitTicket: [
    "The sentence I most wanted to get right is …",
  ],
},
10: {
  kind: "prep", cycle: 4,
  goals: [
    "I can turn my dream into a concrete scene (where / what / why).",
    "I can add real details to imagination.",
  ],
  bigIdea: "Imagination writing is not “dreaming” — it builds a believable world with real details. What is your dream? Where does it happen? What are you doing?",
  guidedTasks: [
    { id: "t1", label: "Write your dream in one sentence.", hint: "For example: “I want to be a vet.”" },
    { id: "t2", label: "Turn your dream into a scene: time, place, people, what you are doing.", hint: "Close your eyes for ten seconds: what do you see?" },
    { id: "t3", label: "Ask AI “How can I make imagination writing feel real?” Note down 3 suggestions.", hint: "Use the AI partner on the right." },
  ],
  writingTask: "Idea: write your story direction / seed — dream scene (where / what / why).",
  aiStarter: "My dream is to become a vet. Ask me three questions to turn this into a scene I can see.",
  parts: [
    { title: "Part A · Dream Scene", kind: "pairs",
      pairs: [
        { label: "Where", value: "the setting: hospital? space? school?" },
        { label: "What", value: "what are you doing all day?" },
        { label: "Why", value: "why is this your dream?" },
      ] },
    { title: "Part B · Real Details", kind: "pairs",
      pairs: [
        { label: "Real", value: "details you have seen, heard or felt" },
        { label: "Imagined", value: "add something beyond reality on that base" },
      ] },
    { title: "Part C · AI Guidance", kind: "list",
      items: [
        "Ask AI questions to help you think through the scene.",
        "AI only asks — you choose and write.",
      ] },
  ],
  checklist: [
    "I wrote my dream",
    "I turned my dream into a scene",
    "I added real details",
    "I asked AI one question",
  ],
  exitTicket: [
    "My dream scene is …",
  ],
},
11: {
  kind: "prep", cycle: 4,
  goals: [
    "I can plan an imagined story with wish, effort, difficulty and success.",
    "I can mix real details into the imagined setting.",
  ],
  bigIdea: "Imagination writing needs structure too: the character has a wish, works for it, meets difficulty, and reaches success. A steady structure keeps imagination from drifting.",
  guidedTasks: [
    { id: "t1", label: "Plan your outline: wish, effort, difficulty, success.", hint: "One sentence per part." },
    { id: "t2", label: "Add 2 real details to your outline.", hint: "A texture you really touched, a sound you really heard." },
    { id: "t3", label: "Use “Improve My Plan” to see three directions and choose one.", hint: "Press “Improve my plan”." },
  ],
  writingTask: "Outline: imagined story — wish / effort / difficulty / success.",
  aiStarter: "My future-story outline: dream, effort, difficulty, success. Ask me two questions about the difficulty part.",
  parts: [
    { title: "Part A · Structure", kind: "pairs",
      pairs: [
        { label: "Wish", value: "what the character wants to get or do" },
        { label: "Effort", value: "steps toward it" },
        { label: "Difficulty", value: "what blocks them? how do they overcome it?" },
        { label: "Success", value: "how does it end? what changed?" },
      ] },
    { title: "Part B · Real + Imagined", kind: "pairs",
      pairs: [
        { label: "Real details", value: "make the world believable" },
        { label: "Imagined elements", value: "bring surprise" },
      ] },
    { title: "Part C · Structure Check", kind: "list",
      items: [
        "Are all four parts there?",
        "Is the difficulty the most tense part?",
        "Does the success answer the wish?",
      ] },
  ],
  checklist: [
    "I planned the four parts",
    "I added 2 real details",
    "I used AI to improve my outline",
  ],
  exitTicket: [
    "One real detail in my imagined world is …",
  ],
},
12: {
  kind: "piece", cycle: 4,
  p5: { pieceTitle: "My Dream", pieceTitleEn: "My Dream" },
  p6: { pieceTitle: "Me in Twenty Years", pieceTitleEn: "Me in Twenty Years" },
  goals: [
    "I can write a complete imagination essay.",
    "I can use real details to make imagination believable.",
    "I can revise and submit.",
  ],
  bigIdea: "Writing day: write your dream world. Steady structure (wish → effort → difficulty → success), true details — then imagination has power.",
  guidedTasks: [
    { id: "t1", label: "Write your draft from the outline.", hint: "Write the difficulty part with the most detail." },
    { id: "t2", label: "Self-check: structure complete? real details? success answers the wish?", hint: "Tick each item." },
    { id: "t3", label: "Ask AI to point out one place to improve, then revise it yourself.", hint: "Ask: “Is my imagined scene clear enough?”" },
  ],
  writingTask: "Essay: complete “My Dream” (P5) / “Me in Twenty Years” (P6).",
  aiStarter: "I drafted my dream essay. Ask me two questions to make my imagined scene clearer.",
  parts: [
    { title: "Part A · Write the Draft", kind: "text",
      text: "Wish → effort → difficulty → success. Write the imagined scene with five senses." },
    { title: "Part B · Self-Revision", kind: "pairs",
      pairs: [
        { label: "Structure complete?", value: "all four parts" },
        { label: "Details real?", value: "real details make it believable" },
        { label: "Answers the wish?", value: "does the success answer the opening wish?" },
      ] },
    { title: "Part C · AI Proofreading", kind: "list",
      items: [
        "Ask AI to point out one small place.",
        "Revise yourself — AI does not write for you.",
      ] },
  ],
  checklist: [
    "I finished the whole essay",
    "All four structure parts are there",
    "I used real details",
    "I submitted my final version",
  ],
  exitTicket: [
    "The most interesting thing in my imagined world is …",
  ],
},
13: {
  kind: "prep", cycle: 5,
  goals: [
    "I can look back at my growth and choose one event to write about.",
    "I can apply the skills I learned to a new topic.",
  ],
  bigIdea: "The final unit: write your growth story. Think back from the start of the course to now — which moment changed you? Choose it and shape it with the six elements.",
  guidedTasks: [
    { id: "t1", label: "Write 3 growth moments (a first time / a failure / a change).", hint: "First time going to school alone? First competition?" },
    { id: "t2", label: "Choose one and write the six elements.", hint: "How did this event make you grow?" },
    { id: "t3", label: "Ask AI “How do I write a growth story?” Note down 3 suggestions.", hint: "Use the AI partner on the right." },
  ],
  writingTask: "Idea: write your story direction / seed — choose one growth event + six elements.",
  aiStarter: "I want to write about a time I grew. Ask me three questions to find the moment I changed.",
  parts: [
    { title: "Part A · Looking Back", kind: "pairs",
      pairs: [
        { label: "A first time", value: "the first time you did something" },
        { label: "A failure", value: "how you stood up after failing" },
        { label: "A change", value: "a moment you realised you were different" },
      ] },
    { title: "Part B · Choosing Material", kind: "pairs",
      pairs: [
        { label: "With change", value: "this event helped you grow" },
        { label: "With details", value: "you remember the picture and the feeling" },
      ] },
    { title: "Part C · AI Guidance", kind: "list",
      items: [
        "Ask AI questions to help you recall details.",
        "AI only asks — you choose and write.",
      ] },
  ],
  checklist: [
    "I wrote 3 growth moments",
    "I chose one and wrote the six elements",
    "I asked AI one question",
  ],
  exitTicket: [
    "The growth event I chose is …",
  ],
},
14: {
  kind: "prep", cycle: 5,
  goals: [
    "I can combine everything I learned into one outline.",
    "I can set a revision strategy (check list).",
  ],
  bigIdea: "For your final essay, use everything from the whole course: five senses, structure, story mountain, people description, real details. Plan today, and writing day goes smoothly.",
  guidedTasks: [
    { id: "t1", label: "Plan the full outline: beginning → build-up → climax → ending.", hint: "Use the story mountain and mark the climax." },
    { id: "t2", label: "Write your revision strategy: which parts need special attention?", hint: "For example: “more feeling in the ending”, “add action to the climax”" },
    { id: "t3", label: "Use “Improve My Plan” to see three directions and choose one.", hint: "Press “Improve my plan”." },
  ],
  writingTask: "Outline: growth story outline + revision strategy.",
  aiStarter: "My growth-story outline is ready. Ask me two questions about the turning point.",
  parts: [
    { title: "Part A · The Whole-Term Toolbox", kind: "pairs",
      pairs: [
        { label: "Five senses", value: "details with pictures" },
        { label: "Story mountain", value: "ups and downs" },
        { label: "Describing people", value: "lifelike characters" },
        { label: "Real details", value: "believability" },
      ] },
    { title: "Part B · Revision Strategy", kind: "list",
      items: [
        "Write down 2 places you need to check carefully.",
        "Follow this list on writing day.",
      ] },
    { title: "Part C · AI Guidance", kind: "list",
      items: [
        "Ask AI questions to help you look at the turning point.",
        "AI only asks — you choose and write.",
      ] },
  ],
  checklist: [
    "I planned the full outline",
    "I marked the climax",
    "I wrote my revision strategy",
    "I used AI to improve my outline",
  ],
  exitTicket: [
    "My revision strategy is …",
  ],
},
15: {
  kind: "piece", cycle: 5,
  p5: { pieceTitle: "An Unforgettable Moment", pieceTitleEn: "An Unforgettable Moment" },
  p6: { pieceTitle: "My Story of Growing Up", pieceTitleEn: "My Story of Growing Up" },
  goals: [
    "I can write and submit my final formal essay.",
    "I can use the whole-term skills in one complete piece.",
    "I can prepare my work for publication (teacher selection).",
  ],
  bigIdea: "The final essay: use every skill from the course to write your growth story. After you finish, your teacher will select work for publication — your piece could be in the anthology!",
  guidedTasks: [
    { id: "t1", label: "Write your draft from the outline, using the whole-term skills.", hint: "Five senses, story mountain, people, details — all of it applies." },
    { id: "t2", label: "Follow your revision strategy, then ask AI to point out one place to improve.", hint: "Revise yourself first, then ask AI." },
    { id: "t3", label: "Check your title, opening and ending, then submit the final version.", hint: "Your piece will enter your teacher's selection queue." },
  ],
  writingTask: "Essay: complete “An Unforgettable Moment” (P5) / “My Story of Growing Up” (P6).",
  aiStarter: "This is my final piece. Ask me two questions to polish the ending before I submit.",
  parts: [
    { title: "Part A · Write the Draft", kind: "text",
      text: "Follow the outline: beginning → build-up → climax → ending. Use the whole-term toolbox." },
    { title: "Part B · Self-Revision", kind: "pairs",
      pairs: [
        { label: "Structure complete?", value: "opening, body and ending all there" },
        { label: "Details with pictures?", value: "five senses + real details" },
        { label: "Emotion shown?", value: "feelings are concrete" },
      ] },
    { title: "Part C · Publication Prep", kind: "list",
      items: [
        "A clear title.",
        "An inviting opening.",
        "A strong ending.",
        "Your teacher will read this piece to decide on publication.",
      ] },
  ],
  checklist: [
    "I finished the whole essay",
    "I followed my revision strategy",
    "I asked AI to check one place",
    "I submitted my final version",
  ],
  exitTicket: [
    "After finishing this piece, I am most proud of …",
  ],
},
};

const lessonActivities: Record<Lang, Record<number, LessonActivity>> = { zh: lessonActivitiesZh, en: lessonActivitiesEn };
const resolveActivity = (base: LessonActivity, level: "P5" | "P6"): LessonActivity => ({ ...base, ...(level === "P5" ? base.p5 : base.p6) });
const lessonCycleOf = (n: number) => lessonActivities.zh[n]?.cycle ?? 1;
const lessonKindOf = (n: number) => lessonActivities.zh[n]?.kind ?? "prep";
const pieceTitleOf = (activity: LessonActivity, level: "P5" | "P6", lang: Lang) => { const override = level === "P5" ? activity.p5 : activity.p6; return lang === "zh" ? (override?.pieceTitle ?? activity.pieceTitle ?? "") : (override?.pieceTitleEn ?? activity.pieceTitleEn ?? ""); };
const UNIT_PIECE: Record<number, number> = { 1: 3, 2: 6, 3: 9, 4: 12, 5: 15 }; // unit -> its major piece lesson

const defaultDraft = "星期六早上，我在校園後的小花園發現一扇以前沒有見過的門。門上有一枚會發光的葉子，當我伸手觸碰它時，耳邊傳來細小的歌聲。\n\n我不知道門後面是甚麼，但那個聲音好像正在叫我的名字。";
const initialSubmissions = [
  { lesson: 9, id: 1, student: "P5-09", title: "The Door in the Garden", level: "P5", status: "待編輯", body: defaultDraft, category: "Fantasy", order: 1, note: "", confirmed: false },
  { lesson: 12, id: 2, student: "P6-12", title: "A Message from Tomorrow", level: "P6", status: "待導師確認", body: "The message arrived before the day had begun.", category: "Future World", order: 2, note: "保留時間旅行的意念，建議加強結局。", confirmed: true },
  { lesson: 15, id: 3, student: "P5-15", title: "The Cloud Collector", level: "P5", status: "已核准", body: "Mia collected clouds in glass jars.", category: "Fantasy", order: 3, note: "語氣清楚，適合收錄。", confirmed: true },
  { lesson: 12, id: 4, student: "P6-03", title: "The Last Library", level: "P6", status: "待編輯", body: "Every book in the last library remembered its reader.", category: "Mystery", order: 4, note: "" },
  { lesson: 9, id: 5, student: "P5-19", title: "A Small Brave Thing", level: "P5", status: "待導師確認", body: "I was not brave at first, but I opened the box.", category: "Realistic", order: 5, note: "" },
];

const ui: Record<Lang, Record<string, string>> = {
  zh: {
    heroSub: "一個安全、分級、保留原創聲音的寫作空間。學生在這裡學習、修訂及提交，導師則在 Anthology Studio 完成最後整理。",
    badgeP56: "P5 / P6",
    badgeCode: "校內代號",
    studiosTitle: "選擇工作區",
    studioProofNote: "校對、評分、下一步",
    studioCourseNote: "每堂有目標、有作品",
    studioAnthologyNote: "從收稿到出版清單",
    studioAccountNote: "批量生成學生帳號",
    principleTitle: "平台原則",
    principleText: "AI 只會指出方向、錯誤和選擇，不會替學生寫完整作品。",
    headerAccount: "校本帳戶",
    headerDemo: "示範工作區",
    courseH2: "每個單元一篇正式作文",
    courseSub: "五個單元，每單元三堂：兩堂學技巧、融入創作流程，第三堂作文日提交正式作文。每篇作文都可以俾老師篩選出版。",
    savedCount: "已收藏 {n}/15",
    journeyTitle: "Writer’s Journey · 收藏你的創作證據",
    journeyText: "每個單元：頭兩堂完成構思與大綱，第三堂作文日完成正式作文。每一篇都係你嘅創作足跡，亦有機會入選作品集。",
    lessonNum: "第 {n} 課 · {level}",
    pieceBadge: "正式作文",
    prepBadge: "鋪墊任務",
    pieceTitleLabel: "本課作文題目",
    unit1: "課題 1 · 校園描寫",
    unit2: "課題 2 · 難忘經歷",
    unit3: "課題 3 · 人物寫作",
    unit4: "課題 4 · 想像寫作",
    unit5: "課題 5 · 成長與出版",
    toolPromptText: "一個可以改變故事方向的小問題",
    toolVocabText: "5 個可選擇、不可照抄的詞語",
    toolPlannerText: "把想法放在故事結構上",
    outputTitle: "本堂收藏輸出：{label}",
    outputHint: "完成後按「收藏這份作品」，原文會保留在目前工作區。",
    saved: "已收藏",
    stageIdea: "構思", stageOutline: "大綱", stageDraft: "草稿", stageRevision: "自我修訂", stageSubmit: "提交",
    stageVersionsKept: "階段版本會被保留",
    savePiece: "收藏這份作品",
    saveStage: "保存這一階段",
    submitPiece: "提交作品",
    trailTitle: "你的創作足跡正在成形",
    trailLesson: "第 {n} 課",
    checklistBadge: "清單 {done}/{total}",
    panelTitle: "本堂活動 · 對照學生筆記",
    goalsLabel: "學習目標",
    bigIdeaLabel: "大概念",
    quickChecklist: "快速清單",
    exitTitle: "Exit Ticket · 課堂小結",
    exitHint: "把答案寫在下方的工作區，連同本堂作品一起收藏。",
    writingTaskLabel: "本堂寫作任務",
    aiPartnerTitle: "AI 思考夥伴",
    aiPartnerHint: "諗唔到點寫？問 AI 一個具體問題，佢會用問題引導你，唔會代你寫。",
    aiUseStarter: "用本堂提示問題",
    aiAsk: "問 AI",
    aiAsking: "AI 諗緊…",
    aiReminder: "AI 係思考夥伴：佢俾方向，最後嘅句子由你寫。",
    improveTitle: "優化我的構思",
    guidedTitle: "本堂小任務",
    guidedHint: "逐個做，做晒就可以開始寫正式作品。",
    unitGoalTitle: "本單元創作目標",
    unitGoalNow: "呢堂就係正式作文：",
    unitGoalPrep: "第 {lesson} 堂會正式作文：",
    unitGoalTail: "——完成小任務，逐步準備呢篇文。",
    journeyFlowTitle: "創作流程",
    journeyFlowHint: "跟住步驟逐步做，完成一步先做下一步。",
    journeyNext: "下一步",
    stepImprove: "AI 優化構思",
    stepIdeaHint: "諗低故事方向，可以用 AI 思考夥伴傾吓。",
    stepImproveHint: "撳「優化我的構思」，揀一個方向加入你嘅草稿。",
    stepOutlineHint: "將構思排成大綱：開端、問題、轉折、結局。",
    stepDraftHint: "跟住大綱寫初稿，唔使完美，寫咗先。",
    stepRevisionHint: "自檢＋叫 AI 指出文法／錯字，逐句改；完整檢查可以去 Proofreading。",
    stepSubmitHint: "檢查標題同作者名，然後遞交。",
    journeyLocked: "完成「{label}」先可以進入下一步",
    stepPlaceholderIdea: "寫低你嘅故事方向／種子…",
    stepPlaceholderImprove: "喺度整理你揀咗嘅 AI 方向…",
    stepPlaceholderOutline: "排大綱：開端、問題、轉折、結局…",
    stepPlaceholderDraft: "跟住大綱寫初稿…",
    stepPlaceholderRevision: "寫你嘅修訂版…",
    stepPlaceholderSubmit: "寫最終檢查聲明／遞交內容…",
    improveHint: "將你嘅 point 或高低起跌寫喺工作區，AI 會俾三個更好方向你揀，句子仍然由你寫。",
    improveButton: "出更好版本",
    improving: "AI 諗緊…",
    improveObs: "結構觀察：",
    studentFullText: "學生作文全文",
    allLessons: "全部課題",
    demoOption: "示範文章",
    myPiece: "課堂收藏 · 第 {n} 課",
    studioOverviewNote: "班級人數、作品數量同審核進度一眼睇清。",
    overviewH2: "班級總覽",
    overviewSub: "睇清楚每個班別嘅學生、作品同審核進度。",
    ovStudents: "學生總數",
    ovPieces: "作品",
    ovPending: "待審核",
    ovApproved: "已核准",
    ovClassHeader: "班別",
    ovStudentsHeader: "學生人數",
    ovPiecesHeader: "作品",
    ovPendingHeader: "待審核",
    ovApprovedHeader: "已核准",
    ovRecentTitle: "最新提交",
    ovRecentSub: "最近入圍／提交嘅學生作品",
    ovNote: "示範數據：接駁資料庫後自動顯示真實班級同作品統計。",
    proofH2: "看見每一個可修改的地方",
    proofSub: "AI 逐項指出問題，學生自己作最後決定。評分是學習地圖，不是作文的標籤。",
    levelP5: "P5 基礎", levelP6: "P6 發展聲音",
    studentDraftEyebrow: "學生草稿 · {name}",
    titleLabel: "作品標題",
    titlePlaceholder: "輸入作品標題（可自行更改）",
    wordCount: "{n} 字",
    codeOnly: "只使用校內代號，不輸入個人資料",
    saveRevision: "保存修訂版本",
    rubricEyebrow: "{level} 形成性評分",
    rubricCardTitle: "{level} 評分表",
    rubricFootnote: "每項 25 分；分數用來決定下一步，不代表學生能力。",
    rubricIdeas: "構思與創意", rubricStructure: "結構", rubricLanguage: "語言", rubricRevision: "修訂努力",
    rubricIdeasReason: "先完成一個清楚的創作目標。",
    rubricStructureReason: "檢查開端、發展及結尾是否連貫。",
    rubricLanguageReason: "選一兩個句子，檢查文法及詞語。",
    rubricRevisionReason: "完成一次有目的的自我修訂。",
    issueCardTitle: "逐項問題卡",
    issueCardSub: "原句 → 為甚麼 → 小提示 → 你自己的修訂",
    issueFound: "AI 找到 {n} 個可以學習的地方。",
    issueWait: "按完整評估後，AI 會逐項列出可修改的地方。",
    fullEvaluate: "完整評估",
    smallHint: "取得一個小提示",
    evaluating: "正在評估…",
    analyzing: "正在分析…",
    originalLine: "原句：",
    whyLabel: "為甚麼：",
    hintLabel: "小提示：",
    resolved: "已處理",
    pending: "待修訂",
    myRevision: "我的修訂",
    myRevisionPlaceholder: "請自己改寫，不要直接複製 AI 答案。",
    readyTitle: "準備好讓 AI 看看你的下一步嗎？",
    readySub: "AI 只會指出方向；最後的句子由你自己決定。",
    myReflection: "我的修訂反思",
    myReflectionPlaceholder: "例如：我今次學會先檢查動詞時態。",
    saveLearning: "保存我的學習記錄",
    saving: "正在保存…",
    msgVersionSaved: "已保存這一個版本。你可以繼續修改，或交給導師查看。",
    msgEvalSaved: "已保存校對紀錄，包括你的修訂及反思。",
    msgRecordCreated: "已建立並保存第一個作品版本。",
    msgCoachError: "AI 暫時未能回覆，請先使用右側 rubric 或請導師協助。",
    msgEvalError: "評估暫時未能完成，請稍後再試。",
    msgDemoSaved: "示範模式：版本已在目前工作區保存。登入後會同步到校本資料庫。",
    reviewH2: "覆核學生的 AI 校對紀錄",
    reviewSub: "教師可以查看學生自己寫的修訂，調整 rubric 分數及標記問題卡；AI 建議不會自動變成教師評語。",
    queueEmptyTitle: "目前沒有已保存的校對評估",
    queueEmptySub: "學生完成一次評估並保存學習記錄後，作品會出現在這裡。",
    queueTitle: "待覆核作品",
    queueSort: "按最近更新排序",
    reviewed: "已覆核",
    pendingReview: "待覆核",
    rubricReview: "Rubric 及問題卡覆核",
    teacherFinal: "教師決定最終記錄",
    overridePlaceholder: "覆寫分數（留空保留 {n}）",
    studentResolved: "學生已處理",
    needsFollowup: "需要教師跟進",
    studentRevision: "學生修訂：",
    aiHint: "AI 提示：",
    teacherNote: "教師覆核備註",
    teacherNotePlaceholder: "記錄下一堂課要跟進的教學重點……",
    saveTeacherReview: "保存教師覆核",
    loadingEval: "正在載入評估……",
    anthH2: "把學生作品整理成一本書",
    anthSub: "先收稿，再編輯；先讓學生確認，再核准；最後才排序、預覽和交給設計製作。",
    previewToggle: "預覽作品集頁",
    previewClose: "關閉版面預覽",
    officialPdf: "正式 PDF",
    makingPdf: "製作 PDF…",
    exportList: "匯出出版清單",
    statSubmitted: "已收稿",
    statToEdit: "待編輯",
    statToConfirm: "待確認",
    statApproved: "已核准",
    editorNoteLabel: "導師編輯備註：",
    noNote: "尚未加入備註",
    queueCardTitle: "作品收件匣",
    worksCount: "{n} 份作品",
    deskTitle: "編輯及出版資料",
    fieldAuthor: "作者代號",
    fieldTitle: "出版標題",
    fieldCategory: "作品分類",
    fieldStatus: "出版狀態",
    statusToEdit: "待編輯", statusToConfirm: "待導師確認", statusApproved: "已核准", statusRejected: "不收錄",
    fieldEditorNote: "導師／編輯備註",
    editorNotePlaceholder: "記錄保留原創聲音、需要確認的修改或版面提示……",
    editorialChecklist: "編輯檢查清單",
    checkVoice: "作者聲音保留",
    checkTitle: "標題已確認",
    checkLanguage: "語言已校對",
    checkLayout: "適合交付排版",
    markConfirmed: "標記學生已確認",
    confirmed: "學生已確認",
    clearEdit: "清除本次編輯",
    approveAdd: "核准並加入作品集",
    exportHint: "核准後會按照左側排序匯出，交給設計製作 PDF／電子書。",
    anthEmpty: "PDF 匯出失敗，請確認已登入並有已核准作品。",
    accH2: "批量建立學生登入帳號",
    accSub: "教師只需匯入校內代號及班別。系統會生成 username 及一次性初始碼，不會要求學生姓名、電話或電郵。",
    accDemoNote: "目前是示範模式。登入教師帳戶後，才會真正寫入資料庫及生成帳號。",
    accStep1: "1. 貼上 CSV 名單",
    accStep1Hint: "必須包含 schoolCode、classCode；每次最多 40 人。",
    classCode: "班別代碼",
    previewGenerate: "預覽並生成帳號",
    generating: "正在生成…",
    accStep2: "2. 安全交付",
    accStep2Text: "初始碼只會在生成後顯示一次。教師應下載 CSV，透過校方指定方式交給學生，並提醒學生首次登入後更改初始碼。",
    generatedCount: "已生成 {n} 個帳號",
    downloadCredentials: "下載一次性憑證",
    loginTest: "學生登入測試",
    loginTestSub: "學生使用教師交付的 username 及一次性初始碼；首次登入後必須設定新碼。",
    oneTimeCode: "一次性初始碼",
    loggingIn: "登入中…",
    setNewCode: "設定新碼",
    newCodePlaceholder: "至少 8 個字元",
    completeFirstChange: "完成首次改碼",
    updating: "更新中…",
  },
  en: {
    heroSub: "A safe, level-based writing space that keeps each student's original voice. Students learn, revise and submit here; teachers finish the final curation in Anthology Studio.",
    badgeP56: "P5 / P6",
    badgeCode: "School codes only",
    studiosTitle: "Choose a studio",
    studioProofNote: "Proofread, score, decide next steps",
    studioCourseNote: "A goal and a piece of work every lesson",
    studioAnthologyNote: "From submissions to the publishing list",
    studioAccountNote: "Generate student accounts in bulk",
    principleTitle: "Platform principle",
    principleText: "AI points out direction, mistakes and choices. It never writes complete pieces for students.",
    headerAccount: "School account",
    headerDemo: "Demo workspace",
    courseH2: "One formal essay per unit",
    courseSub: "Five units, three lessons each: two lessons of skills and planning, one writing day for a formal essay. Every essay can be selected by the teacher for publication.",
    savedCount: "Saved {n}/15",
    journeyTitle: "Writer's Journey · Save your writing evidence",
    journeyText: "In each unit you finish a formal essay: idea and outline in the first two lessons, the full essay on writing day. Every piece can be selected for the anthology.",
    lessonNum: "Lesson {n} · {level}",
    pieceBadge: "Major piece",
    prepBadge: "Prep task",
    pieceTitleLabel: "This lesson's writing topic",
    unit1: "Unit 1 · My School",
    unit2: "Unit 2 · Memorable Experiences",
    unit3: "Unit 3 · Writing About People",
    unit4: "Unit 4 · Imagination",
    unit5: "Unit 5 · Growth & Publishing",
    toolPromptText: "A small question that can change the direction of a story",
    toolVocabText: "5 words you may choose from but never copy",
    toolPlannerText: "Place your ideas on a story structure",
    outputTitle: "This lesson's collectible output: {label}",
    outputHint: "Press 'Save this piece' when you finish; the original stays in your current workspace.",
    saved: "Saved",
    stageIdea: "Idea", stageOutline: "Outline", stageDraft: "Draft", stageRevision: "Revision", stageSubmit: "Submit",
    stageVersionsKept: "Stage versions are kept",
    savePiece: "Save this piece",
    saveStage: "Save this stage",
    submitPiece: "Submit piece",
    trailTitle: "Your writing trail is taking shape",
    trailLesson: "Lesson {n}",
    checklistBadge: "Checklist {done}/{total}",
    panelTitle: "This lesson's activity · Matches your student notes",
    goalsLabel: "Learning goals",
    bigIdeaLabel: "Big idea",
    quickChecklist: "Quick checklist",
    exitTitle: "Exit Ticket · End-of-lesson summary",
    exitHint: "Write your answers in the workspace below and save them together with this lesson's piece.",
    writingTaskLabel: "This lesson's writing task",
    aiPartnerTitle: "AI thinking partner",
    aiPartnerHint: "Stuck on your writing? Ask AI one specific question — it guides you with questions, never writes for you.",
    aiUseStarter: "Use this lesson's starter",
    aiAsk: "Ask AI",
    aiAsking: "AI is thinking…",
    aiReminder: "AI is a thinking partner: it points directions; the final sentences are yours.",
    improveTitle: "Improve my plan",
    guidedTitle: "This lesson's mini-tasks",
    guidedHint: "Work through them one by one, then start your major piece.",
    unitGoalTitle: "This unit's writing goal",
    unitGoalNow: "This is the major piece lesson:",
    unitGoalPrep: "Lesson {lesson} is the major piece:",
    unitGoalTail: " — complete the mini-tasks to build toward it.",
    journeyFlowTitle: "Writing journey",
    journeyFlowHint: "Work step by step; finish one step before the next.",
    journeyNext: "Next step",
    stepImprove: "AI improve",
    stepIdeaHint: "Think about your direction — you may chat with the AI partner.",
    stepImproveHint: "Tap “Improve my plan” and add one direction to your draft.",
    stepOutlineHint: "Shape your plan: beginning, problem, twist, ending.",
    stepDraftHint: "Follow your outline and write the first draft; it need not be perfect.",
    stepRevisionHint: "Self-check + ask AI to point out grammar and spelling; fix one sentence at a time, or use Proofreading for a full check.",
    stepSubmitHint: "Check the title and author name, then submit.",
    journeyLocked: "Finish \u201c{label}\u201d to unlock the next step",
    stepPlaceholderIdea: "Write your story direction / seed\u2026",
    stepPlaceholderImprove: "Tidy the AI direction you chose here\u2026",
    stepPlaceholderOutline: "Plan: beginning, problem, twist, ending\u2026",
    stepPlaceholderDraft: "Write your first draft from the outline\u2026",
    stepPlaceholderRevision: "Write your revised version\u2026",
    stepPlaceholderSubmit: "Write your final check / submission\u2026",
    improveHint: "Write your point or story-mountain plan in the workspace; AI will offer three better directions to choose from. You still write every sentence.",
    improveButton: "Better versions",
    improving: "AI is thinking…",
    improveObs: "Structure note: ",
    studentFullText: "Student's full text",
    allLessons: "All units",
    demoOption: "Demo piece",
    myPiece: "Lesson {n} saved piece",
    studioOverviewNote: "Class sizes, piece counts and review progress at a glance.",
    overviewH2: "Class Overview",
    overviewSub: "See students, pieces and review progress for every class.",
    ovStudents: "Total students",
    ovPieces: "Pieces",
    ovPending: "Awaiting review",
    ovApproved: "Approved",
    ovClassHeader: "Class",
    ovStudentsHeader: "Students",
    ovPiecesHeader: "Pieces",
    ovPendingHeader: "Awaiting",
    ovApprovedHeader: "Approved",
    ovRecentTitle: "Recent submissions",
    ovRecentSub: "Latest pieces submitted or shortlisted",
    ovNote: "Demo figures: once the database is connected, real class and piece statistics appear automatically.",
    proofH2: "See every place you can improve",
    proofSub: "AI points out problems one by one; students make the final call. Scores are a learning map, not a label on your writing.",
    levelP5: "P5 Foundation", levelP6: "P6 Developing Voice",
    studentDraftEyebrow: "Student draft · {name}",
    titleLabel: "Piece title",
    titlePlaceholder: "Enter a title for your piece (you can change it)",
    wordCount: "{n} words",
    codeOnly: "Use only your school code. No personal details.",
    saveRevision: "Save revision version",
    rubricEyebrow: "{level} formative rubric",
    rubricCardTitle: "{level} Rubric",
    rubricFootnote: "Each item is 25 points; scores decide the next step, not the student's ability.",
    rubricIdeas: "Ideas & Creativity", rubricStructure: "Structure", rubricLanguage: "Language", rubricRevision: "Revision Effort",
    rubricIdeasReason: "Start with one clear creative goal.",
    rubricStructureReason: "Check whether the beginning, middle and ending connect.",
    rubricLanguageReason: "Pick one or two sentences and check grammar and word choice.",
    rubricRevisionReason: "Complete one purposeful self-revision.",
    issueCardTitle: "Issue cards",
    issueCardSub: "Original line → Why → Hint → Your own revision",
    issueFound: "AI found {n} places you can learn from.",
    issueWait: "After a full evaluation, AI lists the places you can improve one by one.",
    fullEvaluate: "Full evaluation",
    smallHint: "Get one small hint",
    evaluating: "Evaluating…",
    analyzing: "Analyzing…",
    originalLine: "Original: ",
    whyLabel: "Why: ",
    hintLabel: "Hint: ",
    resolved: "Resolved",
    pending: "To revise",
    myRevision: "My revision",
    myRevisionPlaceholder: "Rewrite it yourself — do not copy AI's answer.",
    readyTitle: "Ready to let AI look at your next step?",
    readySub: "AI only points out directions; the final sentences are yours.",
    myReflection: "My revision reflection",
    myReflectionPlaceholder: "e.g. Today I learned to check verb tenses first.",
    saveLearning: "Save my learning record",
    saving: "Saving…",
    msgVersionSaved: "This version has been saved. You can keep revising, or hand it to your teacher.",
    msgEvalSaved: "Your proofreading record has been saved, including your revisions and reflection.",
    msgRecordCreated: "Your first writing version has been created and saved.",
    msgCoachError: "AI cannot reply right now. Please use the rubric on the right or ask your teacher.",
    msgEvalError: "The evaluation is not ready yet. Please try again later.",
    msgDemoSaved: "Demo mode: your version is saved in the current workspace. After logging in, it will sync to the school database.",
    reviewH2: "Review students' AI proofreading records",
    reviewSub: "Teachers can view each student's own revisions, adjust rubric scores and mark issue cards; AI suggestions never become teacher comments automatically.",
    queueEmptyTitle: "No saved proofreading evaluations yet",
    queueEmptySub: "After a student completes an evaluation and saves their learning record, the piece appears here.",
    queueTitle: "Works to review",
    queueSort: "Sorted by most recent",
    reviewed: "Reviewed",
    pendingReview: "Pending",
    rubricReview: "Rubric and issue-card review",
    teacherFinal: "Teacher decides the final record",
    overridePlaceholder: "Override score (leave blank to keep {n})",
    studentResolved: "Student resolved",
    needsFollowup: "Needs teacher follow-up",
    studentRevision: "Student revision: ",
    aiHint: "AI hint: ",
    teacherNote: "Teacher review note",
    teacherNotePlaceholder: "Note what to follow up in the next lesson…",
    saveTeacherReview: "Save teacher review",
    loadingEval: "Loading evaluation…",
    anthH2: "Turn students' work into a book",
    anthSub: "Collect first, then edit; let students confirm, then approve; finally order, preview and hand over for design.",
    previewToggle: "Preview anthology page",
    previewClose: "Close preview",
    officialPdf: "Official PDF",
    makingPdf: "Making PDF…",
    exportList: "Export publishing list",
    statSubmitted: "Submitted",
    statToEdit: "To edit",
    statToConfirm: "To confirm",
    statApproved: "Approved",
    editorNoteLabel: "Teacher's editorial note: ",
    noNote: "No note yet",
    queueCardTitle: "Submission queue",
    worksCount: "{n} works",
    deskTitle: "Editorial desk",
    fieldAuthor: "Author code",
    fieldTitle: "Publication title",
    fieldCategory: "Category",
    fieldStatus: "Publishing status",
    statusToEdit: "To edit", statusToConfirm: "To confirm", statusApproved: "Approved", statusRejected: "Not included",
    fieldEditorNote: "Teacher/editor note",
    editorNotePlaceholder: "Record preserved original voice, changes to confirm or layout notes…",
    editorialChecklist: "Editorial checklist",
    checkVoice: "Author voice kept",
    checkTitle: "Title confirmed",
    checkLanguage: "Language proofread",
    checkLayout: "Ready for layout",
    markConfirmed: "Mark student confirmed",
    confirmed: "Student confirmed",
    clearEdit: "Clear this edit",
    approveAdd: "Approve and add to anthology",
    exportHint: "After approval, works export in the left-side order for design to produce the PDF/e-book.",
    anthEmpty: "PDF export failed. Please check that you are logged in and have approved works.",
    accH2: "Create student login accounts in bulk",
    accSub: "Teachers only import school codes and class codes. The system generates usernames and one-time initial codes — no student names, phone numbers or emails.",
    accDemoNote: "This is demo mode. After logging in as a teacher, accounts will really be written to the database.",
    accStep1: "1. Paste the CSV list",
    accStep1Hint: "Must include schoolCode and classCode; up to 40 students per batch.",
    classCode: "Class code",
    previewGenerate: "Preview and generate accounts",
    generating: "Generating…",
    accStep2: "2. Safe delivery",
    accStep2Text: "Initial codes are shown only once after generation. Teachers should download the CSV and hand it to students through the school's approved channel, and remind students to change their code after first login.",
    generatedCount: "Generated {n} accounts",
    downloadCredentials: "Download one-time credentials",
    loginTest: "Student login test",
    loginTestSub: "Students use the username and one-time initial code given by their teacher; after first login they must set a new code.",
    oneTimeCode: "One-time initial code",
    loggingIn: "Logging in…",
    setNewCode: "Set a new code",
    newCodePlaceholder: "At least 8 characters",
    completeFirstChange: "Complete first code change",
    updating: "Updating…",
  },
};
const t = (lang: Lang, key: string, vars?: Record<string, string | number>): string => {
  let text = ui[lang][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
};
const statusText = (lang: Lang, status: string): string => {
  const map: Record<string, Record<Lang, string>> = {
    "待編輯": { zh: "待編輯", en: "To edit" },
    "待導師確認": { zh: "待導師確認", en: "To confirm" },
    "已核准": { zh: "已核准", en: "Approved" },
    "不收錄": { zh: "不收錄", en: "Not included" },
  };
  return map[status]?.[lang] ?? status;
};
const rubricLabelText = (lang: Lang, label: string): string => {
  const map: Record<string, Record<Lang, string>> = {
    "Ideas & Creativity": { zh: "構思與創意", en: "Ideas & Creativity" },
    "Structure": { zh: "結構", en: "Structure" },
    "Language": { zh: "語言", en: "Language" },
    "Revision Effort": { zh: "修訂努力", en: "Revision Effort" },
  };
  return map[label]?.[lang] ?? label;
};

function redact(text: string) { return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[電郵已隱去]").replace(/(?:\+?852[ -]?)?\d{4}[ -]?\d{4}/g, "[電話已隱去]"); }

export default function Home() {
  const { user } = useAuth();
  const mode = window.location.pathname === "/student" ? "student" : window.location.pathname === "/teacher" ? "teacher" : "demo";
  const [studio, setStudio] = useState<Studio>(() => { const requested = new URLSearchParams(window.location.search).get("studio") as Studio | null; if (mode === "student") return requested === "course" ? "course" : "proofreading"; return requested && ["proofreading", "course", "anthology", "accounts", "overview"].includes(requested) ? requested : mode === "teacher" ? "overview" : "proofreading"; });
  const [level, setLevel] = useState<"P5" | "P6">("P5");
  const [lang, setLang] = useState<Lang>("zh");
  const [draft, setDraft] = useState(defaultDraft);
  const [selectedLesson, setSelectedLesson] = useState(1);
  const [stage, setStage] = useState<Stage>("draft");
  const [journeyOutputs, setJourneyOutputs] = useState<Record<number, string>>({});
  const [coachMode, setCoachMode] = useState<"proofread" | "structure" | "language">("proofread");
  const [coachResult, setCoachResult] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState(1);
  const [feedback, setFeedback] = useState("");
  const coach = trpc.writingCoach.suggest.useMutation({ onSuccess: (result) => { setCoachResult(result.suggestion); setCoachError(null); }, onError: () => setCoachError(t(lang, "msgCoachError")) });
  const evaluation = trpc.writingCoach.evaluate.useMutation({ onError: () => setCoachError(t(lang, "msgEvalError")) });
  const createWriting = trpc.writing.create.useMutation();
  const [writingId, setWritingId] = useState<number | null>(null);
  const saveVersion = trpc.writing.saveVersion.useMutation({ onSuccess: () => setCoachResult(t(lang, "msgVersionSaved")) });
  const saveEvaluation = trpc.writingEvaluation.save.useMutation({ onSuccess: () => setCoachResult(t(lang, "msgEvalSaved")) });
  const activeSubmission = submissions.find((item) => item.id === selectedSubmission) ?? submissions[0];
  const wordCount = useMemo(() => draft.trim() ? draft.trim().split(/\s+/).length : 0, [draft]);
  const score = Math.min(100, Math.max(45, 55 + Math.min(20, Math.floor(wordCount / 4)) + (draft.includes("，") ? 8 : 0) + (draft.includes("。") ? 7 : 0)));

  const askCoach = () => { setCoachResult(null); setCoachError(null); coach.mutate({ mode: coachMode, draft: redact(draft), level }); };
  const saveStudentVersion = (nextStage: Stage = stage) => {
    if (!user) { setCoachResult(t(lang, "msgDemoSaved")); return; }
    if (writingId) { saveVersion.mutate({ writingId, stage: nextStage, body: redact(draft), studentNote: lang === "zh" ? `學生在 ${nextStage} 階段保存` : `Student saved at ${nextStage} stage` }); }
    else { createWriting.mutate({ assignmentId: selectedLesson, title: lessons[lang][selectedLesson - 1][0], body: redact(draft), stage: nextStage }, { onSuccess: (result) => { setWritingId(result.writingId); setCoachResult(t(lang, "msgRecordCreated")); } }); }
  };
  const updateSubmission = (id: number, patch: Partial<typeof submissions[number]>) => setSubmissions((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const moveSubmission = (direction: -1 | 1) => setSubmissions((items) => { const index = items.findIndex((item) => item.id === selectedSubmission); const next = index + direction; if (index < 0 || next < 0 || next >= items.length) return items; const copy = [...items]; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy.map((item, idx) => ({ ...item, order: idx + 1 })); });
  const exportAnthology = () => { const rows = [["order", "authorCode", "title", "level", "category", "status", "editorNote"], ...submissions.map((item) => [String(item.order), item.student, item.title, item.level, item.category, item.status, item.note])]; const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "storyseed-anthology-content.csv"; link.click(); URL.revokeObjectURL(url); };

  return <div className="min-h-screen bg-[#f7f8f4] text-[#24332f]"><Header studio={studio} setStudio={setStudio} user={user} mode={mode} lang={lang} setLang={setLang} />
    <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-10">
      <section className="rounded-[30px] bg-[#dcebe3] px-6 py-8 md:px-10"><p className="eyebrow text-[#3b6b59]">Chung Sing School · StorySeed Studio</p><div className="mt-3 flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-[#1e3b31] md:text-5xl">{lang === "zh" ? <>讓每一份作品，<br /><span className="text-[#b17235]">由草稿走到作品集。</span></> : <>Let every piece move<br /><span className="text-[#b17235]">from draft to anthology.</span></>}</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#49665a]">{t(lang, "heroSub")}</p></div><div className="flex flex-wrap gap-2"><Badge className="rounded-full bg-white/70 px-4 py-2 text-[#416254]">{t(lang, "badgeP56")}</Badge><Badge className="rounded-full bg-white/70 px-4 py-2 text-[#416254]"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" />{t(lang, "badgeCode")}</Badge></div></div></section>
      <div className="mt-7 grid gap-7 xl:grid-cols-[260px_minmax(0,1fr)]"><aside><p className="eyebrow">Three studios</p><h2 className="mt-1 text-xl font-semibold">{t(lang, "studiosTitle")}</h2><div className="mt-4 space-y-2">{([["overview", "Class Overview", "studioOverviewNote", GraduationCap], ["proofreading", "Proofreading Studio", "studioProofNote", SearchCheck], ["course", "15-Lesson Course", "studioCourseNote", BookOpen], ["anthology", "Anthology Studio", "studioAnthologyNote", LayoutTemplate], ["accounts", "Account Desk", "studioAccountNote", Users]] as const).filter(([id]) => mode !== "student" || id === "proofreading" || id === "course").map(([id, title, noteKey, Icon]) => <button key={id} onClick={() => setStudio(id)} className={`w-full rounded-2xl p-4 text-left transition ${studio === id ? "bg-[#243f38] text-white shadow-[0_14px_30px_rgba(36,63,56,.18)]" : "bg-white text-[#31473e] hover:bg-[#edf5ef]"}`}><div className="flex items-start gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${studio === id ? "bg-[#f0c96a] text-[#354a3e]" : "bg-[#e4f0e7] text-[#4d8063]"}`}><Icon className="h-4 w-4" /></div><div><p className="text-sm font-semibold">{title}</p><p className={`mt-1 text-xs leading-5 ${studio === id ? "text-[#c4d9ce]" : "text-[#89968f]"}`}>{t(lang, noteKey)}</p></div></div></button>)}</div><div className="mt-5 rounded-2xl border border-dashed border-[#bed6c7] bg-[#edf6ef] p-4"><p className="text-xs font-semibold text-[#37634d]">{t(lang, "principleTitle")}</p><p className="mt-2 text-xs leading-5 text-[#628071]">{t(lang, "principleText")}</p></div></aside>
        <section>{studio === "overview" && <TeacherOverviewView lang={lang} />}{studio === "proofreading" && (mode === "teacher" ? <ProofreadingReviewView lang={lang} /> : <ProofreadingView lang={lang} level={level} setLevel={setLevel} draft={draft} setDraft={setDraft} score={score} wordCount={wordCount} evaluation={evaluation} coachMode={coachMode} setCoachMode={setCoachMode} askCoach={askCoach} coach={coach} coachResult={coachResult} coachError={coachError} saveStudentVersion={saveStudentVersion} writingId={writingId} saveEvaluation={saveEvaluation} journeyOutputs={journeyOutputs} />)}
          {studio === "course" && <CourseView key={selectedLesson + "-" + level} lang={lang} level={level} setLevel={setLevel} selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson} stage={stage} setStage={setStage} draft={draft} setDraft={setDraft} saveStudentVersion={saveStudentVersion} journeyOutputs={journeyOutputs} setJourneyOutputs={setJourneyOutputs} />}
          {studio === "anthology" && <AnthologyView lang={lang} user={user} submissions={submissions} active={activeSubmission} selectedId={selectedSubmission} setSelectedId={setSelectedSubmission} updateSubmission={updateSubmission} moveSubmission={moveSubmission} feedback={feedback} setFeedback={setFeedback} exportAnthology={exportAnthology} />}{studio === "accounts" && <AccountImportView lang={lang} user={user} />}
        </section></div>
    </main></div>;
}

function Header({ studio, setStudio, user, mode, lang, setLang }: { studio: Studio; setStudio: (studio: Studio) => void; user: unknown; mode: "demo" | "student" | "teacher"; lang: Lang; setLang: (lang: Lang) => void }) { return <header className="border-b border-[#e8ece7] bg-[#f7f8f4]/90 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-10"><div className="flex min-w-0 items-center"><img src="/logo_with_black_charity_info.png" alt="榮邦教育 Advanced Comet Education Limited" className="h-14 w-auto max-w-[180px] object-contain object-left sm:h-16 sm:max-w-[220px]" /></div><nav className="hidden rounded-full bg-white p-1 shadow-sm md:flex">{([["overview", "總覽", "Overview"], ["proofreading", "校對", "Proofreading"], ["course", "15 課", "15 Lessons"], ["anthology", "作品集", "Anthology"], ["accounts", "帳號", "Accounts"]] as const).filter(([id]) => mode !== "student" || id === "proofreading" || id === "course").map(([id, zhLabel, enLabel]) => <button key={id} onClick={() => setStudio(id)} className={`rounded-full px-4 py-2 text-xs font-semibold ${studio === id ? "bg-[#243f38] text-white" : "text-[#77877f]"}`}>{lang === "zh" ? zhLabel : enLabel}</button>)}</nav><div className="flex items-center gap-3"><button onClick={() => setLang(lang === "zh" ? "en" : "zh")} className="rounded-full border border-[#d5e2da] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f6b55] hover:bg-[#edf5ef]" aria-label="Switch language">{lang === "zh" ? "EN" : "繁中"}</button><div className="hidden text-right sm:block"><p className="text-xs font-semibold text-[#385449]">{user ? t(lang, "headerAccount") : t(lang, "headerDemo")}</p><p className="text-[11px] text-[#8a9791]">Chung Sing School</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4c58b] text-xs font-bold text-[#6c5429]">07</div></div></div></header>; }

function ProofreadingView({ lang, level, setLevel, draft, setDraft, wordCount, evaluation, coachMode, setCoachMode, askCoach, coach, coachResult, coachError, saveStudentVersion, writingId, saveEvaluation, journeyOutputs }: { lang: Lang } & Record<string, any>) {
  const [selectedPiece, setSelectedPiece] = useState(0);
  const [pieceTitle, setPieceTitle] = useState("");
  const pickPiece = (n: number) => { setSelectedPiece(n); setDraft(n === 0 ? defaultDraft : journeyOutputs[n] ?? defaultDraft); setPieceTitle(n === 0 ? "" : lessons[lang][n - 1][0]); };
  const [studentRevisions, setStudentRevisions] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [reflection, setReflection] = useState("");
  const savedEvaluation = trpc.writingEvaluation.get.useQuery({ writingId: writingId ?? 0 }, { enabled: Boolean(writingId) });
  const data = evaluation.data ?? savedEvaluation.data;
  const cards = data?.issues ?? [];
  const saveProofreadingRecord = () => {
    if (!writingId) { saveStudentVersion("revision"); return; }
    saveEvaluation.mutate({ writingId, level, evaluation: data ?? {}, studentRevisions, statuses: Object.fromEntries(cards.map((issue: any) => [issue.id, resolved[issue.id] ? "resolved" : issue.status ?? "pending"])), reflection });
  };
  const rubricRows = data?.rubric ?? [
    { key: "ideasVoice", label: "Ideas & Creativity", score: 15, reason: t(lang, "rubricIdeasReason") },
    { key: "structure", label: "Structure", score: 15, reason: t(lang, "rubricStructureReason") },
    { key: "language", label: "Language", score: 15, reason: t(lang, "rubricLanguageReason") },
    { key: "revision", label: "Revision Effort", score: 15, reason: t(lang, "rubricRevisionReason") },
  ];
  const total = rubricRows.reduce((sum: number, item: any) => sum + item.score, 0);
  const levelName = level === "P5" ? t(lang, "levelP5") : t(lang, "levelP6");
  return <div><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">Function 01 · Proofreading Studio</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{t(lang, "proofH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "proofSub")}</p></div><div className="flex rounded-full bg-white p-1 shadow-sm"><button onClick={() => setLevel("P5")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P5" ? "bg-[#243f38] text-white" : "text-[#7a8982]"}`}>P5</button><button onClick={() => setLevel("P6")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P6" ? "bg-[#243f38] text-white" : "text-[#7a8982]"}`}>P6</button></div></div><div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">{t(lang, "studentDraftEyebrow", { name: levelName })}</p><select value={selectedPiece} onChange={(e) => pickPiece(Number(e.target.value))} className="mt-1.5 block w-full rounded-full border border-[#d8e4dc] bg-[#f7faf6] px-3 py-1.5 text-[11px] font-semibold text-[#47705d]">{Object.entries(journeyOutputs).filter(([, v]) => Boolean(v)).map(([n]) => <option key={n} value={n}>{t(lang, "myPiece", { n })}</option>)}<option value={0}>{t(lang, "demoOption")}</option></select><label className="mt-2 block"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a67b36]">{t(lang, "titleLabel")}</span><input value={pieceTitle} onChange={(e) => setPieceTitle(e.target.value)} placeholder={t(lang, "titlePlaceholder")} className="mt-1 block w-full rounded-xl border border-[#e0e8df] bg-[#fbfcf8] px-3 py-2 text-base font-semibold text-[#31473e] focus:outline-none focus:ring-2 focus:ring-[#b9d4c1]" /></label></div><Badge className="rounded-full bg-[#e4f1e8] text-[#4d8063]">{t(lang, "wordCount", { n: wordCount })}</Badge></div></CardHeader><CardContent><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[285px] resize-none rounded-2xl border-[#e4eade] bg-[#fbfcf8] p-5 text-[15px] leading-7 text-[#33473e] shadow-none" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-1.5 text-xs text-[#87948e]"><LockKeyhole className="h-3.5 w-3.5" />{t(lang, "codeOnly")}</p><Button onClick={() => saveStudentVersion("revision")} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><Check className="mr-2 h-4 w-4" />{t(lang, "saveRevision")}</Button></div></CardContent></Card><div className="space-y-5"><Card className="border-0 bg-[#243f38] text-white shadow-[0_15px_45px_rgba(36,63,56,.14)]"><CardContent className="p-5"><p className="eyebrow text-[#b7d8c8]">{t(lang, "rubricEyebrow", { level })}</p><div className="mt-2 flex items-end justify-between"><p className="text-5xl font-semibold tracking-[-.06em]">{total}<span className="text-xl text-[#b7d8c8]">/100</span></p><Star className="h-7 w-7 text-[#f0c96a]" /></div><p className="mt-3 text-xs leading-5 text-[#c5d7d0]">{t(lang, "rubricFootnote")}</p></CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="pb-2"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-[#4e8063]" /><CardTitle className="text-base">{t(lang, "rubricCardTitle", { level })}</CardTitle></div></CardHeader><CardContent className="space-y-4">{rubricRows.map((item: any) => <div key={item.key}><div className="flex justify-between text-xs"><span className="font-semibold text-[#40564b]">{rubricLabelText(lang, item.label)}</span><span className="text-[#6b9278]">{item.score}/25</span></div><div className="mt-1.5 h-1.5 rounded-full bg-[#edf1eb]"><div className="h-1.5 rounded-full bg-[#7db18a]" style={{ width: `${item.score * 4}%` }} /></div><p className="mt-1 text-[11px] leading-4 text-[#89968f]">{item.reason}</p></div>)}</CardContent></Card></div></div><Card className="mt-6 border-0 bg-[#fffdf8] shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="border-b border-[#f0ead9] bg-[#fff8e8] pb-4"><div className="flex items-center gap-2"><WandSparkles className="h-4 w-4 text-[#c18a32]" /><div><CardTitle className="text-base">{t(lang, "issueCardTitle")}</CardTitle><p className="mt-0.5 text-xs text-[#8f7b48]">{t(lang, "issueCardSub")}</p></div></div></CardHeader><CardContent className="p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#6b7168]">{cards.length ? t(lang, "issueFound", { n: cards.length }) : t(lang, "issueWait")}</p><div className="flex flex-wrap gap-2"><Button onClick={() => evaluation.mutate({ draft: redact(draft), level })} disabled={evaluation.isPending} className="rounded-full bg-[#243f38] text-white">{evaluation.isPending ? t(lang, "evaluating") : t(lang, "fullEvaluate")}<ClipboardCheck className="ml-2 h-4 w-4" /></Button><Button onClick={askCoach} disabled={coach.isPending} variant="outline" className="rounded-full border-[#d8dec7] text-[#806a38]">{coach.isPending ? t(lang, "analyzing") : t(lang, "smallHint")}<MessageCircle className="ml-2 h-4 w-4" /></Button></div></div>{cards.length ? <div className="space-y-4">{cards.map((issue: any, index: number) => <Card key={issue.id ?? index} className={`border bg-white shadow-none ${(resolved[issue.id] ?? issue.status === "resolved") ? "border-[#b9d8c2] bg-[#f5fbf6]" : "border-[#eee5d9]"}`}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3e2bd] text-xs font-bold text-[#8a6a35]">{index + 1}</span><Badge variant="outline" className="rounded-full border-[#e5c8bc] text-[10px]">{issue.category}</Badge></div><p className="mt-3 text-sm font-semibold text-[#4c514a]">{t(lang, "originalLine")}<span className="rounded bg-[#fff0e8] px-1 text-[#955b43]">{issue.fragment}</span></p><p className="mt-2 text-sm leading-6 text-[#6c746c]"><strong>{t(lang, "whyLabel")}</strong>{issue.explanation}</p><p className="mt-2 rounded-xl bg-[#edf6ef] p-3 text-xs leading-5 text-[#557261]"><strong>{t(lang, "hintLabel")}</strong>{issue.hint}</p></div><button onClick={() => setResolved((prev) => ({ ...prev, [issue.id]: !prev[issue.id] }))} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${(resolved[issue.id] ?? issue.status === "resolved") ? "bg-[#cfe8d5] text-[#37634d]" : "bg-[#f3f5f0] text-[#718079]"}`}>{(resolved[issue.id] ?? issue.status === "resolved") ? t(lang, "resolved") : t(lang, "pending")}</button></div><label className="mt-4 block text-xs font-semibold text-[#60756a]">{t(lang, "myRevision")}<textarea value={studentRevisions[issue.id] ?? issue.studentRevision ?? ""} onChange={(e) => setStudentRevisions((prev) => ({ ...prev, [issue.id]: e.target.value }))} placeholder={t(lang, "myRevisionPlaceholder")} className="field mt-1.5 min-h-[72px] w-full resize-y" /></label></CardContent></Card>)}</div> : <div className="rounded-2xl border border-dashed border-[#ded8c7] bg-white p-6 text-center"><p className="text-sm font-semibold text-[#5c625b]">{t(lang, "readyTitle")}</p><p className="mt-2 text-xs leading-5 text-[#8e9188]">{t(lang, "readySub")}</p></div>}<div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end"><label className="block text-xs font-semibold text-[#60756a]">{t(lang, "myReflection")}<textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={t(lang, "myReflectionPlaceholder")} className="field mt-1.5 min-h-[76px] w-full resize-y" /></label><Button onClick={saveProofreadingRecord} disabled={saveEvaluation.isPending} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]">{saveEvaluation.isPending ? t(lang, "saving") : t(lang, "saveLearning")}</Button></div>{coachResult && <p className="mt-4 rounded-xl bg-[#f4f1e5] p-3 text-xs leading-5 text-[#6d613f]">{coachResult}</p>}{coachError && <p className="mt-3 rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{coachError}</p>}</CardContent></Card></div>;
}
function ProofreadingReviewView({ lang }: { lang: Lang }) {
  const queue = trpc.writingEvaluation.queue.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = selectedId ?? queue.data?.[0]?.writingId ?? 0;
  const detail = trpc.writingEvaluation.get.useQuery({ writingId: activeId }, { enabled: Boolean(activeId) });
  const review = trpc.writingEvaluation.teacherReview.useMutation({ onSuccess: () => { queue.refetch(); detail.refetch(); } });
  const [teacherNote, setTeacherNote] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, "pending" | "resolved" | "needs_teacher_review">>({});
  const current = detail.data as any;
  const saveReview = () => {
    if (!activeId) return;
    review.mutate({ writingId: activeId, teacherNote, rubricOverrides: Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== "").map(([key, value]) => [key, Number(value)])), issueStatuses: statuses });
  };
  return <div><div className="mb-5"><p className="eyebrow">Teacher tools · Proofreading Review</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "reviewH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "reviewSub")}</p></div>{!queue.data?.length ? <Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardContent className="p-8 text-center"><p className="font-semibold text-[#4c6257]">{t(lang, "queueEmptyTitle")}</p><p className="mt-2 text-sm text-[#8a9891]">{t(lang, "queueEmptySub")}</p></CardContent></Card> : <div className="grid gap-5 lg:grid-cols-[280px_1fr]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><CardTitle className="text-lg">{t(lang, "queueTitle")}</CardTitle><p className="text-xs text-[#8a9891]">{t(lang, "queueSort")}</p></CardHeader><CardContent className="space-y-2">{queue.data.map((item: any) => <button key={item.writingId} onClick={() => { setSelectedId(item.writingId); setTeacherNote(item.teacherNote ?? ""); }} className={`w-full rounded-xl p-3 text-left ${activeId === item.writingId ? "bg-[#edf6ef] ring-1 ring-[#b9d4c1]" : "hover:bg-[#f7faf6]"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-[#385449]">作品 #{item.writingId}</span><Badge variant="outline" className="rounded-full text-[10px]">{item.level}</Badge></div><p className="mt-1 text-[11px] text-[#8a9891]">{item.reviewedAt ? t(lang, "reviewed") : t(lang, "pendingReview")}</p></button>)}</CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Writing #{activeId}</p><CardTitle className="mt-1 text-lg">{t(lang, "rubricReview")}</CardTitle></div><Badge className="rounded-full bg-[#fff4d9] text-[#856a36]">{t(lang, "teacherFinal")}</Badge></div></CardHeader><CardContent>{current ? <>{current.body ? <div className="mb-4 rounded-2xl bg-[#fbfcf8] p-4"><p className="eyebrow">{t(lang, "studentFullText")}</p><p className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-[#40564b]">{current.body}</p></div> : null}<div className="grid gap-3 md:grid-cols-2">{current.rubric.map((row: any) => <div key={row.key} className="rounded-xl bg-[#f7faf6] p-3"><div className="flex items-center justify-between text-xs font-semibold text-[#49665a]"><span>{rubricLabelText(lang, row.label)}</span><span>{row.score}/25</span></div><input value={overrides[row.key] ?? ""} onChange={(e) => setOverrides((previous) => ({ ...previous, [row.key]: e.target.value }))} placeholder={t(lang, "overridePlaceholder", { n: row.score })} inputMode="numeric" className="field mt-2 bg-white text-xs" /><p className="mt-2 text-[11px] leading-4 text-[#89968f]">{row.reason}</p></div>)}</div><div className="mt-5 space-y-3">{current.issues.map((issue: any) => <div key={issue.id} className="rounded-xl border border-[#eee5d9] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-[#5b665e]">{issue.fragment}</p><select value={statuses[issue.id] ?? issue.status ?? "pending"} onChange={(e) => setStatuses((previous) => ({ ...previous, [issue.id]: e.target.value as any }))} className="field w-auto py-1 text-[11px]"><option value="pending">{t(lang, "pending")}</option><option value="resolved">{t(lang, "studentResolved")}</option><option value="needs_teacher_review">{t(lang, "needsFollowup")}</option></select></div><p className="mt-2 text-xs leading-5 text-[#718179]">{t(lang, "studentRevision")}{issue.studentRevision || "尚未填寫"}</p><p className="mt-1 text-[11px] text-[#9a8e79]">{t(lang, "aiHint")}{issue.hint}</p></div>)}</div><label className="mt-5 block text-xs font-semibold text-[#60756a]">{t(lang, "teacherNote")}<textarea value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)} placeholder={t(lang, "teacherNotePlaceholder")} className="field mt-1.5 min-h-[90px] w-full resize-y" /></label><div className="mt-4 flex justify-end"><Button onClick={saveReview} disabled={review.isPending} className="rounded-full bg-[#243f38] text-white">{review.isPending ? t(lang, "saving") : t(lang, "saveTeacherReview")}<Check className="ml-2 h-4 w-4" /></Button></div></> : <p className="text-sm text-[#8a9891]">{t(lang, "loadingEval")}</p>}</CardContent></Card></div>}</div>;
}
function GuidedTasksPanel({ lang, lesson, tasks, answers, onAnswer }: { lang: Lang; lesson: number; tasks: GuidedTask[]; answers: Record<string, string>; onAnswer: (id: string, value: string) => void }) {
  const keyOf = (id: string) => `${lesson}:${id}`;
  const done = tasks.filter((task) => (answers[keyOf(task.id)] ?? "").trim()).length;
  return <div className="mt-3 rounded-2xl border border-[#e4e8df] bg-white p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold text-[#6f5730]">{t(lang, "guidedTitle")}</p><p className="mt-0.5 text-[11px] leading-4 text-[#8b7954]">{t(lang, "guidedHint")}</p></div><Badge className="rounded-full bg-[#e7f3e8] text-[#4d8063]">{done}/{tasks.length}</Badge></div><div className="mt-3 space-y-2">{tasks.map((task, ti) => { const value = answers[keyOf(task.id)] ?? ""; const isDone = Boolean(value.trim()); return <div key={keyOf(task.id)} className="rounded-xl bg-[#fbfaf5] p-3"><div className="flex items-start gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${isDone ? "bg-[#f0c96a] text-[#34483d]" : "bg-[#e5f0e8] text-[#4d8063]"}`}>{isDone ? <Check className="h-3 w-3" /> : String(ti + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold leading-5 text-[#4c6257]">{task.label}</p>{task.hint ? <p className="mt-0.5 text-[11px] leading-4 text-[#9a8f7c]">{task.hint}</p> : null}<input value={value} onChange={(e) => onAnswer(task.id, e.target.value)} placeholder={lang === "zh" ? "喺度寫低你嘅答案…" : "Write your answer here…"} className="field mt-2 w-full bg-white text-xs" /></div></div></div>; })}</div></div>;
}
function CourseView({ lang, level, setLevel, selectedLesson, setSelectedLesson, stage, setStage, setDraft, saveStudentVersion, journeyOutputs, setJourneyOutputs }: { lang: Lang } & Record<string, any>) {
  const outputLabel = lessons[lang][selectedLesson - 1][2];
  const output = journeyOutputs[selectedLesson] ?? "";
  const activity = resolveActivity(lessonActivities[lang][selectedLesson], level);
  const completedCount = Object.values(journeyOutputs).filter(Boolean).length;
  const [stepTexts, setStepTexts] = useState<Record<string, string>>({});
  const [improveTried, setImproveTried] = useState(false);
  const journeySteps = ([["idea", "stageIdea", "stepIdeaHint"], ["improve", "stepImprove", "stepImproveHint"], ["outline", "stageOutline", "stepOutlineHint"], ["draft", "stageDraft", "stepDraftHint"], ["revision", "stageRevision", "stepRevisionHint"], ["submitted", "stageSubmit", "stepSubmitHint"]]) as [string, string, string][];
  const currentStepIdx = Math.max(0, journeySteps.findIndex(([id]) => id === stage));
  const nextStep = journeySteps[currentStepIdx + 1];
  const isStepDone = (id: string) => id === "improve" ? improveTried : Boolean((stepTexts[id] ?? "").trim());
  const canOpen = (id: string) => { const idx = journeySteps.findIndex(([s]) => s === id); return idx <= 0 || isStepDone(journeySteps[idx - 1][0]); };
  const currentDone = isStepDone(journeySteps[currentStepIdx][0]);
  const finalContent = (stepTexts.submitted ?? "").trim() || (stepTexts.revision ?? "").trim() || (stepTexts.draft ?? "").trim() || (stepTexts.outline ?? "").trim() || (stepTexts.idea ?? "").trim();
  const syncDraft = () => { if (finalContent) setDraft(finalContent); };
  const saveOutput = () => {
    if (!finalContent) return;
    syncDraft();
    setJourneyOutputs((previous: Record<number, string>) => ({ ...previous, [selectedLesson]: finalContent }));
    saveStudentVersion(stage);
  };
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const askAI = trpc.writingCoach.ask.useMutation({ onSuccess: (result) => { setAiAnswer(result.answer); setAiError(null); }, onError: () => setAiError(t(lang, "msgCoachError")) });
  const sendAI = () => { if (!aiQuestion.trim()) return; setAiAnswer(null); setAiError(null); askAI.mutate({ question: aiQuestion.trim(), level, lang }); };
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, string>>({});
  const [improveResult, setImproveResult] = useState<any>(null);
  const [improvePick, setImprovePick] = useState<number | null>(null);
  const improvePlan = trpc.writingCoach.improve.useMutation({ onSuccess: (result) => { setImproveResult(result); setImprovePick(null); setAiError(null); }, onError: () => setAiError(t(lang, "msgCoachError")) });
  const runImprove = () => { const base = (stepTexts.idea ?? "").trim() || (stepTexts[stage] ?? "").trim(); if (!base) return; setImproveTried(true); setAiError(null); improvePlan.mutate({ plan: base, level, lang }); };
  return <div><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Function 02 · 15-Lesson Course</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "courseH2")}</h2><p className="mt-2 text-sm text-[#7a8982]">{t(lang, "courseSub")}</p></div><div className="flex items-center gap-3"><div className="rounded-full bg-[#fff8e8] px-3 py-2 text-xs font-semibold text-[#866b37]">{t(lang, "savedCount", { n: completedCount })}</div><div className="flex rounded-full bg-white p-1 shadow-sm"><button onClick={() => setLevel("P5")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P5" ? "bg-[#243f38] text-white" : "text-[#74837c]"}`}>P5</button><button onClick={() => setLevel("P6")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P6" ? "bg-[#243f38] text-white" : "text-[#74837c]"}`}>P6</button></div></div></div><div className="mb-5 rounded-2xl border border-[#e6dfc9] bg-[#fffaf0] p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0c96a] text-[#6d5427]"><Star className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-[#6f5730]">{t(lang, "journeyTitle")}</p><p className="mt-1 text-xs leading-5 text-[#8b7954]">{t(lang, "journeyText")}</p></div></div><div className="mt-3 flex gap-1.5">{lessons[lang].map((_, index) => <button aria-label={lang === "zh" ? `第 ${index + 1} 堂收藏狀態` : `Lesson ${index + 1} saved state`} key={index} onClick={() => setSelectedLesson(index + 1)} className={`h-2 flex-1 rounded-full ${journeyOutputs[index + 1] ? "bg-[#b17235]" : selectedLesson === index + 1 ? "bg-[#d9bd78]" : "bg-[#eadfca]"}`} />)}</div></div><div className="grid gap-5 lg:grid-cols-[300px_1fr]"><div className="space-y-3">{[1, 2, 3, 4, 5].map((cycle) => <div key={cycle}><p className="px-1 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#a67b36]">{t(lang, "unit" + cycle)}</p><div className="space-y-2">{lessons[lang].map((lesson, index) => lessonCycleOf(index + 1) === cycle ? <button key={lesson[0]} onClick={() => setSelectedLesson(index + 1)} className={`w-full rounded-2xl p-3 text-left ${selectedLesson === index + 1 ? "bg-[#243f38] text-white" : "bg-white text-[#31473e] hover:bg-[#edf5ef]"}`}><div className="flex items-start gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${journeyOutputs[index + 1] ? "bg-[#f0c96a] text-[#34483d]" : selectedLesson === index + 1 ? "bg-[#f0c96a] text-[#34483d]" : "bg-[#e5f0e8] text-[#4d8063]"}`}>{journeyOutputs[index + 1] ? <Check className="h-4 w-4" /> : String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><p className="text-sm font-semibold">{lesson[0]}</p>{lessonKindOf(index + 1) === "piece" && <Badge className="rounded-full bg-[#f3e2bd] px-1.5 py-0 text-[9px] font-bold text-[#8a6a35]">{t(lang, "pieceBadge")}</Badge>}</div><p className={`mt-1 text-[11px] leading-4 ${selectedLesson === index + 1 ? "text-[#c5d9ce]" : "text-[#8a9891]"}`}>{lesson[2]}</p></div></div></button> : null)}</div></div>)}</div><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><p className="eyebrow">{t(lang, "lessonNum", { n: String(selectedLesson).padStart(2, "0"), level })}</p><CardTitle className="mt-1 text-2xl">{lessons[lang][selectedLesson - 1][0]}</CardTitle>{activity?.kind === "piece" && <p className="mt-2 inline-flex rounded-lg bg-[#fff8e8] px-2 py-1 text-[11px] font-semibold text-[#8a6a35]">{t(lang, "pieceTitleLabel")}：{pieceTitleOf(activity, level, lang)}</p>}{(() => { const pieceLesson = UNIT_PIECE[lessonCycleOf(selectedLesson)]; const pieceActivity = resolveActivity(lessonActivities[lang][pieceLesson], level); if (!pieceActivity) return null; const isPiece = lessonKindOf(selectedLesson) === "piece"; return <div className="mt-3 rounded-2xl border border-[#e4e8df] bg-[#f7faf6] p-3"><div className="flex items-start gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-[#4e7b61]" /><div><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#4e7b61]">{t(lang, "unitGoalTitle")}</p><p className="mt-1 text-xs leading-5 text-[#557261]">{t(lang, isPiece ? "unitGoalNow" : "unitGoalPrep", { lesson: pieceLesson })}<strong>「{pieceTitleOf(pieceActivity, level, lang)}」</strong>{t(lang, "unitGoalTail")}</p></div></div></div>; })()}<p className="mt-2 text-sm leading-6 text-[#718179]">{lessons[lang][selectedLesson - 1][1]}</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3"><MiniTool icon={<Sparkles />} label="Prompt card" text={t(lang, "toolPromptText")} /><MiniTool icon={<BookOpen />} label="Vocabulary" text={t(lang, "toolVocabText")} /><MiniTool icon={<LayoutTemplate />} label="Planner" text={t(lang, "toolPlannerText")} /></div>{activity && <LessonActivityPanel lang={lang} activity={activity} />}<div className="mt-6 rounded-2xl bg-[#fbfaf5] p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-[#6f5730]">{t(lang, "outputTitle", { label: outputLabel })}</p><p className="mt-1 text-[11px] text-[#918975]">{t(lang, "outputHint")}</p></div>{output && <Badge className="rounded-full bg-[#e7f3e8] text-[#4d8063]">{t(lang, "saved")}</Badge>}</div>{activity && <div className="mt-3 rounded-xl border border-[#f0e3c4] bg-[#fff8e8] p-3"><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#a67b36]">{t(lang, "writingTaskLabel")}</p><p className="mt-1 text-sm leading-6 text-[#6d613f]">{activity.writingTask}</p></div>}{activity?.guidedTasks?.length ? <GuidedTasksPanel lang={lang} lesson={selectedLesson} tasks={activity.guidedTasks} answers={guidedAnswers} onAnswer={(id, v) => setGuidedAnswers((prev) => ({ ...prev, [selectedLesson + ":" + id]: v }))} /> : null}{(() => { return <div className="mt-3 rounded-2xl border border-[#e4e8df] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><WandSparkles className="h-4 w-4 text-[#c18a32]" /><div><p className="text-xs font-semibold text-[#6f5730]">{t(lang, "journeyFlowTitle")}</p><p className="mt-0.5 text-[11px] leading-4 text-[#8b7954]">{t(lang, "journeyFlowHint")}</p></div></div><div className="flex items-center gap-2">{nextStep && !currentDone && <p className="text-[11px] leading-4 text-[#a45d47]">{t(lang, "journeyLocked", { label: t(lang, journeySteps[currentStepIdx][1]) })}</p>}{nextStep && currentDone && <Button onClick={() => setStage(nextStep[0])} className="rounded-full bg-[#243f38] px-4 text-white">{t(lang, "journeyNext")}<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>}</div></div><div className="mt-3 flex flex-wrap gap-1.5">{journeySteps.map(([id, labelKey, hintKey], index) => { const done = index < currentStepIdx; const active = id === stage; const locked = !active && !canOpen(id); return <button key={id} disabled={locked} onClick={() => setStage(id)} title={t(lang, hintKey)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${active ? "bg-[#243f38] text-white" : done ? "bg-[#e7f3e8] text-[#3f6b50]" : locked ? "cursor-not-allowed bg-[#f2f0e8] text-[#b5ab95]" : "bg-[#f2f0e8] text-[#8b8371]"}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-[#f0c96a] text-[#34483d]" : done ? "bg-[#5e9a70] text-white" : locked ? "bg-white text-[#b5ab95]" : "bg-white text-[#8b8371]"}`}>{done ? <Check className="h-3 w-3" /> : locked ? <LockKeyhole className="h-3 w-3" /> : String(index + 1).padStart(2, "0")}</span>{t(lang, labelKey)}</button>; })}</div><p className="mt-2.5 rounded-xl bg-[#fbfaf5] px-3 py-2 text-[11px] leading-4 text-[#8b7954]"><strong className="text-[#6f5730]">{t(lang, journeySteps[currentStepIdx][1])} · </strong>{t(lang, journeySteps[currentStepIdx][2])}</p></div>; })()}<Textarea value={stepTexts[stage] ?? ""} onChange={(e) => setStepTexts((prev) => ({ ...prev, [stage]: e.target.value }))} placeholder={t(lang, "stepPlaceholder" + (stage === "idea" ? "Idea" : stage === "improve" ? "Improve" : stage === "outline" ? "Outline" : stage === "draft" ? "Draft" : stage === "revision" ? "Revision" : "Submit"))} className="mt-4 min-h-[240px] resize-none rounded-2xl border-[#ece8d9] bg-white p-4 text-[15px] leading-7" />{activity && <div className="mt-3 rounded-2xl border border-[#e4e8df] bg-white p-3"><div className="flex items-center gap-2"><WandSparkles className="h-4 w-4 text-[#c18a32]" /><p className="text-xs font-semibold text-[#6f5730]">{t(lang, "aiPartnerTitle")}</p></div><p className="mt-1 text-[11px] leading-5 text-[#8b7954]">{t(lang, "aiPartnerHint")}</p><div className="mt-2 flex flex-wrap gap-2"><input value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder={activity.aiStarter} className="field min-w-[200px] flex-1 text-xs" /><Button onClick={() => setAiQuestion(activity.aiStarter)} variant="outline" className="rounded-full border-[#e3d3a9] text-[11px] text-[#806a38]">{t(lang, "aiUseStarter")}</Button><Button onClick={sendAI} disabled={askAI.isPending || !aiQuestion.trim()} className="rounded-full bg-[#a67b36] text-white">{askAI.isPending ? t(lang, "aiAsking") : t(lang, "aiAsk")}<MessageCircle className="ml-2 h-4 w-4" /></Button></div>{aiAnswer && <p className="mt-2 rounded-xl bg-[#edf6ef] p-3 text-xs leading-5 text-[#557261]">{aiAnswer}</p>}{aiError && <p className="mt-2 rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{aiError}</p>}<p className="mt-2 text-[10px] leading-4 text-[#9a8f7c]">{t(lang, "aiReminder")}</p><div className="mt-2 border-t border-[#f0e3c4] pt-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[11px] font-semibold text-[#806a38]">{t(lang, "improveTitle")}</p><p className="mt-0.5 text-[10px] leading-4 text-[#9a8f7c]">{t(lang, "improveHint")}</p></div><Button onClick={runImprove} disabled={improvePlan.isPending || !((stepTexts.idea ?? "").trim() || (stepTexts[stage] ?? "").trim())} variant="outline" className="rounded-full border-[#e3d3a9] text-[11px] text-[#806a38]">{improvePlan.isPending ? t(lang, "improving") : t(lang, "improveButton")}<WandSparkles className="ml-1 h-3.5 w-3.5" /></Button></div>{improveResult?.alternatives?.length ? <div className="mt-2 space-y-1.5">{improveResult.alternatives.map((alt: any, i: number) => <button key={alt.title ?? i} onClick={() => { setImprovePick(i); const tag = "[" + (alt.title ?? "ABC"[i]) + "] " + alt.direction; setStepTexts((prev) => { const base = prev.improve ?? prev.idea ?? ""; return { ...prev, improve: base.includes(tag) ? base : base ? base + "\n\n" + tag : tag }; }); }} className={`w-full rounded-lg p-2 text-left text-[11px] leading-5 ${improvePick === i ? "bg-[#f3e2bd] text-[#5f4a1e]" : "bg-[#fff8e8] text-[#6d613f] hover:bg-[#f8eed3]"}`}><strong>{alt.title ?? "ABC"[i]} · </strong>{alt.direction}</button>)}<p className="rounded-lg bg-[#edf6ef] p-2 text-[11px] leading-5 text-[#557261]"><strong>{t(lang, "improveObs")}</strong>{improveResult.observation}</p></div> : null}</div></div>}<div className="mt-3 flex flex-wrap justify-between gap-3"><p className="flex items-center gap-2 text-xs text-[#829089]"><LockKeyhole className="h-3.5 w-3.5" />{t(lang, "stageVersionsKept")}</p><div className="flex gap-2"><Button onClick={saveOutput} disabled={!finalContent} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><Star className="mr-2 h-4 w-4" />{t(lang, "savePiece")}</Button><Button onClick={() => { syncDraft(); saveStudentVersion(stage); }} disabled={!currentDone && stage !== "submitted"} className="rounded-full bg-[#243f38] text-white">{stage === "submitted" ? t(lang, "submitPiece") : t(lang, "saveStage")}<Send className="ml-2 h-4 w-4" /></Button></div></div></div></CardContent></Card></div>{completedCount > 0 && <Card className="mt-5 border-0 bg-[#edf6ef] shadow-none"><CardContent className="p-5"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-[#4e8063]" /><p className="text-sm font-semibold text-[#315a46]">{t(lang, "trailTitle")}</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(journeyOutputs).filter(([, value]) => Boolean(value)).slice(-3).map(([lessonNo, value]) => <button key={lessonNo} onClick={() => setSelectedLesson(Number(lessonNo))} className="rounded-xl bg-white/80 p-3 text-left"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#7c9a84]">{t(lang, "trailLesson", { n: String(lessonNo).padStart(2, "0") })}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#567261]">{String(value)}</p></button>)}</div></CardContent></Card>}</div>;
}
function TeacherOverviewView({ lang }: { lang: Lang }) {
  // Demo figures until the database is connected. Replace with
  // curriculum.classes + writingEvaluation.queue + anthology lists when live.
  const classRows = [
    { code: "P5", students: 20, pieces: 3, pending: 2, approved: 1 },
    { code: "P6", students: 20, pieces: 2, pending: 1, approved: 0 },
  ];
  const totals = classRows.reduce((acc, row) => ({ students: acc.students + row.students, pieces: acc.pieces + row.pieces, pending: acc.pending + row.pending, approved: acc.approved + row.approved }), { students: 0, pieces: 0, pending: 0, approved: 0 });
  const recent = initialSubmissions.slice(0, 4);
  return <div><div className="mb-5"><p className="eyebrow">Teacher tools · Class Overview</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "overviewH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "overviewSub")}</p></div><div className="mb-5 grid gap-3 md:grid-cols-4"><Stat label={t(lang, "ovStudents")} value={`${totals.students}`} /><Stat label={t(lang, "ovPieces")} value={`${totals.pieces}`} /><Stat label={t(lang, "ovPending")} value={`${totals.pending}`} /><Stat label={t(lang, "ovApproved")} value={`${totals.approved}`} /></div><div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><CardTitle className="text-lg">{t(lang, "ovClassHeader")}</CardTitle></CardHeader><CardContent><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#e8ece7] text-[#8a9891]"><th className="pb-2 font-semibold">{t(lang, "ovClassHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovStudentsHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovPiecesHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovPendingHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovApprovedHeader")}</th></tr></thead><tbody>{classRows.map((row) => <tr key={row.code} className="border-b border-[#f0f2ee] last:border-0"><td className="py-3 font-semibold text-[#354940]">{row.code}</td><td className="py-3 text-[#5f7168]">{row.students}</td><td className="py-3 text-[#5f7168]">{row.pieces}</td><td className="py-3 text-[#a45d47]">{row.pending}</td><td className="py-3 text-[#47705d]">{row.approved}</td></tr>)}</tbody></table><p className="mt-3 text-[11px] leading-5 text-[#9a8f7c]">{t(lang, "ovNote")}</p></CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><CardTitle className="text-lg">{t(lang, "ovRecentTitle")}</CardTitle><p className="text-xs text-[#8a9891]">{t(lang, "ovRecentSub")}</p></CardHeader><CardContent className="space-y-2">{recent.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf6] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#31473e]">{item.title}</p><p className="mt-0.5 text-[11px] text-[#89968f]">{item.student} · {item.level}</p></div><Badge variant="outline" className="rounded-full border-[#d7e5db] text-[10px] text-[#668273]">{statusText(lang, item.status)}</Badge></div>)}</CardContent></Card></div></div>;
}
function AnthologyView({ lang, user, submissions, active, selectedId, setSelectedId, updateSubmission, moveSubmission, feedback, setFeedback, exportAnthology }: any) { const [preview, setPreview] = useState(false); const [lessonFilter, setLessonFilter] = useState<number>(0); const filtered = lessonFilter === 0 ? submissions : submissions.filter((item: any) => item.lesson === lessonFilter); const anthologyExport = trpc.anthology.exportContent.useQuery(undefined, { enabled: Boolean(user) }); const selectAnthology = trpc.anthology.select.useMutation(); const pdfExport = trpc.anthology.exportPdf.useMutation({ onSuccess: (result) => { window.open(result.url, "_blank", "noopener,noreferrer"); }, onError: () => setFeedback(t(lang, "anthEmpty")) }); const approve = () => { updateSubmission(active.id, { status: "已核准" }); if (user) selectAnthology.mutate({ writingId: active.id, authorCode: active.student, publicationTitle: active.title, displayOrder: active.order, approved: 1 }); }; return <div><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Function 03 · Anthology Studio</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "anthH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "anthSub")}</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => setPreview(!preview)} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><LayoutTemplate className="mr-2 h-4 w-4" />{preview ? t(lang, "previewClose") : t(lang, "previewToggle")}</Button><Button onClick={() => pdfExport.mutate()} disabled={pdfExport.isPending} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><FileText className="mr-2 h-4 w-4" />{pdfExport.isPending ? t(lang, "makingPdf") : t(lang, "officialPdf")}</Button><Button onClick={exportAnthology} className="rounded-full bg-[#243f38] text-white"><Download className="mr-2 h-4 w-4" />{t(lang, "exportList")}</Button></div></div><div className="mb-5 grid gap-3 md:grid-cols-4"><Stat label={t(lang, "statSubmitted")} value={`${submissions.length}`} /><Stat label={t(lang, "statToEdit")} value={`${submissions.filter((item: any) => item.status === "待編輯").length}`} /><Stat label={t(lang, "statToConfirm")} value={`${submissions.filter((item: any) => item.status === "待導師確認").length}`} /><Stat label={t(lang, "statApproved")} value={`${submissions.filter((item: any) => item.status === "已核准").length}`} /></div>{preview && <Card className="mb-6 overflow-hidden border-0 bg-[#fffdf8] shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardContent className="p-8 md:p-12"><p className="eyebrow text-[#b17235]">Chung Sing School · Anthology preview</p><h3 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-[-.05em] text-[#243f38]">{active.title}</h3><p className="mt-3 text-sm text-[#7f8e86]">{active.student} · {active.level} · {active.category}</p><div className="my-7 h-px bg-[#e9e3d4]" /><p className="max-w-2xl whitespace-pre-wrap text-lg leading-9 text-[#4b5d54]">{active.body}</p><div className="mt-10 rounded-xl bg-[#edf6ef] p-4 text-sm text-[#557261]">{t(lang, "editorNoteLabel")}{active.note || t(lang, "noNote")}</div></CardContent></Card>}<div className="grid gap-6 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">Submission queue</p><CardTitle className="mt-1 text-lg">{t(lang, "queueCardTitle")}</CardTitle></div><div className="flex flex-wrap items-center gap-2"><select value={lessonFilter} onChange={(e) => setLessonFilter(Number(e.target.value))} className="field w-auto rounded-full py-1 text-[11px]"><option value={0}>{t(lang, "allLessons")}</option>{[1, 2, 3, 4, 5].map((c) => <option key={c} value={c}>{t(lang, "unit" + c)}</option>)}</select><Badge className="rounded-full bg-[#e4f1e8] text-[#4d8063]">{t(lang, "worksCount", { n: filtered.length })}</Badge></div></div></CardHeader><CardContent className="space-y-2">{filtered.map((item: any) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl p-3 text-left ${selectedId === item.id ? "bg-[#edf6ef] ring-1 ring-[#b9d4c1]" : "hover:bg-[#f7faf6]"}`}><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5f0e8] text-xs font-bold text-[#4d8063]">{String(item.order).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-[#31473e]">{item.title}</p><Badge variant="outline" className="rounded-full border-[#d7e5db] text-[10px] text-[#668273]">{statusText(lang, item.status)}</Badge></div><p className="mt-1 text-xs text-[#89968f]">{item.student} · {item.level} · {item.category}</p></div></div></button>)}</CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><p className="eyebrow">Editorial desk</p><CardTitle className="mt-1 text-lg">{t(lang, "deskTitle")}</CardTitle></div><div className="flex gap-1"><Button variant="outline" size="icon" onClick={() => moveSubmission(-1)} className="h-8 w-8 rounded-lg"><ChevronUp className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={() => moveSubmission(1)} className="h-8 w-8 rounded-lg"><ChevronDown className="h-4 w-4" /></Button></div></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Field label={t(lang, "fieldAuthor")}><input value={active.student} onChange={(e) => updateSubmission(active.id, { student: e.target.value })} className="field" /></Field><Field label={t(lang, "fieldTitle")}><input value={active.title} onChange={(e) => updateSubmission(active.id, { title: e.target.value })} className="field" /></Field><Field label={t(lang, "fieldCategory")}><select value={active.category} onChange={(e) => updateSubmission(active.id, { category: e.target.value })} className="field"><option>Fantasy</option><option>Mystery</option><option>Future World</option><option>Realistic</option><option>Poetry</option></select></Field><Field label={t(lang, "fieldStatus")}><select value={active.status} onChange={(e) => updateSubmission(active.id, { status: e.target.value })} className="field"><option value="待編輯">{t(lang, "statusToEdit")}</option><option value="待導師確認">{t(lang, "statusToConfirm")}</option><option value="已核准">{t(lang, "statusApproved")}</option><option value="不收錄">{t(lang, "statusRejected")}</option></select></Field></div><Field label={t(lang, "fieldEditorNote")}><Textarea value={active.note} onChange={(e) => updateSubmission(active.id, { note: e.target.value })} placeholder={t(lang, "editorNotePlaceholder")} className="min-h-[100px] rounded-xl border-[#dfe8e1] bg-[#fbfcf9] text-sm" /></Field><div className="rounded-2xl bg-[#f7faf6] p-4"><p className="eyebrow">{t(lang, "editorialChecklist")}</p><div className="mt-3 grid gap-2 text-sm text-[#5f7168] md:grid-cols-2"><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkVoice")}</p><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkTitle")}</p><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkLanguage")}</p><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkLayout")}</p></div></div><div className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => updateSubmission(active.id, { confirmed: !active.confirmed })} className="rounded-full border-[#d8e4dc] text-[#47705d]">{active.confirmed ? t(lang, "confirmed") : t(lang, "markConfirmed")}</Button><Button variant="outline" onClick={() => setFeedback("")} className="rounded-full border-[#d8e4dc] text-[#47705d]">{t(lang, "clearEdit")}</Button><Button onClick={approve} disabled={selectAnthology.isPending} className="rounded-full bg-[#243f38] text-white">{selectAnthology.isPending ? t(lang, "saving") : t(lang, "approveAdd")} <Check className="ml-2 h-4 w-4" /></Button></div>{feedback !== undefined && <p className="text-xs text-[#799087]">{feedback || t(lang, "exportHint")}</p>}</CardContent></Card></div></div>; }

function AccountImportView({ lang, user }: { lang: Lang; user: unknown }) {
  const [classCode, setClassCode] = useState("6F");
  const [csv, setCsv] = useState("schoolCode,classCode\nP6-01,6F\nP6-02,6F\nP6-03,6F");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentUsername, setStudentUsername] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [mustChangeCode, setMustChangeCode] = useState(false);
  const login = trpc.accounts.studentLogin.useMutation({ onSuccess: (value) => { setMustChangeCode(value.mustChangeCode); setError(null); if (!value.mustChangeCode) window.location.reload(); }, onError: (reason) => setError(reason.message || "學生登入失敗。") });
  const changeCode = trpc.accounts.changeCode.useMutation({ onSuccess: () => window.location.reload(), onError: (reason) => setError(reason.message || "更新初始碼失敗。") });
  const mutation = trpc.accounts.bulkImport.useMutation({ onSuccess: (value) => { setResult(value); setError(null); }, onError: (reason) => setError(reason.message || "匯入失敗，請檢查 CSV 格式。") });
  const downloadCredentials = () => { if (!result?.credentials) return; const rows = [["schoolCode", "username", "initialCode"], ...result.credentials.map((item: any) => [item.schoolCode, item.username, item.initialCode])]; const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "storyseed-student-account-credentials.csv"; link.click(); URL.revokeObjectURL(url); };
  return <div><p className="eyebrow">Teacher tools · Account Desk</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "accH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "accSub")}</p>{!user && <div className="mt-5 rounded-2xl border border-[#ead9bc] bg-[#fff8e8] p-4 text-sm text-[#806a38]">{t(lang, "accDemoNote")}</div>}<div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><CardTitle className="text-lg">{t(lang, "accStep1")}</CardTitle><p className="text-xs text-[#8a9891]">{t(lang, "accStep1Hint")}</p></CardHeader><CardContent><label className="block text-xs font-semibold text-[#60756a]">{t(lang, "classCode")}<input value={classCode} onChange={(e) => setClassCode(e.target.value)} className="field mt-1.5" /></label><Textarea value={csv} onChange={(e) => setCsv(e.target.value)} className="mt-4 min-h-[220px] rounded-2xl border-[#dfe8e1] bg-[#fbfcf9] font-mono text-xs" /><Button onClick={() => mutation.mutate({ classCode, csv })} disabled={!user || mutation.isPending} className="mt-4 rounded-full bg-[#243f38] text-white">{mutation.isPending ? t(lang, "generating") : t(lang, "previewGenerate")}<Users className="ml-2 h-4 w-4" /></Button>{error && <p className="mt-3 rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{error}</p>}</CardContent></Card><Card className="border-0 bg-[#edf6ef] shadow-none"><CardHeader><CardTitle className="text-lg text-[#315a46]">{t(lang, "accStep2")}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-[#557261]">{t(lang, "accStep2Text")}</p>{result && <div className="mt-5 rounded-2xl bg-white p-4"><p className="text-xs font-semibold text-[#37634d]">{t(lang, "generatedCount", { n: result.credentials.length })}</p><Button onClick={downloadCredentials} variant="outline" className="mt-3 rounded-full border-[#b9d4c1] text-[#47705d]"><Download className="mr-2 h-4 w-4" />{t(lang, "downloadCredentials")}</Button><p className="mt-3 text-[11px] leading-5 text-[#8a9891]">{result.warning}</p></div>}</CardContent></Card></div><Card className="mt-6 border-0 bg-[#fffaf0] shadow-none"><CardHeader><CardTitle className="text-lg text-[#6f5730]">{t(lang, "loginTest")}</CardTitle><p className="text-xs text-[#8a9891]">{t(lang, "loginTestSub")}</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3"><input value={studentUsername} onChange={(e) => setStudentUsername(e.target.value)} placeholder="username" className="field" /><input value={studentCode} onChange={(e) => setStudentCode(e.target.value)} placeholder={t(lang, "oneTimeCode")} type="password" className="field" /><Button onClick={() => login.mutate({ username: studentUsername, code: studentCode })} disabled={login.isPending} className="rounded-full bg-[#a67b36] text-white">{login.isPending ? t(lang, "loggingIn") : t(lang, "loginTest")}<LockKeyhole className="ml-2 h-4 w-4" /></Button></div>{mustChangeCode && <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-end"><label className="flex-1 text-xs font-semibold text-[#60756a]">{t(lang, "setNewCode")}<input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder={t(lang, "newCodePlaceholder")} type="password" className="field mt-1.5" /></label><Button onClick={() => changeCode.mutate({ newCode })} disabled={newCode.length < 8 || changeCode.isPending} className="rounded-full bg-[#243f38] text-white">{changeCode.isPending ? t(lang, "updating") : t(lang, "completeFirstChange")}</Button></div>}</CardContent></Card></div>;
}
function MiniTool({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) { return <div className="rounded-2xl border border-[#edf0eb] bg-[#fcfdfb] p-4"><div className="flex items-center gap-2 text-[#4e7b61]">{icon}<span className="text-xs font-semibold uppercase tracking-[.1em]">{label}</span></div><p className="mt-3 text-sm font-medium text-[#354940]">{text}</p></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <Card className="border-0 bg-white shadow-[0_10px_25px_rgba(36,51,47,.04)]"><CardContent className="p-4"><p className="text-xs text-[#8b9892]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#2c4439]">{value}</p></CardContent></Card>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#60756a]">{label}</span>{children}</label>; }
function LessonActivityPanel({ lang, activity }: { lang: Lang; activity: LessonActivity }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const done = activity.checklist.filter((_, index) => checked[index]).length;
  const renderPart = (part: LessonPart) => {
    if (part.kind === "pairs") return <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{part.pairs!.map((item) => <div key={item.label} className="rounded-xl border border-[#e8ece3] bg-[#fcfdfb] p-3"><p className="text-xs font-semibold text-[#354940]">{item.label}</p><p className="mt-1 text-[11px] leading-4 text-[#718179]">{item.value}</p></div>)}</div>;
    if (part.kind === "plan") return <div className="mt-3 flex flex-wrap gap-2">{part.items!.map((field) => <span key={field} className="rounded-full bg-[#eef3ec] px-3 py-1.5 text-[11px] font-semibold text-[#4d6b5a]">{field}</span>)}</div>;
    if (part.kind === "text") return <p className="mt-3 rounded-xl bg-[#edf6ef] p-3 text-[11px] leading-5 text-[#557261]">{part.text}</p>;
    return <ul className="mt-3 space-y-2">{part.items!.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-[#557261]"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7db18a]" />{item}</li>)}</ul>;
  };
  return <div className="mt-5 rounded-2xl border border-[#e4e8df] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><PenLine className="h-4 w-4 text-[#4e7b61]" /><p className="text-sm font-semibold text-[#354940]">{t(lang, "panelTitle")}</p></div><Badge className="rounded-full bg-[#e5f0e8] text-[#4d8063]">{t(lang, "checklistBadge", { done, total: activity.checklist.length })}</Badge></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-[#f7faf6] p-4"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#4e7b61]">{t(lang, "goalsLabel")}</p><ul className="mt-3 space-y-2">{activity.goals.map((goal) => <li key={goal} className="flex gap-2 text-xs leading-5 text-[#557261]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5e9a70]" />{goal}</li>)}</ul></div><div className="rounded-2xl bg-[#fff8e8] p-4"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#a67b36]">{t(lang, "bigIdeaLabel")}</p><p className="mt-3 text-xs leading-5 text-[#6d613f]">{activity.bigIdea}</p></div></div><div className="mt-4 space-y-4">{activity.parts.map((part) => <div key={part.title}><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#4e7b61]">{part.title}</p>{renderPart(part)}</div>)}</div><div className="mt-4 rounded-2xl border border-[#e8ece3] p-4"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#4e7b61]">{t(lang, "quickChecklist")}</p><div className="mt-3 grid gap-2 md:grid-cols-2">{activity.checklist.map((item, index) => <button key={item} onClick={() => setChecked((prev) => ({ ...prev, [index]: !prev[index] }))} className={`flex items-start gap-2 rounded-xl p-2 text-left text-[11px] leading-5 ${checked[index] ? "bg-[#e7f3e8] text-[#3f6b50]" : "bg-[#f7faf6] text-[#718179]"}`}><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked[index] ? "border-[#5e9a70] bg-[#5e9a70]" : "border-[#c8d6cc] bg-white"}`}>{checked[index] && <Check className="h-3 w-3 text-white" />}</span>{item}</button>)}</div></div><div className="mt-4 rounded-2xl bg-[#fffaf0] p-4"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[#a67b36]">{t(lang, "exitTitle")}</p><ul className="mt-3 space-y-2">{activity.exitTicket.map((question) => <li key={question} className="text-xs leading-5 text-[#6d613f]">{question}</li>)}</ul><p className="mt-3 text-[11px] leading-5 text-[#8f7b48]">{t(lang, "exitHint")}</p></div></div>;
}
