# StorySeed

Chung Sing School P5／P6 寫作平台：學生寫作與修訂、教師校對評分、學生帳戶管理、班級寫作任務及作品集。

本文件以現有程式為準；功能存在不代表已通過線上端到端測試。

## 編號規則

- `[Fxxx]`：功能參考號，例如 `[F003]` 是學生帳戶管理。
- `[Syyy]`：步驟參考號；全文不重複。
- 每個步驟的 block comment 第一行使用 `[Fxxx][Syyy] 操作句子`，再列出 Input、Process、Output。這些區塊亦可作為程式註解格式。
- 新功能／步驟使用新號碼；現有號碼保留，方便交接及問題追蹤。

## 功能索引

| 編號 | 功能 | 入口／主要程式 | 步驟 |
| --- | --- | --- | --- |
| [F001] | 本地啟動與設定 | `package.json`、`server/db.ts` | [S001]–[S002] |
| [F002] | 學生、教師及管理員登入 | `/student-login`、`/teacher-login`、`/admin-login`；`server/routers.ts` | [S003]–[S004] |
| [F003] | 單一學生新增、CSV 匯入／匯出 | 教師「帳號」；`client/src/components/teacher/AccountsDesk.tsx` | [S005]–[S007] |
| [F004] | 班級寫作任務 | 教師「寫作任務」；`server/manageDb.ts` | [S008]–[S009] |
| [F005] | 15 課寫作及階段版本 | `/student`；`client/src/pages/Home.tsx` | [S010] |
| [F006] | AI 校對及教師評分 | 學生／教師「校對」；`server/writingEvaluation.ts` | [S011]–[S012] |
| [F007] | 作品集編輯及匯出 | 教師「作品集」；`server/anthologyPdf.ts` | [S013] |
| [F008] | 管理員學生及教師管理 | `/admin`；`server/manageRouter.ts` | [S014]–[S015] |
| [F009] | PostgreSQL migration／seed | `drizzle/storyseed_*.sql` | [S016] |
| [F010] | Vercel 部署及驗證 | `vercel.json`、`api/index.js` | [S017]–[S018] |

## 架構與部署目錄

React 19 + Vite → Express／tRPC API → Drizzle + `pg` → Render PostgreSQL。

- App 部署平台：Vercel；Render 僅提供資料庫。
- Vercel Root Directory：`src/storyseed-project`。
- 本地完整路徑：`/Users/larrylo/SourceProject/storyseed/src/storyseed-project`。
- Render DB：`dpg-d6iok5q4d50c738643c0-a`；應用資料表以 `storyseed_` 開頭。
- Production URL：[StorySeed](https://storyseed-project.vercel.app)。本次文件更新未重新驗證線上狀態。

## [F001] 本地啟動

```text
/* [F001][S001] 在應用目錄安裝依賴並設定環境變數。
 * Input: Node.js 22+、pnpm 10、.env.example、Render External Database URL。
 * Process: 執行 pnpm install；建立私有 .env 並填入所需值。
 * Output: 本地依賴及設定；不把 .env 或 secret 提交到 Git。
 */
```

| 環境變數 | 用途 |
| --- | --- |
| `DATABASE_URL` | Render External PostgreSQL URL |
| `PGSSL=true`、`PGSSLMODE=require` | PostgreSQL SSL 連線 |
| `JWT_SECRET` | 教師／學生／管理員登入 session 簽署 |
| `BUILT_IN_FORGE_API_URL`、`BUILT_IN_FORGE_API_KEY` | 現有 AI provider |
| `VITE_APP_ID`、`OAUTH_SERVER_URL` | 保留的 OAuth 整合；Email／密碼登入不經 OAuth |
| `OWNER_OPEN_ID` | 保留的擁有者角色設定 |

```text
/* [F001][S002] 啟動本地網站及檢查資料庫連線。
 * Input: S001 的設定、已建好的 storyseed_* schema。
 * Process: 執行 pnpm dev；開啟首頁及 /api/trpc/system.dbPing。
 * Output: localhost:3000 的 UI；dbPing 在連線成功時回傳 ok: true。
 */
```

```bash
cd /Users/larrylo/SourceProject/storyseed/src/storyseed-project
pnpm install
pnpm dev
```

## [F002] 登入

```text
/* [F002][S003] 教師或管理員以 Email 及密碼登入。
 * Input: 已建立帳戶的 Email、密碼、對應登入頁。
 * Process: accounts.teacherLogin／adminLogin 驗證密碼 hash 與角色，簽署 session cookie。
 * Output: 教師進入 /teacher；管理員進入 /admin；失敗時顯示錯誤。
 */
```

```text
/* [F002][S004] 學生登入並按要求更改初始碼。
 * Input: /student-login 的 username 及初始碼。
 * Process: accounts.studentLogin 驗證 active 及 hash；mustChangeCode 為 true 時更改初始碼。
 * Output: 學生 session；完成改碼後可使用受限制的寫作功能。
 */
```

現有實作按需求以 MD5 儲存教師／管理員密碼及學生初始碼，不儲存明文。MD5 並非適合密碼的現代雜湊算法，正式安全加固應改用 Argon2id／scrypt。JWT secret 與密碼 hash 是不同用途；`auth.me` 排除 `passwordHash`。

測試帳號由 `drizzle/storyseed_seed_drill.sql` 建立；本文不重複公開密碼。

## [F003] 學生帳戶及 CSV

```text
/* [F003][S005] 教師新增一名學生。
 * Input: 「帳號」頁的既有班別代碼（例 6F）、校內代號（例 P6-03）。
 * Process: manage.students.createOne 查找班別，產生 username 及初始碼，保存 hash。
 * Output: username、初始碼；教師保存並私下交給學生。
 */
```

```text
/* [F003][S006] 教師批量匯入學生並下載初始碼 CSV。
 * Input: 班別代碼及含 schoolCode,classCode 欄位的 CSV 文字。
 * Process: accounts.bulkImport 解析名單並建立帳戶；下載回應中的初始碼。
 * Output: import batch、學生帳戶及憑證 CSV；初始碼不以明文存入資料庫。
 */
```

目前 UI 是貼上 CSV 文字，並非選取 CSV 檔案上載。

```csv
schoolCode,classCode
P6-01,6F
P6-02,6F
```

```text
/* [F003][S007] 教師匯出班級學生名單。
 * Input: 既有班別代碼。
 * Process: manage.students.exportCsv 讀取帳戶，瀏覽器下載 CSV。
 * Output: schoolCode,classCode,username,active,mustChangeCode；不包含密碼／初始碼。
 */
```

## [F004] 班級寫作任務

```text
/* [F004][S008] 教師建立寫作任務草稿。
 * Input: 「寫作任務」頁的班別、P5/P6、標題及說明文字。
 * Process: manage.assignments.create 查找班別並插入 storyseed_class_assignments。
 * Output: draft 任務；尚未向學生建立 writing。
 */
```

例：班別 `6F`、年級 `P6`、標題「花園裡的神秘門」、說明「描述發現門的經過，加入感官細節及人物選擇。」

```text
/* [F004][S009] 教師向全班 active 學生發佈任務。
 * Input: 已建立的 assignmentId；按「向全班發佈」。
 * Process: manage.assignments.open 逐一建立／取得學生 user、班級關聯及 writing，再設為 open。
 * Output: 任務狀態及 studentCount；資料庫限制或中途失敗可能留下部分寫作紀錄。
 */
```

目前發佈以班級為範圍，並未實作「教師只可管理自己名下班級」的檢查。教師自訂任務使用 1000 起的 lessonNo；初始 SQL 的 writings.lesson_no 限制為 1–15，現有 v4 migration 沒有解除限制。因此按原始 migration 建出的資料庫可能無法完成發佈，不能視為已驗證的全班任務流程。

## [F005] 學生写作

```text
/* [F005][S010] 學生完成內置課程的寫作階段並儲存。
 * Input: /student 的課次、idea／outline／draft／revision／submitted 階段及正文。
 * Process: writing.create／saveVersion 保存版本；journey.save 保存課堂作品文字。
 * Output: storyseed_writings、storyseed_writing_versions 及 storyseed_journey_pieces 紀錄。
 */
```

15 課的教材及活動仍來自 `Home.tsx` 內置陣列。P5/P6 共用課程內容；暫無 PDF／Word 教材上載功能，也未見學生端自訂任務清單及選擇入口。Demo 資料在記憶體中，重新整理可能消失。

## [F006] 校對及教師評分

```text
/* [F006][S011] 學生取得 AI 校對並保存修訂紀錄。
 * Input: 正文、P5/P6、學生修訂文字、issue 狀態及反思。
 * Process: writingCoach.evaluate 呼叫 AI；正規化 rubric／issues；writingEvaluation.save 保存紀錄。
 * Output: 四項 rubric、校對 issue cards、學生反思及 writing assessment。
 */
```

```text
/* [F006][S012] 教師檢視校對隊列並保存評分覆核。
 * Input: 教師「校對」頁選取 writing、分數調整、issue 狀態及教師備註。
 * Process: writingEvaluation.queue／get 讀取紀錄；teacherReview 保存覆核。
 * Output: assessment 的 rubricOverrides、教師備註及 reviewedAt；隊列更新。
 */
```

AI coach 以提問、提示及詞彙選擇支援學生，不代寫整篇作品。AI provider 未設定時不能把 placeholder 分數當成正式評分。

## [F007] 作品集

```text
/* [F007][S013] 教師編輯作品集並匯出。
 * Input: 作者代號、出版標題、分類、狀態、排序及編輯備註。
 * Process: studio.anthologyDesk／updateAnthology 讀寫資料；作品核准後走 anthology 匯出流程。
 * Output: 編輯後的作品集資料、CSV 或 A4 PDF；PDF 需要可用的檔案儲存 provider。
 */
```

作品集仍有 demo fallback；空的 API 結果不代表畫面必定清空所有示範卡。未提供 EPUB 匯出。

## [F008] 管理員後台

```text
/* [F008][S014] 管理員檢視及啟用／停用學生。
 * Input: /admin 的班別 filter、學生帳戶及 active 設定。
 * Process: manage.students.list／setActive 查詢並更新帳戶狀態。
 * Output: 更新後名單；停用帳戶不能通過下一次學生登入驗證。
 */
```

停用不等於刪除資料；現有 session 的即時撤銷仍需另行驗證。

```text
/* [F008][S015] 管理員新增、修改或移除教師。
 * Input: 教師 Email、名稱、密碼或指定 userId。
 * Process: manage.teachers.create／update／remove；密碼轉為 hash，移除時刪除教師 profile 並停用密碼登入。
 * Output: 教師名單更新；user 紀錄保留，原有關聯資料不會整批刪除。
 */
```

## [F009] 資料庫 migration 及 seed

```text
/* [F009][S016] 建立或更新 storyseed_* schema，按需要加入 drill seed。
 * Input: Render CLI 存取權、指定 DB ID、init／v2／v3／v4 SQL。
 * Process: 新 DB 先套用 init，再依序套用 v2、v3、v4；現有 script 處理 v2 起及 seed。
 * Output: schema 與 drill rows；另行查詢 tables／columns／constraints 確認實際完成。
 */
```

`pnpm db:migrate:render` 與 `pnpm db:seed:render` 指向上述既有 Render DB。前者不執行 init；兩者會執行 drill seed，seed 可能重設 drill 憑證，不適合當成無副作用的健康檢查。script 印出 Applied 並不足以證明 schema 正確，需查詢驗證。

## [F010] Vercel 部署及驗證

```text
/* [F010][S017] 以 src/storyseed-project 為 Vercel Root Directory 部署。
 * Input: Git 版本、Production 環境變數及 vercel.json。
 * Process: pnpm build 建立 dist/public、dist/server/vercel-handler.js 及本地 server bundle。
 * Output: 前端静態資源及 api/index.js 轉接的 Express／tRPC Function。
 */
```

`vercel.json` 使用 `framework: null`、Output Directory `dist/public`。`/api/*` 轉到 Function，其餘 SPA 路徑回到 `index.html`。不需 Render Web Service；handler 不應作為首頁靜態檔案提供。

```text
/* [F010][S018] 驗證部署與核心使用流程。
 * Input: 部署 URL、測試帳戶、既有班別及 drill 資料。
 * Process: 檢查首頁 HTML、dbPing、登入、帳戶 CSV、任務發佈、寫作儲存及教師覆核。
 * Output: 每項成功／失敗結果及證據；只在實測完成後標記通過。
 */
```

```bash
pnpm check
pnpm test
pnpm test:sraa
pnpm build
```

`test:sraa` 目前主要查詢指定 Render DB：連線、表數、seed、writing／assessment 關聯及 trash row。它不會操作瀏覽器，不會真的測試 API 權限或 archive mutation，因此不能替代 UI／API 端到端驗證。完整 test suite 包含此資料庫測試，執行時需 Render CLI 存取權。

## 交接參考

- `DEPLOY.md`：Vercel build 與部署設定。
- `drizzle/schema.ts`：Drizzle schema。
- `server/routers.ts`、`server/manageRouter.ts`：API 與角色檢查。
- `server/manageDb.ts`：帳戶管理與班級任務資料流程。
- `LOCAL_SETUP.md`、`AI_HANDOFF.md`、`README-full.md`：舊交接資料；部分內容可能仍指向 MySQL／OAuth，應以現有程式及本文件為準。
