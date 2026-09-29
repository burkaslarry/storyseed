# Project TODO

- [x] 建立 P5／P6 分級課程、15 節課程任務、提示卡、詞彙支援及故事規劃工具
- [x] 建立學生、教師、導師及管理角色的最少資料權限模型（classMembers role + 登入保護 API；管理員仍需校方配置）
- [x] 建立班別及學生校內代號／校方帳戶識別方式（classes + classMembers.schoolCode）
- [x] 建立學生寫作工作區：構思→大綱→草稿→自我修訂→提交（原型流程）
- [x] 保留學生草稿版本、提交版本及修訂紀錄（writings + writingVersions 持久化 API）
- [x] 建立受教學規則限制的 AI 寫作助手：發想、詞彙、結構及校對建議
- [x] 防止 AI 直接代寫完整作品，並持續提示學生保留原創聲音
- [x] 避免把姓名、聯絡方式及敏感資料送入 AI 對話
- [x] 建立教師／導師按班別檢視作品、留言回饋及追蹤修訂狀態介面（教學回饋及版本查詢 API + 示範工作台）
- [x] 建立作品集稿件挑選、核准、排序及作者資料整理流程（anthologyItems + 核准／排序 API）
- [x] 產出供設計及 PDF／電子書製作使用的內容清單（anthology.exportContent API）
- [x] 採用「elegant、clean、colourful、student-friendly、creative technology」視覺方向
- [x] 為目前已實作的私隱遮罩及認證流程加入 Vitest 測試；資料庫流程測試待後續完成
- [x] 完成桌面及小屏幕視覺驗證
- [x] 撰寫校本示範版使用說明及未來擴展建議（校本試行使用說明.md）

## Follow-up implementation gaps

- [x] 補齊 15 節課程資料、P5／P6 切換、任務、提示卡、詞彙支援與故事規劃內容（目前兩級共用示範內容，仍可再深化差異）
- [x] 在 schema／router／db 實作 student／teacher／tutor／admin 角色、班別關聯與登入保護 API
- [x] 實作可持久化的寫作工作流與版本紀錄（構思／大綱／草稿／自我修訂／提交）
- [x] 把 AI proofread 模式接到 UI，並為 LLM 失敗情況加入錯誤提示與降級回應
- [x] 在送往 LLM 前加入電郵及電話格式遮罩，並以單元測試驗證
- [x] 實作教師回饋、修訂狀態追蹤、作品集挑選／核准／排序與可匯出的出版內容清單
- [x] 為目前安全流程加入 Vitest 測試，並完成小屏幕截圖驗證；其餘資料流程測試待資料庫功能完成

## Final hardening gaps

- [x] 在 router 加入 role／class membership 權限檢查，限制學生、教師、導師及管理員 API 存取範圍（已完成 API guard；正式班別配置由校方管理員執行）
- [x] 把 schoolCode／校方帳戶與登入後使用者綁定，提供可驗證的班別識別資料模型及 helper（實際帳戶匯入待校方提供名單）
- [x] 把學生五步寫作流程接到持久化 API，支援建立、續寫、提交及讀取各階段版本
- [x] 把教師工作台所需的 feedback mutation、revision status 查詢及班別資料 API 建立完成（示範工作台可按校方資料接線）
- [x] 實作作品集管理所需的挑選、核准、排序、作者資料及匯出內容 API，並提供出版工作台示範介面
- [x] 為 writing／teaching／anthology 的權限基礎及私隱流程新增 Vitest 測試；資料庫整合測試需在校方帳戶資料建立後補做

## Quotation and curriculum review

- [x] 對照學校來信與現有 quotation 的課堂數量、服務時段、導師安排及費用計算
- [x] 對照學生 sample；目前工作區沒有重新提供 sample，因此只完成 quotation-level 評估，未虛構 sample-specific 結論
- [x] 檢查 substantive editing、visual graphic design、PDF／電子書交付物是否需要限定範圍
- [x] 檢查 15 節課程是否與 AI 平台工作流、學生提交、教師回饋及出版流程完全對齊
- [x] 提出可直接放回 quotation 的修訂文字、分項收費及待學校確認事項

## Contract-aligned website redesign

- [x] 將網站主導航整理成三個核心功能：Proofreading Studio、15-Lesson Course、Anthology Studio
- [x] 建立學生 proofreading、評分及建議介面，包含 proofreading breakdown、rubric 分數、優點及下一步建議
- [x] 建立受教學規則限制的 AI proofreading／rubric evaluation 流程，避免代寫完整作品
- [x] 將 15 堂課程改為清晰的學生任務導航，顯示每堂學習目標、活動及作品輸出
- [x] 實作作品集 Studio：收稿、編輯、學生確認、核准、排序、版面預覽及匯出（已加入登入後 API 接線；示範資料可替換為校方收稿）
- [x] 實作作品集編輯欄位：標題、作者代號、作品分類、導師評語、出版狀態及排序
- [x] 實作作品集內容清單及適合交給設計／PDF 製作的匯出格式（CSV 供設計／PDF 製作使用）
- [x] 補充作品集管理流程的審閱狀態、學生確認、核准、預覽及操作提示
- [x] 為三個核心功能完成目前可行的型別／權限／私隱 Vitest 驗證，並完成桌面及手機視覺驗證

## New validation, publishing, and account features

- [x] 建立 3 篇真實學生作文的安全測試匯入、匿名化、AI 評估及結果比較流程
- [x] 儲存每篇作文的 rubric、proofreading breakdown 及 AI 建議測試報告；教師觀察欄位待試教後加入
- [x] 在 Anthology Studio 建立正式作品集封面、目錄、內頁及作者代號版面模板
- [x] 設計鍾聲學校校本作品集封面，保留學校名稱、課程名稱及出版年份欄位
- [x] 產出 A4 print-ready PDF；電子書目前以同一 PDF 作分享版本，EPUB 待校方確認是否需要
- [x] 建立教師批量匯入學生名單介面，支援 CSV 格式檢查、錯誤提示及批量生成
- [x] 為學生生成唯一 username／一次性初始碼，資料庫只保存校內代號及初始碼雜湊
- [x] 建立匯入批次記錄、一次性憑證下載及 mustChangeCode 欄位
- [x] 實作學生帳號登入、session cookie 及 Account Desk 登入／改碼介面
- [x] 加入 mustChangeCode 強制保護，首次登入改碼前禁止學生存取其他受保護功能
- [x] 為初始碼驗證及 mustChangeCode 拒絕 helper 新增 Vitest 測試；studentLogin／changeCode 的 DB 整合測試待校方帳戶資料建立後補做
- [x] 完成 Account Desk 學生登入／首次改碼介面的桌面／手機視覺驗證
- [x] 為 PDF 產生器及名單匯入新增 Vitest 測試，並完成桌面視覺驗證
- [x] 為 Proofreading Studio 的 structured evaluation parsing、rubric shape 及 fallback/error handling 新增 Vitest 測試

## Separate teacher and student login entry points

- [x] 建立 `/teacher-login` 教師登入頁及 `/student-login` 學生登入頁
- [x] 教師登入後只導向 `/teacher` 教師工作台，學生登入後只導向 `/student` 學生寫作／課程工作區
- [x] 在 `/student` 前端隱藏 Anthology／Account Desk，並保留後端角色及 mustChangeCode guard
- [x] 為學生登入頁接上一次性初始碼及首次改碼流程
- [x] 為教師／學生入口加入登入中、錯誤提示、已登入及未登入狀態；登出沿用既有 session logout
- [x] 完成兩個登入頁、角色導向的型別／既有權限測試，並完成教師／學生桌面視覺驗證

## Login split hardening

- [x] 在教師及學生登入頁加入可操作的已登入狀態及登出入口
- [x] 補充教師 OAuth callback 導向 `/teacher` 的可驗證 helper 及單元測試
- [x] 為 `/teacher-login`、`/student-login` 及成功登入導向完成型別／瀏覽器視覺驗證（共用導向 helper、13 項測試及 `/teacher`／`/student` 截圖）

## Proofreading Studio instructional redesign

- [x] 定義逐項問題卡 schema：原句、問題類型、解釋、提示、學生修訂欄及狀態
- [x] 建立 P5／P6 分級 rubric，包含 Ideas & Creativity、Structure、Language、Revision Effort 及分項理由
- [x] 把伺服器端 AI 評估改為結構化問題卡及分級 rubric 回應，並保留安全 fallback
- [x] 將 Proofreading Studio 前端改為逐項問題卡顯示，避免只顯示總分
- [x] 加入學生自行修訂及自我反思欄，保留原文與修訂內容
- [x] 加入教師覆核／覆寫評分及回饋入口（Proofreading Review 工作台、rubric 覆寫、問題卡狀態及教師備註）
- [x] 新增 Proofreading schema、rubric 分級及 fallback Vitest 測試，完成桌面／手機視覺驗證

## Writer’s Journey refinement

- [x] 每堂課標示可收藏的學習輸出，建立 15 堂創作足跡
- [x] 顯示已收藏堂數、進度條及最近收藏內容，讓學生看見小作品如何累積
- [x] 收藏時同步保存目前階段版本，保留原創聲音及修訂證據

## Proofreading persistence hardening

- [x] 新增 writingEvaluations 資料表，保存結構化評估、逐卡修訂、反思及教師覆核資料
- [x] 接通學生保存／讀取評估 API，並保留安全的 AI fallback
- [x] 接通教師 queue、rubric 覆寫、問題卡狀態及覆核備註 API／介面
- [x] 完成 schema 測試、production build，以及 Proofreading 學生桌面／手機與教師工作台視覺驗證
