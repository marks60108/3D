# P2S 3D 建模工具

給拓竹 P2S(列印範圍 256×256×256mm)使用的網頁參數化建模工具。用滑桿調整尺寸、即時看 3D 預覽,滿意後直接下載 STL 匯入 Bambu Studio 列印。

## 開發

```bash
npm install
npm run dev       # 啟動本機開發伺服器
npm run build     # 打包 production build
npm run verify    # 在 Node 中驗證所有模板都能正確產生幾何(不用開瀏覽器)
```

## 功能

- **模板模式**:收納盒(可選壓入式蓋子)、L 型支架(含鎖孔)、圓柱/套筒、壁掛掛勾,每個模板都可用滑桿調整尺寸、孔位等參數。
- **自訂堆疊模式**:自行疊加方塊/圓柱,指定位置、旋轉與聯集/差集運算,組出模板沒有涵蓋的形狀。
- 3D 預覽會畫出 P2S 的 256mm³ 列印範圍框線,超出範圍時框線變紅並顯示警告。
- 下載的 STL 座標原點對齊列印範圍角落,方便直接匯入切片軟體。

## 技術

Vite + React + TypeScript,3D 渲染用 `@react-three/fiber`(Three.js),實體布林運算(挖孔、合併)用 [manifold-3d](https://github.com/elalish/manifold) 的 WASM 版本,STL 匯出用 `three-stdlib` 的 `STLExporter`。

新增模板的方式:在 `src/templates/` 建立一個檔案,依照 `types.ts` 的 `Template` 介面定義參數與 `build()` 函式,再到 `src/templates/index.ts` 註冊。
