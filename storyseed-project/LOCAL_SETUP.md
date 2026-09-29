# StorySeed 本機使用指南

這個專案可以在 Windows、macOS 或 Linux 本機運行。它是 React + Vite + Express + MySQL 的完整網站，不是單一 HTML 檔案。

## 一、先安裝必要軟件

請安裝：

1. **Node.js 22 或以上**：<https://nodejs.org/>
2. **pnpm 10**：

```bash
npm install -g pnpm
```

如果你使用 Windows，建議使用 PowerShell；macOS／Linux 可使用 Terminal。

## 二、解壓及安裝套件

進入專案資料夾後執行：

```bash
pnpm install
```

## 三、建立環境設定

將 `.env.example` 複製成 `.env`：

```bash
cp .env.example .env
```

Windows PowerShell 使用：

```powershell
Copy-Item .env.example .env
```

### 最簡單：只試用介面

如果只是想先看看平台介面，可以先保留空白設定，然後執行：

```bash
pnpm dev
```

在瀏覽器開啟：<http://localhost:3000/>

這個模式可以查看示範工作區及主要介面，但 AI、正式登入及跨裝置保存不會完整運作。

### 完整使用所需設定

要使用正式 AI、學生／教師登入及資料保存，需要在 `.env` 填入：

- `DATABASE_URL`：MySQL 或 TiDB 資料庫連接字串
- `JWT_SECRET`：至少 32 個字符的本機 session secret
- `VITE_APP_ID`：登入服務的 application ID
- `OAUTH_SERVER_URL`：登入服務網址
- `BUILT_IN_FORGE_API_URL`：AI 服務 API 網址
- `BUILT_IN_FORGE_API_KEY`：AI 服務 API key
- `OWNER_OPEN_ID`：管理員識別碼

**不要把 `.env`、API key、資料庫密碼上載到 GitHub 或傳給學生。**

## 四、啟動開發版本

```bash
pnpm dev
```

開啟：<http://localhost:3000/>

常用入口：

- 示範首頁：`http://localhost:3000/`
- 教師登入：`http://localhost:3000/teacher-login`
- 學生登入：`http://localhost:3000/student-login`

## 五、正式本機版本

```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

之後開啟：<http://localhost:3000/>

## 六、資料庫

正式使用前，先在 MySQL 建立一個空資料庫，然後在 `.env` 設定 `DATABASE_URL`。接著執行：

```bash
pnpm db:push
```

這會產生／套用 Drizzle database migration。若你不熟悉 MySQL，建議先用本機 Docker、XAMPP，或由 IT 人員建立一個 MySQL database。

## 七、重要限制

本機示範模式適合你自己試用版面及流程。若要讓學校約 40 位學生同時使用，不建議只在你自己的電腦上開啟，因為：

- 你的電腦必須長期開機及連接網絡；
- 學生在校外不能穩定連入；
- 本機資料沒有自動備份；
- AI API key 及資料庫需要安全保存。

學校正式使用時，應部署到 Hostinger 或其他伺服器，再配合正式 MySQL、備份及 HTTPS。

## Troubleshooting

### `pnpm` 找不到

重新安裝 Node.js，然後執行：

```bash
npm install -g pnpm
```

### Port 3000 已被使用

先關閉另一個開發伺服器，或在本機 shell 設定另一個 port，再重新啟動。

### AI 沒有回覆

確認 `.env` 中的 `BUILT_IN_FORGE_API_URL` 及 `BUILT_IN_FORGE_API_KEY` 已填寫，並重新啟動 `pnpm dev`。
