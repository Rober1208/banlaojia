# 伴老家

陪爸媽走一圈家裡的居家安全健檢網頁。純靜態網站（HTML／CSS／JavaScript），不需要建置工具，也沒有後端。

## 本機預覽

```bash
python -m http.server 8765
```

在這個資料夾執行後，打開 http://localhost:8765

## 檔案

- `index.html`：頁面骨架
- `data.js`：題庫、改善建議、補助資訊（要修改題目或文字就改這裡）
- `app.js`：流程、計分、結果頁
- `styles.css`：樣式，包含字體放大與高對比模式

## 部署

把這個資料夾整個放到任何靜態網站空間即可，例如 GitHub Pages 或 Netlify。
修改 CSS 或 JS 後，記得把 `index.html` 裡的 `?v=` 版本號加 1，避免瀏覽器讀到舊的快取。
