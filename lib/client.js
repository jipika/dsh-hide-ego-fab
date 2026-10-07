// dsh-hide-ego-fab — browser half: hide ego-browser's floating watch ball.
//
// 背景：dsh-ego-browser 的 client 半边是二选一（见它的 lib/client.js apply()）——
//   有 betterSidebar 服务 → mountSidebarTab()，在侧边栏开「Agent 浏览器」Tab；
//   没有 → mountFloatingWatch()，在右下角挂 #dsh-ego-fab（那个地球图标圆钮）。
// 它自身没有任何控制浮球显示的配置（client 侧 18 个配置字段里没有；唯一沾边的
// disableFrameRelay 只关画面回传，浮球本体照旧）。所以禁用 dsh-better-sidebar 之后，
// 想保住 ego_* 工具、又不想看浮球，只能从外面盖一条 CSS —— 就是本插件干的事。
//
// 强度依据：ego 的 PANEL_CSS 里 `#dsh-ego-fab{ … display: flex; … }` 是普通声明
// （无 !important），本插件的 !important 稳赢。
//
// 作用域：只动 #dsh-ego-fab。#dsh-ego-panel 不碰 —— 观察窗本身保留，只是没有入口。
//
// 开关（无需重载）：
//   document.documentElement.dataset.hideEgoFab = "off"   // 立刻恢复显示
//   delete document.documentElement.dataset.hideEgoFab    // 再次隐藏
//
// 卸载：删掉 profile cordis.patch.yml 里的 insert 块 + package.json 的依赖行 + 重启应用。

window.__ModuleLoader__.load({
	id: "dsh-hide-ego-fab",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const STYLE_ID = "dsh-hide-ego-fab-style";
		const CSS = [
			"/* ego-browser 的右下角浮球：只在 better-sidebar 缺席时出现 */",
			'html:not([data-hide-ego-fab="off"]) #dsh-ego-fab {',
			'  display: none !important;',
			'}',
		].join("\n");

		function apply() {
			if (!document.head) {
				document.addEventListener("DOMContentLoaded", apply, { once: true });
				return;
			}
			// 复用同一个 <style> 并写入当前版本：client 插件热重载后旧标签还挂在 head 上，
			// 光按 id 去重会让新代码配着旧样式跑。
			let style = document.getElementById(STYLE_ID);
			if (style === null) {
				style = document.createElement("style");
				style.id = STYLE_ID;
				document.head.appendChild(style);
			}
			if (style.textContent !== CSS) style.textContent = CSS;
		}

		exports.apply = apply;
		exports.inject = [];
		return module.exports;
	}
});
