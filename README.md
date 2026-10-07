<div align="center">
  <img src="assets/icon.svg" width="72" alt="dsh-hide-ego-fab icon">
</div>

# dsh-hide-ego-fab

把 `dsh-ego-browser` 在「better-sidebar 缺席」时挂出的**右下角浮球**（`#dsh-ego-fab`）隐藏掉，其余能力一概不动。

## 它解决什么

`dsh-ego-browser` 的 client 半边是二选一（它自己 `lib/client.js` 的 `apply()`）：

- 有 `betterSidebar` 服务 → `mountSidebarTab()`，在侧边栏开一个「Agent 浏览器」Tab；
- 没有 → `mountFloatingWatch()`，往右下角挂一个 `#dsh-ego-fab`。

它自己**没有任何控制浮球显示的配置**：client 侧 18 个配置字段（`disableFrameRelay` / `isolateSpaces` / `idleTimeoutMin` / `chromePath` / `captureBackend` / `streamProfile` / `cdp*` / `ffmpeg*` / `githubMirror` / `egoCliArgs` / `chromeArgs`）里没有一个是管浮球的，唯一沾边的 `disableFrameRelay` 只是关掉画面回传，浮球本体照旧。

所以当 `dsh-better-sidebar` 被禁用时，想保住 `ego_*` 工具、又不想看浮球，只能从外面盖一条 CSS —— 就是本插件。

## 行为

```css
html:not([data-hide-ego-fab="off"]) #dsh-ego-fab { display: none !important; }
```

- 作用域只有 `#dsh-ego-fab`；**`#dsh-ego-panel` 不动**（观察窗本身保留，只是没有浮球入口）。
- 强度：ego 的 `PANEL_CSS` 里 `#dsh-ego-fab{ … display: flex; … }` 是普通声明（无 `!important`），本条稳赢。

## 开关（无需重载）

浏览器控制台里执行：

```js
document.documentElement.dataset.hideEgoFab = "off"    // 立刻恢复显示
delete document.documentElement.dataset.hideEgoFab     // 再次隐藏
```

## 离线验证

client 半边可以在 Node 里离线跑（stub DOM + fake `__ModuleLoader__`），不必等重启：

```bash
node tests/probe.mjs                                   # 14 项断言
node tests/probe.mjs <别的 client.js>                  # 拿别的插件做对照
```

## 挂载 / 卸载

- **挂载**：`~/.dsh/profiles/<profile>/cordis.patch.yml` 里的 insert 块（`- id: hide-ego-fab`）
  ＋ profile `package.json` 的 `"dsh-hide-ego-fab": "link:../../local-plugins/dsh-hide-ego-fab"`。
  `node_modules` 下对应的相对软链：`node_modules/dsh-hide-ego-fab -> ../../../local-plugins/dsh-hide-ego-fab`。
- **卸载**：删掉上面两处 + 重启应用（client 半边清单是启动时读的）。

## 归属

本机自研小工具（`~/.dsh/local-plugins/`）。改动只影响本插件的 `<style id="dsh-hide-ego-fab-style">`，删掉即完全恢复。
