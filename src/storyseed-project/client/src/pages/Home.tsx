import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BookOpen, Check, ChevronDown, ChevronUp, ClipboardCheck, Download, FileText, GraduationCap, LayoutTemplate, LockKeyhole, MessageCircle, PenLine, SearchCheck, Send, Sparkles, Star, Users, WandSparkles, ClipboardList } from "lucide-react";
import { AssignmentsDesk } from "@/components/teacher/AssignmentsDesk";
import { AccountsDesk } from "@/components/teacher/AccountsDesk";

/*
 * StorySeed studio page.
 *
 * One screen serves three entry modes, chosen from the URL:
 *   /            demo workspace, no login required
 *   /student     student portal: Proofreading Studio and the 15-lesson course
 *   /teacher     teacher portal: class overview, review, anthology, accounts
 *
 * Language is Traditional Chinese or English (`lang`). Lesson copy, the
 * UI dictionary, and the AI thinking-partner replies all follow that toggle.
 *
 * UNFINISHED on this page:
 * - Class Overview counts and the anthology queue start from hard-coded
 *   demo rows (`initialSubmissions`), not live class or writing queries.
 * - P5 and P6 share the same 15 lesson texts. The level switch only
 *   changes the label and the level sent to the AI coach.
 * - Lesson content is embedded in this file. It is not loaded from the
 *   `assignments` table.
 * - Collected lesson pieces (`journeyOutputs`) live in browser memory and
 *   disappear on refresh unless a student is logged in and the database
 *   is configured.
 * - `score` is a word-count guess passed into Proofreading Studio, and that
 *   view ignores it. The 60/100 on screen is four placeholder rubric rows
 *   of 15 until a real evaluation comes back.
 * - The header avatar is the fixed label "07", not the signed-in student.
 */

type Studio = "proofreading" | "course" | "anthology" | "accounts" | "overview" | "assignments";
type Stage = "idea" | "outline" | "draft" | "revision" | "submitted";
type Lang = "zh" | "en";

/*
 * Fifteen lesson titles, short descriptions, and savable-output labels.
 * Index 0 is Lesson 1. The same outline is used for P5 and P6.
 * Tuple shape: [title, description, output label].
 */
const lessons: Record<Lang, readonly (readonly [string, string, string])[]> = {
  zh: [
    ["AI 是創意夥伴", "了解如何讓 AI 問問題，而不是替你寫作。", "寫作安全宣言"],
    ["把靈感變成故事種子", "用提示卡產生三個真正屬於你的故事點子。", "三個故事種子"],
    ["創作一個有目標的角色", "從願望、情緒、優點及缺點建立角色。", "角色卡"],
    ["用五感描寫場景", "用看、聽、聞、觸、味道讓讀者進入你的世界。", "感官描寫"],
    ["故事山：開始、轉折與結局", "安排問題、轉折及結局，讓故事走得更穩。", "故事大綱"],
    ["讓對話說出角色個性", "用語氣和對話展現角色聲音。", "對話片段"],
    ["第一篇完整創作", "把大綱發展成一份完整草稿。", "第一版草稿"],
    ["讓回饋變成下一版", "學習使用 checklist 及導師意見修訂作品。", "第二版草稿"],
    ["用畫面寫一首小詩", "嘗試比喻、節奏及圖像化語言。", "短詩或 image prose"],
    ["AI 是你的編輯夥伴", "取得校對方向，但由你決定如何修改。", "編輯反思"],
    ["把一個場景寫得更豐富", "增加動作、情緒、細節及節奏。", "擴寫場景"],
    ["試試另一種世界", "在 mystery、fantasy 或 future world 中選一種創作。", "genre draft"],
    ["為作品準備出版", "選擇作品、整理標題、開首、結尾及作者話。", "出版稿"],
    ["分享、傾聽、再修改", "以讀者角度聽取回饋並完成最後修訂。", "final manuscript"],
    ["小作家作品展", "回顧你的創作成長及 AI 使用決定。", "作品集提交"],
  ],
  en: [
    ["AI is a Creative Partner", "Learn how to ask AI questions instead of letting it write for you.", "Writing Safety Pledge"],
    ["Turning Ideas into Story Seeds", "Use prompt cards to generate three story ideas that are truly yours.", "Three Story Seeds"],
    ["Creating a Character with a Goal", "Build a character from wants, feelings, strengths and weaknesses.", "Character Card"],
    ["Describing Scenes with Five Senses", "Use sight, sound, smell, touch and taste to bring readers into your world.", "Sensory Writing"],
    ["Story Mountain: Beginning, Turning Point and Ending", "Arrange the problem, turning point and ending so your story stays steady.", "Story Outline"],
    ["Letting Dialogue Show Character", "Use tone and word choice to reveal each character's voice.", "Dialogue Scene"],
    ["First Full Piece of Writing", "Develop your outline into a complete draft.", "First Draft"],
    ["Turning Feedback into the Next Version", "Learn to revise with a checklist and your teacher's feedback.", "Second Draft"],
    ["Writing a Small Poem with Pictures", "Try metaphor, rhythm and image-rich language.", "Short Poem or Image Prose"],
    ["AI as Your Editing Partner", "Get editing direction, but you decide what to change.", "Editing Reflection"],
    ["Making One Scene Richer", "Add action, emotion, details and rhythm.", "Expanded Scene"],
    ["Trying Another World", "Choose mystery, fantasy or a future world to create in.", "Genre Draft"],
    ["Preparing Your Work for Publication", "Choose your piece, polish the title, opening, ending and author note.", "Publication Draft"],
    ["Sharing, Listening, Revising", "Hear feedback as a reader and complete your final revision.", "Final Manuscript"],
    ["Young Writers' Showcase", "Look back at your writing growth and your AI choices.", "Anthology Submission"],
  ],
};

// 每堂的結構化活動內容，對照真實課程（報價單 15 課大綱 + 課堂筆記），
// 讓每一堂都有明確的平台活動及可保存產出。平台原則：AI 不代寫。
type LessonPart = { title: string; kind: "pairs" | "list" | "text" | "plan"; pairs?: { label: string; value: string }[]; items?: string[]; text?: string };
type LessonActivity = {
  goals: string[];
  bigIdea: string;
  parts: LessonPart[];
  checklist: string[];
  exitTicket: string[];
  writingTask: string;
  aiStarter: string;
};
const lessonActivitiesZh: Record<number, LessonActivity> = {

  1: {
    goals: [
      "我能解釋 AI 如何支援我的寫作，而不會成為作者。",
      "我能運用 StorySeed 寫作旅程的五個階段。",
      "我能憑自己的想像寫一段原創迷你場景。",
      "我能在使用 AI 時作出安全而負責任的選擇。",
    ],
    bigIdea: "AI 可以成為思考夥伴：它會提出問題、提供可能性，並幫我們留意語言選擇。不過，重要的決定由作者自己作。你的想法、經歷和聲音，都是屬於你的。",
    writingTask: "寫一段約 120–150 字的基準迷你場景，以「When I opened the classroom door, everything was different.」開頭，包含一個角色、一個令人意外的細節和一個動作。此草稿不可使用 AI。",
    aiStarter: "Give me three possible problems for a story about a student who finds something surprising in a classroom. Ask me one question about each problem.",
    parts: [
      { title: "Part A · 甚麼是好故事？", kind: "pairs", pairs: [
        { label: "角色 Character", value: "一個好奇但害怕犯錯的學生" },
        { label: "慾望 Want", value: "學生想找出是誰留下神秘紙條" },
        { label: "問題 Problem", value: "每當學生接近，線索就會消失" },
        { label: "有趣細節 Interesting detail", value: "紙條有橙味，寫在藍色紙上" },
      ] },
      { title: "Part B · AI 能為作者做甚麼？", kind: "pairs", pairs: [
        { label: "產生可能性", value: "為懸疑故事建議三個不尋常的場景。" },
        { label: "提出引導問題", value: "問我的角色想要甚麼、有甚麼阻礙。" },
        { label: "支援詞彙", value: "為「walk」提供五個替換詞，並解釋每個詞的氣氛。" },
        { label: "指出修訂點", value: "指出我的段落中需要更清楚細節的位置。" },
        { label: "嘗試寫作實驗", value: "示範同一時刻用有趣或神秘風格寫會係點。" },
      ] },
      { title: "Part C · 教練還是代寫？", kind: "pairs", pairs: [
        { label: "「給我三個關於一把失蹤鑰匙的故事問題，並就每個問題問我一個問題。」", value: "作者自行選擇並發展一個問題——這是寫作教練。" },
        { label: "「寫一個 500 字關於失蹤鑰匙的故事，要刺激並使用出色詞彙。」", value: "AI 為學生寫完整個故事——這是代寫。" },
      ] },
      { title: "Part D · 閱讀示範", kind: "pairs", pairs: [
        { label: "AI 的建議", value: "一名學生發現學校圖書館有一扇只在日落後出現的門，門後是一個裝滿鐘的房間。" },
        { label: "學生的版本", value: "下午 4:05，Mina 聽到圖書館閱讀桌下傳來微小的滴答聲。她抽出一本藍色圖書，發現裏面貼著一把鑰匙。鑰匙是暖的，彷彿剛才還有人握過。Mina 看向時鐘，秒針已停了。" },
      ] },
      { title: "Part E · 負責任使用 AI 規則", kind: "list", items: [
        "我要求三個點子、比較它們並改動我最喜歡的一個——負責任。",
        "我複製 AI 的故事當作自己的作品提交——不負責任。",
        "我要求詞彙選擇，然後揀符合我意思的詞——負責任。",
        "我將全名、電話、地址或密碼輸入寫作工具——不負責任。",
        "我檢查 AI 建議是否合理並適合學校——負責任。",
      ] },
      { title: "Part F · StorySeed 寫作旅程", kind: "plan", items: [
        "1. 意念 Idea → 故事種子",
        "2. 大綱 Outline → 故事地圖",
        "3. 草稿 Draft → 完整初稿",
        "4. 修訂 Revision → 新版本",
        "5. 提交 Submitted → 可出版成品",
      ] },
      { title: "Part G · 私隱偵探", kind: "pairs", pairs: [
        { label: "安全的故事情節", value: "虛構角色 Kai · 虛構的學校圖書館 · 喜歡芒果雪糕的角色" },
        { label: "應保密的資料", value: "我的家庭地址 · 我的電話號碼 · 我的密碼或登入代碼" },
      ] },
      { title: "Part H · 我的基準迷你場景", kind: "text", text: "寫一段約 120–150 字的場景，以「When I opened the classroom door, everything was different.」開頭，包含一個角色、一個令人意外的細節和一個動作。先計劃：場景在哪裏？誰在場？有甚麼不同或令人意外？角色想要甚麼？角色下一步會做甚麼？" },
      { title: "Part I · 改善一個句子", kind: "pairs", pairs: [
        { label: "The classroom was strange.（課室很奇怪）", value: "加入聲音、顏色、氣味、動作或感受。" },
        { label: "I walked to the window.（我走向窗邊）", value: "我怎樣走？我注意到甚麼？" },
        { label: "I saw a box.（我看見一個盒子）", value: "它看起來怎樣？為甚麼重要？" },
      ] },
      { title: "Part J · 建立負責任的 AI 請求", kind: "plan", items: [
        "角色 Role：你是一位會問有用問題的寫作教練。",
        "我的目標 My goal：我想請你幫我……",
        "AI 不可做的事：不要替我把整個故事寫好。",
        "我會作的決定：我會決定……",
        "私隱檢查：我已移除姓名、聯絡資料和私人資訊。",
      ] },
    ],
    checklist: [
      "我能解釋 AI 可以怎樣支援作者。",
      "我能分辨寫作教練和代寫。",
      "我認識 StorySeed 五個階段。",
      "我完成了一段原創基準場景。",
      "我會保護我的私人資料。",
      "我會為自己的寫作作最終決定。",
    ],
    exitTicket: [
      "AI 能為作者做的一件有用的事是……",
      "AI 不可為我做的事是……",
      "我想練習的 StorySeed 階段是……因為……",
      "我會記住的一條私隱規則是……",
    ],
  },
  2: {
    goals: [
      "我能解釋為甚麼清晰的提示詞會得到更好的故事點子。",
      "我能運用文體、角色、場景、問題和轉折來建立提示詞。",
      "我能比較 AI 建議，揀出最有潛力的點子。",
      "我能改動 AI 建議，使它變成屬於我的原創故事種子。",
    ],
    bigIdea: "提示詞是一組指示。你提供的實用細節愈多，得到的點子可能愈有用。AI 可以提供可能性，但你是負責選擇、改動並賦予意義的作者。",
    writingTask: "完成你的故事種子卡：暫定標題、文體、主角與目標、場景與氣氛、主要問題、有趣物件或線索、轉折。然後寫一段 3–5 句的故事種子，交代主角、地點、問題和疑問。",
    aiStarter: "Compare these three story seeds and tell me which has the strongest problem and why.",
    parts: [
      { title: "Part A · 一個詞，多個故事", kind: "pairs", pairs: [
        { label: "鑰匙很小，是銀造的", value: "失落的寶藏或一把小鎖" },
        { label: "下雪時鑰匙仍是暖的", value: "有生命的東西，或剛被人握過" },
        { label: "鑰匙藏在圖書館書本裏", value: "祕密訊息或隱藏房間" },
        { label: "鑰匙標明「午夜前不可使用」", value: "神秘事件，或等待被打破的規則" },
      ] },
      { title: "Part B · 甚麼是提示詞？", kind: "pairs", pairs: [
        { label: "提示詞 A：過於籠統", value: "Give me a story idea.（給我一個故事點子。）" },
        { label: "提示詞 B：更有用", value: "You are a writing helper. Give me three mystery story seeds for an upper-primary student. The main character is a quiet but clever student. The setting is a school library after class. Add one surprising but suitable problem." },
      ] },
      { title: "Part C · 提示詞公式", kind: "pairs", pairs: [
        { label: "角色 Role", value: "AI 應該係咩？——寫作助手" },
        { label: "任務 Task", value: "AI 應該做咩？——給我三個故事種子" },
        { label: "文體 Genre", value: "甚麼類型的故事？——懸疑／奇幻／冒險" },
        { label: "角色 Character", value: "故事關於誰？——勇敢的小五學生" },
        { label: "場景 Setting", value: "在哪裏、何時？——晚上的學校圖書館" },
        { label: "問題／轉折 Problem / Twist", value: "有咩令故事有趣？——地圖每小時改變" },
      ] },
      { title: "Part D · 建立提示詞：步驟 1", kind: "plan", items: [
        "文體：懸疑／奇幻／冒險／搞笑／未來世界",
        "主角",
        "場景",
        "時間或天氣",
        "物件或線索",
      ] },
      { title: "Part E · 建立提示詞：步驟 2", kind: "pairs", pairs: [
        { label: "有東西消失", value: "班級吉祥物在學校拍照前消失了。" },
        { label: "有東西改變", value: "無人看管時，美術室每幅畫都會移動。" },
        { label: "發現祕密", value: "在鬆動的班房瓷磚後發現一張訊息。" },
        { label: "困難的抉擇", value: "角色只能拯救一件物件，不能兩件。" },
        { label: "加入轉折", value: "簡單點子可加轉折：地圖顯示還未存在的地方；聲音來自一張被遺忘的照片；腳印在天花板前消失。" },
      ] },
      { title: "Part F · 我的完整提示詞", kind: "text", text: "運用你在 Part D 和 E 的選擇，盡量包含提示詞公式中至少五個部分，以「You are a…」開頭。然後檢查：我的提示詞是否清楚說明我想要甚麼？是否包含角色和問題？是否要求點子而非完整故事？是否適合學校？" },
      { title: "Part G · 比較三個故事種子", kind: "pairs", pairs: [
        { label: "A. 每晚學校鐘聲響十三次，但只有一個學生聽得到。", value: "懸疑與特殊能力" },
        { label: "B. 學生發現一枝會說話的鉛筆，有問必答，但從不說真話。", value: "奇幻加上信任問題" },
        { label: "C. 班上的植物長出一片新葉，葉上印著一幅小地圖。", value: "一個會成長的小線索" },
      ] },
      { title: "Part H · 令點子變成自己的", kind: "pairs", pairs: [
        { label: "AI 建議", value: "角色：喜歡解謎的學生；場景：放學後的學校圖書館；物件：會改變的地圖；問題：地圖通往一個鎖上的房間。" },
        { label: "我的版本", value: "至少改動三個細節，並加入你自己想像的元素——不是私人資料。" },
      ] },
      { title: "Part I · 示範：從 AI 種子到我的故事種子", kind: "pairs", pairs: [
        { label: "AI 種子", value: "一名學生發現學校裏有個隱藏房間，房間內有來自未來的物件。" },
        { label: "作者的改動", value: "主角是 Jo，他總是等遲到校車的最後一個學生。一個下雨的下午，Jo 沿著發光的擦膠碎屑走到舊音樂室。裏面每件物件都標著明天的日期——但有一件標著今天。" },
      ] },
      { title: "Part J · 我的故事種子卡", kind: "plan", items: [
        "故事標題（暫定）",
        "文體",
        "主角與目標",
        "場景與氣氛",
        "主要問題",
        "有趣物件或線索",
        "轉折或未解答的疑問",
      ] },
      { title: "Part K · 提示詞練習：修正提示詞", kind: "text", text: "以下提示詞太短。加入文體、角色、場景、問題和特別方向，重寫一次。過短提示詞：「Give me a story about a door.」" },
    ],
    checklist: [
      "我能解釋為甚麼具體的提示詞有用。",
      "我能運用提示詞公式。",
      "我包含了角色、場景和問題。",
      "我加入了轉折或未解答的疑問。",
      "我在選擇前比較了多個點子。",
      "我改動了 AI 種子並加入自己的聲音。",
    ],
    exitTicket: [
      "我今天使用的提示詞其中一部分是……",
      "我選擇的故事種子是……因為……",
      "我改動令點子變成自己的一個細節是……",
      "關於我的故事，我仍然想問的一個問題是……",
    ],
  },
  3: {
    goals: [
      "我能創造一個有清楚目標、優點、缺點和問題的角色。",
      "我能透過行動、選擇、對白和反應來表現個性。",
      "我能用 AI 探索角色可能性，而不會抄襲一個完整角色。",
      "我能讓我的角色自然連繫到故事衝突。",
    ],
    bigIdea: "一個可信的角色不止於名字和外貌。讀者透過角色想要甚麼、害怕甚麼、選擇甚麼和做甚麼來理解角色。AI 可以提供可能性，但你自己決定角色真正的樣子。",
    writingTask: "寫一段約 100–130 字的角色場景，包含角色的目標、一個動作、一句對白和一個反應。",
    aiStarter: "Ask me questions to discover what my character fears and what my character wants.",
    parts: [
      { title: "Part A · 猜猜這個角色", kind: "pairs", pairs: [
        { label: "三枝不同鉛筆永遠按相同順序排列", value: "細心或控制慾強" },
        { label: "總是留意到有人被冷落", value: "善良、觀察力強" },
        { label: "緊張時會笑", value: "用幽默隱藏感受" },
        { label: "拒絕求助", value: "驕傲或怕看起來軟弱" },
      ] },
      { title: "Part B · 角色積木", kind: "pairs", pairs: [
        { label: "目標 Goal", value: "角色想要甚麼？——找回失蹤的狗" },
        { label: "優點 Strength", value: "角色擅長甚麼？——留意微小細節" },
        { label: "缺點 Flaw", value: "有甚麼令事情變難？——不信任別人" },
        { label: "恐懼 Fear", value: "角色想避免甚麼？——被指責" },
        { label: "需要／成長 Need / growth", value: "角色可能學會甚麼？——求助也可以是勇敢" },
      ] },
      { title: "Part C · 角色檔案", kind: "plan", items: [
        "姓名／暱稱",
        "年齡或年級",
        "一個可見細節",
        "一個習慣",
        "一段重要關係",
        "一個祕密或私下的憂慮",
      ] },
      { title: "Part D · 用行動表現個性", kind: "pairs", pairs: [
        { label: "Leo 很勇敢。", value: "Leo 擋在狗和破閘門之間，儘管雙手在發抖。" },
        { label: "Nia 很細心。", value: "Nia 打開最小那把鎖前，把鑰匙數了兩次。" },
        { label: "Sam 很妒忌。", value: "Sam 對獎品微笑，然後靜靜把得獎畫移到後面。" },
        { label: "Ivy 很好奇。", value: "Ivy 把警告讀了兩次，然後第三次打開門。" },
      ] },
      { title: "Part E · 角色聲音", kind: "pairs", pairs: [
        { label: "害羞／謹慎", value: "停頓、柔軟詞語、提問——「Maybe we could wait… just in case?」" },
        { label: "直接／自信", value: "命令、短句——「Open the gate. I will go first.」" },
        { label: "搞笑／緊張", value: "玩笑、誇張——「Excellent. A haunted locker. My favourite.」" },
        { label: "好奇／精力充沛", value: "大量問題和細節——「Why is it warm? And why is it humming?」" },
      ] },
      { title: "Part F · AI 作為角色教練", kind: "pairs", pairs: [
        { label: "「給我五個想當領袖的角色可能有的缺點。」", value: "我揀一個能造成有用問題的。" },
        { label: "「問我問題，幫我發現我的角色害怕甚麼。」", value: "我用自己的想法回答。" },
        { label: "「建議三個害羞角色可能求助的方式，保持簡短。」", value: "我會改動句子，使它像我的角色會說的話。" },
        { label: "「這個角色緊張時會做甚麼？給我選擇。」", value: "我選一個符合故事的動作。" },
      ] },
      { title: "Part G · 示範角色檔案：Kai", kind: "pairs", pairs: [
        { label: "目標", value: "證明自己能獨自破解學校謎團。" },
        { label: "優點", value: "他記得路線和小視覺細節。" },
        { label: "缺點", value: "他拒絕求助，因為怕看起來軟弱。" },
        { label: "恐懼", value: "因犯錯而被嘲笑。" },
        { label: "抉擇", value: "他請一位低年級學生幫忙讀隱藏地圖。" },
        { label: "改變", value: "他學會接受幫助不會抹掉自己的才能。" },
      ] },
      { title: "Part H · 我的完整角色規劃器", kind: "plan", items: [
        "我的角色一開始想要甚麼？",
        "角色害怕甚麼？",
        "甚麼優點幫到角色？",
        "甚麼缺點造成麻煩？",
        "角色會面對甚麼困難抉擇？",
        "角色最後可能明白甚麼？",
      ] },
      { title: "Part I · 場景中的角色", kind: "text", text: "寫一段約 100–130 字的短場景，包含角色的目標、一個動作、一句對白和一個反應。先計劃：角色在哪裏？角色現在想要甚麼？有甚麼阻礙？角色會說或做甚麼？" },
    ],
    checklist: [
      "我的角色有清楚的目標。",
      "我的角色有優點和缺點。",
      "我透過行動或對白表現個性。",
      "我的角色連繫到故事問題。",
      "我把 AI 當作教練，而不是替代作者。",
    ],
    exitTicket: [
      "我的角色目標是……",
      "我的角色有的一個優點和一個缺點是……",
      "一個能揭示個性的抉擇是……",
    ],
  },
  4: {
    goals: [
      "我能運用五感，令場景更清楚、更生動。",
      "我能用具體的名詞、動詞和形容詞取代籠統詞語。",
      "我能用 AI 探索詞彙選擇和感官細節。",
      "我能選擇、改動並組合建議，使我的描寫聽起來像我。",
    ],
    bigIdea: "細節幫助讀者看見、聽見、聞到、嚐到和觸摸到故事世界。AI 可以提供詞彙選擇，但揀選符合角色、氣氛和意義的細節，是作者的工作。",
    writingTask: "從你的故事中揀一個重要場景並描寫它。盡量包含至少三種感官，以及一個具體動詞。",
    aiStarter: "Give me five verbs for walking. Explain which one sounds nervous.",
    parts: [
      { title: "Part A · 你能留意到甚麼？", kind: "plan", items: [
        "看見 See",
        "聽見 Hear",
        "聞到 Smell",
        "觸摸 Feel / touch",
        "嚐到 Taste（真實或想像）",
      ] },
      { title: "Part B · 籠統詞語與具體詞語", kind: "pairs", pairs: [
        { label: "walked（走）", value: "tiptoed / marched / shuffled / stumbled" },
        { label: "looked（看）", value: "glanced / stared / peered / scanned" },
        { label: "said（說）", value: "whispered / muttered / shouted / asked" },
        { label: "big（大）", value: "towering / enormous / wide / bulky" },
        { label: "nice smell（好聞）", value: "sweet / smoky / spicy / earthy" },
      ] },
      { title: "Part C · 展示，而非直接說出", kind: "pairs", pairs: [
        { label: "Mina 很緊張。", value: "她的手指扭著紙角。時鐘的聲音異常地響。" },
        { label: "房間很可怕。", value: "燈光閃爍。牆後有東西在抓撓。" },
        { label: "Leo 很興奮。", value: "他的膝蓋不停上下彈動。他讀了三遍訊息。" },
        { label: "湯很好喝。", value: "碗上蒸氣盤旋，薑味令她的肚子咕嚕作響。" },
      ] },
      { title: "Part D · 閱讀示範段落", kind: "pairs", pairs: [
        { label: "版本 1：籠統", value: "The old classroom was strange. There was a box on the desk. I walked over to it and opened it." },
        { label: "版本 2：具體", value: "The old classroom smelled of dust and wet umbrellas. A narrow wooden box sat on the teacher’s desk, its brass lock shining under the flickering light. I crossed the room slowly. When my fingers touched the lid, the box gave a tiny click—as if it had been waiting for me." },
      ] },
      { title: "Part E · 建立感官詞庫", kind: "list", items: [
        "聽覺：crackling, echoing, humming, thudding, whispering",
        "視覺：glowing, shadowy, pale, sparkling, blurred",
        "味覺：bitter, salty, sour, creamy, minty",
        "觸覺：rough, sticky, freezing, prickly, silky",
        "嗅覺：dusty, smoky, floral, damp, metallic",
      ] },
      { title: "Part F · 營造氣氛", kind: "pairs", pairs: [
        { label: "學校走廊", value: "神秘" },
        { label: "雨後的操場", value: "平靜／孤單" },
        { label: "慶祝前的廚房", value: "興奮／溫暖" },
        { label: "暴風雨中的課室", value: "擔心／奇幻" },
      ] },
      { title: "Part G · AI 如何幫助描寫", kind: "pairs", pairs: [
        { label: "「給我五個表示走的動詞，解釋哪個聽起來緊張。」", value: "我選一個符合角色的動詞。" },
        { label: "「為雨中的學校操場建議感官細節。不要寫段落。」", value: "我揀符合故事的細節。" },
        { label: "「問我三個問題，令我的場景更具體。」", value: "我用自己話回答問題。" },
        { label: "「給我 ‘bright’ 的替代詞，包括語氣差異。」", value: "我決定哪個詞合適。" },
      ] },
      { title: "Part H · 細節階梯", kind: "text", text: "細節加上層次會變得更強。1. 籠統：There was a bird. 2. 具體：A small blue bird perched on the window. 3. 感官：Its wet feathers shivered as rain tapped the glass. 4. 意義：It carried the same red thread as the missing class badge. 用四步建立你自己的階梯。" },
      { title: "Part I · 描寫一件重要物件", kind: "plan", items: [
        "這件物件是甚麼？",
        "它看起來怎樣？",
        "它有甚麼聲音或氣味？",
        "摸起來感覺如何？",
        "它連接著甚麼記憶或祕密？",
        "我可以使用甚麼比喻？（like / as…as）",
      ] },
      { title: "Part J · 為你的故事描寫場景", kind: "text", text: "運用你的故事大綱，揀一個重要場景並發展它。計劃：場景在哪裏？角色看到、聽到、聞到或嚐到、感受到甚麼？讀者應感受到甚麼氣氛？然後寫你的場景描寫，包含至少三種感官和一個具體動詞。" },
    ],
    checklist: [
      "我的描寫使用了至少三種感官。",
      "我把籠統詞語換成具體選擇。",
      "我用細節展示感受或氣氛。",
      "我包含了具體名詞或動詞。",
      "我把 AI 當作教練，並改動建議令文字像我。",
    ],
    exitTicket: [
      "我今天用到的其中一種感官是……",
      "一個能營造氣氛的細節是……",
      "AI 可以幫助我修訂描寫的一種方式是……",
    ],
  },
  5: {
    goals: [
      "我能把故事組織成清楚的開端、問題、上升行動、轉折點和結局。",
      "我能用故事山來按邏輯順序計劃事件。",
      "我能用 AI 擴充大綱，而不會失去對故事的控制。",
      "我能檢查每個事件是否導致或鋪墊下一個事件。",
    ],
    bigIdea: "當事件有清楚次序時，故事更容易跟隨。角色的問題應製造壓力，轉折點應涉及抉擇，結局應顯示有甚麼改變。",
    writingTask: "完成你的故事大綱規劃器：開端、問題、上升行動 1、上升行動 2、轉折點／抉擇、結局／結果，並解釋每個事件為甚麼重要。",
    aiStarter: "Ask me whether my events are in a clear order and suggest one obstacle for my character’s goal.",
    parts: [
      { title: "Part A · 把事件排序", kind: "list", items: [
        "角色在圖書館書本裏找到一把鑰匙。",
        "角色注意到樓梯下有一扇鎖上的門。",
        "角色決定是否打開那扇門。",
        "角色發現鑰匙為甚麼被藏起來。",
      ] },
      { title: "Part B · 故事山", kind: "pairs", pairs: [
        { label: "開端／設定", value: "介紹角色、場景和平常情況。" },
        { label: "問題", value: "有事情改變，或製造一個目標。" },
        { label: "上升行動", value: "事件令問題變得更難。" },
        { label: "轉折點", value: "角色作出重要抉擇。" },
        { label: "結局／結果", value: "顯示後果和改變。" },
      ] },
      { title: "Part C · 因果關係", kind: "pairs", pairs: [
        { label: "地圖開始褪色 → 所以……", value: "角色必須趕快找到出路。" },
        { label: "角色不能請大人幫忙 → 因為……", value: "祕密會被發現。" },
        { label: "朋友違反規則 → 因此……", value: "角色必須作出抉擇。" },
      ] },
      { title: "Part D · 示範故事山", kind: "text", text: "示範：The Door Behind the Display Board。開端：Nia 留校完成空課室裏的一幅畫。問題：她發現展示板後有一扇小門。上升行動：只有把未完成的畫放在門旁，門才會打開。裏面是明天的圖畫。轉折點：其中一幅畫顯示學校的畫會在暴風雨中毀掉。Nia 要麼警告大家，要麼保護祕密房間。結局：Nia 警告全班並救回畫作，但一幅新畫出現，上面有她的名字。" },
      { title: "Part E · AI 作為大綱教練", kind: "pairs", pairs: [
        { label: "「在這兩點之間給我兩個可能事件。」", value: "我揀一個符合的。" },
        { label: "「問我事件次序是否清楚。」", value: "我自己修訂次序。" },
        { label: "「為我角色的目標建議三個障礙。」", value: "我揀一個並改動它。" },
        { label: "「告訴我哪個事件多餘，並解釋原因。」", value: "我決定是否刪除它。" },
      ] },
      { title: "Part F · 我的故事大綱規劃器", kind: "plan", items: [
        "1. 開端／設定",
        "2. 問題",
        "3. 上升行動 1",
        "4. 上升行動 2",
        "5. 轉折點／抉擇",
        "6. 結局／結果",
      ] },
      { title: "Part G · 修補故事跳躍", kind: "text", text: "在「之前」和「之後」兩個時刻之間加入一至兩個連接事件。之前：角色發現學校時鐘在倒數。跳躍：角色拯救學校免於消失。建立兩點之間的橋樑。" },
      { title: "Part H · 大綱質素檢查", kind: "list", items: [
        "故事有清楚的問題嗎？",
        "每個事件是否鋪墊或導致另一個事件？",
        "角色是否作出抉擇？",
        "結局是否由事件推展而來？",
      ] },
    ],
    checklist: [
      "我使用了故事山的階段。",
      "我包含了問題和上升行動。",
      "我的轉折點包含一個抉擇。",
      "我的結局由事件推展而來。",
      "我把 AI 當作大綱教練。",
    ],
    exitTicket: [
      "我的故事問題是……",
      "最重要的事件是……因為……",
      "我的結局顯示……",
    ],
  },

  6: {
    goals: [
      "我能寫出聽起來自然、並表現角色個性的對白。",
      "我能在一段場景中同時運用說話、動作和內心想法。",
      "我能寫一段揭示角色所思所感的內心獨白。",
      "我能用 AI 探索語氣和用詞，同時保持角色自己的聲音。",
    ],
    bigIdea: "角色不會以同一種方式說話或思考。對白顯示角色說甚麼；內心獨白顯示角色可能藏在心底的話。AI 可以提供選擇，但每個角色真正想表達甚麼，由你決定。",
    writingTask: "從你的故事大綱中揀一個時刻。寫一段約 120–160 字的短場景，包含至少四句對白、兩個動作節拍和一個內心想法。",
    aiStarter: "Give me three ways a shy character might ask for help. Keep each under ten words.",
    parts: [
      { title: "Part A · 角色真正想表達甚麼？", kind: "pairs", pairs: [
        { label: "「我不怕。你先走吧。」", value: "隱藏恐懼——想對方先行" },
        { label: "「那是一幅很有趣的畫。」", value: "妒忌、困惑或驚訝" },
        { label: "「我又忘記做功課了。」", value: "藉口或隱藏擔憂" },
        { label: "「不，真的。我完全沒事。」", value: "其實有事——逃避真相" },
      ] },
      { title: "Part B · 甚麼令對白自然？", kind: "pairs", pairs: [
        { label: "有清楚目的", value: "「Did you move the key?」 Mia asked." },
        { label: "聽起來像某個角色", value: "「Wait up! My shoelace is trying to escape!」" },
        { label: "包含動作或反應", value: "「I did not touch it.」 Jay pulled his hand away." },
        { label: "不會解釋一切", value: "「You know what happened last summer.」" },
        { label: "推動故事前進", value: "「The map is changing. We have five minutes.」" },
      ] },
      { title: "Part C · 說話、動作與想法", kind: "pairs", pairs: [
        { label: "只有對白：「我不進去。」", value: "對白＋動作＋內心想法：「我不進去。」Kai 一手仍放在門柄上。如果他走進去，奇怪的嗡嗡聲也許會停——但要是它又再響起呢？" },
        { label: "只有對白：「把信給我。」", value: "對白＋動作＋內心想法：「把信給我。」Nora 伸手，然後縮回。她不想他看見信封上自己的名字。" },
      ] },
      { title: "Part D · 閱讀示範場景", kind: "text", text: "「你也聽到了，對吧？」Leo 低聲說。Maya 瞪著黑暗的窗戶。「聽到甚麼？」敲擊聲再次響起——三下緩慢的敲門。Leo 的手指在口袋裏握緊鉛筆。他想告訴 Maya 那張紙條，但最後一行仍在他腦中燃燒：不要讓她聽到敲門聲。" },
      { title: "Part E · 賦予每個角色聲音", kind: "pairs", pairs: [
        { label: "謹慎害羞", value: "短答、停頓、禮貌用語——「Maybe… we could wait a little?」" },
        { label: "自信直接", value: "清楚命令、強勁動詞——「Open the door. I will handle the alarm.」" },
        { label: "搞笑緊張", value: "玩笑、誇張、快速轉變——「Great. A haunted locker. Exactly what I needed today.」" },
        { label: "好奇精力充沛", value: "大量問題、興奮細節——「But why is it glowing? And why is it warm?」" },
      ] },
      { title: "Part F · 對白標籤與動作節拍", kind: "pairs", pairs: [
        { label: "對白標籤：「I found it,」 Sam said.", value: "動作節拍：「I found it.」 Sam held up the muddy key." },
        { label: "對白標籤：「That is not my name,」 she whispered.", value: "動作節拍：「That is not my name.」 She folded the paper twice." },
        { label: "對白標籤：「Run!」 he shouted.", value: "動作節拍：「Run!」 He grabbed the backpack and pulled open the gate." },
      ] },
      { title: "Part G · 內心獨白", kind: "pairs", pairs: [
        { label: "即將打開神秘盒子", value: "如果我打開它，就不能假裝從未發現過它。" },
        { label: "犯了錯", value: "我現在就該說真話，趁謊言還未變大。" },
        { label: "聽到朋友呼喚", value: "拜託是 Maya。拜託不是紙條裏那個聲音。" },
        { label: "必須作出抉擇", value: "我可以守住祕密，也可以幫助需要我的人。" },
      ] },
      { title: "Part H · AI 如何幫助角色聲音", kind: "pairs", pairs: [
        { label: "「給我三個害羞角色可能求助的方式，每個不超過十個字。」", value: "我揀選並改動句子。" },
        { label: "「問我問題，幫我理解角色為甚麼沉默。」", value: "我決定角色的真正原因。" },
        { label: "「給我 ‘said’ 的替代詞，顯示不同語氣。」", value: "我揀符合場景的動詞。" },
        { label: "「在困難抉擇前建議三個可能想法。不要寫場景。」", value: "我選符合故事的想法。" },
      ] },
      { title: "Part I · 示範：補上缺少的一層", kind: "pairs", pairs: [
        { label: "第一版本", value: "「對不起我弄丟了你的鑰匙。」「我很生氣。」" },
        { label: "改善版本", value: "「你找到了？」June 問。「沒有。」Ben 一直看著地板。June 伸出手。「那你握著的是甚麼？」" },
      ] },
      { title: "Part J · 帶有潛台詞的對白", kind: "pairs", pairs: [
        { label: "「你先走吧。我在這裏等。」", value: "我害怕，但我不想攔住你。" },
        { label: "「那是一幅好畫。」", value: "我看不懂，或者我可能藏著妒忌。" },
        { label: "「沒關係。」", value: "其實很要緊，但我不想解釋。" },
        { label: "「我只是看看。」", value: "我在找東西，希望你沒發現。" },
      ] },
      { title: "Part K · 寫一段對白場景", kind: "text", text: "從你的故事大綱中揀一個時刻。寫一段約 120–160 字的短場景，包含至少四句對白、兩個動作節拍和一個內心想法。先計劃：誰在說話？每個角色想要甚麼？他們之間有甚麼問題或祕密？場景應營造甚麼氣氛？對話結束時有甚麼改變？" },
    ],
    checklist: [
      "我寫的對白有清楚目的。",
      "我的角色不會全部一模一樣地說話。",
      "我使用了動作節拍或反應。",
      "我包含了一個內心想法。",
      "我使用了潛台詞或隱藏含意。",
      "我把 AI 當作教練，而不是代寫。",
    ],
    exitTicket: [
      "一種不用說出名字就能展示感受的方法是……",
      "我作出的一個對白選擇是……",
      "一個揭示我角色的內心想法是……",
    ],
  },
  7: {
    goals: [
      "我能運用我的計劃，草擬一篇完整的短篇創意作品。",
      "我能寫一個介紹角色、地點和問題的開端。",
      "我能用動作、細節、對白或想法發展中段。",
      "我能寫一個顯示結果的結局，並為回饋做好準備。",
    ],
    bigIdea: "初稿是開始，不是最終答案。今天你會把想法變成一篇完整作品。繼續寫，作出明智選擇，並留時間重讀自己的作品。",
    writingTask: "寫你的第一篇完整創意作品，目標是有清楚的開端、中段和結局。小五學生可以使用句子開頭；小六學生應發展更強的個人聲音。",
    aiStarter: "Ask me questions to help me develop the most important moment of my draft.",
    parts: [
      { title: "Part A · 草稿前", kind: "plan", items: [
        "我寫的是哪種作品？（故事／詩／創意散文）",
        "主角是誰？",
        "主要問題或中心意念是甚麼？",
        "最重要的時刻是甚麼？",
        "作品會如何結束？",
      ] },
      { title: "Part B · 草稿提醒", kind: "pairs", pairs: [
        { label: "開端", value: "清楚的開場影像、角色、場景或問題。" },
        { label: "中段", value: "至少兩個事件、動作、反應或細節。" },
        { label: "重要時刻", value: "一個抉擇、發現、感受或改變。" },
        { label: "結局", value: "一個結果、最終影像、反思或問題。" },
        { label: "全文", value: "具體詞語、多變句式和你自己的聲音。" },
      ] },
      { title: "Part C · 草稿時負責任地使用 AI", kind: "pairs", pairs: [
        { label: "你可以請 AI……", value: "建議一個詞或短語 · 問關於你計劃的問題 · 提供兩個過渡選擇 · 幫你留意遺漏的細節" },
        { label: "不可請 AI……", value: "替你寫完整故事 · 取代你自己的點子 · 造出可盲目複製的段落 · 替你作所有重要決定" },
      ] },
      { title: "Part D · 我的第一篇完整草稿", kind: "text", text: "寫你的完整創意作品，目標是有清楚的開端、中段和結局。小五學生可以使用句子開頭；小六學生應發展更強的個人聲音。為作品加上標題。" },
      { title: "Part E · 快速重讀", kind: "plan", items: [
        "最清楚的影像係……",
        "最有趣的角色動作係……",
        "產生最強感受的部分係……",
        "我最想先改善的部分係……",
      ] },
      { title: "Part F · 初稿檢查", kind: "list", items: [
        "我的作品有清楚的中心意念或問題。",
        "我包含了幫助讀者想像的細節。",
        "我的角色／敘述者採取行動或表達想法。",
        "中段沒有跳得太快。",
        "結局給予讀者結果或最終感受。",
      ] },
    ],
    checklist: [
      "我寫了開端、中段和結局。",
      "我使用了自己的想法和聲音。",
      "我為第 8 課留下一個修訂目標。",
    ],
    exitTicket: [
      "我今天完成了……",
      "我感到自豪的部分是……",
      "我下一步想作的改善是……",
    ],
  },
  8: {
    goals: [
      "我能運用回饋找出甚麼清楚、甚麼需要改善。",
      "我能修訂情節清晰度、用詞和句式變化。",
      "我能把 AI 當作校對和修訂夥伴，同時保持對自己作品的擁有權。",
      "我能作出具體改動，而不只是修正小錯誤。",
    ],
    bigIdea: "修訂就是再看一次你的作品。有力的修訂可以加、刪、移動或替換詞語和意念。回饋不是對你的評價；它是幫助你的作品觸達讀者的資訊。",
    writingTask: "運用你的初稿、回饋和修訂清單寫出改善版本。小五學生可修訂選定段落；小六學生應修訂整篇作品。",
    aiStarter: "Point out possible spelling or grammar errors in my paragraph. List the sentence and explain the problem. Do not rewrite the whole piece.",
    parts: [
      { title: "Part A · 「更好」是甚麼意思？", kind: "pairs", pairs: [
        { label: "The place was nice.", value: "The garden smelled of wet soil and mint." },
        { label: "He went into the room.", value: "He slipped into the room before the bell rang." },
        { label: "She was scared.", value: "Her hand stopped inches from the handle." },
        { label: "Everything happened quickly.", value: "The lights flashed, the alarm screamed and the door slammed." },
      ] },
      { title: "Part B · 三個修訂問題", kind: "pairs", pairs: [
        { label: "清楚嗎？", value: "讀者能否跟隨角色、場景和事件？" },
        { label: "有效嗎？", value: "細節有沒有製造預期的感受？" },
        { label: "是我的嗎？", value: "最終作品是否反映自己的想法和聲音？" },
      ] },
      { title: "Part C · 有用的回饋", kind: "pairs", pairs: [
        { label: "「很好。」", value: "「開頭令我好奇，因為……」" },
        { label: "「加多啲細節。」", value: "「我想知道房間聽起來係點。」" },
        { label: "「結局好差。」", value: "「我明白事件，但我想看到角色點樣改變。」" },
        { label: "「改文法。」", value: "「檢查呢段嘅時態。」" },
      ] },
      { title: "Part D · AI 作為校對夥伴", kind: "pairs", pairs: [
        { label: "請 AI 找出可能的串字或文法錯誤", value: "你決定建議是否正確。" },
        { label: "請 AI 指出重複的詞語", value: "你揀哪個替換聽起來像你。" },
        { label: "請 AI 建議更清晰的句子", value: "你決定原文是否有刻意風格。" },
        { label: "請 AI 檢查對白標點", value: "你揀符合意思的標點。" },
      ] },
      { title: "Part E · 接受、改動或拒絕？", kind: "pairs", pairs: [
        { label: "The wind was very loud. → The wind howled.", value: "符合氣氛就接受；想保留平淡語氣就拒絕。" },
        { label: "I was so so tired. → I was exhausted.", value: "通常接受——消除意外重複。" },
        { label: "The room was dark. → The room was dark and silent.", value: "只有當靜默對故事重要才接受。" },
        { label: "The old door groaned. → The old door made a complaining noise.", value: "拒絕——長版本較弱。" },
      ] },
      { title: "Part F · 修訂第一輪：情節清晰度", kind: "list", items: [
        "我能識別主角嗎？",
        "我能識別主要問題或中心意念嗎？",
        "每個重要事件是否連接到下一個？",
        "結局是否由故事推展而來？",
      ] },
      { title: "Part G · 修訂第二輪：細節與語言", kind: "list", items: [
        "替換一個籠統名詞或動詞",
        "加入一個感官或具體細節",
        "刪除一個重複或不必要的詞",
        "合併或變化兩個短句",
        "在有需要處加入對白、動作或內心想法",
      ] },
      { title: "Part H · 修訂第三輪：句式變化", kind: "plan", items: [
        "強調用的短句",
        "流暢或細節用的長句",
        "以動作或場景開頭的句子",
        "揭示感受的提問或想法",
      ] },
      { title: "Part I · 我的修訂版草稿", kind: "text", text: "運用你的初稿、回饋和修訂清單寫出改善版本。小五學生可修訂選定段落；小六學生應修訂整篇作品。然後反思：我作出的最大改動是……這個改動幫助讀者是因為……我拒絕或改動的一個 AI 建議是……" },
    ],
    checklist: [
      "我先檢查情節清晰度，再檢查文法。",
      "我對詞語或句子作出了具體改動。",
      "我尊重地使用回饋。",
      "我檢查 AI 建議，而不是盲目接受。",
      "我的修訂版仍然聽起來像我。",
    ],
    exitTicket: [
      "回饋幫我留意到……",
      "我練習的一項修訂技巧是……",
      "我的寫作更清晰是因為……",
    ],
  },
  9: {
    goals: [
      "我能運用影像、物件和感官細節創作詩歌或影像式作品。",
      "我能運用明喻、暗喻和擬人法令意念生動。",
      "我能嘗試分行、節奏和重複。",
      "我能用 AI 探索影像和用詞，同時保持自己的意義和聲音。",
    ],
    bigIdea: "詩歌不一定需要講述完整故事。一首詩可以捕捉一種感受、一刻、一個影像或一個問題。AI 可以幫你留意可能性，但揀選影像、聲音和意義的是詩人。",
    writingTask: "揀一件物件，寫一首 8–12 行的短詩，包含一個比喻、一個感官細節和一個重複的詞或短語。然後寫一段約 100–130 字的影像式散文，以「On the day the sky turned orange, I found…」開頭。",
    aiStarter: "Give me five unusual images connected to rain. Do not write a poem.",
    parts: [
      { title: "Part A · 再看一眼", kind: "plan", items: [
        "學校鐘",
        "一枝鉛筆",
        "一扇窗",
        "一件雨衣",
        "一個萬字夾",
      ] },
      { title: "Part B · 甚麼是影像式寫作？", kind: "pairs", pairs: [
        { label: "操場圍欄旁的一隻鞋", value: "有人離開，或有人等待回來" },
        { label: "關上的門縫透出的光", value: "一個祕密、希望或新開始" },
        { label: "一個插滿花的裂杯", value: "受損之物仍可承載美麗" },
        { label: "卡在樹上的風箏", value: "自由、童年或被困住" },
      ] },
      { title: "Part C · 明喻與暗喻", kind: "pairs", pairs: [
        { label: "明喻", value: "The rain fell like a curtain.——雨遮蔽或分隔世界。" },
        { label: "明喻", value: "Her voice was as soft as folded paper.——溫柔而安靜。" },
        { label: "暗喻", value: "The playground was an empty ocean.——寬廣而孤單。" },
        { label: "暗喻", value: "The moon was a silver button.——細小、明亮而接近。" },
      ] },
      { title: "Part D · 擬人法", kind: "pairs", pairs: [
        { label: "The wind moved the curtains.", value: "The wind whispered through the curtains." },
        { label: "The clock made a sound.", value: "The clock complained about being awake." },
        { label: "The leaves fell.", value: "The leaves waved goodbye." },
        { label: "The rain hit the roof.", value: "The rain drummed on the roof." },
      ] },
      { title: "Part E · 閱讀示範詩", kind: "text", text: "The Lost Glove：一隻手套在早晨長椅下等待。它握住一小口袋昨天的寒冷。另一隻手套在某個溫暖的書包裏，想念著那隻曾經與它牽在一起的手。" },
      { title: "Part F · 用詞與聯想", kind: "pairs", pairs: [
        { label: "walk", value: "wander / hurry / drift / march / creep" },
        { label: "dark", value: "shadowy / black / quiet / hidden / empty" },
        { label: "look", value: "glance / stare / search / watch / notice" },
        { label: "happy", value: "bright / warm / sparkling / peaceful / excited" },
        { label: "sad", value: "hollow / lonely / grey / quiet / heavy" },
      ] },
      { title: "Part G · 節奏、重複與分行", kind: "pairs", pairs: [
        { label: "重複", value: "I wait. I wait. I wait.——顯示時間、不耐煩或希望。" },
        { label: "短行", value: "The door / opens.——製造停頓和強調。" },
        { label: "長行", value: "The river carries every secret under the bridges and away.——製造流動感。" },
        { label: "聲音模式", value: "click, crack, clatter——令一刻感覺嘈雜或活躍。" },
      ] },
      { title: "Part H · AI 如何幫助詩歌", kind: "pairs", pairs: [
        { label: "「給我五個與雨相關的不尋常影像。不要寫詩。」", value: "我揀選並改動一個影像。" },
        { label: "「給我安靜房間的明喻，並解釋每個的氣氛。」", value: "我揀符合的比喻。" },
        { label: "「就這個影像問我三個問題：樹上的紅絲帶。」", value: "我用自己聲音回答。" },
        { label: "「為我自己的句子建議不同的分行方式。」", value: "我揀想要的節奏。" },
      ] },
      { title: "Part I · 影像到意義階梯", kind: "text", text: "有力的影像可經四步成長。1. 物件：一條紅絲帶綁在樹上。2. 感官細節：它是濕的、鮮亮的，末端磨損。3. 動作／改變：風拉扯它，但結仍然繫住。4. 意義：有人正在努力記住一個承諾。建立你自己的階梯。" },
      { title: "Part J · 寫一首短詩", kind: "text", text: "揀 Part A 中的一件物件或你自己的點子，寫 8–12 行。包含一個比喻、一個感官細節和一個重複的詞或短語。為詩加上標題。" },
      { title: "Part K · 影像式散文", kind: "text", text: "影像式寫作不一定要是詩。寫一段短段落，以「On the day the sky turned orange, I found…」開頭，續寫約 100–130 字。包含至少三個感官細節和一個有更深意義的影像。" },
    ],
    checklist: [
      "我使用了清楚的中央影像和感官細節。",
      "我使用了明喻、暗喻或擬人法，並嘗試了節奏、重複或分行。",
      "使用 AI 時，我保持了自己的聲音和意義。",
    ],
    exitTicket: [
      "我的中央影像是……",
      "我使用的一種詩歌技巧是……",
      "AI 幫我探索……但我決定……",
    ],
  },
  10: {
    goals: [
      "我能分辨校對與改善意念和風格。",
      "我能請 AI 提供聚焦的編輯建議。",
      "我能接受、改動或拒絕建議，同時保持自己的意義和聲音。",
      "我能解釋自己寫作中所作的編輯決定。",
    ],
    bigIdea: "AI 可以像一位指出可能問題的編輯夥伴。它不是作者，也不永遠正確。作者必須閱讀每個建議、檢查意義，並作最終決定。",
    writingTask: "從第 7 課草稿或另一篇作品中揀一個段落，逐一用四個編輯鏡頭處理：正確性、清晰度、用詞、聲音。寫出編輯後的段落並解釋你的決定。",
    aiStarter: "Find possible verb tense errors in this paragraph. List each sentence and explain the problem. Do not rewrite the whole story.",
    parts: [
      { title: "Part A · 校對還是修訂？", kind: "pairs", pairs: [
        { label: "校對", value: "檢查串字、標點、文法和打字錯誤。例：「She walk」→「She walked」。通常令寫作正確。" },
        { label: "修訂", value: "改變意念、次序、細節、用詞或句子效果。例：加入一個細節顯示她為甚麼緊張。令寫作更清晰、有力或有趣。" },
      ] },
      { title: "Part B · 四個編輯鏡頭", kind: "pairs", pairs: [
        { label: "正確性", value: "串字、文法或標點是否正確？The character walk → walks / walked" },
        { label: "清晰度", value: "讀者能理解意義嗎？當讀者不知道「it」指甚麼時，把它改清楚。" },
        { label: "用詞", value: "這是最準確的詞嗎？went → crept / hurried / wandered" },
        { label: "聲音", value: "句子聽起來像這位作者或角色嗎？不要用角色永遠不會用的詞取代簡單聲音。" },
      ] },
      { title: "Part C · 請 AI 提供聚焦協助", kind: "pairs", pairs: [
        { label: "太籠統：「令我的故事更好。」", value: "更聚焦：「找出可能的動詞時態錯誤，列出句子並解釋問題。不要重寫整個故事。」" },
        { label: "太籠統：「修正我的段落。」", value: "更聚焦：「識別這個段落重複使用超過兩次的詞語，並為每個建議兩個替換。」" },
        { label: "太籠統：「改善我的寫作。」", value: "更聚焦：「檢查對白標點是否清楚。只顯示可能的修正。」" },
        { label: "太籠統：「令它聽起來專業。」", value: "更聚焦：「建議這句一個更清晰的版本，但保留意義和我簡單的風格。」" },
      ] },
      { title: "Part D · 建立編輯提示詞", kind: "plan", items: [
        "文字／段落：我想檢查……",
        "編輯焦點：串字／時態／標點／重複詞語／清晰度……",
        "回應格式：列出句子、可能問題和原因。",
        "我的界線：不要重寫整篇或改變我的意義。",
      ] },
      { title: "Part E · 閱讀每個建議", kind: "pairs", pairs: [
        { label: "把「crept」改為「walked」，因為較簡單。", value: "如果「crept」承載你想要的氣氛，就拒絕。" },
        { label: "每個動作都加「suddenly」。", value: "拒絕——意外重複會削弱寫作。" },
        { label: "把「Mina」改為「the protagonist」。", value: "拒絕——會破壞與角色的親近感。" },
        { label: "把「They was waiting」改為「They were waiting」。", value: "接受——這是真正的文法錯誤。" },
      ] },
      { title: "Part F · 文法與時態檢查", kind: "pairs", pairs: [
        { label: "Yesterday, I walk to the park and find a silver key.", value: "Yesterday, I walked to the park and found a silver key." },
        { label: "The door opens, and the lights flashed.", value: "The door opened, and the lights flashed." },
        { label: "Mia was holding the note when the bell rings.", value: "Mia was holding the note when the bell rang." },
        { label: "They was waiting outside.", value: "They were waiting outside." },
      ] },
      { title: "Part G · 對白標點", kind: "pairs", pairs: [
        { label: "「Where are you going」 asked Leo.", value: "「Where are you going?」 asked Leo." },
        { label: "Mina said 「I found it.」", value: "Mina said, 「I found it.」" },
        { label: "「Stop」! shouted Kai.", value: "「Stop!」 shouted Kai." },
        { label: "「I know, she whispered, 「but I am still worried.」", value: "「I know,」 she whispered, 「but I am still worried.」" },
      ] },
      { title: "Part H · 重複詞語與精準選擇", kind: "pairs", pairs: [
        { label: "The old old house had an old door.", value: "The ageing house had a creaking door." },
        { label: "She looked at the map and looked at the clock.", value: "She studied the map, then glanced at the clock." },
        { label: "He was very tired, very cold and very hungry.", value: "He was exhausted, chilled and starving." },
      ] },
      { title: "Part I · 清晰度檢查", kind: "pairs", pairs: [
        { label: "When Ben spoke to Kai, he was angry.", value: "不清楚：誰生氣？寫明名字。" },
        { label: "Nora put the book beside the bag, but it was wet.", value: "不清楚：甚麼濕了？寫明物件。" },
        { label: "The teacher told the student that she should wait.", value: "不清楚：誰該等？重複名字。" },
      ] },
      { title: "Part J · 改善一個段落", kind: "text", text: "閱讀以下段落，作出至少四次有目的的編輯。你可以修正錯誤、改善清晰度或強化用詞。段落：Last Saturday, I go to the empty playground. The swings was moving even though there was no wind. I look at them and I feel scared. Then I hear my name, but I did not see nobody. 然後解釋：我接受的一個改動是……我改動或拒絕的一個建議是……" },
      { title: "Part K · 編輯我自己的草稿", kind: "plan", items: [
        "正確性：我發現了甚麼／我改動了甚麼",
        "清晰度：我發現了甚麼／我改動了甚麼",
        "用詞：我發現了甚麼／我改動了甚麼",
        "聲音：我發現了甚麼／我改動了甚麼",
      ] },
    ],
    checklist: [
      "我使用了聚焦的編輯請求。",
      "我檢查了文法、清晰度、用詞或聲音。",
      "我深思熟慮地接受、改動或拒絕建議。",
      "我沒有讓 AI 重寫我的整篇作品。",
      "我的最終段落仍然聽起來像我。",
    ],
    exitTicket: [
      "校對不同於修訂，因為……",
      "一個我可以使用的聚焦 AI 請求是……",
      "最終的編輯決定屬於……",
    ],
  },

  11: {
    goals: [
      "我能把一個短事件擴寫成清楚而引人入勝的場景。",
      "我能加入動作、情緒、場景細節、對白和內心想法。",
      "我能用 AI 建議可能的細節，同時選擇屬於我故事的內容。",
      "我能確保每個加入的細節都有目的。",
    ],
    bigIdea: "擴寫場景是放慢一個重要時刻，讓讀者可以親身經歷它。加入能揭示角色、營造氣氛或推動故事的細節。字數更多並不自動等於寫得更好。",
    writingTask: "從第 7 課草稿中揀一個短事件。先計劃各層，再寫約 120–160 字的擴寫場景。",
    aiStarter: "Give me three sensory details for my setting. Do not write a paragraph.",
    parts: [
      { title: "Part A · 缺少了甚麼？", kind: "plan", items: [
        "邊個女仔？佢係咩人？",
        "佢點解打開門？",
        "扇門睇落／聽落係點？",
        "佢見到、聽到、聞到或感覺到咩？",
        "佢打開門之後有咩改變？",
      ] },
      { title: "Part B · 場景擴寫公式", kind: "pairs", pairs: [
        { label: "動作", value: "角色做咩？——佢按咗門柄兩次。" },
        { label: "場景", value: "角色喺邊？——最後一次鈴聲後，走廊空無一人。" },
        { label: "感官細節", value: "可以見到、聽到、聞到或摸到咩？——金屬門柄又凍又濕。" },
        { label: "情緒／想法", value: "角色內心發生咩事？——如果佢而家轉身走，冇人會知道。" },
        { label: "對白／反應", value: "角色講咩，或有人點反應？——「Hello?」佢喚道。" },
        { label: "改變／後果", value: "呢一刻之後有咩唔同？——佢身後有盞燈亮起。" },
      ] },
      { title: "Part C · 閱讀示範擴寫", kind: "pairs", pairs: [
        { label: "短版本", value: "The girl opened the door." },
        { label: "擴寫版本", value: "The girl pressed her ear against the classroom door. Nothing moved inside, but a warm smell of cinnamon slipped through the gap. She turned the handle slowly. The hinges gave a tired squeak, and a strip of golden light fell across her shoes. “Hello?” she whispered. From somewhere in the dark, a second voice answered her name." },
      ] },
      { title: "Part D · 有目的的細節", kind: "pairs", pairs: [
        { label: "破損的衣袖", value: "顯示近期的掙扎或艱辛旅程。" },
        { label: "停下的時鐘", value: "製造線索、時間壓力或怪異氣氛。" },
        { label: "角色藏起雙手", value: "暗示恐懼、內疚或祕密。" },
        { label: "橙的氣味", value: "連繫到記憶、物件或早前線索。" },
      ] },
      { title: "Part E · AI 作為擴寫教練", kind: "pairs", pairs: [
        { label: "「為呢個場景畀三個感官細節。唔好寫段落。」", value: "我揀一個符合氣氛嘅。" },
        { label: "「建議兩個顯示緊張角色嘅動作。」", value: "我改動動作以符合角色。" },
        { label: "「問我關於呢個場景可以有咩改變嘅問題。」", value: "我用自己嘅情節回答。" },
        { label: "「喺呢個事件之後畀兩個可能後果。」", value: "我揀屬於我故事嘅後果。" },
      ] },
      { title: "Part F · 加入動作與反應", kind: "plan", items: [
        "事件：窗突然破裂 → 動作＋反應",
        "事件：朋友話「我知你嘅祕密。」→ 動作＋反應",
        "事件：燈熄咗 → 動作＋反應",
        "事件：角色搵到失蹤嘅物件 → 動作＋反應",
      ] },
      { title: "Part G · 加入唔拖慢場景嘅對白", kind: "pairs", pairs: [
        { label: "揭示目標", value: "「我要喺日落前到橋。」" },
        { label: "製造張力", value: "「你一早知會發生呢件事。」" },
        { label: "提供資訊", value: "「條鑰匙只可以用一次。」" },
        { label: "改變形勢", value: "「等等——聲係嚟自袋入面。」" },
      ] },
      { title: "Part H · 加入內心想法", kind: "pairs", pairs: [
        { label: "聽到身後有腳步聲", value: "如果我跑，佢會知道我驚。" },
        { label: "朋友問真相", value: "我而家可以話俾佢知，但真相可能令一切破裂。" },
        { label: "見到熟悉嘅物件", value: "我之前見過嗰條紅線——喺失蹤嘅袋上。" },
      ] },
      { title: "Part I · 令場景保持推進", kind: "pairs", pairs: [
        { label: "如果段落以新線索結束……", value: "下一段可以顯示角色決定點做。" },
        { label: "如果段落以角色提問結束……", value: "下一段可以俾答案、驚喜或新問題。" },
        { label: "如果段落以強烈情緒結束……", value: "下一段可以顯示由情緒引起嘅動作。" },
        { label: "如果段落以場景細節結束……", value: "下一段可以將細節連繫到問題或目標。" },
      ] },
      { title: "Part J · 我的場景擴寫規劃器", kind: "text", text: "從第 7 課草稿揀一個短事件，寫前先計劃各層：用一句話講發生咩事？角色喺邊？角色做咩？角色感應到咩？角色感受或諗咩？邊句對白有幫助？場景結束時有咩改變？然後寫約 120–160 字嘅擴寫場景。" },
    ],
    checklist: [
      "我加入了動作、反應和感官或場景細節。",
      "我透過想法、對白或行為展示情緒，而細節幫助場景。",
      "我把 AI 當作擴寫教練，而不是代寫。",
    ],
    exitTicket: [
      "我擴寫嘅短事件係……",
      "我加入嘅一個有用細節係……",
      "場景喺……嘅時候改變咗。",
    ],
  },
  12: {
    goals: [
      "我能識別懸疑、奇幻和未來世界寫作嘅特徵。",
      "我能用一條文體規則或創作限制引導點子。",
      "我能用 AI 比較文體可能性，而唔會抄襲完整故事。",
      "我能寫一篇有清楚文體聲音嘅原創短篇。",
    ],
    bigIdea: "文體俾讀者某啲期望，但作者都可以令讀者驚喜。今日你會實驗一種文體、運用一條創作限制，並令最終故事屬於自己。",
    writingTask: "用你揀嘅文體寫一篇新嘅短篇。小五學生可寫約 150–200 字並獲得支援；小六學生可寫 200–300 字並發展更強嘅文體聲音。遵守一條創作限制。",
    aiStarter: "Give me three genre directions for my story seed and list common features of each genre. Do not write a story.",
    parts: [
      { title: "Part A · 文體特徵", kind: "pairs", pairs: [
        { label: "懸疑", value: "讀者可能期望問題、線索和揭曉。材料：嫌疑人、證據、煙幕、發現。" },
        { label: "奇幻", value: "讀者可能期望魔法、奇特生物或不可能嘅規則。材料：世界規則、任務、物件、抉擇、後果。" },
        { label: "未來世界", value: "讀者可能期望新科技、改變咗嘅社會或未來問題。材料：裝置、系統、發明、道德抉擇。" },
      ] },
      { title: "Part B · 一個點子，三種文體", kind: "pairs", pairs: [
        { label: "起始點子", value: "一個細路喺學校花園搵到一把鑰匙。" },
        { label: "懸疑", value: "鑰匙打開一個被人試圖隱藏嘅儲物櫃。" },
        { label: "奇幻", value: "鑰匙打開一扇只在月光下出現嘅門。" },
        { label: "未來世界", value: "鑰匙係一個被遺棄記憶檔案庫嘅存取碼。" },
      ] },
      { title: "Part C · 懸疑實驗", kind: "plan", items: [
        "主要問題：讀者想知咩？",
        "第一個線索",
        "可能嘅嫌疑人或解釋",
        "煙幕（red herring）",
        "最終揭曉",
      ] },
      { title: "Part D · 奇幻實驗", kind: "plan", items: [
        "有咩唔尋常或魔法？",
        "魔法可以做咩？",
        "魔法唔可以做咩？",
        "佢付出咩代價或改變咩？",
        "角色必須作咩抉擇？",
      ] },
      { title: "Part E · 未來世界實驗", kind: "plan", items: [
        "存在咩發明或系統？",
        "人哋每日點用佢？",
        "邊個受惠？",
        "佢可以製造咩問題或不公平？",
        "角色決定點做？",
      ] },
      { title: "Part F · AI 作為文體教練", kind: "pairs", pairs: [
        { label: "「畀我三個呢個故事種子嘅文體方向。」", value: "我揀一個並改編。" },
        { label: "「列出兒童友好懸疑嘅常見特徵。唔好寫故事。」", value: "我揀我需要嘅特徵。" },
        { label: "「問我問題令奇幻規則一致。」", value: "我用自己嘅諗法回答。" },
        { label: "「建議呢個發明引起嘅一個未來世界問題。」", value: "我決定佢係咪符合角色。" },
      ] },
      { title: "Part G · 創作限制", kind: "pairs", pairs: [
        { label: "包含一件出現三次嘅物件", value: "製造讀者可以跟隨嘅模式。" },
        { label: "以問題開頭", value: "立即吸引讀者。" },
        { label: "只用一句對白", value: "令嗰句對白更顯重要。" },
        { label: "以令人意外嘅影像結尾", value: "留下強烈嘅最終感受。" },
        { label: "透過訊息、便條或清單講故事", value: "改變成篇作品嘅形狀。" },
      ] },
      { title: "Part H · 比較文體開頭", kind: "pairs", pairs: [
        { label: "懸疑", value: "At 4:02, the empty locker received a message." },
        { label: "奇幻", value: "The river knew my name before I crossed it." },
        { label: "未來世界", value: "The app said I would forget my brother at noon." },
      ] },
      { title: "Part I · 示範文體轉換", kind: "pairs", pairs: [
        { label: "基本事件", value: "一個學生收到一封信。" },
        { label: "懸疑", value: "封信日期係聽日，並含一個關於失蹤老師嘅線索。" },
        { label: "奇幻", value: "封信由一座會說話嘅山寫嚟，要求學生歸還一顆被偷嘅星星。" },
        { label: "未來世界", value: "封信係學生年老記憶自動發出嘅訊息，警告一個決定。" },
      ] },
      { title: "Part J · 規劃我的文體作品", kind: "plan", items: [
        "我揀邊種文體？",
        "讀者期望咩？",
        "有咩會唔同或令人意外？",
        "我嘅角色係邊個，佢想要咩？",
        "邊個問題或疑問開始作品？",
        "會發生咩抉擇或改變？",
        "結局會留俾讀者咩感受？",
      ] },
      { title: "Part K · 草擬我的文體作品", kind: "text", text: "寫一篇新嘅短篇。小五學生可寫約 150–200 字並獲得支援；小六學生可寫 200–300 字並發展更強嘅文體聲音。先決定文體和限制，然後檢查：讀者能識別文體嗎？我用咗至少兩個文體特徵嗎？我有遵守創作限制嗎？角色有作抉擇或面對改變嗎？" },
    ],
    checklist: [
      "我揀咗懸疑、奇幻或未來世界。",
      "我用咗至少兩個文體特徵。",
      "我遵守一條創作限制。",
      "我嘅角色面對問題、抉擇或改變。",
      "我用 AI 攞可能性同回饋，而唔係抄襲故事。",
    ],
    exitTicket: [
      "我實驗咗……文體。",
      "我嘅創作限制係……",
      "令作品有呢種文體感覺嘅一個選擇係……",
    ],
  },
  13: {
    goals: [
      "我能揀出我想發展出版嘅作品。",
      "我能為讀者打磨標題、開頭和結尾。",
      "我能寫一段關於我嘅諗法同寫作選擇嘅作者的話。",
      "我能用 AI 攞選擇同回饋，同時保持作品原創同個人化。",
    ],
    bigIdea: "出版係為讀者準備寫作。一篇可出版嘅作品有清楚目的、合適標題、有力開頭、令人滿足嘅結尾，以及一位能解釋作品背後選擇嘅作者。",
    writingTask: "喺改善標題、開頭同結尾之後，抄寫或重寫你揀選嘅作品，然後用 60–100 字寫你嘅作者的話。",
    aiStarter: "Give me five title options based on my central image. Do not choose one for me.",
    parts: [
      { title: "Part A · 咩令你想讀？", kind: "list", items: [
        "The Door That Remembered Me",
        "At 4:02, the empty locker received a message.",
        "The Last Orange Tree on Earth",
      ] },
      { title: "Part B · 揀我最佳作品", kind: "pairs", pairs: [
        { label: "第 7 課第一篇完整草稿", value: "有開端、中段同結局嘅完整故事" },
        { label: "第 9 課詩／影像散文", value: "影像豐富，運用詩歌技巧" },
        { label: "第 12 課文體作品", value: "有清楚文體聲音同限制" },
        { label: "揀選標準", value: "一個清楚中心意念 · 我嘅聲音 · 讀者跟得到 · 我自豪嘅部分 · 我可以用聚焦修訂改善佢" },
      ] },
      { title: "Part C · 認識我嘅讀者", kind: "plan", items: [
        "邊個可能讀我嘅作品？",
        "我想讀者帶走咩感受或意念？",
        "有冇細節讀者可能唔明白？",
        "我應該透過寫作本身解釋咩，而唔係外加解釋？",
      ] },
      { title: "Part D · 建立有力標題", kind: "pairs", pairs: [
        { label: "直接", value: "The Missing Key" },
        { label: "影像式", value: "A Pocketful of Rain" },
        { label: "提問式", value: "Who Turned Off the Stars?" },
        { label: "暗示／懸疑", value: "The Door That Remembered" },
        { label: "象徵式", value: "Three Small Promises" },
      ] },
      { title: "Part E · 打磨開頭", kind: "pairs", pairs: [
        { label: "以動作開頭", value: "The key slipped from Mina’s hand and rolled under the locked door." },
        { label: "以突出影像開頭", value: "Every window in the city reflected a different moon." },
        { label: "以問題開頭", value: "What would you do if your shadow came home first?" },
        { label: "以問題開頭", value: "By breakfast, everyone had forgotten Leo’s name." },
      ] },
      { title: "Part F · 打磨結尾", kind: "pairs", pairs: [
        { label: "結果", value: "The door closed, but this time Mina had the key." },
        { label: "改變", value: "He still feared the dark; he simply stopped letting it choose for him." },
        { label: "最終影像", value: "The last paper boat carried her name towards the open sea." },
        { label: "問題／可能性", value: "Somewhere beyond the clouds, another bell began to ring." },
      ] },
      { title: "Part G · AI 作為出版教練", kind: "pairs", pairs: [
        { label: "「根據我嘅中央影像畀五個標題選項。唔好幫我揀。」", value: "我揀或改編標題。" },
        { label: "「話我知讀者可能從我嘅開頭明白咩。」", value: "我決定係咪要澄清。" },
        { label: "「問我結尾係咪連繫到中心意念。」", value: "我自己修訂結尾。" },
        { label: "「校對呢段最終段落，唔好改變我嘅聲音。」", value: "我檢查每個建議。" },
      ] },
      { title: "Part H · 出版風格檢查", kind: "list", items: [
        "標題：串字正確並清楚放置嗎？",
        "段落／行：分節對讀者有幫助嗎？",
        "名字同細節：名字、時態同重要事實一致嗎？",
        "標點：有檢查對白同句子結尾嗎？",
        "篇幅：作品完整並適合文集嗎？",
      ] },
      { title: "Part I · 寫作者的話", kind: "plan", items: [
        "咩啟發咗呢篇作品？",
        "我探索咗咩意念、感受或問題？",
        "我為邊個寫作選擇自豪？",
        "如果我用到 AI，佢點幫我？",
        "我自己作咗咩決定？",
      ] },
      { title: "Part J · 可出版草稿", kind: "text", text: "喺改善標題、開頭同結尾之後，抄寫或重寫你揀選嘅作品，並加上最終標題。然後用 60–100 字寫你嘅作者的話——要誠實、具體、清楚。唔好淨係話「AI 寫嘅」。解釋你自己嘅選擇。" },
    ],
    checklist: [
      "我揀咗最強嘅作品，並打磨咗標題、開頭同結尾。",
      "我檢查咗最終文本並寫咗作者的話。",
      "我保持咗對自己意念同最終選擇嘅擁有權。",
    ],
    exitTicket: [
      "我揀嘅作品係……因為……",
      "我嘅最終標題係……",
      "我嘅作者的話解釋咗……",
    ],
  },
  14: {
    goals: [
      "我能清楚分享我嘅寫作，並尊重咁聆聽另一位作者。",
      "我能就意義、語言同讀者效果提供同接收具體回饋。",
      "我能對標題、開頭、結尾同句子作最終改善。",
      "我能為班級文集準備一份乾淨嘅最終手稿。",
    ],
    bigIdea: "作者唔係單獨工作。分享幫助你發現讀者留意到、理解到或好奇咩。你決定邊啲回饋會令最終作品更清晰、更有力。",
    writingTask: "將你嘅最終版本抄入最終手稿頁。然後完成最終語言檢查：讀成篇作品、檢查每句嘅意義、檢查串字標點時態、檢查標題同作者資料。",
    aiStarter: "Summarise what a reader may understand from my piece in three points.",
    parts: [
      { title: "Part A · 讀者回應", kind: "plan", items: [
        "我留意到……",
        "我感受到……",
        "我好奇……",
      ] },
      { title: "Part B · 點樣分享寫作", kind: "pairs", pairs: [
        { label: "分享前", value: "揀一段短節錄或讀成篇。話俾聽眾知你需要邊類回饋。準備好面對唔同反應。" },
        { label: "分享時", value: "讀得慢而清晰。喺標題同重要時刻停頓。唔好為每個句子道歉。" },
        { label: "分享後", value: "多謝聽眾並記低有用回饋。決定接受、改動或保留咩。保持對最終選擇嘅擁有權。" },
      ] },
      { title: "Part C · 設定回饋焦點", kind: "plan", items: [
        "標題／開頭：佢令你想繼續讀嗎？",
        "清晰度：你明白個處境嗎？",
        "角色／感受：你留意到咩情緒或目標？",
        "結尾：有咩感受或問題留下？",
        "語言／影像：你記得邊個詞或影像？",
      ] },
      { title: "Part D · 俾具體回饋", kind: "pairs", pairs: [
        { label: "「好好。」", value: "「開頭令我好奇，因為我唔知封信係邊個寄。」" },
        { label: "「加多啲細節。」", value: "「我想知 Leo 喺張紙變暖時聽到咩。」" },
        { label: "「我鍾意。」", value: "「最終影像留喺我腦海，因為佢連繫到標題。」" },
        { label: "「改結尾。」", value: "「我明白發生咩事，但我想有一句顯示 Leo 嘅抉擇。」" },
      ] },
      { title: "Part E · 回饋句子開頭", kind: "pairs", pairs: [
        { label: "留意", value: "我留意到……" },
        { label: "讀者效果", value: "我感受到／想像到／好奇……" },
        { label: "問題", value: "我好奇嘅係……" },
        { label: "強項", value: "對我嚟講最強嘅部分係……因為……" },
        { label: "建議", value: "一個可能嘅下一步係……" },
      ] },
      { title: "Part F · 決定修訂咩", kind: "list", items: [
        "佢哋清楚理解嘅部分係……",
        "佢哋想知多啲嘅部分係……",
        "佢哋記得嘅詞或影像係……",
        "一個可能嘅修訂係……",
        "我會接受／改動／保留佢，因為……",
      ] },
      { title: "Part G · AI 作為最終回饋夥伴", kind: "pairs", pairs: [
        { label: "「用三點總結讀者可能從呢篇作品理解到咩。」", value: "我檢查總結係咪符合我嘅意圖。" },
        { label: "「列出讀者可能感到困惑嘅位置。」", value: "我決定係咪澄清。" },
        { label: "「建議呢句兩個較短版本。保留我嘅意義。」", value: "我揀或保留原文。" },
        { label: "「校對最終版本，只列出可能錯誤。」", value: "我自己檢查每個修正。" },
      ] },
      { title: "Part H · 最終修訂第一輪：意義", kind: "list", items: [
        "讀者能識別中心意念或問題嗎？",
        "作品有向清楚方向推進嗎？",
        "結尾連繫到中心意念嗎？",
        "有冇細節令人困惑或分心？",
      ] },
      { title: "Part I · 最終修訂第二輪：語言", kind: "list", items: [
        "用精確動詞替換一個含糊動詞",
        "刪除一個不必要嘅重複詞",
        "改善一句太長或令人困惑嘅句子",
        "加入一個令影像更強嘅細節",
        "檢查時態、串字同標點",
      ] },
      { title: "Part J · 最終修訂第三輪：呈現", kind: "list", items: [
        "標題清楚且串字正確",
        "段落或分行有助閱讀",
        "名字同重要細節保持一致",
        "對白標點已檢查",
        "如有需要已加入作者的話",
      ] },
      { title: "Part K · 準備最終手稿", kind: "text", text: "抄寫你嘅最終版本，寫得清楚或打字，以便提交到班級文集。包含：最終標題、作者姓名／班級資料、完整最終文本、作者的話，以及任何插圖或版面說明。" },
    ],
    checklist: [
      "我分享咗作品並尊重咁聆聽。",
      "我提供或接收咗具體回饋。",
      "我對意義同語言作咗最終改善。",
      "我檢查咗手稿嘅呈現。",
      "我已為班級展示同文集提交做好準備。",
    ],
    exitTicket: [
      "我收到最有用嘅回饋係……",
      "我作嘅最終改動係……",
      "我做編輯學到嘅一件事係……",
    ],
  },
  15: {
    goals: [
      "我能向觀眾分享一件完成嘅創意作品。",
      "我能解釋我嘅點子點樣由計劃發展到最終草稿。",
      "我能反思自己嘅寫作技巧、修訂習慣同負責任嘅 AI 使用。",
      "我能慶祝自己嘅成長，並俾其他作者尊重嘅肯定。",
    ],
    bigIdea: "一件完成嘅作品唔只係結尾；佢係你作為作者所作選擇嘅證據。今日你會展示作品、反思旅程，並揀出創意寫作嘅下一步。",
    writingTask: "完成文集提交檢查、寫你嘅最終提交聲明，並完成你嘅創意寫作反思。",
    aiStarter: "Ask me questions to help me reflect on how my writing has grown this term.",
    parts: [
      { title: "Part A · 我嘅寫作旅程", kind: "plan", items: [
        "課程開始時，我感覺……",
        "一個令我意外嘅點子係……",
        "我練習嘅一項寫作技巧係……",
        "一個改善咗我作品嘅修訂係……",
        "而家我感覺……",
      ] },
      { title: "Part B · 準備展示", kind: "plan", items: [
        "我分享邊篇作品？",
        "標題係咩？",
        "我會讀或講幾耐？",
        "觀眾應該聽到邊個短節錄？",
        "觀眾應該留意咩？",
      ] },
      { title: "Part C · 演講技巧", kind: "pairs", pairs: [
        { label: "之前", value: "練習困難嘅詞。標記停頓位置。確認標題同作者名準備好。" },
        { label: "期間", value: "講得清楚而唔好太快。可以時望吓觀眾。用聲音展示氣氛。" },
        { label: "之後", value: "多謝觀眾。尊重咁聆聽其他人。記低一個正面回應。" },
      ] },
      { title: "Part D · 讚賞另一位作者", kind: "list", items: [
        "我留意到……",
        "我想像到……",
        "我好奇嘅係……",
        "我欣賞嘅一個寫作選擇係……",
        "呢篇作品留喺我心裏，因為……",
      ] },
      { title: "Part E · 文集提交檢查", kind: "list", items: [
        "最終標題",
        "作者姓名／班級資料",
        "完整最終手稿",
        "作者的話",
        "正確嘅檔案或手寫副本",
        "如有需要嘅插圖／版面資料",
      ] },
      { title: "Part F · 課程與 AI", kind: "pairs", pairs: [
        { label: "AI 可以幫我……", value: "腦力激盪點子 · 比較詞語選擇 · 就草稿提問 · 留意可能錯誤" },
        { label: "我仍然需要……", value: "作重要嘅創作決定 · 揀符合我聲音嘅詞 · 檢查建議是否正確 · 保護我嘅意義同原創性" },
      ] },
      { title: "Part G · 我嘅寫作技巧：之前同而家", kind: "pairs", pairs: [
        { label: "產生故事點子", value: "之前 → 而家" },
        { label: "規劃故事結構", value: "之前 → 而家" },
        { label: "創造角色", value: "之前 → 而家" },
        { label: "運用細節同描寫", value: "之前 → 而家" },
        { label: "寫對白或聲音", value: "之前 → 而家" },
        { label: "修訂同校對", value: "之前 → 而家" },
        { label: "負責任咁使用 AI", value: "之前 → 而家" },
      ] },
      { title: "Part H · 我嘅創意寫作反思", kind: "plan", items: [
        "我變成咗邊種作者？",
        "我而家對計劃同修訂有咩理解？",
        "回饋點樣改變咗我嘅作品？",
        "我點樣使用 AI 而唔交出擁有權？",
        "下一篇作品我想嘗試咩？",
      ] },
      { title: "Part I · 我嘅下一個寫作目標", kind: "plan", items: [
        "點子：具體目標＋第一個行動",
        "描寫：具體目標＋第一個行動",
        "角色／對白：具體目標＋第一個行動",
        "結構／結尾：具體目標＋第一個行動",
        "修訂／編輯：具體目標＋第一個行動",
      ] },
      { title: "Part J · 課程回饋", kind: "list", items: [
        "課程最有用嘅部分係……",
        "我想再做一次嘅活動係……",
        "一個有挑戰性嘅地方係……",
        "我對未來作者嘅一個建議係……",
      ] },
    ],
    checklist: [
      "我分享咗或準備好完成嘅作品。",
      "我完成咗文集提交檢查。",
      "我反思咗自己嘅寫作成長。",
      "我解釋咗自己負責任咁使用 AI。",
      "我為創意寫作設定咗下一個目標。",
    ],
    exitTicket: [
      "我自豪嘅係我……",
      "我嘅寫作成長係因為……",
      "我嘅下一個創作步驟係……",
    ],
  },

};
const lessonActivitiesEn: Record<number, LessonActivity> = {

  1: {
    goals: [
      "I can explain how AI can support my writing without becoming the author.",
      "I can use the five stages of the StorySeed writing journey.",
      "I can write an original mini scene from my own imagination.",
      "I can make safe and responsible choices when using AI.",
    ],
    bigIdea: "AI can be a thinking partner. It can ask questions, offer possibilities and help us notice language choices. However, the writer makes the important decisions. Your ideas, experiences and voice belong to you.",
    writingTask: "Write a baseline mini scene of about 120-150 words beginning with: “When I opened the classroom door, everything was different.” Include a character, a surprising detail and one action. Do not use AI for this draft.",
    aiStarter: "Give me three possible problems for a story about a student who finds something surprising in a classroom. Ask me one question about each problem.",
    parts: [
      { title: "Part A · What Makes a Good Story?", kind: "pairs", pairs: [
        { label: "Character", value: "A student who is curious but afraid of making mistakes" },
        { label: "Want", value: "The student wants to find out who is leaving mysterious notes" },
        { label: "Problem", value: "The clues disappear whenever the student gets close" },
        { label: "Interesting detail", value: "The notes smell like oranges and are written on blue paper" },
      ] },
      { title: "Part B · What Can AI Do for a Writer?", kind: "pairs", pairs: [
        { label: "Generate possibilities", value: "Suggest three unusual settings for a mystery story." },
        { label: "Ask guiding questions", value: "Ask me what my character wants and what is stopping them." },
        { label: "Support vocabulary", value: "Give me five alternatives for “walk” and explain the mood of each word." },
        { label: "Notice revision points", value: "Point out a place where my paragraph may need clearer details." },
        { label: "Try a writing experiment", value: "Show how the same moment might feel in a funny or mysterious style." },
      ] },
      { title: "Part C · Coach or Ghostwriter?", kind: "pairs", pairs: [
        { label: "“Give me three possible problems for a story about a lost key. Ask me one question about each problem.”", value: "The writer chooses one problem and develops it — a writing coach." },
        { label: "“Write a 500-word story about a lost key. Make it exciting and use excellent vocabulary.”", value: "The AI creates the complete story for the student — a ghostwriter." },
      ] },
      { title: "Part D · Read the Model", kind: "pairs", pairs: [
        { label: "An AI suggestion", value: "A student finds a door in the school library that only appears after sunset. Behind it is a room filled with clocks." },
        { label: "The student’s version", value: "At 4:05 p.m., Mina heard a tiny ticking sound under the library’s reading table. She pulled out a blue library book and found a key taped inside. It was warm, as if someone had just been holding it. Mina looked at the clock. The second hand had stopped." },
      ] },
      { title: "Part E · Responsible AI Rules", kind: "list", items: [
        "I ask for three ideas, compare them and change my favourite one — responsible.",
        "I copy an AI story and submit it as my own — not responsible.",
        "I ask for vocabulary choices, then choose the word that matches my meaning — responsible.",
        "I type my full name, phone number, address or passwords into a writing tool — not responsible.",
        "I check whether an AI suggestion makes sense and is suitable for school — responsible.",
      ] },
      { title: "Part F · The StorySeed Writing Journey", kind: "plan", items: [
        "1. Idea → a story seed",
        "2. Outline → a story map",
        "3. Draft → a complete draft",
        "4. Revision → a new version",
        "5. Submitted → a publication-ready piece",
      ] },
      { title: "Part G · Privacy Detective", kind: "pairs", pairs: [
        { label: "Safe story details", value: "A fictional character called Kai · a made-up school library · a character who likes mango ice cream" },
        { label: "Private information", value: "My home address · my phone number · my password or login code" },
      ] },
      { title: "Part H · My Baseline Mini Scene", kind: "text", text: "Write a short scene of about 120-150 words beginning with: “When I opened the classroom door, everything was different.” Include a character, a surprising detail and one action. Plan first: Where is the scene? Who is there? What is different or surprising? What does the character want? What will the character do next?" },
      { title: "Part I · Improve One Sentence", kind: "pairs", pairs: [
        { label: "The classroom was strange.", value: "Add a sound, colour, smell, movement or feeling." },
        { label: "I walked to the window.", value: "How did I walk? What did I notice?" },
        { label: "I saw a box.", value: "What did it look like? Why was it important?" },
      ] },
      { title: "Part J · Make a Responsible AI Request", kind: "plan", items: [
        "Role: You are a writing coach who asks helpful questions.",
        "My goal: I want help to…",
        "What AI must not do: Do not write the whole story for me.",
        "What I will decide: I will decide…",
        "Privacy check: I have removed names, contact details and private information.",
      ] },
    ],
    checklist: [
      "I can explain how AI can support a writer.",
      "I can distinguish a writing coach from a ghostwriter.",
      "I know the five StorySeed stages.",
      "I completed an original baseline scene.",
      "I will protect my private information.",
      "I will make the final decisions about my writing.",
    ],
    exitTicket: [
      "One useful thing AI can do for a writer is…",
      "One thing AI must not do for me is…",
      "The StorySeed stage I want to practise is… because…",
      "One privacy rule I will remember is…",
    ],
  },
  2: {
    goals: [
      "I can explain why a clear prompt gives better story ideas.",
      "I can build a prompt using genre, character, setting, problem and twist.",
      "I can compare AI suggestions and choose the idea with the most potential.",
      "I can change an AI suggestion so that it becomes my own original story seed.",
    ],
    bigIdea: "A prompt is a set of directions. The more useful details you give, the more useful the ideas may be. AI can suggest possibilities, but you are the writer who chooses, changes and adds meaning.",
    writingTask: "Complete your Story Seed Card: working title, genre, main character and goal, setting and atmosphere, main problem, interesting object or clue, and a twist. Then write a 3-5 sentence story seed telling who, where, what problem and what question.",
    aiStarter: "Compare these three story seeds and tell me which has the strongest problem and why.",
    parts: [
      { title: "Part A · One Word, Many Stories", kind: "pairs", pairs: [
        { label: "The key is very small and made of silver", value: "A lost treasure or a tiny lock" },
        { label: "The key is warm even though it is snowing", value: "Something alive or recently held" },
        { label: "The key is hidden inside a library book", value: "A secret message or a hidden room" },
        { label: "The key is labelled “Do not use before midnight”", value: "A mystery or a rule waiting to be broken" },
      ] },
      { title: "Part B · What Is a Prompt?", kind: "pairs", pairs: [
        { label: "Prompt A: too general", value: "Give me a story idea." },
        { label: "Prompt B: more useful", value: "You are a writing helper. Give me three mystery story seeds for an upper-primary student. The main character is a quiet but clever student. The setting is a school library after class. Add one surprising but suitable problem." },
      ] },
      { title: "Part C · The Prompt Formula", kind: "pairs", pairs: [
        { label: "Role", value: "What should AI be? — a writing helper" },
        { label: "Task", value: "What should AI do? — give me three story seeds" },
        { label: "Genre", value: "What kind of story? — mystery / fantasy / adventure" },
        { label: "Character", value: "Who is the story about? — a brave P5 student" },
        { label: "Setting", value: "Where and when? — the school library at night" },
        { label: "Problem / Twist", value: "What makes it interesting? — the map changes every hour" },
      ] },
      { title: "Part D · Build Your Prompt: Step 1", kind: "plan", items: [
        "Genre: Mystery / Fantasy / Adventure / Funny story / Future world",
        "Main character",
        "Setting",
        "Time or weather",
        "Object or clue",
      ] },
      { title: "Part E · Build Your Prompt: Step 2", kind: "pairs", pairs: [
        { label: "Something disappears", value: "The class mascot vanishes before the school photo." },
        { label: "Something changes", value: "Every drawing in the art room moves when nobody is looking." },
        { label: "A secret is discovered", value: "A message is found behind a loose classroom tile." },
        { label: "A difficult choice", value: "The character can save one object, but not two." },
        { label: "A twist", value: "A simple idea can be twisted: a map shows places that do not exist yet; a voice comes from a forgotten photograph; footprints stop at the ceiling." },
      ] },
      { title: "Part F · My Complete Prompt", kind: "text", text: "Use your choices from Parts D and E. Try to include at least five parts of the prompt formula. Start with “You are a…” Then check: Does my prompt clearly say what I want? Does it include a character and a problem? Does it ask for ideas rather than a complete story? Is it suitable for school?" },
      { title: "Part G · Compare Three Story Seeds", kind: "pairs", pairs: [
        { label: "A. Every night, the school bell rings thirteen times, but only one student can hear it.", value: "Mystery and a special ability" },
        { label: "B. A student finds a talking pencil that answers every question—but never tells the truth.", value: "Fantasy with a problem of trust" },
        { label: "C. The class plant grows a new leaf with a tiny map printed on it.", value: "A small clue that grows" },
      ] },
      { title: "Part H · Make the Idea Your Own", kind: "pairs", pairs: [
        { label: "AI suggestion", value: "Character: a student who loves solving puzzles; Setting: the school library after class; Object: a map that changes; Problem: the map leads to a locked room." },
        { label: "My version", value: "Change at least three details and add something from your own imagination—not private information." },
      ] },
      { title: "Part I · Model: From AI Seed to My Story Seed", kind: "pairs", pairs: [
        { label: "AI seed", value: "A student discovers a hidden room in the school. The room contains objects from the future." },
        { label: "Writer’s changes", value: "The main character is Jo, who is always the last student waiting for the late school bus. One rainy afternoon, Jo follows a trail of glowing eraser crumbs to the old music room. Inside, every object has a date from tomorrow—but one object has today’s date." },
      ] },
      { title: "Part J · My Story Seed Card", kind: "plan", items: [
        "Story title (working title)",
        "Genre",
        "Main character and goal",
        "Setting and atmosphere",
        "Main problem",
        "Interesting object or clue",
        "Twist or unanswered question",
      ] },
      { title: "Part K · Prompt Practice: Fix the Prompt", kind: "text", text: "The prompt below is too short. Rewrite it by adding a genre, character, setting, problem and special direction. Too-short prompt: “Give me a story about a door.”" },
    ],
    checklist: [
      "I can explain why specific prompts are useful.",
      "I can use the prompt formula.",
      "I included a character, setting and problem.",
      "I added a twist or an unanswered question.",
      "I compared ideas before choosing one.",
      "I changed an AI seed and added my own voice.",
    ],
    exitTicket: [
      "One part of a prompt I used today was…",
      "The story seed I chose because…",
      "One detail I changed to make the idea my own was…",
      "One question I still have about my story is…",
    ],
  },
  3: {
    goals: [
      "I can create a character with a clear goal, strength, flaw and problem.",
      "I can show personality through actions, choices, dialogue and reactions.",
      "I can use AI to explore character possibilities without copying a complete character.",
      "I can make my character connect naturally to the story conflict.",
    ],
    bigIdea: "A believable character is more than a name and an appearance. Readers understand a character through what the character wants, fears, chooses and does. AI can suggest possibilities, but you decide who your character really is.",
    writingTask: "Write a character scene of about 100-130 words. Include your character’s goal, one action, one line of dialogue and one reaction.",
    aiStarter: "Ask me questions to discover what my character fears and what my character wants.",
    parts: [
      { title: "Part A · Guess the Character", kind: "pairs", pairs: [
        { label: "Keeps three different pencils in exactly the same order", value: "Careful or controlling" },
        { label: "Always notices when someone is left out", value: "Kind and observant" },
        { label: "Laughs when nervous", value: "Hides feelings with humour" },
        { label: "Refuses to ask for help", value: "Proud or afraid of looking weak" },
      ] },
      { title: "Part B · Character Building Blocks", kind: "pairs", pairs: [
        { label: "Goal", value: "What does the character want? — to find the missing dog" },
        { label: "Strength", value: "What can the character do well? — notices small details" },
        { label: "Flaw", value: "What makes things difficult? — does not trust others" },
        { label: "Fear", value: "What does the character want to avoid? — being blamed" },
        { label: "Need / growth", value: "What may the character learn? — asking for help can be brave" },
      ] },
      { title: "Part C · Character Profile", kind: "plan", items: [
        "Name / nickname",
        "Age or school year",
        "One visible detail",
        "One habit",
        "One important relationship",
        "A secret or private worry",
      ] },
      { title: "Part D · Show Personality Through Action", kind: "pairs", pairs: [
        { label: "Leo was brave.", value: "Leo stepped between the dog and the broken gate, even though his hands were shaking." },
        { label: "Nia was careful.", value: "Nia counted the keys twice before opening the smallest lock." },
        { label: "Sam was jealous.", value: "Sam smiled at the prize, then quietly moved the winning drawing behind the others." },
        { label: "Ivy was curious.", value: "Ivy read the warning twice and opened the door a third time." },
      ] },
      { title: "Part E · Character Voice", kind: "pairs", pairs: [
        { label: "Shy / careful", value: "Pauses, soft words, questions — “Maybe we could wait… just in case?”" },
        { label: "Direct / confident", value: "Commands, short sentences — “Open the gate. I will go first.”" },
        { label: "Funny / nervous", value: "Jokes, exaggeration — “Excellent. A haunted locker. My favourite.”" },
        { label: "Curious / energetic", value: "Many questions and details — “Why is it warm? And why is it humming?”" },
      ] },
      { title: "Part F · AI as a Character Coach", kind: "pairs", pairs: [
        { label: "“Give me five possible flaws for a character who wants to be a leader.”", value: "I choose one that creates a useful problem." },
        { label: "“Ask me questions to discover what my character fears.”", value: "I answer in my own ideas." },
        { label: "“Suggest three ways a shy character might ask for help. Keep them short.”", value: "I change the line so it sounds like my character." },
        { label: "“What might this character do when nervous? Give choices.”", value: "I select the action that fits my story." },
      ] },
      { title: "Part G · Model Character Profile: Kai", kind: "pairs", pairs: [
        { label: "Goal", value: "To prove he can solve the school mystery alone." },
        { label: "Strength", value: "He remembers routes and small visual details." },
        { label: "Flaw", value: "He refuses help because he fears looking weak." },
        { label: "Fear", value: "Being laughed at for making a mistake." },
        { label: "Choice", value: "He asks a younger student to help read a hidden map." },
        { label: "Change", value: "He learns that accepting help does not erase his skills." },
      ] },
      { title: "Part H · My Full Character Planner", kind: "plan", items: [
        "What does my character want at the start?",
        "What is the character afraid of?",
        "What strength helps the character?",
        "What flaw causes trouble?",
        "What difficult choice will the character face?",
        "What might the character understand by the end?",
      ] },
      { title: "Part I · Character in a Scene", kind: "text", text: "Write a short scene of about 100-130 words. Include your character’s goal, one action, one line of dialogue and one reaction. Plan first: Where is the character? What does the character want now? What gets in the way? What does the character say or do?" },
    ],
    checklist: [
      "My character has a clear goal.",
      "My character has a strength and a flaw.",
      "I showed personality through action or dialogue.",
      "My character connects to the story problem.",
      "I used AI as a coach, not a replacement writer.",
    ],
    exitTicket: [
      "My character’s goal is…",
      "A strength and flaw my character has are…",
      "One choice that reveals personality is…",
    ],
  },
  4: {
    goals: [
      "I can use the five senses to make a scene clearer and more vivid.",
      "I can replace general words with specific nouns, verbs and adjectives.",
      "I can use AI to explore vocabulary choices and sensory details.",
      "I can select, change and combine suggestions so that my description sounds like me.",
    ],
    bigIdea: "Details help readers see, hear, smell, taste and touch the story world. AI can offer vocabulary choices, but the writer chooses the detail that fits the character, mood and meaning.",
    writingTask: "Choose one important setting from your story and describe it. Try to include at least three senses and one specific verb.",
    aiStarter: "Give me five verbs for walking. Explain which one sounds nervous.",
    parts: [
      { title: "Part A · What Can You Notice?", kind: "plan", items: [
        "See",
        "Hear",
        "Smell",
        "Feel / touch",
        "Taste (real or imagined)",
      ] },
      { title: "Part B · General Words and Specific Words", kind: "pairs", pairs: [
        { label: "walked", value: "tiptoed / marched / shuffled / stumbled" },
        { label: "looked", value: "glanced / stared / peered / scanned" },
        { label: "said", value: "whispered / muttered / shouted / asked" },
        { label: "big", value: "towering / enormous / wide / bulky" },
        { label: "nice smell", value: "sweet / smoky / spicy / earthy" },
      ] },
      { title: "Part C · Show, Don’t Just Tell", kind: "pairs", pairs: [
        { label: "Mina was nervous.", value: "Her fingers twisted the corner of the paper. The clock sounded unusually loud." },
        { label: "The room was frightening.", value: "The light flickered. Something scratched behind the wall." },
        { label: "Leo was excited.", value: "He could not stop bouncing his knee. He read the message three times." },
        { label: "The soup was delicious.", value: "Steam curled above the bowl, and the ginger smell made her stomach rumble." },
      ] },
      { title: "Part D · Read the Model Paragraph", kind: "pairs", pairs: [
        { label: "Version 1: General", value: "The old classroom was strange. There was a box on the desk. I walked over to it and opened it." },
        { label: "Version 2: Detailed", value: "The old classroom smelled of dust and wet umbrellas. A narrow wooden box sat on the teacher’s desk, its brass lock shining under the flickering light. I crossed the room slowly. When my fingers touched the lid, the box gave a tiny click—as if it had been waiting for me." },
      ] },
      { title: "Part E · Build a Sensory Word Bank", kind: "list", items: [
        "Hear: crackling, echoing, humming, thudding, whispering",
        "See: glowing, shadowy, pale, sparkling, blurred",
        "Taste: bitter, salty, sour, creamy, minty",
        "Touch: rough, sticky, freezing, prickly, silky",
        "Smell: dusty, smoky, floral, damp, metallic",
      ] },
      { title: "Part F · Create an Atmosphere", kind: "pairs", pairs: [
        { label: "A school corridor", value: "mysterious" },
        { label: "A playground after rain", value: "peaceful / lonely" },
        { label: "A kitchen before a celebration", value: "excited / warm" },
        { label: "A classroom during a storm", value: "worried / magical" },
      ] },
      { title: "Part G · How AI Can Help With Description", kind: "pairs", pairs: [
        { label: "“Give me five verbs for walking. Explain which one sounds nervous.”", value: "I choose the verb that matches my character." },
        { label: "“Suggest sensory details for a rainy school playground. Do not write a paragraph.”", value: "I choose details that fit my story." },
        { label: "“Ask me three questions to make my setting more specific.”", value: "I answer the questions in my own words." },
        { label: "“Give me alternatives for ‘bright’. Include mood differences.”", value: "I decide whether the word is suitable." },
      ] },
      { title: "Part H · Detail Ladder", kind: "text", text: "A detail can become stronger when you add layers. 1. General: There was a bird. 2. Specific: A small blue bird perched on the window. 3. Sensory: Its wet feathers shivered as rain tapped the glass. 4. Meaning: It carried the same red thread as the missing class badge. Build your own ladder in four steps." },
      { title: "Part I · Describe an Important Object", kind: "plan", items: [
        "What is the object?",
        "What does it look like?",
        "What sound or smell does it have?",
        "How does it feel to touch?",
        "What memory or secret is connected to it?",
        "What comparison could I use? (like / as…as)",
      ] },
      { title: "Part J · Describe a Setting for Your Story", kind: "text", text: "Use your story outline and choose one important setting. Plan: Where is the scene? What can the character see, hear, smell or taste, feel? What mood should the reader feel? Then write your setting description with at least three senses and one specific verb." },
    ],
    checklist: [
      "I used at least three senses in my description.",
      "I replaced general words with specific choices.",
      "I used details to show a feeling or mood.",
      "I included a specific noun or verb.",
      "I used AI as a coach and changed suggestions so my writing sounds like me.",
    ],
    exitTicket: [
      "One sense I used today was…",
      "One detail that creates mood is…",
      "One way AI can help me revise description is…",
    ],
  },
  5: {
    goals: [
      "I can organise a story into a clear beginning, problem, rising action, turning point and ending.",
      "I can use a story mountain to plan events in a logical order.",
      "I can use AI to expand an outline without losing control of my story.",
      "I can check that each event causes or prepares for the next event.",
    ],
    bigIdea: "A story is easier to follow when events have a clear order. The character’s problem should create pressure, the turning point should involve a choice, and the ending should show what changes.",
    writingTask: "Complete your Story Outline Planner: beginning, problem, rising action 1, rising action 2, turning point / choice, and ending / result. Explain why each event matters.",
    aiStarter: "Ask me whether my events are in a clear order and suggest one obstacle for my character’s goal.",
    parts: [
      { title: "Part A · Put the Events in Order", kind: "list", items: [
        "The character finds a key inside a library book.",
        "The character notices a locked door under the stairs.",
        "The character decides whether to open the door.",
        "The character discovers why the key was hidden.",
      ] },
      { title: "Part B · The Story Mountain", kind: "pairs", pairs: [
        { label: "Beginning / set-up", value: "Introduce the character, setting and normal situation." },
        { label: "Problem", value: "Something changes or creates a goal." },
        { label: "Rising action", value: "Events make the problem harder." },
        { label: "Turning point", value: "The character makes an important choice." },
        { label: "Ending / result", value: "Show the consequence and what changes." },
      ] },
      { title: "Part C · Cause and Effect", kind: "pairs", pairs: [
        { label: "The map begins to fade → so…", value: "The character must hurry to find the way." },
        { label: "The character cannot ask the adults for help → because…", value: "The secret would be discovered." },
        { label: "The friend breaks the rule → therefore…", value: "The character must make a choice." },
      ] },
      { title: "Part D · Model Story Mountain", kind: "text", text: "Example: The Door Behind the Display Board. Beginning: Nia stays late to finish a drawing in an empty classroom. Problem: She finds a small door behind the display board. Rising action: The door opens only when she places her unfinished drawing beside it. Inside, she sees pictures of tomorrow. Turning point: One picture shows the school’s drawings being destroyed in a storm. Nia must warn everyone or protect the secret room. Ending: Nia warns the class and saves the drawings, but one new picture appears with her name on it." },
      { title: "Part E · AI as an Outline Coach", kind: "pairs", pairs: [
        { label: "“Give me two possible events between these two points.”", value: "I choose the event that fits." },
        { label: "“Ask me whether my events are in a clear order.”", value: "I revise the order myself." },
        { label: "“Suggest three obstacles for my character’s goal.”", value: "I choose one and change it." },
        { label: "“Tell me which event feels unnecessary and why.”", value: "I decide whether to remove it." },
      ] },
      { title: "Part F · My Story Outline Planner", kind: "plan", items: [
        "1. Beginning / set-up",
        "2. Problem",
        "3. Rising action 1",
        "4. Rising action 2",
        "5. Turning point / choice",
        "6. Ending / result",
      ] },
      { title: "Part G · Fix the Story Jump", kind: "text", text: "Add one or two connecting events between the before and after moments. Before: The character realises the school clock is counting backwards. Jump: The character saves the school from disappearing. Build the bridge between these points." },
      { title: "Part H · Outline Quality Check", kind: "list", items: [
        "Does the story have a clear problem?",
        "Does each event prepare for or cause another event?",
        "Does the character make a choice?",
        "Does the ending follow from the events?",
      ] },
    ],
    checklist: [
      "I used the Story Mountain stages.",
      "I included a problem and rising action.",
      "My turning point includes a choice.",
      "My ending follows from the events.",
      "I used AI as an outline coach.",
    ],
    exitTicket: [
      "My story problem is…",
      "The most important event is… because…",
      "My ending shows…",
    ],
  },

  6: {
    goals: [
      "I can write dialogue that sounds natural and shows a character’s personality.",
      "I can use speech, action and inner thoughts together in a scene.",
      "I can write an inner monologue that reveals what a character is thinking or feeling.",
      "I can use AI to explore tone and word choices while keeping my characters’ voices my own.",
    ],
    bigIdea: "Characters do not all speak or think in the same way. Dialogue shows what a character says; inner monologue shows what the character may keep inside. AI can offer alternatives, but you decide what each character truly means.",
    writingTask: "Use a moment from your story outline. Write a short scene of about 120-160 words. Include at least four lines of dialogue, two action beats and one inner thought.",
    aiStarter: "Give me three ways a shy character might ask for help. Keep each under ten words.",
    parts: [
      { title: "Part A · What Does the Character Really Mean?", kind: "pairs", pairs: [
        { label: "“I am not scared. You can go first.”", value: "Hiding fear — wants the other person to go first" },
        { label: "“That is a very interesting drawing.”", value: "Jealousy, confusion or surprise" },
        { label: "“I forgot to do the homework again.”", value: "Excuses or a hidden worry" },
        { label: "“No, really. I am perfectly fine.”", value: "Not fine — avoiding the truth" },
      ] },
      { title: "Part B · What Makes Dialogue Natural?", kind: "pairs", pairs: [
        { label: "It has a clear purpose", value: "“Did you move the key?” Mia asked." },
        { label: "It sounds like a character", value: "“Wait up! My shoelace is trying to escape!”" },
        { label: "It includes action or reaction", value: "“I did not touch it.” Jay pulled his hand away." },
        { label: "It does not explain everything", value: "“You know what happened last summer.”" },
        { label: "It moves the story forward", value: "“The map is changing. We have five minutes.”" },
      ] },
      { title: "Part C · Speech, Action and Thought", kind: "pairs", pairs: [
        { label: "Only dialogue: “I am not going in.”", value: "Dialogue + action + inner thought: “I am not going in.” Kai kept one hand on the door handle. If he stepped inside, the strange humming might stop—but what if it started again?" },
        { label: "Only dialogue: “Give me the letter.”", value: "Dialogue + action + inner thought: “Give me the letter.” Nora reached for it, then pulled her hand back. She did not want him to see her name on the envelope." },
      ] },
      { title: "Part D · Read the Model Scene", kind: "text", text: "“You heard that too, right?” Leo whispered. Maya stared at the dark window. “Heard what?” The tapping came again—three slow knocks. Leo’s fingers tightened around the pencil in his pocket. He wanted to tell Maya about the note, but the last line was still burning in his mind: Do not let her hear the tapping." },
      { title: "Part E · Give Each Character a Voice", kind: "pairs", pairs: [
        { label: "Careful and shy", value: "Short answers, pauses, polite words — “Maybe… we could wait a little?”" },
        { label: "Confident and direct", value: "Clear commands, strong verbs — “Open the door. I will handle the alarm.”" },
        { label: "Funny and nervous", value: "Jokes, exaggeration, quick changes — “Great. A haunted locker. Exactly what I needed today.”" },
        { label: "Curious and energetic", value: "Many questions, excited details — “But why is it glowing? And why is it warm?”" },
      ] },
      { title: "Part F · Dialogue Tags and Action Beats", kind: "pairs", pairs: [
        { label: "Dialogue tag: “I found it,” Sam said.", value: "Action beat: “I found it.” Sam held up the muddy key." },
        { label: "Dialogue tag: “That is not my name,” she whispered.", value: "Action beat: “That is not my name.” She folded the paper twice." },
        { label: "Dialogue tag: “Run!” he shouted.", value: "Action beat: “Run!” He grabbed the backpack and pulled open the gate." },
      ] },
      { title: "Part G · Inner Monologue", kind: "pairs", pairs: [
        { label: "About to open a mysterious box", value: "If I open it, I cannot pretend I never found it." },
        { label: "Has made a mistake", value: "I should tell the truth now, before the lie grows bigger." },
        { label: "Hears a friend calling", value: "Please let that be Maya. Please do not let it be the voice from the note." },
        { label: "Must make a choice", value: "I can keep the secret safe, or I can help someone who needs me." },
      ] },
      { title: "Part H · How AI Can Help With Character Voice", kind: "pairs", pairs: [
        { label: "“Give me three ways a shy character might ask for help. Keep each under ten words.”", value: "I choose and change the line." },
        { label: "“Ask me questions that will help me understand why my character is silent.”", value: "I decide the character’s real reason." },
        { label: "“Give me alternatives for ‘said’ that show different moods.”", value: "I choose the verb that fits the scene." },
        { label: "“Suggest three possible thoughts before a difficult choice. Do not write the scene.”", value: "I select the thought that matches my story." },
      ] },
      { title: "Part I · Model: Add the Missing Layer", kind: "pairs", pairs: [
        { label: "First version", value: "“I am sorry I lost your key.” “I am angry.”" },
        { label: "Improved version", value: "“You found it?” June asked. “No.” Ben kept his eyes on the floor. June held out her hand. “Then what are you holding?”" },
      ] },
      { title: "Part J · Dialogue with Subtext", kind: "pairs", pairs: [
        { label: "“You can go. I will wait here.”", value: "I am scared, but I do not want to stop you." },
        { label: "“That is a nice picture.”", value: "I do not understand it, or I may be hiding jealousy." },
        { label: "“It does not matter.”", value: "It matters a lot, but I do not want to explain." },
        { label: "“I was just looking.”", value: "I was searching for something and hope you did not notice." },
      ] },
      { title: "Part K · Write a Dialogue Scene", kind: "text", text: "Use a moment from your story outline. Write a short scene of about 120-160 words. Include at least four lines of dialogue, two action beats and one inner thought. Plan first: Who is speaking? What does each character want? What problem or secret is between them? What mood should the scene create? What changes by the end of the conversation?" },
    ],
    checklist: [
      "I wrote dialogue with a clear purpose.",
      "My characters do not all sound exactly the same.",
      "I used action beats or reactions.",
      "I included an inner thought.",
      "I used subtext or a hidden meaning.",
      "I used AI as a coach, not a ghostwriter.",
    ],
    exitTicket: [
      "One way to show a feeling without naming it is…",
      "One dialogue choice I made was…",
      "One inner thought that reveals my character is…",
    ],
  },
  7: {
    goals: [
      "I can use my plan to draft a complete short creative piece.",
      "I can write a beginning that introduces a character, place and problem.",
      "I can develop the middle with actions, details, dialogue or thoughts.",
      "I can write an ending that shows a result and prepare my draft for feedback.",
    ],
    bigIdea: "A first draft is a beginning, not a final answer. Today you will turn your ideas into a complete piece. Keep writing, make sensible choices and leave some time to read your work again.",
    writingTask: "Write your first complete creative piece. Aim for a clear beginning, middle and ending. P5 writers may use sentence starters; P6 writers should develop a stronger personal voice.",
    aiStarter: "Ask me questions to help me develop the most important moment of my draft.",
    parts: [
      { title: "Part A · Before I Draft", kind: "plan", items: [
        "What kind of piece am I writing? (story / poem / creative prose)",
        "Who is the main character?",
        "What is the main problem or central idea?",
        "What is the most important moment?",
        "How will the piece end?",
      ] },
      { title: "Part B · Drafting Reminders", kind: "pairs", pairs: [
        { label: "Beginning", value: "A clear opening image, character, setting or question." },
        { label: "Middle", value: "At least two events, actions, reactions or details." },
        { label: "Important moment", value: "A choice, discovery, feeling or change." },
        { label: "Ending", value: "A result, final image, reflection or question." },
        { label: "Throughout", value: "Specific words, varied sentences and your own voice." },
      ] },
      { title: "Part C · Use AI Responsibly While Drafting", kind: "pairs", pairs: [
        { label: "You may ask AI to…", value: "suggest a word or short phrase · ask questions about your plan · offer two possible transitions · help you notice a missing detail" },
        { label: "Do not ask AI to…", value: "write the complete story for you · replace your own ideas · create a paragraph to copy blindly · make all the important decisions" },
      ] },
      { title: "Part D · My First Complete Draft", kind: "text", text: "Write your complete creative piece. Aim for a clear beginning, middle and ending. P5 writers may use sentence starters; P6 writers should develop a stronger personal voice. Give your piece a title." },
      { title: "Part E · Quick Read-Through", kind: "plan", items: [
        "The clearest image is…",
        "The most interesting character action is…",
        "The part that creates the strongest feeling is…",
        "The part I want to improve first is…",
      ] },
      { title: "Part F · First-Draft Check", kind: "list", items: [
        "My piece has a clear central idea or problem.",
        "I included details that help the reader imagine.",
        "My character / speaker takes action or expresses an idea.",
        "The middle does not jump too quickly.",
        "The ending gives the reader a result or final feeling.",
      ] },
    ],
    checklist: [
      "I wrote a beginning, middle and ending.",
      "I used my own ideas and voice.",
      "I left myself a revision target for Lesson 8.",
    ],
    exitTicket: [
      "Today I completed…",
      "The part I am proud of is…",
      "The next improvement I want to make is…",
    ],
  },
  8: {
    goals: [
      "I can use feedback to identify what is clear and what needs improvement.",
      "I can revise plot clarity, word choice and sentence variety.",
      "I can use AI as a proofreading and revision partner while keeping ownership of my work.",
      "I can make specific changes instead of only correcting small mistakes.",
    ],
    bigIdea: "Revision means seeing your writing again. A strong revision can add, cut, move or replace words and ideas. Feedback is not a judgement of you; it is information that helps your writing reach the reader.",
    writingTask: "Use your first draft, feedback and the revision checklist. Write the improved version. P5 writers may revise selected paragraphs; P6 writers should revise the complete piece.",
    aiStarter: "Point out possible spelling or grammar errors in my paragraph. List the sentence and explain the problem. Do not rewrite the whole piece.",
    parts: [
      { title: "Part A · What Does “Better” Mean?", kind: "pairs", pairs: [
        { label: "The place was nice.", value: "The garden smelled of wet soil and mint." },
        { label: "He went into the room.", value: "He slipped into the room before the bell rang." },
        { label: "She was scared.", value: "Her hand stopped inches from the handle." },
        { label: "Everything happened quickly.", value: "The lights flashed, the alarm screamed and the door slammed." },
      ] },
      { title: "Part B · Three Revision Questions", kind: "pairs", pairs: [
        { label: "Is it clear?", value: "Can the reader follow the character, setting and events?" },
        { label: "Is it effective?", value: "Do the details create the intended feeling?" },
        { label: "Is it mine?", value: "Does the final writing reflect my own ideas and voice?" },
      ] },
      { title: "Part C · Feedback That Helps", kind: "pairs", pairs: [
        { label: "“It is good.”", value: "“The opening makes me curious because…”" },
        { label: "“Add more details.”", value: "“I want to know what the room sounds like.”" },
        { label: "“The ending is bad.”", value: "“I understand the event, but I want to see how the character changes.”" },
        { label: "“Fix grammar.”", value: "“Check the tense in this paragraph.”" },
      ] },
      { title: "Part D · AI as a Proofreading Partner", kind: "pairs", pairs: [
        { label: "Ask AI to identify possible spelling or grammar errors", value: "You decide whether the suggestion is correct." },
        { label: "Ask AI to point out repeated words", value: "You choose which replacement sounds like you." },
        { label: "Ask AI to suggest a clearer sentence", value: "You decide whether the original has a deliberate style." },
        { label: "Ask AI to check punctuation in dialogue", value: "You choose which punctuation follows your intended meaning." },
      ] },
      { title: "Part E · Accept, Change or Reject?", kind: "pairs", pairs: [
        { label: "The wind was very loud. → The wind howled.", value: "Accept if it fits your mood; reject if you want the plainer tone." },
        { label: "I was so so tired. → I was exhausted.", value: "Likely accept — removes accidental repetition." },
        { label: "The room was dark. → The room was dark and silent.", value: "Accept only if the silence matters to the story." },
        { label: "The old door groaned. → The old door made a complaining noise.", value: "Reject — the longer version is weaker." },
      ] },
      { title: "Part F · Revision Pass 1: Plot Clarity", kind: "list", items: [
        "Can I identify the main character?",
        "Can I identify the main problem or central idea?",
        "Does each important event connect to the next?",
        "Does the ending follow from the story?",
      ] },
      { title: "Part G · Revision Pass 2: Details and Language", kind: "list", items: [
        "Replace one general noun or verb",
        "Add one sensory or specific detail",
        "Remove one repeated or unnecessary word",
        "Combine or vary two short sentences",
        "Add dialogue, action or inner thought where useful",
      ] },
      { title: "Part H · Revision Pass 3: Sentence Variety", kind: "plan", items: [
        "Short sentence for emphasis",
        "Longer sentence for flow or detail",
        "Sentence beginning with an action or setting",
        "Question or thought that reveals feeling",
      ] },
      { title: "Part I · My Revised Draft", kind: "text", text: "Use your first draft, feedback and revision checklist. Write the improved version. P5 writers may revise selected paragraphs; P6 writers should revise the complete piece. Then reflect: The biggest change I made was… This change helps the reader because… One AI suggestion I rejected or changed was…" },
    ],
    checklist: [
      "I checked plot clarity before grammar.",
      "I made specific changes to words or sentences.",
      "I used feedback respectfully.",
      "I checked AI suggestions instead of accepting them blindly.",
      "My revised draft still sounds like me.",
    ],
    exitTicket: [
      "Feedback helped me notice…",
      "One revision skill I practised was…",
      "My writing is clearer because…",
    ],
  },
  9: {
    goals: [
      "I can use images, objects and sensory details to create a poem or image-based piece.",
      "I can use similes, metaphors and personification to make ideas vivid.",
      "I can experiment with line breaks, rhythm and repetition.",
      "I can use AI to explore images and word choices while keeping my own meaning and voice.",
    ],
    bigIdea: "Poetry does not always need to tell a complete story. A poem can capture a feeling, moment, image or question. AI can help you notice possibilities, but the poet chooses the images, sounds and meaning.",
    writingTask: "Choose one object and write a short image poem of 8-12 lines. Include one comparison, one sensory detail and one repeated word or phrase. Then write an image-based prose paragraph of about 100-130 words beginning with: “On the day the sky turned orange, I found…”",
    aiStarter: "Give me five unusual images connected to rain. Do not write a poem.",
    parts: [
      { title: "Part A · Look Again", kind: "plan", items: [
        "A school bell",
        "A pencil",
        "A window",
        "A raincoat",
        "A paper clip",
      ] },
      { title: "Part B · What Is Image-Based Writing?", kind: "pairs", pairs: [
        { label: "A single shoe beside the playground fence", value: "Someone has left, or someone is waiting to return" },
        { label: "Light under a closed door", value: "A secret, hope or a new beginning" },
        { label: "A cracked cup full of flowers", value: "Something damaged can still hold beauty" },
        { label: "A kite caught in a tree", value: "Freedom, childhood or being stuck" },
      ] },
      { title: "Part C · Simile and Metaphor", kind: "pairs", pairs: [
        { label: "Simile", value: "The rain fell like a curtain — the rain hides or separates the world." },
        { label: "Simile", value: "Her voice was as soft as folded paper — gentle and quiet." },
        { label: "Metaphor", value: "The playground was an empty ocean — wide and lonely." },
        { label: "Metaphor", value: "The moon was a silver button — small, bright and close." },
      ] },
      { title: "Part D · Personification", kind: "pairs", pairs: [
        { label: "The wind moved the curtains.", value: "The wind whispered through the curtains." },
        { label: "The clock made a sound.", value: "The clock complained about being awake." },
        { label: "The leaves fell.", value: "The leaves waved goodbye." },
        { label: "The rain hit the roof.", value: "The rain drummed on the roof." },
      ] },
      { title: "Part E · Read the Model Poem", kind: "text", text: "The Lost Glove: One glove waits under the morning bench. It holds a little pocket of yesterday’s cold. The other glove is somewhere inside a warm schoolbag, missing the hand that used to join them." },
      { title: "Part F · Word Choice and Connotation", kind: "pairs", pairs: [
        { label: "walk", value: "wander / hurry / drift / march / creep" },
        { label: "dark", value: "shadowy / black / quiet / hidden / empty" },
        { label: "look", value: "glance / stare / search / watch / notice" },
        { label: "happy", value: "bright / warm / sparkling / peaceful / excited" },
        { label: "sad", value: "hollow / lonely / grey / quiet / heavy" },
      ] },
      { title: "Part G · Rhythm, Repetition and Line Breaks", kind: "pairs", pairs: [
        { label: "Repetition", value: "I wait. I wait. I wait. — shows time, impatience or hope." },
        { label: "Short lines", value: "The door / opens. — creates pauses and emphasis." },
        { label: "Long line", value: "The river carries every secret under the bridges and away. — creates a flowing feeling." },
        { label: "Sound pattern", value: "click, crack, clatter — makes the moment feel noisy or active." },
      ] },
      { title: "Part H · How AI Can Help With Poetry", kind: "pairs", pairs: [
        { label: "“Give me five unusual images connected to rain. Do not write a poem.”", value: "I choose and change an image." },
        { label: "“Give me similes for a quiet room. Explain the mood of each.”", value: "I choose the comparison that fits." },
        { label: "“Ask me three questions about this image: a red ribbon on a tree.”", value: "I answer in my own voice." },
        { label: "“Suggest different line-break possibilities for my own sentence.”", value: "I choose the rhythm I want." },
      ] },
      { title: "Part I · Image to Meaning Ladder", kind: "text", text: "A powerful image can grow through four steps. 1. Object: A red ribbon is tied to a tree. 2. Sensory detail: It is wet, bright and fraying at the ends. 3. Action / change: The wind pulls it, but the knot holds. 4. Meaning: Someone is trying to remember a promise. Build your own ladder." },
      { title: "Part J · Write a Short Image Poem", kind: "text", text: "Choose one object from Part A or your own idea. Write 8-12 lines. Include one comparison, one sensory detail and one repeated word or phrase. Give your poem a title." },
      { title: "Part K · Image-Based Prose", kind: "text", text: "Image-based writing does not have to be a poem. Write a short paragraph that begins with: “On the day the sky turned orange, I found…” Continue for about 100-130 words. Include at least three sensory details and one image that has a deeper meaning." },
    ],
    checklist: [
      "I used a clear central image and sensory details.",
      "I used a simile, metaphor or personification and experimented with rhythm, repetition or line breaks.",
      "I kept my own voice and meaning when using AI.",
    ],
    exitTicket: [
      "My central image was…",
      "One poetic technique I used was…",
      "AI helped me explore… but I decided…",
    ],
  },
  10: {
    goals: [
      "I can distinguish proofreading from improving ideas and style.",
      "I can ask AI for focused editing suggestions.",
      "I can accept, change or reject suggestions while keeping my meaning and voice.",
      "I can explain the editing decisions I make in my own writing.",
    ],
    bigIdea: "AI can act like an editing partner who points out possible problems. It is not the author and it is not always correct. The writer must read every suggestion, check the meaning and make the final decision.",
    writingTask: "Use a paragraph from your Lesson 7 draft or another piece. Work through the four editing lenses one at a time: correctness, clarity, word choice, voice. Write your edited paragraph and explain your decisions.",
    aiStarter: "Find possible verb tense errors in this paragraph. List each sentence and explain the problem. Do not rewrite the whole story.",
    parts: [
      { title: "Part A · Proofreading or Revision?", kind: "pairs", pairs: [
        { label: "Proofreading", value: "Checks spelling, punctuation, grammar and typing errors. Example: “She walk” → “She walked.” Usually makes the writing correct." },
        { label: "Revision", value: "Changes ideas, order, detail, word choice or sentence effect. Example: add a detail showing why she was nervous. Makes the writing clearer, stronger or more interesting." },
      ] },
      { title: "Part B · Four Editing Lenses", kind: "pairs", pairs: [
        { label: "Correctness", value: "Is the spelling, grammar or punctuation correct? The character walk → walks / walked" },
        { label: "Clarity", value: "Can the reader understand the meaning? Change “it” when the reader does not know what it means." },
        { label: "Word choice", value: "Is this the most exact word? went → crept / hurried / wandered" },
        { label: "Voice", value: "Does the sentence sound like this writer or character? Do not replace a simple voice with words the character would never use." },
      ] },
      { title: "Part C · Ask AI for Focused Help", kind: "pairs", pairs: [
        { label: "Too broad: “Make my story better.”", value: "More focused: “Find possible verb tense errors. List the sentence and explain the problem. Do not rewrite the whole story.”" },
        { label: "Too broad: “Fix my paragraph.”", value: "More focused: “Identify repeated words in this paragraph and suggest two alternatives for each.”" },
        { label: "Too broad: “Improve my writing.”", value: "More focused: “Check whether the dialogue punctuation is clear. Show only possible corrections.”" },
        { label: "Too broad: “Make it sound professional.”", value: "More focused: “Suggest one clearer version of this sentence, but keep the meaning and my simple style.”" },
      ] },
      { title: "Part D · Build an Editing Prompt", kind: "plan", items: [
        "Text / section: I want to check…",
        "Editing focus: spelling / tense / punctuation / repeated words / clarity…",
        "Response format: List the sentence, possible issue and reason.",
        "My boundary: Do not rewrite the whole piece or change my meaning.",
      ] },
      { title: "Part E · Read Every Suggestion", kind: "pairs", pairs: [
        { label: "Change “crept” to “walked” because it is simpler.", value: "Reject if “crept” carries the mood you want." },
        { label: "Add “suddenly” to every action.", value: "Reject — accidental repetition weakens writing." },
        { label: "Change “Mina” to “the protagonist”.", value: "Reject — it damages the character’s closeness." },
        { label: "Correct “They was waiting” to “They were waiting”.", value: "Accept — this is a real grammar error." },
      ] },
      { title: "Part F · Grammar and Tense Check", kind: "pairs", pairs: [
        { label: "Yesterday, I walk to the park and find a silver key.", value: "Yesterday, I walked to the park and found a silver key." },
        { label: "The door opens, and the lights flashed.", value: "The door opened, and the lights flashed." },
        { label: "Mia was holding the note when the bell rings.", value: "Mia was holding the note when the bell rang." },
        { label: "They was waiting outside.", value: "They were waiting outside." },
      ] },
      { title: "Part G · Punctuation in Dialogue", kind: "pairs", pairs: [
        { label: "“Where are you going” asked Leo.", value: "“Where are you going?” asked Leo." },
        { label: "Mina said “I found it.”", value: "Mina said, “I found it.”" },
        { label: "“Stop”! shouted Kai.", value: "“Stop!” shouted Kai." },
        { label: "“I know, she whispered, “but I am still worried.”", value: "“I know,” she whispered, “but I am still worried.”" },
      ] },
      { title: "Part H · Repeated Words and Precise Choices", kind: "pairs", pairs: [
        { label: "The old old house had an old door.", value: "The ageing house had a creaking door." },
        { label: "She looked at the map and looked at the clock.", value: "She studied the map, then glanced at the clock." },
        { label: "He was very tired, very cold and very hungry.", value: "He was exhausted, chilled and starving." },
      ] },
      { title: "Part I · Clarity Check", kind: "pairs", pairs: [
        { label: "When Ben spoke to Kai, he was angry.", value: "Unclear: who was angry? Clarify the name." },
        { label: "Nora put the book beside the bag, but it was wet.", value: "Unclear: what was wet? Name the object." },
        { label: "The teacher told the student that she should wait.", value: "Unclear: who should wait? Repeat the name." },
      ] },
      { title: "Part J · Improve One Paragraph", kind: "text", text: "Read the paragraph and make at least four purposeful edits. You may correct errors, improve clarity or strengthen word choice. Paragraph: Last Saturday, I go to the empty playground. The swings was moving even though there was no wind. I look at them and I feel scared. Then I hear my name, but I did not see nobody. Then explain: One change I accepted was… One suggestion I changed or rejected was…" },
      { title: "Part K · Edit My Own Draft", kind: "plan", items: [
        "Correctness: What I found / What I changed",
        "Clarity: What I found / What I changed",
        "Word choice: What I found / What I changed",
        "Voice: What I found / What I changed",
      ] },
    ],
    checklist: [
      "I used a focused editing request.",
      "I checked grammar, clarity, word choice or voice.",
      "I accepted, changed or rejected suggestions thoughtfully.",
      "I did not allow AI to rewrite my whole piece.",
      "My final paragraph still sounds like me.",
    ],
    exitTicket: [
      "Proofreading is different from revision because…",
      "One focused AI request I can use is…",
      "The final editing decision belongs to…",
    ],
  },

  11: {
    goals: [
      "I can expand a short event into a clear and engaging scene.",
      "I can add action, emotion, setting details, dialogue and inner thoughts.",
      "I can use AI to suggest possible details while choosing what belongs in my story.",
      "I can make sure every added detail has a purpose.",
    ],
    bigIdea: "An expanded scene slows down an important moment so the reader can experience it. Add details that reveal character, create mood or move the story forward. More words do not automatically make better writing.",
    writingTask: "Choose a short event from your Lesson 7 draft. Plan the layers, then write your expanded scene of about 120-160 words.",
    aiStarter: "Give me three sensory details for my setting. Do not write a paragraph.",
    parts: [
      { title: "Part A · What Is Missing?", kind: "plan", items: [
        "Which girl? What is she like?",
        "Why does she open the door?",
        "What does the door look or sound like?",
        "What does she see, hear, smell or feel?",
        "What changes after she opens it?",
      ] },
      { title: "Part B · The Scene Expansion Formula", kind: "pairs", pairs: [
        { label: "Action", value: "What does the character do? — She pressed the handle twice." },
        { label: "Setting", value: "Where is the character? — The corridor was empty after the final bell." },
        { label: "Sensory detail", value: "What can be seen, heard, smelled or felt? — The metal handle was cold and damp." },
        { label: "Emotion / thought", value: "What is happening inside? — If she turned back now, nobody would know." },
        { label: "Dialogue / reaction", value: "What is said or how does someone react? — “Hello?” she called." },
        { label: "Change / consequence", value: "What is different after the moment? — A light switched on behind her." },
      ] },
      { title: "Part C · Read the Model Expansion", kind: "pairs", pairs: [
        { label: "Short version", value: "The girl opened the door." },
        { label: "Expanded version", value: "The girl pressed her ear against the classroom door. Nothing moved inside, but a warm smell of cinnamon slipped through the gap. She turned the handle slowly. The hinges gave a tired squeak, and a strip of golden light fell across her shoes. “Hello?” she whispered. From somewhere in the dark, a second voice answered her name." },
      ] },
      { title: "Part D · Details With a Purpose", kind: "pairs", pairs: [
        { label: "A torn sleeve", value: "Shows a recent struggle or difficult journey." },
        { label: "A clock that stops", value: "Creates a clue, time pressure or strange atmosphere." },
        { label: "A character hiding their hands", value: "Suggests fear, guilt or a secret." },
        { label: "A smell of oranges", value: "Connects to a memory, object or earlier clue." },
      ] },
      { title: "Part E · AI as an Expansion Coach", kind: "pairs", pairs: [
        { label: "“Give me three sensory details for this setting. Do not write a paragraph.”", value: "I choose one that fits my mood." },
        { label: "“Suggest two actions that show a nervous character.”", value: "I change the action to fit my character." },
        { label: "“Ask me questions about what could change in this scene.”", value: "I answer using my own plot." },
        { label: "“Give me two possible consequences after this event.”", value: "I choose the consequence that belongs in my story." },
      ] },
      { title: "Part F · Add Action and Reaction", kind: "plan", items: [
        "Event: A window suddenly breaks → action + reaction",
        "Event: A friend says, “I know your secret.” → action + reaction",
        "Event: The lights go out → action + reaction",
        "Event: The character finds the missing object → action + reaction",
      ] },
      { title: "Part G · Add Dialogue Without Slowing the Scene", kind: "pairs", pairs: [
        { label: "Reveal a goal", value: "“I need to reach the bridge before sunset.”" },
        { label: "Create tension", value: "“You knew this would happen.”" },
        { label: "Give information", value: "“The key only works once.”" },
        { label: "Change the situation", value: "“Wait—the sound is coming from inside the bag.”" },
      ] },
      { title: "Part H · Add Inner Thought", kind: "pairs", pairs: [
        { label: "Hears footsteps behind them", value: "If I run, it will know I am afraid." },
        { label: "A friend asks for the truth", value: "I could tell her now, but the truth might break everything." },
        { label: "Sees a familiar object", value: "I had seen that red thread before—on the missing bag." },
      ] },
      { title: "Part I · Keep the Scene Moving", kind: "pairs", pairs: [
        { label: "If the paragraph ends with a new clue…", value: "The next paragraph could show the character deciding what to do." },
        { label: "If the paragraph ends with a character question…", value: "The next paragraph could give an answer, surprise or new question." },
        { label: "If the paragraph ends with a strong emotion…", value: "The next paragraph could show an action caused by that emotion." },
        { label: "If the paragraph ends with a setting detail…", value: "The next paragraph could connect the detail to the problem or goal." },
      ] },
      { title: "Part J · My Scene Expansion Planner", kind: "text", text: "Choose a short event from your Lesson 7 draft. Plan the layers before writing: What is happening in one sentence? Where is the character? What does the character do? What can the character sense? What does the character feel or think? What line of dialogue could help? What changes by the end of the scene? Then write your expanded scene of about 120-160 words." },
    ],
    checklist: [
      "I added action, reaction and sensory or setting details.",
      "I showed emotion through thought, dialogue or behaviour, and my details help the scene.",
      "I used AI as an expansion coach, not a ghostwriter.",
    ],
    exitTicket: [
      "The short event I expanded was…",
      "One useful detail I added was…",
      "The scene changed when…",
    ],
  },
  12: {
    goals: [
      "I can identify features of Mystery, Fantasy and Future World writing.",
      "I can use a genre rule or creative constraint to guide my ideas.",
      "I can use AI to compare genre possibilities without copying a complete story.",
      "I can draft a short original piece with a clear genre voice.",
    ],
    bigIdea: "A genre gives readers certain expectations, but writers can also surprise them. Today you will experiment with a genre, use a creative constraint and make the final story your own.",
    writingTask: "Write a new short piece in your chosen genre. P5 writers may write about 150-200 words with support; P6 writers may write 200-300 words and develop a stronger genre voice. Follow one creative constraint.",
    aiStarter: "Give me three genre directions for my story seed and list common features of each genre. Do not write a story.",
    parts: [
      { title: "Part A · Genre Features", kind: "pairs", pairs: [
        { label: "Mystery", value: "Readers may expect questions, clues and a reveal. Ingredients: suspect, evidence, red herring, discovery." },
        { label: "Fantasy", value: "Readers may expect magic, unusual beings or impossible rules. Ingredients: world rule, quest, object, choice, consequence." },
        { label: "Future World", value: "Readers may expect new technology, changed society or future problems. Ingredients: device, system, invention, ethical choice." },
      ] },
      { title: "Part B · One Idea, Three Genres", kind: "pairs", pairs: [
        { label: "Starting idea", value: "A child finds a key in the school garden." },
        { label: "Mystery", value: "The key opens a locker that someone has tried to hide." },
        { label: "Fantasy", value: "The key opens a door that appears only under moonlight." },
        { label: "Future World", value: "The key is an access code to an abandoned memory archive." },
      ] },
      { title: "Part C · Mystery Experiment", kind: "plan", items: [
        "Main question: What does the reader want to know?",
        "First clue",
        "Possible suspect or explanation",
        "Red herring",
        "Final reveal",
      ] },
      { title: "Part D · Fantasy Experiment", kind: "plan", items: [
        "What is unusual or magical?",
        "What can the magic do?",
        "What can it not do?",
        "What does it cost or change?",
        "What choice must the character make?",
      ] },
      { title: "Part E · Future World Experiment", kind: "plan", items: [
        "What invention or system exists?",
        "How do people use it every day?",
        "Who benefits from it?",
        "What problem or unfairness could it create?",
        "What does the character decide?",
      ] },
      { title: "Part F · AI as a Genre Coach", kind: "pairs", pairs: [
        { label: "“Give me three genre directions for this story seed.”", value: "I choose one and adapt it." },
        { label: "“List common features of a child-friendly mystery. Do not write a story.”", value: "I choose the features I need." },
        { label: "“Ask me questions to make my fantasy rule consistent.”", value: "I answer in my own ideas." },
        { label: "“Suggest a future-world problem caused by this invention.”", value: "I decide whether it fits my character." },
      ] },
      { title: "Part G · Creative Constraints", kind: "pairs", pairs: [
        { label: "Include one object that appears three times", value: "Creates a pattern the reader can follow." },
        { label: "Begin with a question", value: "Pulls the reader in immediately." },
        { label: "Use exactly one line of dialogue", value: "Makes that one line matter." },
        { label: "End with a surprising image", value: "Leaves a strong final feeling." },
        { label: "Tell the story through a message, note or list", value: "Changes the shape of the whole piece." },
      ] },
      { title: "Part H · Compare Genre Openings", kind: "pairs", pairs: [
        { label: "Mystery", value: "At 4:02, the empty locker received a message." },
        { label: "Fantasy", value: "The river knew my name before I crossed it." },
        { label: "Future World", value: "The app said I would forget my brother at noon." },
      ] },
      { title: "Part I · Model Genre Shift", kind: "pairs", pairs: [
        { label: "Basic event", value: "A student receives a letter." },
        { label: "Mystery", value: "The letter is dated tomorrow and contains a clue about a missing teacher." },
        { label: "Fantasy", value: "The letter is written by a talking mountain asking the student to return a stolen star." },
        { label: "Future World", value: "The letter is an automatic message from the student’s older memory, warning about a decision." },
      ] },
      { title: "Part J · Plan My Genre Piece", kind: "plan", items: [
        "Which genre am I choosing?",
        "What does the reader expect?",
        "What will be different or surprising?",
        "Who is my character and what do they want?",
        "What problem or question begins the piece?",
        "What choice or change will happen?",
        "What will the ending leave the reader feeling?",
      ] },
      { title: "Part K · Draft My Genre Piece", kind: "text", text: "Write a new short piece. P5 writers may write about 150-200 words with support; P6 writers may write 200-300 words and develop a stronger genre voice. Decide your genre and constraint first, then check: Can the reader identify the genre? Did I use at least two genre features? Did I follow my creative constraint? Does the character make a choice or face a change?" },
    ],
    checklist: [
      "I chose Mystery, Fantasy or Future World.",
      "I used at least two genre features.",
      "I followed a creative constraint.",
      "My character faces a problem, choice or change.",
      "I used AI for possibilities and feedback, not a copied story.",
    ],
    exitTicket: [
      "I experimented with the genre…",
      "My creative constraint was…",
      "One choice that made the piece feel like this genre was…",
    ],
  },
  13: {
    goals: [
      "I can select the piece of writing I want to develop for publication.",
      "I can polish my title, opening and ending for an audience.",
      "I can write a short Author’s Note about my ideas and writing choices.",
      "I can use AI for options and feedback while keeping my work original and personal.",
    ],
    bigIdea: "Publishing means preparing writing for readers. A publication-ready piece has a clear purpose, a suitable title, a strong opening, a satisfying ending and an author who can explain the choices behind the work.",
    writingTask: "Copy or rewrite your selected piece after making your title, opening and ending improvements. Then write your Author’s Note in 60-100 words.",
    aiStarter: "Give me five title options based on my central image. Do not choose one for me.",
    parts: [
      { title: "Part A · What Makes You Want to Read?", kind: "list", items: [
        "The Door That Remembered Me",
        "At 4:02, the empty locker received a message.",
        "The Last Orange Tree on Earth",
      ] },
      { title: "Part B · Choose My Best Work", kind: "pairs", pairs: [
        { label: "Lesson 7 first complete draft", value: "Full story with a beginning, middle and ending" },
        { label: "Lesson 9 poem / image prose", value: "Image-rich, uses poetic techniques" },
        { label: "Lesson 12 genre piece", value: "Has a clear genre voice and constraint" },
        { label: "Selection criteria", value: "One clear main idea · my own voice · readers can follow it · a part I am proud of · I can improve it with focused revision" },
      ] },
      { title: "Part C · Know My Audience", kind: "plan", items: [
        "Who might read my piece?",
        "What feeling or idea do I want readers to take away?",
        "Is there any detail a reader may not understand?",
        "What should I explain through the writing instead of an extra explanation?",
      ] },
      { title: "Part D · Create a Strong Title", kind: "pairs", pairs: [
        { label: "Direct", value: "The Missing Key" },
        { label: "Image-based", value: "A Pocketful of Rain" },
        { label: "Question", value: "Who Turned Off the Stars?" },
        { label: "Hint / mystery", value: "The Door That Remembered" },
        { label: "Symbolic", value: "Three Small Promises" },
      ] },
      { title: "Part E · Polish the Opening", kind: "pairs", pairs: [
        { label: "Begin with action", value: "The key slipped from Mina’s hand and rolled under the locked door." },
        { label: "Begin with a striking image", value: "Every window in the city reflected a different moon." },
        { label: "Begin with a question", value: "What would you do if your shadow came home first?" },
        { label: "Begin with a problem", value: "By breakfast, everyone had forgotten Leo’s name." },
      ] },
      { title: "Part F · Polish the Ending", kind: "pairs", pairs: [
        { label: "Result", value: "The door closed, but this time Mina had the key." },
        { label: "Change", value: "He still feared the dark; he simply stopped letting it choose for him." },
        { label: "Final image", value: "The last paper boat carried her name towards the open sea." },
        { label: "Question / possibility", value: "Somewhere beyond the clouds, another bell began to ring." },
      ] },
      { title: "Part G · AI as a Publication Coach", kind: "pairs", pairs: [
        { label: "“Give me five title options based on my central image. Do not choose one for me.”", value: "I choose or adapt the title." },
        { label: "“Tell me what a reader may understand from my opening.”", value: "I decide whether to clarify it." },
        { label: "“Ask whether my ending connects to the main idea.”", value: "I revise the ending myself." },
        { label: "“Proofread this final paragraph without changing my voice.”", value: "I check every suggestion." },
      ] },
      { title: "Part H · Publication Style Check", kind: "list", items: [
        "Title: Is it spelled correctly and placed clearly?",
        "Paragraphs / lines: Are breaks helpful for the reader?",
        "Names and details: Are names, tense and important facts consistent?",
        "Punctuation: Have I checked dialogue and sentence endings?",
        "Length: Is the piece complete and suitable for the anthology?",
      ] },
      { title: "Part I · Write an Author’s Note", kind: "plan", items: [
        "What inspired this piece?",
        "What idea, feeling or question did I explore?",
        "Which writing choice am I proud of?",
        "How did AI help, if I used it?",
        "What decision did I make myself?",
      ] },
      { title: "Part J · Publication-Ready Draft", kind: "text", text: "Copy or rewrite your selected piece after making your title, opening and ending improvements. Give it a final title. Then write your Author’s Note in 60-100 words — be honest, specific and clear. Do not simply say “AI wrote it.” Explain your own choices." },
    ],
    checklist: [
      "I selected my strongest piece and polished the title, opening and ending.",
      "I checked the final text and wrote an Author’s Note.",
      "I kept ownership of my ideas and final choices.",
    ],
    exitTicket: [
      "The piece I selected is… because…",
      "My final title is…",
      "My Author’s Note explains…",
    ],
  },
  14: {
    goals: [
      "I can share my writing clearly and listen respectfully to another writer.",
      "I can give and receive specific feedback about meaning, language and reader effect.",
      "I can make final improvements to my title, opening, ending and sentences.",
      "I can prepare a clean final manuscript for the class anthology.",
    ],
    bigIdea: "A writer does not work alone. Sharing helps you discover what a reader notices, understands or wonders about. You decide which feedback will make your final piece clearer and stronger.",
    writingTask: "Copy your final version into the Final Manuscript page. Then complete the Final Language Check: read the whole piece, check every sentence for meaning, check spelling, punctuation and tense, and check the title and author information.",
    aiStarter: "Summarise what a reader may understand from my piece in three points.",
    parts: [
      { title: "Part A · Reader Response", kind: "plan", items: [
        "I notice…",
        "I feel…",
        "I wonder…",
      ] },
      { title: "Part B · How to Share Writing", kind: "pairs", pairs: [
        { label: "Before sharing", value: "Choose a short section or read the whole piece. Tell listeners what kind of feedback you need. Be ready for different reactions." },
        { label: "While sharing", value: "Read slowly and clearly. Pause at the title and important moments. Do not apologise for every sentence." },
        { label: "After sharing", value: "Thank the listener and record useful feedback. Decide what to accept, change or leave. Keep ownership of the final choices." },
      ] },
      { title: "Part C · Set My Feedback Focus", kind: "plan", items: [
        "Title / opening: Does it make you want to continue?",
        "Clarity: What do you understand about the situation?",
        "Character / feeling: What emotion or goal do you notice?",
        "Ending: What feeling or question remains?",
        "Language / imagery: Which word or image do you remember?",
      ] },
      { title: "Part D · Give Specific Feedback", kind: "pairs", pairs: [
        { label: "“It is good.”", value: "“The opening makes me curious because I do not know who sent the envelope.”" },
        { label: "“Add more details.”", value: "“I want to know what Leo hears when the paper becomes warm.”" },
        { label: "“I like it.”", value: "“The final image stays in my mind because it connects to the title.”" },
        { label: "“Fix the ending.”", value: "“I understand what happens, but I want one sentence showing Leo’s choice.”" },
      ] },
      { title: "Part E · Feedback Sentence Starters", kind: "pairs", pairs: [
        { label: "Notice", value: "I noticed…" },
        { label: "Reader effect", value: "I felt / imagined / wondered…" },
        { label: "Question", value: "I was curious about…" },
        { label: "Strength", value: "The strongest part for me was… because…" },
        { label: "Suggestion", value: "One possible next step is…" },
      ] },
      { title: "Part F · Decide What to Revise", kind: "list", items: [
        "The part they understood clearly was…",
        "The part they wanted to know more about was…",
        "The word or image they remembered was…",
        "One possible revision is…",
        "I will accept / change / leave it because…",
      ] },
      { title: "Part G · AI as a Final Feedback Partner", kind: "pairs", pairs: [
        { label: "“Summarise what a reader may understand from this piece in three points.”", value: "I check whether the summary matches my intention." },
        { label: "“List any place where the reader may feel confused.”", value: "I decide whether to clarify it." },
        { label: "“Suggest two shorter versions of this sentence. Keep my meaning.”", value: "I choose or keep my original." },
        { label: "“Proofread the final version and list possible errors only.”", value: "I check each correction myself." },
      ] },
      { title: "Part H · Final Refinement Pass 1: Meaning", kind: "list", items: [
        "Can a reader identify the main idea or problem?",
        "Does the piece move in a clear direction?",
        "Does the ending connect to the central idea?",
        "Are there any details that confuse or distract?",
      ] },
      { title: "Part I · Final Refinement Pass 2: Language", kind: "list", items: [
        "Replace one vague verb with an exact verb",
        "Remove an unnecessary repeated word",
        "Improve one sentence that is too long or confusing",
        "Add one detail that creates a stronger image",
        "Check tense, spelling and punctuation",
      ] },
      { title: "Part J · Final Refinement Pass 3: Presentation", kind: "list", items: [
        "Title is clear and correctly spelled",
        "Paragraph or line breaks help reading",
        "Names and important details stay consistent",
        "Dialogue punctuation is checked",
        "Author’s Note is included if required",
      ] },
      { title: "Part K · Prepare My Final Manuscript", kind: "text", text: "Copy your final version. Write clearly or type it for submission to the class anthology. Include: final title, author name / class information, complete final text, Author’s Note, and any illustration or layout note." },
    ],
    checklist: [
      "I shared my work and listened respectfully.",
      "I gave or received specific feedback.",
      "I made final improvements to meaning and language.",
      "I checked the presentation of my manuscript.",
      "I am ready for the class showcase and anthology submission.",
    ],
    exitTicket: [
      "The most useful feedback I received was…",
      "The final change I made was…",
      "One thing I learned about being an editor is…",
    ],
  },
  15: {
    goals: [
      "I can share a completed creative work with an audience.",
      "I can explain how my idea developed from planning to final draft.",
      "I can reflect on my writing skills, revision habits and responsible AI use.",
      "I can celebrate my own growth and give respectful recognition to other writers.",
    ],
    bigIdea: "A finished piece is not only an ending; it is evidence of the choices you made as a writer. Today you will showcase your work, reflect on your journey and identify the next step in your creative writing.",
    writingTask: "Complete your anthology submission check, write your Final Submission Statement, and complete your Creative Writing Reflection.",
    aiStarter: "Ask me questions to help me reflect on how my writing has grown this term.",
    parts: [
      { title: "Part A · My Writing Journey", kind: "plan", items: [
        "At the beginning of the course, I felt…",
        "An idea that surprised me was…",
        "A writing skill I practised was…",
        "A revision that improved my work was…",
        "Now I feel…",
      ] },
      { title: "Part B · Prepare to Showcase", kind: "plan", items: [
        "Which piece am I sharing?",
        "What is the title?",
        "How long will I read or present?",
        "Which short section should the audience hear?",
        "What should the audience notice?",
      ] },
      { title: "Part C · Presentation Skills", kind: "pairs", pairs: [
        { label: "Before", value: "Practise the difficult words. Mark where to pause. Check that the title and author name are ready." },
        { label: "During", value: "Speak clearly and not too quickly. Look up when possible. Let your voice show the mood." },
        { label: "After", value: "Thank the audience. Listen respectfully to others. Record one positive response." },
      ] },
      { title: "Part D · Celebrate Another Writer", kind: "list", items: [
        "I noticed…",
        "I imagined…",
        "I was curious about…",
        "A writing choice I admired was…",
        "This piece stayed with me because…",
      ] },
      { title: "Part E · Anthology Submission Check", kind: "list", items: [
        "Final title",
        "Author name / class information",
        "Complete final manuscript",
        "Author’s Note",
        "Correct file or handwritten copy",
        "Illustration / layout information if needed",
      ] },
      { title: "Part F · The Course and AI", kind: "pairs", pairs: [
        { label: "AI can help me…", value: "brainstorm ideas · compare word choices · ask questions about a draft · notice possible errors" },
        { label: "I still need to…", value: "make the important creative decisions · choose words that fit my voice · check whether suggestions are correct · protect my meaning and originality" },
      ] },
      { title: "Part G · My Writing Skills Before and Now", kind: "pairs", pairs: [
        { label: "Generating story ideas", value: "Before → Now" },
        { label: "Planning story structure", value: "Before → Now" },
        { label: "Creating characters", value: "Before → Now" },
        { label: "Using details and description", value: "Before → Now" },
        { label: "Writing dialogue or voice", value: "Before → Now" },
        { label: "Revising and proofreading", value: "Before → Now" },
        { label: "Using AI responsibly", value: "Before → Now" },
      ] },
      { title: "Part H · My Creative Writing Reflection", kind: "plan", items: [
        "What kind of writer am I becoming?",
        "What do I now understand about planning and revision?",
        "How did feedback change my work?",
        "How did I use AI without giving away my ownership?",
        "What do I want to try in my next piece?",
      ] },
      { title: "Part I · My Next Writing Goal", kind: "plan", items: [
        "Ideas: my specific goal + first action",
        "Description: my specific goal + first action",
        "Characters / dialogue: my specific goal + first action",
        "Structure / endings: my specific goal + first action",
        "Revision / editing: my specific goal + first action",
      ] },
      { title: "Part J · Course Feedback", kind: "list", items: [
        "The most useful part of the course was…",
        "One activity I would like to do again is…",
        "One thing that was challenging was…",
        "One suggestion for future writers is…",
      ] },
    ],
    checklist: [
      "I shared or prepared my completed work.",
      "I completed my anthology submission check.",
      "I reflected on my writing growth.",
      "I explained my responsible use of AI.",
      "I set a next goal for my creative writing.",
    ],
    exitTicket: [
      "I am proud that I…",
      "My writing has grown because…",
      "My next creative step is…",
    ],
  },

};
const lessonActivities: Record<Lang, Record<number, LessonActivity>> = { zh: lessonActivitiesZh, en: lessonActivitiesEn };

/* Sample proofreading draft shown when the student has not saved a lesson piece. */
const defaultDraft = "星期六早上，我在校園後的小花園發現一扇以前沒有見過的門。門上有一枚會發光的葉子，當我伸手觸碰它時，耳邊傳來細小的歌聲。\n\n我不知道門後面是甚麼，但那個聲音好像正在叫我的名字。";

/*
 * UNFINISHED: stand-in anthology queue.
 * These five pieces are not rows from `anthologyItems`. Approve, reorder,
 * and the CSV export operate on this in-memory list. A logged-in teacher
 * can also call `anthology.select`, but these ids are not real writing ids.
 */
const initialSubmissions = [
  { id: 1, student: "P5-07", title: "The Door in the Garden", level: "P5", status: "待編輯", body: defaultDraft, category: "Fantasy", order: 1, note: "", confirmed: false },
  { id: 2, student: "P6-12", title: "A Message from Tomorrow", level: "P6", status: "待導師確認", body: "The message arrived before the day had begun.", category: "Future World", order: 2, note: "保留時間旅行的意念，建議加強結局。", confirmed: true },
  { id: 3, student: "P5-15", title: "The Cloud Collector", level: "P5", status: "已核准", body: "Mia collected clouds in glass jars.", category: "Fantasy", order: 3, note: "語氣清楚，適合收錄。", confirmed: true },
  { id: 4, student: "P6-03", title: "The Last Library", level: "P6", status: "待編輯", body: "Every book in the last library remembered its reader.", category: "Mystery", order: 4, note: "" },
  { id: 5, student: "P5-19", title: "A Small Brave Thing", level: "P5", status: "待導師確認", body: "I was not brave at first, but I opened the box.", category: "Realistic", order: 5, note: "" },
];

/* Bilingual UI strings. `t(lang, key)` reads this dictionary. Stored status values stay in Chinese. */
const ui: Record<Lang, Record<string, string>> = {
  zh: {
    heroSub: "一個安全、分級、保留原創聲音的寫作空間。學生在這裡學習、修訂及提交，導師則在 Anthology Studio 完成最後整理。",
    badgeP56: "P5 / P6",
    badgeCode: "校內代號",
    studiosTitle: "選擇工作區",
    studioProofNote: "校對、評分、下一步",
    studioCourseNote: "每堂有目標、有作品",
    studioAnthologyNote: "從收稿到出版清單",
    studioAssignNote: "建立任務並向全班發佈",
    studioAccountNote: "批量生成學生帳號",
    principleTitle: "平台原則",
    principleText: "AI 只會指出方向、錯誤和選擇，不會替學生寫完整作品。",
    headerAccount: "校本帳戶",
    headerDemo: "示範工作區",
    courseH2: "每一堂都有一個作品",
    courseSub: "由構思開始，逐步走到 final manuscript；每份小作品都會成為你的 Writer’s Journey。",
    savedCount: "已收藏 {n}/15",
    journeyTitle: "Writer’s Journey · 收藏你的創作證據",
    journeyText: "每堂只需完成一個小輸出，例如角色卡、感官描寫或出版稿。這些不是零碎功課，而是最後作品集的創作足跡。",
    lessonNum: "第 {n} 課 · {level}",
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
    studioAssignNote: "Create and publish writing tasks",
    studioAccountNote: "Generate student accounts in bulk",
    principleTitle: "Platform principle",
    principleText: "AI points out direction, mistakes and choices. It never writes complete pieces for students.",
    headerAccount: "School account",
    headerDemo: "Demo workspace",
    courseH2: "One piece of work every lesson",
    courseSub: "Start from ideas and move all the way to the final manuscript; every small piece becomes part of your Writer's Journey.",
    savedCount: "Saved {n}/15",
    journeyTitle: "Writer's Journey · Save your writing evidence",
    journeyText: "Complete one small output per lesson, such as a character card, sensory writing or a publication draft. These are not loose homework — they are the footsteps of your final anthology.",
    lessonNum: "Lesson {n} · {level}",
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

/* Strip emails and Hong Kong-style phone numbers before a draft is sent or saved. */
function redact(text: string) { return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[電郵已隱去]").replace(/(?:\+?852[ -]?)?\d{4}[ -]?\d{4}/g, "[電話已隱去]"); }

/*
 * Studio shell. Demo mode skips login. Saving a writing version requires
 * `user`; otherwise the button only shows a demo message.
 */
export default function Home() {
  const { user } = useAuth();
  const mode = window.location.pathname === "/student" ? "student" : window.location.pathname === "/teacher" ? "teacher" : "demo";
  const [studio, setStudio] = useState<Studio>(() => { const requested = new URLSearchParams(window.location.search).get("studio") as Studio | null; if (mode === "student") return requested === "course" ? "course" : "proofreading"; return requested && ["proofreading", "course", "anthology", "accounts", "overview", "assignments"].includes(requested) ? requested : mode === "teacher" ? "overview" : "proofreading"; });
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
  const journeyList = trpc.journey.list.useQuery(undefined, { enabled: Boolean(user) && mode === "student" });
  const saveJourney = trpc.journey.save.useMutation();
  const anthologyDesk = trpc.studio.anthologyDesk.useQuery(undefined, { enabled: Boolean(user) && mode === "teacher" });
  const updateAnthology = trpc.studio.updateAnthology.useMutation({ onSuccess: () => anthologyDesk.refetch() });
  useEffect(() => {
    if (journeyList.data) setJourneyOutputs(journeyList.data as Record<number, string>);
  }, [journeyList.data]);
  useEffect(() => {
    if (anthologyDesk.data?.length) {
      setSubmissions(anthologyDesk.data as typeof initialSubmissions);
      setSelectedSubmission(anthologyDesk.data[0]?.id ?? 1);
    }
  }, [anthologyDesk.data]);
  const activeSubmission = submissions.find((item) => item.id === selectedSubmission) ?? submissions[0];
  const wordCount = useMemo(() => draft.trim() ? draft.trim().split(/\s+/).length : 0, [draft]);
  const score = Math.min(100, Math.max(45, 55 + Math.min(20, Math.floor(wordCount / 4)) + (draft.includes("，") ? 8 : 0) + (draft.includes("。") ? 7 : 0)));

  const askCoach = () => { setCoachResult(null); setCoachError(null); coach.mutate({ mode: coachMode, draft: redact(draft), level }); };
  const saveStudentVersion = (nextStage: Stage = stage) => {
    if (!user) { setCoachResult(t(lang, "msgDemoSaved")); return; }
    if (writingId) { saveVersion.mutate({ writingId, stage: nextStage, body: redact(draft), studentNote: lang === "zh" ? `學生在 ${nextStage} 階段保存` : `Student saved at ${nextStage} stage` }); }
    else { createWriting.mutate({ assignmentId: selectedLesson, title: lessons[lang][selectedLesson - 1][0], body: redact(draft), stage: nextStage }, { onSuccess: (result) => { setWritingId(result.writingId); setCoachResult(t(lang, "msgRecordCreated")); } }); }
  };
  const updateSubmission = (id: number, patch: Partial<typeof submissions[number]>) => {
    setSubmissions((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    if (user) {
      const payload: Record<string, unknown> = { id };
      if (patch.student !== undefined) payload.authorCode = patch.student;
      if (patch.title !== undefined) payload.publicationTitle = patch.title;
      if (patch.category !== undefined) payload.category = patch.category;
      if (patch.status !== undefined) payload.status = patch.status;
      if (patch.note !== undefined) payload.editorNote = patch.note;
      if (patch.confirmed !== undefined) payload.studentConfirmed = patch.confirmed;
      if (patch.order !== undefined) payload.displayOrder = patch.order;
      if (patch.body !== undefined) payload.body = patch.body;
      if (Object.keys(payload).length > 1) updateAnthology.mutate(payload as any);
    }
  };
  const moveSubmission = (direction: -1 | 1) => setSubmissions((items) => { const index = items.findIndex((item) => item.id === selectedSubmission); const next = index + direction; if (index < 0 || next < 0 || next >= items.length) return items; const copy = [...items]; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy.map((item, idx) => ({ ...item, order: idx + 1 })); });
  const exportAnthology = () => { const rows = [["order", "authorCode", "title", "level", "category", "status", "editorNote"], ...submissions.map((item) => [String(item.order), item.student, item.title, item.level, item.category, item.status, item.note])]; const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "storyseed-anthology-content.csv"; link.click(); URL.revokeObjectURL(url); };

  return <div className="min-h-screen bg-[#f7f8f4] text-[#24332f]"><Header studio={studio} setStudio={setStudio} user={user} mode={mode} lang={lang} setLang={setLang} />
    <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-10">
      <section className="rounded-[30px] bg-[#dcebe3] px-6 py-8 md:px-10"><p className="eyebrow text-[#3b6b59]">Chung Sing School · StorySeed Studio</p><div className="mt-3 flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><div><h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-[#1e3b31] md:text-5xl">{lang === "zh" ? <>讓每一份作品，<br /><span className="text-[#b17235]">由草稿走到作品集。</span></> : <>Let every piece move<br /><span className="text-[#b17235]">from draft to anthology.</span></>}</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#49665a]">{t(lang, "heroSub")}</p></div><div className="flex flex-wrap gap-2"><Badge className="rounded-full bg-white/70 px-4 py-2 text-[#416254]">{t(lang, "badgeP56")}</Badge><Badge className="rounded-full bg-white/70 px-4 py-2 text-[#416254]"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" />{t(lang, "badgeCode")}</Badge></div></div></section>
      <div className="mt-7 grid gap-7 xl:grid-cols-[260px_minmax(0,1fr)]"><aside><p className="eyebrow">Three studios</p><h2 className="mt-1 text-xl font-semibold">{t(lang, "studiosTitle")}</h2><div className="mt-4 space-y-2">{([["overview", "Class Overview", "studioOverviewNote", GraduationCap], ["assignments", "Writing Assignments", "studioAssignNote", ClipboardList], ["proofreading", "Proofreading Studio", "studioProofNote", SearchCheck], ["course", "15-Lesson Course", "studioCourseNote", BookOpen], ["anthology", "Anthology Studio", "studioAnthologyNote", LayoutTemplate], ["accounts", "Account Desk", "studioAccountNote", Users]] as const).filter(([id]) => mode !== "student" || id === "proofreading" || id === "course").map(([id, title, noteKey, Icon]) => <button key={id} onClick={() => setStudio(id)} className={`w-full rounded-2xl p-4 text-left transition ${studio === id ? "bg-[#243f38] text-white shadow-[0_14px_30px_rgba(36,63,56,.18)]" : "bg-white text-[#31473e] hover:bg-[#edf5ef]"}`}><div className="flex items-start gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${studio === id ? "bg-[#f0c96a] text-[#354a3e]" : "bg-[#e4f0e7] text-[#4d8063]"}`}><Icon className="h-4 w-4" /></div><div><p className="text-sm font-semibold">{title}</p><p className={`mt-1 text-xs leading-5 ${studio === id ? "text-[#c4d9ce]" : "text-[#89968f]"}`}>{t(lang, noteKey)}</p></div></div></button>)}</div><div className="mt-5 rounded-2xl border border-dashed border-[#bed6c7] bg-[#edf6ef] p-4"><p className="text-xs font-semibold text-[#37634d]">{t(lang, "principleTitle")}</p><p className="mt-2 text-xs leading-5 text-[#628071]">{t(lang, "principleText")}</p></div></aside>
        <section>{studio === "overview" && <TeacherOverviewView lang={lang} />}{studio === "proofreading" && (mode === "teacher" ? <ProofreadingReviewView lang={lang} /> : <ProofreadingView lang={lang} level={level} setLevel={setLevel} draft={draft} setDraft={setDraft} score={score} wordCount={wordCount} evaluation={evaluation} coachMode={coachMode} setCoachMode={setCoachMode} askCoach={askCoach} coach={coach} coachResult={coachResult} coachError={coachError} saveStudentVersion={saveStudentVersion} writingId={writingId} saveEvaluation={saveEvaluation} journeyOutputs={journeyOutputs} />)}
          {studio === "course" && <CourseView lang={lang} level={level} setLevel={setLevel} selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson} stage={stage} setStage={setStage} draft={draft} setDraft={setDraft} saveStudentVersion={saveStudentVersion} journeyOutputs={journeyOutputs} setJourneyOutputs={setJourneyOutputs} saveJourney={saveJourney} writingId={writingId} user={user} />}
          {studio === "anthology" && <AnthologyView lang={lang} user={user} submissions={submissions} active={activeSubmission} selectedId={selectedSubmission} setSelectedId={setSelectedSubmission} updateSubmission={updateSubmission} moveSubmission={moveSubmission} feedback={feedback} setFeedback={setFeedback} exportAnthology={exportAnthology} />}{studio === "assignments" && <AssignmentsDesk user={user} />}{studio === "accounts" && <AccountsDesk lang={lang} user={user} t={t} />}
        </section></div>
    </main></div>;
}

/* Top bar: logo, studio tabs, language toggle. Students never see Overview, Anthology, or Accounts. */
function Header({ studio, setStudio, user, mode, lang, setLang }: { studio: Studio; setStudio: (studio: Studio) => void; user: unknown; mode: "demo" | "student" | "teacher"; lang: Lang; setLang: (lang: Lang) => void }) { return <header className="border-b border-[#e8ece7] bg-[#f7f8f4]/90 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-10"><div className="flex min-w-0 items-center"><img src="/logo_with_black_charity_info.png" alt="榮邦教育 Advanced Comet Education Limited" className="h-14 w-auto max-w-[180px] object-contain object-left sm:h-16 sm:max-w-[220px]" /></div><nav className="hidden rounded-full bg-white p-1 shadow-sm md:flex">{([["overview", "總覽", "Overview"], ["assignments", "寫作任務", "Assignments"], ["proofreading", "校對", "Proofreading"], ["course", "15 課", "15 Lessons"], ["anthology", "作品集", "Anthology"], ["accounts", "帳號", "Accounts"]] as const).filter(([id]) => mode !== "student" || id === "proofreading" || id === "course").map(([id, zhLabel, enLabel]) => <button key={id} onClick={() => setStudio(id)} className={`rounded-full px-4 py-2 text-xs font-semibold ${studio === id ? "bg-[#243f38] text-white" : "text-[#77877f]"}`}>{lang === "zh" ? zhLabel : enLabel}</button>)}</nav><div className="flex items-center gap-3"><button onClick={() => setLang(lang === "zh" ? "en" : "zh")} className="rounded-full border border-[#d5e2da] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f6b55] hover:bg-[#edf5ef]" aria-label="Switch language">{lang === "zh" ? "EN" : "繁中"}</button><div className="hidden text-right sm:block"><p className="text-xs font-semibold text-[#385449]">{user ? t(lang, "headerAccount") : t(lang, "headerDemo")}</p><p className="text-[11px] text-[#8a9791]">Chung Sing School</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4c58b] text-xs font-bold text-[#6c5429]">07</div></div></div></header>; }

/*
 * Student proofreading studio.
 * The piece picker loads a saved lesson draft or the demo garden-door text.
 * "Ask coach" and "Evaluate" call the LLM. Without an API key those calls
 * fail and the view shows the bilingual error string.
 */
function ProofreadingView({ lang, level, setLevel, draft, setDraft, wordCount, evaluation, coachMode, setCoachMode, askCoach, coach, coachResult, coachError, saveStudentVersion, writingId, saveEvaluation, journeyOutputs }: { lang: Lang } & Record<string, any>) {
  const [selectedPiece, setSelectedPiece] = useState(0);
  const pickPiece = (n: number) => { setSelectedPiece(n); setDraft(n === 0 ? defaultDraft : journeyOutputs[n] ?? defaultDraft); };
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
  return <div><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">Function 01 · Proofreading Studio</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{t(lang, "proofH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "proofSub")}</p></div><div className="flex rounded-full bg-white p-1 shadow-sm"><button onClick={() => setLevel("P5")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P5" ? "bg-[#243f38] text-white" : "text-[#7a8982]"}`}>P5</button><button onClick={() => setLevel("P6")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P6" ? "bg-[#243f38] text-white" : "text-[#7a8982]"}`}>P6</button></div></div><div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">{t(lang, "studentDraftEyebrow", { name: levelName })}</p><select value={selectedPiece} onChange={(e) => pickPiece(Number(e.target.value))} className="mt-1.5 block w-full rounded-full border border-[#d8e4dc] bg-[#f7faf6] px-3 py-1.5 text-[11px] font-semibold text-[#47705d]">{Object.entries(journeyOutputs).filter(([, v]) => Boolean(v)).map(([n]) => <option key={n} value={n}>{t(lang, "myPiece", { n })}</option>)}<option value={0}>{t(lang, "demoOption")}</option></select><CardTitle className="mt-1 text-xl">{selectedPiece === 0 ? "The Door in the Garden" : lessons[lang][selectedPiece - 1][0]}</CardTitle></div><Badge className="rounded-full bg-[#e4f1e8] text-[#4d8063]">{t(lang, "wordCount", { n: wordCount })}</Badge></div></CardHeader><CardContent><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[285px] resize-none rounded-2xl border-[#e4eade] bg-[#fbfcf8] p-5 text-[15px] leading-7 text-[#33473e] shadow-none" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-1.5 text-xs text-[#87948e]"><LockKeyhole className="h-3.5 w-3.5" />{t(lang, "codeOnly")}</p><Button onClick={() => saveStudentVersion("revision")} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><Check className="mr-2 h-4 w-4" />{t(lang, "saveRevision")}</Button></div></CardContent></Card><div className="space-y-5"><Card className="border-0 bg-[#243f38] text-white shadow-[0_15px_45px_rgba(36,63,56,.14)]"><CardContent className="p-5"><p className="eyebrow text-[#b7d8c8]">{t(lang, "rubricEyebrow", { level })}</p><div className="mt-2 flex items-end justify-between"><p className="text-5xl font-semibold tracking-[-.06em]">{total}<span className="text-xl text-[#b7d8c8]">/100</span></p><Star className="h-7 w-7 text-[#f0c96a]" /></div><p className="mt-3 text-xs leading-5 text-[#c5d7d0]">{t(lang, "rubricFootnote")}</p></CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="pb-2"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-[#4e8063]" /><CardTitle className="text-base">{t(lang, "rubricCardTitle", { level })}</CardTitle></div></CardHeader><CardContent className="space-y-4">{rubricRows.map((item: any) => <div key={item.key}><div className="flex justify-between text-xs"><span className="font-semibold text-[#40564b]">{rubricLabelText(lang, item.label)}</span><span className="text-[#6b9278]">{item.score}/25</span></div><div className="mt-1.5 h-1.5 rounded-full bg-[#edf1eb]"><div className="h-1.5 rounded-full bg-[#7db18a]" style={{ width: `${item.score * 4}%` }} /></div><p className="mt-1 text-[11px] leading-4 text-[#89968f]">{item.reason}</p></div>)}</CardContent></Card></div></div><Card className="mt-6 border-0 bg-[#fffdf8] shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="border-b border-[#f0ead9] bg-[#fff8e8] pb-4"><div className="flex items-center gap-2"><WandSparkles className="h-4 w-4 text-[#c18a32]" /><div><CardTitle className="text-base">{t(lang, "issueCardTitle")}</CardTitle><p className="mt-0.5 text-xs text-[#8f7b48]">{t(lang, "issueCardSub")}</p></div></div></CardHeader><CardContent className="p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#6b7168]">{cards.length ? t(lang, "issueFound", { n: cards.length }) : t(lang, "issueWait")}</p><div className="flex flex-wrap gap-2"><Button onClick={() => evaluation.mutate({ draft: redact(draft), level })} disabled={evaluation.isPending} className="rounded-full bg-[#243f38] text-white">{evaluation.isPending ? t(lang, "evaluating") : t(lang, "fullEvaluate")}<ClipboardCheck className="ml-2 h-4 w-4" /></Button><Button onClick={askCoach} disabled={coach.isPending} variant="outline" className="rounded-full border-[#d8dec7] text-[#806a38]">{coach.isPending ? t(lang, "analyzing") : t(lang, "smallHint")}<MessageCircle className="ml-2 h-4 w-4" /></Button></div></div>{cards.length ? <div className="space-y-4">{cards.map((issue: any, index: number) => <Card key={issue.id ?? index} className={`border bg-white shadow-none ${(resolved[issue.id] ?? issue.status === "resolved") ? "border-[#b9d8c2] bg-[#f5fbf6]" : "border-[#eee5d9]"}`}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3e2bd] text-xs font-bold text-[#8a6a35]">{index + 1}</span><Badge variant="outline" className="rounded-full border-[#e5c8bc] text-[10px]">{issue.category}</Badge></div><p className="mt-3 text-sm font-semibold text-[#4c514a]">{t(lang, "originalLine")}<span className="rounded bg-[#fff0e8] px-1 text-[#955b43]">{issue.fragment}</span></p><p className="mt-2 text-sm leading-6 text-[#6c746c]"><strong>{t(lang, "whyLabel")}</strong>{issue.explanation}</p><p className="mt-2 rounded-xl bg-[#edf6ef] p-3 text-xs leading-5 text-[#557261]"><strong>{t(lang, "hintLabel")}</strong>{issue.hint}</p></div><button onClick={() => setResolved((prev) => ({ ...prev, [issue.id]: !prev[issue.id] }))} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${(resolved[issue.id] ?? issue.status === "resolved") ? "bg-[#cfe8d5] text-[#37634d]" : "bg-[#f3f5f0] text-[#718079]"}`}>{(resolved[issue.id] ?? issue.status === "resolved") ? t(lang, "resolved") : t(lang, "pending")}</button></div><label className="mt-4 block text-xs font-semibold text-[#60756a]">{t(lang, "myRevision")}<textarea value={studentRevisions[issue.id] ?? issue.studentRevision ?? ""} onChange={(e) => setStudentRevisions((prev) => ({ ...prev, [issue.id]: e.target.value }))} placeholder={t(lang, "myRevisionPlaceholder")} className="field mt-1.5 min-h-[72px] w-full resize-y" /></label></CardContent></Card>)}</div> : <div className="rounded-2xl border border-dashed border-[#ded8c7] bg-white p-6 text-center"><p className="text-sm font-semibold text-[#5c625b]">{t(lang, "readyTitle")}</p><p className="mt-2 text-xs leading-5 text-[#8e9188]">{t(lang, "readySub")}</p></div>}<div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end"><label className="block text-xs font-semibold text-[#60756a]">{t(lang, "myReflection")}<textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={t(lang, "myReflectionPlaceholder")} className="field mt-1.5 min-h-[76px] w-full resize-y" /></label><Button onClick={saveProofreadingRecord} disabled={saveEvaluation.isPending} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]">{saveEvaluation.isPending ? t(lang, "saving") : t(lang, "saveLearning")}</Button></div>{coachResult && <p className="mt-4 rounded-xl bg-[#f4f1e5] p-3 text-xs leading-5 text-[#6d613f]">{coachResult}</p>}{coachError && <p className="mt-3 rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{coachError}</p>}</CardContent></Card></div>;
}
/*
 * Teacher proofreading queue. Reads `writingEvaluation.queue`.
 * The queue is empty until students have saved evaluations in the database.
 */
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
  return <div><div className="mb-5"><p className="eyebrow">Teacher tools · Proofreading Review</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "reviewH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "reviewSub")}</p></div>{!queue.data?.length ? <Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardContent className="p-8 text-center"><p className="font-semibold text-[#4c6257]">{t(lang, "queueEmptyTitle")}</p><p className="mt-2 text-sm text-[#8a9891]">{t(lang, "queueEmptySub")}</p></CardContent></Card> : <div className="grid gap-5 lg:grid-cols-[280px_1fr]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><CardTitle className="text-lg">{t(lang, "queueTitle")}</CardTitle><p className="text-xs text-[#8a9891]">{t(lang, "queueSort")}</p></CardHeader><CardContent className="space-y-2">{queue.data.map((item: any) => <button key={item.writingId} onClick={() => { setSelectedId(item.writingId); setTeacherNote(item.teacherNote ?? ""); }} className={`w-full rounded-xl p-3 text-left ${activeId === item.writingId ? "bg-[#edf6ef] ring-1 ring-[#b9d4c1]" : "hover:bg-[#f7faf6]"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-[#385449]">作品 #{item.writingId}</span><Badge variant="outline" className="rounded-full text-[10px]">{item.level}</Badge></div><p className="mt-1 text-[11px] text-[#8a9891]">{item.reviewedAt ? t(lang, "reviewed") : t(lang, "pendingReview")}</p></button>)}</CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Writing #{activeId}</p><CardTitle className="mt-1 text-lg">{t(lang, "rubricReview")}</CardTitle></div><Badge className="rounded-full bg-[#fff4d9] text-[#856a36]">{t(lang, "teacherFinal")}</Badge></div></CardHeader><CardContent>{current ? <><div className="grid gap-3 md:grid-cols-2">{current.rubric.map((row: any) => <div key={row.key} className="rounded-xl bg-[#f7faf6] p-3"><div className="flex items-center justify-between text-xs font-semibold text-[#49665a]"><span>{rubricLabelText(lang, row.label)}</span><span>{row.score}/25</span></div><input value={overrides[row.key] ?? ""} onChange={(e) => setOverrides((previous) => ({ ...previous, [row.key]: e.target.value }))} placeholder={t(lang, "overridePlaceholder", { n: row.score })} inputMode="numeric" className="field mt-2 bg-white text-xs" /><p className="mt-2 text-[11px] leading-4 text-[#89968f]">{row.reason}</p></div>)}</div><div className="mt-5 space-y-3">{current.issues.map((issue: any) => <div key={issue.id} className="rounded-xl border border-[#eee5d9] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-[#5b665e]">{issue.fragment}</p><select value={statuses[issue.id] ?? issue.status ?? "pending"} onChange={(e) => setStatuses((previous) => ({ ...previous, [issue.id]: e.target.value as any }))} className="field w-auto py-1 text-[11px]"><option value="pending">{t(lang, "pending")}</option><option value="resolved">{t(lang, "studentResolved")}</option><option value="needs_teacher_review">{t(lang, "needsFollowup")}</option></select></div><p className="mt-2 text-xs leading-5 text-[#718179]">{t(lang, "studentRevision")}{issue.studentRevision || "尚未填寫"}</p><p className="mt-1 text-[11px] text-[#9a8e79]">{t(lang, "aiHint")}{issue.hint}</p></div>)}</div><label className="mt-5 block text-xs font-semibold text-[#60756a]">{t(lang, "teacherNote")}<textarea value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)} placeholder={t(lang, "teacherNotePlaceholder")} className="field mt-1.5 min-h-[90px] w-full resize-y" /></label><div className="mt-4 flex justify-end"><Button onClick={saveReview} disabled={review.isPending} className="rounded-full bg-[#243f38] text-white">{review.isPending ? t(lang, "saving") : t(lang, "saveTeacherReview")}<Check className="ml-2 h-4 w-4" /></Button></div></> : <p className="text-sm text-[#8a9891]">{t(lang, "loadingEval")}</p>}</CardContent></Card></div>}</div>;
}
/*
 * Fifteen-lesson course and the student's writing box.
 * "Save this piece" updates `journeyOutputs` in memory only.
 * "Save stage" writes to the database only when a student session exists.
 * UNFINISHED: the P5/P6 control does not swap lesson text.
 */
function CourseView({ lang, level, setLevel, selectedLesson, setSelectedLesson, stage, setStage, draft, setDraft, saveStudentVersion, journeyOutputs, setJourneyOutputs, saveJourney, writingId, user }: { lang: Lang } & Record<string, any>) {
  const outputLabel = lessons[lang][selectedLesson - 1][2];
  const output = journeyOutputs[selectedLesson] ?? "";
  const activity = lessonActivities[lang][selectedLesson];
  const completedCount = Object.values(journeyOutputs).filter(Boolean).length;
  const saveOutput = () => {
    if (!draft.trim()) return;
    setJourneyOutputs((previous: Record<number, string>) => ({ ...previous, [selectedLesson]: draft.trim() }));
    if (user) saveJourney.mutate({ lessonNo: selectedLesson, body: draft.trim(), writingId: writingId ?? undefined });
    saveStudentVersion(stage);
  };
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const askAI = trpc.writingCoach.ask.useMutation({ onSuccess: (result) => { setAiAnswer(result.answer); setAiError(null); }, onError: () => setAiError(t(lang, "msgCoachError")) });
  const sendAI = () => { if (!aiQuestion.trim()) return; setAiAnswer(null); setAiError(null); askAI.mutate({ question: aiQuestion.trim(), level, lang }); };
  return <div><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Function 02 · 15-Lesson Course</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "courseH2")}</h2><p className="mt-2 text-sm text-[#7a8982]">{t(lang, "courseSub")}</p></div><div className="flex items-center gap-3"><div className="rounded-full bg-[#fff8e8] px-3 py-2 text-xs font-semibold text-[#866b37]">{t(lang, "savedCount", { n: completedCount })}</div><div className="flex rounded-full bg-white p-1 shadow-sm"><button onClick={() => setLevel("P5")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P5" ? "bg-[#243f38] text-white" : "text-[#74837c]"}`}>P5</button><button onClick={() => setLevel("P6")} className={`rounded-full px-4 py-2 text-xs font-semibold ${level === "P6" ? "bg-[#243f38] text-white" : "text-[#74837c]"}`}>P6</button></div></div></div><div className="mb-5 rounded-2xl border border-[#e6dfc9] bg-[#fffaf0] p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0c96a] text-[#6d5427]"><Star className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-[#6f5730]">{t(lang, "journeyTitle")}</p><p className="mt-1 text-xs leading-5 text-[#8b7954]">{t(lang, "journeyText")}</p></div></div><div className="mt-3 flex gap-1.5">{lessons[lang].map((_, index) => <button aria-label={lang === "zh" ? `第 ${index + 1} 堂收藏狀態` : `Lesson ${index + 1} saved state`} key={index} onClick={() => setSelectedLesson(index + 1)} className={`h-2 flex-1 rounded-full ${journeyOutputs[index + 1] ? "bg-[#b17235]" : selectedLesson === index + 1 ? "bg-[#d9bd78]" : "bg-[#eadfca]"}`} />)}</div></div><div className="grid gap-5 lg:grid-cols-[300px_1fr]"><div className="space-y-2">{lessons[lang].map((lesson, index) => <button key={lesson[0]} onClick={() => setSelectedLesson(index + 1)} className={`w-full rounded-2xl p-3 text-left ${selectedLesson === index + 1 ? "bg-[#243f38] text-white" : "bg-white text-[#31473e] hover:bg-[#edf5ef]"}`}><div className="flex items-start gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${journeyOutputs[index + 1] ? "bg-[#f0c96a] text-[#34483d]" : selectedLesson === index + 1 ? "bg-[#f0c96a] text-[#34483d]" : "bg-[#e5f0e8] text-[#4d8063]"}`}>{journeyOutputs[index + 1] ? <Check className="h-4 w-4" /> : String(index + 1).padStart(2, "0")}</span><div><p className="text-sm font-semibold">{lesson[0]}</p><p className={`mt-1 text-[11px] leading-4 ${selectedLesson === index + 1 ? "text-[#c5d9ce]" : "text-[#8a9891]"}`}>{lesson[2]}</p></div></div></button>)}</div><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><p className="eyebrow">{t(lang, "lessonNum", { n: String(selectedLesson).padStart(2, "0"), level })}</p><CardTitle className="mt-1 text-2xl">{lessons[lang][selectedLesson - 1][0]}</CardTitle><p className="mt-2 text-sm leading-6 text-[#718179]">{lessons[lang][selectedLesson - 1][1]}</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3"><MiniTool icon={<Sparkles />} label="Prompt card" text={t(lang, "toolPromptText")} /><MiniTool icon={<BookOpen />} label="Vocabulary" text={t(lang, "toolVocabText")} /><MiniTool icon={<LayoutTemplate />} label="Planner" text={t(lang, "toolPlannerText")} /></div>{activity && <LessonActivityPanel lang={lang} activity={activity} />}<div className="mt-6 rounded-2xl bg-[#fbfaf5] p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-[#6f5730]">{t(lang, "outputTitle", { label: outputLabel })}</p><p className="mt-1 text-[11px] text-[#918975]">{t(lang, "outputHint")}</p></div>{output && <Badge className="rounded-full bg-[#e7f3e8] text-[#4d8063]">{t(lang, "saved")}</Badge>}</div>{activity && <div className="mt-3 rounded-xl border border-[#f0e3c4] bg-[#fff8e8] p-3"><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#a67b36]">{t(lang, "writingTaskLabel")}</p><p className="mt-1 text-sm leading-6 text-[#6d613f]">{activity.writingTask}</p></div>}<div className="flex flex-wrap gap-2">{([['idea', 'stageIdea'], ['outline', 'stageOutline'], ['draft', 'stageDraft'], ['revision', 'stageRevision'], ['submitted', 'stageSubmit']] as const).map(([id, key]) => <button key={id} onClick={() => setStage(id)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${stage === id ? "bg-[#243f38] text-white" : "bg-white text-[#789087]"}`}>{t(lang, key)}</button>)}</div><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="mt-4 min-h-[240px] resize-none rounded-2xl border-[#ece8d9] bg-white p-4 text-[15px] leading-7" />{activity && <div className="mt-3 rounded-2xl border border-[#e4e8df] bg-white p-3"><div className="flex items-center gap-2"><WandSparkles className="h-4 w-4 text-[#c18a32]" /><p className="text-xs font-semibold text-[#6f5730]">{t(lang, "aiPartnerTitle")}</p></div><p className="mt-1 text-[11px] leading-5 text-[#8b7954]">{t(lang, "aiPartnerHint")}</p><div className="mt-2 flex flex-wrap gap-2"><input value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder={activity.aiStarter} className="field min-w-[200px] flex-1 text-xs" /><Button onClick={() => setAiQuestion(activity.aiStarter)} variant="outline" className="rounded-full border-[#e3d3a9] text-[11px] text-[#806a38]">{t(lang, "aiUseStarter")}</Button><Button onClick={sendAI} disabled={askAI.isPending || !aiQuestion.trim()} className="rounded-full bg-[#a67b36] text-white">{askAI.isPending ? t(lang, "aiAsking") : t(lang, "aiAsk")}<MessageCircle className="ml-2 h-4 w-4" /></Button></div>{aiAnswer && <p className="mt-2 rounded-xl bg-[#edf6ef] p-3 text-xs leading-5 text-[#557261]">{aiAnswer}</p>}{aiError && <p className="mt-2 rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{aiError}</p>}<p className="mt-2 text-[10px] leading-4 text-[#9a8f7c]">{t(lang, "aiReminder")}</p></div>}<div className="mt-3 flex flex-wrap justify-between gap-3"><p className="flex items-center gap-2 text-xs text-[#829089]"><LockKeyhole className="h-3.5 w-3.5" />{t(lang, "stageVersionsKept")}</p><div className="flex gap-2"><Button onClick={saveOutput} disabled={!draft.trim()} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><Star className="mr-2 h-4 w-4" />{t(lang, "savePiece")}</Button><Button onClick={() => saveStudentVersion(stage)} className="rounded-full bg-[#243f38] text-white">{stage === "submitted" ? t(lang, "submitPiece") : t(lang, "saveStage")}<Send className="ml-2 h-4 w-4" /></Button></div></div></div></CardContent></Card></div>{completedCount > 0 && <Card className="mt-5 border-0 bg-[#edf6ef] shadow-none"><CardContent className="p-5"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-[#4e8063]" /><p className="text-sm font-semibold text-[#315a46]">{t(lang, "trailTitle")}</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(journeyOutputs).filter(([, value]) => Boolean(value)).slice(-3).map(([lessonNo, value]) => <button key={lessonNo} onClick={() => setSelectedLesson(Number(lessonNo))} className="rounded-xl bg-white/80 p-3 text-left"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#7c9a84]">{t(lang, "trailLesson", { n: String(lessonNo).padStart(2, "0") })}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#567261]">{String(value)}</p></button>)}</div></CardContent></Card>}</div>;
}
/*
 * UNFINISHED: teacher class overview.
 * `classRows` and `recent` are fixed demo figures (20 + 20 students, five
 * sample titles). Replace them with `curriculum.classes`,
 * `writingEvaluation.queue`, and the anthology list once the database
 * has real class and writing rows.
 */
function TeacherOverviewView({ lang }: { lang: Lang }) {
  const overview = trpc.studio.overview.useQuery();
  const classRows = overview.data?.classRows?.length
    ? overview.data.classRows
    : [
        { code: "P5", students: 0, pieces: 0, pending: 0, approved: 0 },
        { code: "P6", students: 0, pieces: 0, pending: 0, approved: 0 },
      ];
  const totals = classRows.reduce((acc, row) => ({ students: acc.students + row.students, pieces: acc.pieces + row.pieces, pending: acc.pending + row.pending, approved: acc.approved + row.approved }), { students: 0, pieces: 0, pending: 0, approved: 0 });
  const recent = overview.data?.recent?.length ? overview.data.recent : initialSubmissions.slice(0, 4);
  return <div><div className="mb-5"><p className="eyebrow">Teacher tools · Class Overview</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "overviewH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "overviewSub")}</p></div><div className="mb-5 grid gap-3 md:grid-cols-4"><Stat label={t(lang, "ovStudents")} value={`${totals.students}`} /><Stat label={t(lang, "ovPieces")} value={`${totals.pieces}`} /><Stat label={t(lang, "ovPending")} value={`${totals.pending}`} /><Stat label={t(lang, "ovApproved")} value={`${totals.approved}`} /></div><div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><CardTitle className="text-lg">{t(lang, "ovClassHeader")}</CardTitle></CardHeader><CardContent><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#e8ece7] text-[#8a9891]"><th className="pb-2 font-semibold">{t(lang, "ovClassHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovStudentsHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovPiecesHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovPendingHeader")}</th><th className="pb-2 font-semibold">{t(lang, "ovApprovedHeader")}</th></tr></thead><tbody>{classRows.map((row) => <tr key={row.code} className="border-b border-[#f0f2ee] last:border-0"><td className="py-3 font-semibold text-[#354940]">{row.code}</td><td className="py-3 text-[#5f7168]">{row.students}</td><td className="py-3 text-[#5f7168]">{row.pieces}</td><td className="py-3 text-[#a45d47]">{row.pending}</td><td className="py-3 text-[#47705d]">{row.approved}</td></tr>)}</tbody></table><p className="mt-3 text-[11px] leading-5 text-[#9a8f7c]">{overview.isLoading ? "…" : t(lang, "ovNote")}</p></CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader><CardTitle className="text-lg">{t(lang, "ovRecentTitle")}</CardTitle><p className="text-xs text-[#8a9891]">{t(lang, "ovRecentSub")}</p></CardHeader><CardContent className="space-y-2">{recent.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf6] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#31473e]">{item.title}</p><p className="mt-0.5 text-[11px] text-[#89968f]">{item.student} · {item.level}</p></div><Badge variant="outline" className="rounded-full border-[#d7e5db] text-[10px] text-[#668273]">{statusText(lang, item.status)}</Badge></div>)}</CardContent></Card></div></div>;
}
/*
 * Anthology desk: preview, reorder, approve, CSV download, and PDF export.
 * UNFINISHED: the list on screen is the demo `submissions` state.
 * `anthology.exportContent` is queried when a teacher is logged in, but
 * that result is not what the cards render. PDF export needs a session,
 * approved database items, and file storage.
 * EPUB is not implemented.
 */
function AnthologyView({ lang, user, submissions, active, selectedId, setSelectedId, updateSubmission, moveSubmission, feedback, setFeedback, exportAnthology }: any) { const [preview, setPreview] = useState(false); const anthologyExport = trpc.anthology.exportContent.useQuery(undefined, { enabled: Boolean(user) }); const selectAnthology = trpc.anthology.select.useMutation(); const pdfExport = trpc.anthology.exportPdf.useMutation({ onSuccess: (result) => { window.open(result.url, "_blank", "noopener,noreferrer"); }, onError: () => setFeedback(t(lang, "anthEmpty")) }); const approve = () => { updateSubmission(active.id, { status: "已核准" }); if (user && (active.writingId ?? active.id)) selectAnthology.mutate({ writingId: active.writingId ?? active.id, authorCode: active.student, publicationTitle: active.title, displayOrder: active.order, approved: 1 }); }; return <div><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Function 03 · Anthology Studio</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "anthH2")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "anthSub")}</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => setPreview(!preview)} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><LayoutTemplate className="mr-2 h-4 w-4" />{preview ? t(lang, "previewClose") : t(lang, "previewToggle")}</Button><Button onClick={() => pdfExport.mutate()} disabled={pdfExport.isPending} variant="outline" className="rounded-full border-[#d8e4dc] text-[#47705d]"><FileText className="mr-2 h-4 w-4" />{pdfExport.isPending ? t(lang, "makingPdf") : t(lang, "officialPdf")}</Button><Button onClick={exportAnthology} className="rounded-full bg-[#243f38] text-white"><Download className="mr-2 h-4 w-4" />{t(lang, "exportList")}</Button></div></div><div className="mb-5 grid gap-3 md:grid-cols-4"><Stat label={t(lang, "statSubmitted")} value={`${submissions.length}`} /><Stat label={t(lang, "statToEdit")} value={`${submissions.filter((item: any) => item.status === "待編輯").length}`} /><Stat label={t(lang, "statToConfirm")} value={`${submissions.filter((item: any) => item.status === "待導師確認").length}`} /><Stat label={t(lang, "statApproved")} value={`${submissions.filter((item: any) => item.status === "已核准").length}`} /></div>{preview && <Card className="mb-6 overflow-hidden border-0 bg-[#fffdf8] shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardContent className="p-8 md:p-12"><p className="eyebrow text-[#b17235]">Chung Sing School · Anthology preview</p><h3 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-[-.05em] text-[#243f38]">{active.title}</h3><p className="mt-3 text-sm text-[#7f8e86]">{active.student} · {active.level} · {active.category}</p><div className="my-7 h-px bg-[#e9e3d4]" /><p className="max-w-2xl whitespace-pre-wrap text-lg leading-9 text-[#4b5d54]">{active.body}</p><div className="mt-10 rounded-xl bg-[#edf6ef] p-4 text-sm text-[#557261]">{t(lang, "editorNoteLabel")}{active.note || t(lang, "noNote")}</div></CardContent></Card>}<div className="grid gap-6 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><p className="eyebrow">Submission queue</p><CardTitle className="mt-1 text-lg">{t(lang, "queueCardTitle")}</CardTitle></div><Badge className="rounded-full bg-[#e4f1e8] text-[#4d8063]">{t(lang, "worksCount", { n: submissions.length })}</Badge></div></CardHeader><CardContent className="space-y-2">{submissions.map((item: any) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl p-3 text-left ${selectedId === item.id ? "bg-[#edf6ef] ring-1 ring-[#b9d4c1]" : "hover:bg-[#f7faf6]"}`}><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5f0e8] text-xs font-bold text-[#4d8063]">{String(item.order).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-[#31473e]">{item.title}</p><Badge variant="outline" className="rounded-full border-[#d7e5db] text-[10px] text-[#668273]">{statusText(lang, item.status)}</Badge></div><p className="mt-1 text-xs text-[#89968f]">{item.student} · {item.level} · {item.category}</p></div></div></button>)}</CardContent></Card><Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><p className="eyebrow">Editorial desk</p><CardTitle className="mt-1 text-lg">{t(lang, "deskTitle")}</CardTitle></div><div className="flex gap-1"><Button variant="outline" size="icon" onClick={() => moveSubmission(-1)} className="h-8 w-8 rounded-lg"><ChevronUp className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={() => moveSubmission(1)} className="h-8 w-8 rounded-lg"><ChevronDown className="h-4 w-4" /></Button></div></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Field label={t(lang, "fieldAuthor")}><input value={active.student} onChange={(e) => updateSubmission(active.id, { student: e.target.value })} className="field" /></Field><Field label={t(lang, "fieldTitle")}><input value={active.title} onChange={(e) => updateSubmission(active.id, { title: e.target.value })} className="field" /></Field><Field label={t(lang, "fieldCategory")}><select value={active.category} onChange={(e) => updateSubmission(active.id, { category: e.target.value })} className="field"><option>Fantasy</option><option>Mystery</option><option>Future World</option><option>Realistic</option><option>Poetry</option></select></Field><Field label={t(lang, "fieldStatus")}><select value={active.status} onChange={(e) => updateSubmission(active.id, { status: e.target.value })} className="field"><option value="待編輯">{t(lang, "statusToEdit")}</option><option value="待導師確認">{t(lang, "statusToConfirm")}</option><option value="已核准">{t(lang, "statusApproved")}</option><option value="不收錄">{t(lang, "statusRejected")}</option></select></Field></div><Field label={t(lang, "fieldEditorNote")}><Textarea value={active.note} onChange={(e) => updateSubmission(active.id, { note: e.target.value })} placeholder={t(lang, "editorNotePlaceholder")} className="min-h-[100px] rounded-xl border-[#dfe8e1] bg-[#fbfcf9] text-sm" /></Field><div className="rounded-2xl bg-[#f7faf6] p-4"><p className="eyebrow">{t(lang, "editorialChecklist")}</p><div className="mt-3 grid gap-2 text-sm text-[#5f7168] md:grid-cols-2"><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkVoice")}</p><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkTitle")}</p><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkLanguage")}</p><p><Check className="mr-2 inline h-4 w-4 text-[#5e9a70]" />{t(lang, "checkLayout")}</p></div></div><div className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => updateSubmission(active.id, { confirmed: !active.confirmed })} className="rounded-full border-[#d8e4dc] text-[#47705d]">{active.confirmed ? t(lang, "confirmed") : t(lang, "markConfirmed")}</Button><Button variant="outline" onClick={() => setFeedback("")} className="rounded-full border-[#d8e4dc] text-[#47705d]">{t(lang, "clearEdit")}</Button><Button onClick={approve} disabled={selectAnthology.isPending} className="rounded-full bg-[#243f38] text-white">{selectAnthology.isPending ? t(lang, "saving") : t(lang, "approveAdd")} <Check className="ml-2 h-4 w-4" /></Button></div>{feedback !== undefined && <p className="text-xs text-[#799087]">{feedback || t(lang, "exportHint")}</p>}</CardContent></Card></div></div>; }

/*
 * Teacher account desk: CSV import of school codes, one-time initial codes,
 * and a student login test.
 * UNFINISHED without a database and a teacher session: the generate button
 * stays disabled, and import fails unless the class code already exists.
 * There is no screen here for creating that class.
 */
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
/*
 * Renders one lesson: goals, parts (pairs, lists, model text, plan chips),
 * a clickable checklist, and the exit ticket. Checklist ticks stay in
 * component state and reset when the student changes lesson.
 */
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
