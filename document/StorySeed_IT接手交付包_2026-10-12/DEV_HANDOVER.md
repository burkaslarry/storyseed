# StorySeed — IT Developer 接手說明書（Handover to IT Developer）

> 版本：2026-10-12　|　學校：Chung Sing School（鐘聲學校）　|　營運機構：Advanced Comet Education Limited（昇㧷教育有限公司）
> 用途：本文件供接手開發者（IT Developer）了解平台架構、近期改動，並完成 **LLM（AI）連接、MySQL 資料庫連接及 Hostinger 部署**。

---

## 1. 專案身份

| 項目 | 內容 |
|---|---|
| 系統名稱 | StorySeed — Chung Sing School AI Creative Writing Platform（AI 創意寫作平台） |
| 學校 | Chung Sing School（鐘聲學校） |
| 營運機構 | Advanced Comet Education Limited（昇㧷教育有限公司） |
| 目標用戶 | P5 / P6 學生（約每級 20 人）、老師 |
| 平台定位 | 學生在平台學習、創作、修訂及提交作文；老師審閱、評分，並把作品編輯成作品集（Anthology）出版 |
| 核心原則 | **AI 是指導教練，不是代寫槍手**。AI 只提供方向、提示、錯誤說明與建議，不代寫完整學生作品 |

---

## 2. 技術棧（Technology Stack）

| 層 | 技術 |
|---|---|
| 前端 | React 19 + Vite 7 + TypeScript + Tailwind CSS 4（shadcn 風格 UI） |
| 後端 | Express 4 + tRPC 11（`/api/trpc`） |
| 資料庫 | MySQL / TiDB（Drizzle ORM + drizzle-kit 遷移） |
| AI | OpenAI 兼容 Chat Completions API（`/v1/chat/completions`），預設 fallback 為 `https://forge.manus.im/v1/chat/completions` |
| 文件生成 | pdf-lib + fontkit（作品集 A4 PDF 輸出） |
| 認證 | JWT cookie + OAuth 回調（`/api/oauth/callback`） |
| 測試 | Vitest（現有 15 個測試） |
| 套件管理 | pnpm 10（`packageManager: pnpm@10.4.1`） |

生產建置流程：`vite build && esbuild server/_core/index.ts --outdir dist`，之後 `NODE_ENV=production node dist/index.js`。Server 動態讀取 `PORT`。

---

## 3. 本批次改動總覽（2026-10-08 → 2026-10-12）

本批次由 AI 助手完成，全部改動經 **TypeScript 編譯檢查（`pnpm check`，零錯誤）** 及瀏覽器視覺驗證。以下係改咗啲咩：

### 3.1 課程重設計：15 堂 → 「5 個單元 × 3 堂」

原課程為 15 堂散裝課程，出版流程集中喺最後幾堂。現已重組為 **5 個單元，每單元 3 堂**：

| 單元 | 課堂 | 單元主題 | 第 3 堂（作文日） |
|---|---|---|---|
| 1 | 堂 1–3 | 校園描寫 | 堂 3 · 作文日 |
| 2 | 堂 4–6 | 難忘經歷 | 堂 6 · 作文日 |
| 3 | 堂 7–9 | 人物寫作 | 堂 9 · 作文日 |
| 4 | 堂 10–12 | 想像寫作 | 堂 12 · 作文日 |
| 5 | 堂 13–15 | 成長與出版 | 堂 15 · 作文日 |

- **每個單元頭兩堂**為準備堂（構思筆記 / 作文大綱），**第三堂為「作文日」**：學生寫一篇完整正式作文並提交。
- **每篇正式作文都可以被老師篩選用於出版**（唔係淨係最後先出版）。
- 程式碼常量 `UNIT_PIECE` 已更新為 `{ 1: 3, 2: 6, 3: 9, 4: 12, 5: 15 }`（單元 → 作文日課堂編號）。

### 3.2 P5 / P6 作文題目：題材相近、課題不同

| 單元 | P5 題目 | P6 題目 |
|---|---|---|
| 1 校園描寫 | 《我的學校》 | 《關於我的學校》 |
| 2 難忘經歷 | 《一次旅行》 | 《那次難忘的旅程》 |
| 3 人物寫作 | 《我最想感謝的人》 | 《一位影響我的人》 |
| 4 想像寫作 | 《我的夢想》 | 《二十年後的我》 |
| 5 成長與出版 | 《一件令我難忘的事》 | 《我成長的故事》 |

> ⚠️ **注意**：上述題目係 AI 助手按學校要求格式（完整作文題目、非詩作）擬定嘅**建議題目**。學校表示有**既定題目**但尚未提供。若收到學校正式題目，只需更新 `Home.tsx` 內 `lessonActivitiesZh / lessonActivitiesEn` 中第 3、6、9、12、15 堂活動資料的 `p5.pieceTitle / p6.pieceTitle`（以及 `lessons` 陣列標題），無需改動結構。

### 3.3 創作流程融入每一堂（唔係最後先教）

六步創作流程 **構思 → AI 優化構思 → 大綱 → 草稿 → 自我修訂 → 提交** 已統一應用於**全部 15 堂**（原本只有「作文日」類型課堂先有完整流程）：

- 準備堂：構思 → AI 優化構思 → 大綱（小輸出）
- 作文日：完整六步並提交正式作文
- 程式碼：`journeySteps` 常量已統一為六步陣列（移除原先的條件分支）

### 3.4 移除詩作／短詩課題

所有詩作、短詩等非正式作文輸出課題已從課程中刪除；所有課題均為完整作文題目格式（書名號《》）。

### 3.5 Proofreading Studio 標題改為學生自行填寫

- 原標題欄固定顯示示範標題「The Door in the Garden」（硬編碼）。
- 現改為**可編輯輸入框**，學生可自行輸入標題（中英文皆有提示語：「輸入作品標題（可自行更改）」）。
- 學生揀「示範文章」時標題留空自行輸入；揀自己嘅作品時會預填課堂名稱，但仍可更改。

### 3.6 教師端示範數據課堂號修正

教師端作品集（Anthology）示範收稿 `initialSubmissions` 中，原先引用「第 7 堂」嘅兩條記錄已改為「第 9 堂」（因新課程下第 7 堂係準備堂，第 9 堂先係該單元嘅作文日），確保教師端顯示對應新課程。

---

## 4. 改動檔案清單（本批次）

交付包 `changed-files/` 內含以下檔案，**覆蓋入原專案即可**（路徑與原專案一致）：

| 檔案 | 狀態 | 說明 |
|---|---|---|
| `client/src/pages/Home.tsx` | **已修改** | 課程資料（`lessons`、`lessonActivitiesZh/En`、`UNIT_PIECE`、`journeySteps`、單元名稱、課程文案）、Proofreading 標題輸入框、教師端示範數據 |
| `tools/curriculum_data.py` | **新增** | 課程資料源（30 份中英活動資料，含 P5/P6 作文題目），供課程重寫腳本使用 |
| `tools/apply_curriculum.py` | **新增** | 課程重寫腳本（將 `curriculum_data.py` 嘅資料寫入 `Home.tsx`，已成功執行） |

> 其餘檔案（server、drizzle、client 其他頁面等）本批次**未有改動**。`AI_HANDOFF.md`（專案根目錄）係更早期嘅完整交接文件，可一併參考。

---

## 5. 環境變數（IT Developer 必讀）

建立 `.env`（複製自 `LOCAL_ENV_TEMPLATE.txt`）並填寫真實值。**切勿把 `.env`、API Key、密碼 commit 或放入交付包。**

| 變數 | 用途 | 備註 |
|---|---|---|
| `NODE_ENV` | development / production | 部署時設 `production` |
| `PORT` | Server 埠號 | Hostinger 會動態注入；本地開發注意 3000 埠可能被其他服務佔用（見 §9） |
| `VITE_APP_ID` | App 身份標識 | 依部署環境提供 |
| `JWT_SECRET` | Cookie 簽名密鑰 | 必須為長隨機字串，勿洩漏 |
| `DATABASE_URL` | MySQL 連線字串 | 格式：`mysql://user:password@host:port/dbname` |
| `OAUTH_SERVER_URL` | OAuth 認證伺服器 | 學校身份系統／OAuth Provider 的 base URL |
| `OWNER_OPEN_ID` | 系統擁有者 Open ID | 平台管理員身份 |
| `BUILT_IN_FORGE_API_URL` | **LLM API base URL** | OpenAI 兼容接口；留空時 fallback `https://forge.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | **LLM API Key** | 以 `Bearer` 方式送出 |

### 5.1 LLM（AI）連接指引

- LLM 呼叫集中在 `server/_core/llm.ts`：向 `${BUILT_IN_FORGE_API_URL}/v1/chat/completions` 發送 OpenAI 兼容格式請求，認證用 `Authorization: Bearer ${BUILT_IN_FORGE_API_KEY}`。
- `server/_core/map.ts`（提示詞工程）、`server/_core/imageGeneration.ts`（插圖）、`server/_core/dataApi.ts`（資料 API）都依賴同一組環境變數。
- **換 LLM Provider（例如 OpenAI / Anthropic / 其他 OpenAI 兼容服務）**：只要目標服務支援 OpenAI 兼容 `/v1/chat/completions`，設定 `BUILT_IN_FORGE_API_URL` 同 `BUILT_IN_FORGE_API_KEY` 即可，**唔使改程式碼**。若不支援 OpenAI 格式，需在 `server/_core/llm.ts` 加 adapter。
- 本地無 LLM 時，平台以「示範模式」運作：UI 可完整預覽，但 AI 評估／提示功能不會有真實回應（前端會顯示錯誤提示）。

### 5.2 MySQL（SQL）連接指引

- 連線由 `server/db.ts` 讀取 `DATABASE_URL`（`drizzle(process.env.DATABASE_URL)`），未設定時 `getDb()` 回傳空值，平台以示範模式運作。
- Schema 定義於 `drizzle/schema.ts`，遷移檔於 `drizzle/`（例：`writingEvaluations` 表）。
- 建立資料庫並設定 `DATABASE_URL` 後執行：`pnpm db:push`（`drizzle-kit generate && drizzle-kit migrate`）。
- 主要資料表：users、classes、class members、student accounts、assignments、writings、writing versions、feedback、writingEvaluations、anthology items/exports。

---

## 6. 本地開發（IT Developer 環境）

前置需求：**Node.js 22+、pnpm 10**；完整功能另需 MySQL/TiDB。

```bash
pnpm install          # 安裝依賴（pnpm 10 需 onlyBuiltDependencies 允許 esbuild 等）
pnpm dev              # 啟動開發伺服器（預設 3000 埠）
pnpm check            # TypeScript 編譯檢查（本批次已通過，零錯誤）
pnpm test             # Vitest（現有 15 個測試）
pnpm build            # 生產建置（vite build + esbuild → dist/）
pnpm start            # 生產模式執行（需先 build）
```

> **Windows 本地注意**：本機 3000 埠被另一個常駐服務（WhatsApp bridge）佔用，本專案需用 **3001 埠**啟動：`$env:PORT='3001'; pnpm dev`，瀏覽器開 `http://localhost:3001/`。

---

## 7. Hostinger 部署指引

> 詳細相容性審計見專案根目錄 `hostinger-compatibility-audit.md`（現有文件）。

1. **方案**：Hostinger Business/Cloud 網頁代管的 Node.js 應用（官方支援 Node 18/20/22/24、React、Vite、Express），或 VPS 自行配置。
2. **建置**：
   ```bash
   pnpm install
   pnpm build
   ```
3. **啟動**：`NODE_ENV=production node dist/index.js`（Server 會讀取 Hostinger 注入嘅 `PORT`，並喺 production 下直接服務 Vite 輸出）。
4. **環境變數**：喺 Hostinger 面板設定 §5 全部變數。
5. **資料庫**：Hostinger 提供 MySQL；建立資料庫後將連線字串填入 `DATABASE_URL`，首次部署執行 `pnpm db:push`（或手動執行 `drizzle/` 遷移 SQL）。
6. **⚠️ 已知不可移植項**（需 IT Developer 處理）：
   - **OAuth**：現有 `OAUTH_SERVER_URL` 依賴 Manus OAuth 環境；Hostinger 上需要學校身份系統或第三方 OAuth Provider 的憑證與回調地址（`/api/oauth/callback`）。
   - **LLM**：`BUILT_IN_FORGE_API_URL/KEY` 預設指向 Manus forge；Hostinger 上可換成任何 OpenAI 兼容供應商（見 §5.1）。
   - **儲存**：`server/storage.ts` 依賴 forge 儲存/資料 API；如需檔案上傳（作品集封面等），要接入 S3 相容儲存（專案已含 `@aws-sdk/client-s3` 依賴，但 adapter 需按部署環境配置）。
7. **建議架構**：保留現有 Manus adapter 作後備，另加 Hostinger adapter（Provider 介面分離），避免一刀切遷移風險。

---

## 8. 驗證清單（交付前）

- [ ] `pnpm check` 零錯誤
- [ ] `pnpm test` 全部通過（15 個測試）
- [ ] `pnpm build` 成功
- [ ] 本地 `pnpm dev` 後瀏覽器開啟：學生版 `/student`（Proofreading + 15 課）正常顯示
- [ ] 老師版 `/teacher`：總覽／校對／15 課／作品集／帳號五區正常
- [ ] 15 課頁：5 單元 × 3 堂、每單元第 3 堂「正式作文」badge、P5/P6 題目切換、六步流程（構思→AI 優化構思→大綱→草稿→自我修訂→提交）每堂可見
- [ ] Proofreading：標題可自行輸入
- [ ] 設定 LLM 環境變數後，AI 評估（「完整評估」按鈕）有真實回應
- [ ] 設定 `DATABASE_URL` 後，學生作品／評估記錄可寫入 MySQL

---

## 9. 已知注意事項

1. **示範模式**：未設定 `DATABASE_URL` 或 `BUILT_IN_FORGE_API_URL/KEY` 時，平台以示範模式運作——所有 UI 可預覽、可操作，但不會真實寫庫、不會有真實 AI 回應、登入流程不會成功。
2. **端口衝突（僅本機）**：開發機 3000 埠被 WhatsApp bridge（hermes 服務，PID 1504）佔用，**不可停止或改動**；本專案一律用 3001+。
3. **作文題目為建議版**：見 §3.2 警告，等學校正式題目更換。
4. **AI 安全原則**：AI 不代寫完整作文；只提供問題、提示、方向、錯誤說明與建議。修改 AI 提示詞或評估 schema 時，需同步更新 `server/writingEvaluation.test.ts` 的測試。
5. **學生隱私**：平台只使用校內代號（如 P5-01），不收集個人資料；`redact()` 會在 AI 呼叫前遮蓋明顯的電郵及香港電話號碼。

---

## 10. 快速上手（5 分鐘）

```bash
# 1. 安裝
pnpm install

# 2. 開發模式（Windows 用 3001 埠）
$env:PORT='3001'; pnpm dev

# 3. 瀏覽器
#    http://localhost:3001/          → 登入前頁
#    http://localhost:3001/student   → 學生版（示範模式）
#    http://localhost:3001/teacher   → 老師版（示範模式）

# 4. 駁 LLM（.env）
BUILT_IN_FORGE_API_URL=https://你的-openai-相容-base-url
BUILT_IN_FORGE_API_KEY=你的-api-key

# 5. 駁 SQL（.env）
DATABASE_URL=mysql://user:password@127.0.0.1:3306/storyseed
pnpm db:push
```

如有任何疑問，請先查閱專案根目錄 `AI_HANDOFF.md`（早期完整交接文件）及 `LOCAL_SETUP.md`。
