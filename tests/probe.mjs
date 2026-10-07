// 离线探针：在 Node 里用 stub DOM 真跑 dsh-hide-ego-fab 的 client.js。
// 目的 = 在「必须重启应用才生效」的约束下，先把 apply() 的注册与注入断言掉。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const CLIENT = process.argv[2] || fileURLToPath(new URL("../lib/client.js", import.meta.url));

const captured = [];
globalThis.window = {
  __ModuleLoader__: {
    load(spec) { captured.push(spec); },
  },
};

const byId = new Map();
const head = {
  children: [],
  appendChild(el) {
    this.children.push(el);
    if (el.id) byId.set(el.id, el);
    return el;
  },
};
globalThis.document = {
  head,
  getElementById(id) { return byId.get(id) ?? null; },
  createElement(tag) {
    return {
      tagName: String(tag).toUpperCase(),
      id: "",
      textContent: "",
      appendChild() {},
    };
  },
  addEventListener() {},
};

const code = readFileSync(CLIENT, "utf8");
vm.runInThisContext(code, { filename: CLIENT });

const results = [];
const assert = (name, cond, extra = "") => {
  results.push({ name, ok: !!cond, extra });
};

assert("捕获到 1 次 __ModuleLoader__.load", captured.length === 1, `captured=${captured.length}`);
const spec = captured[0] || {};
assert("spec.id === 包名", spec.id === "dsh-hide-ego-fab", `id=${spec.id}`);
assert("spec.factory 是函数", typeof spec.factory === "function");

let exported = null;
let factoryErr = null;
try {
  exported = spec.factory(() => { throw new Error("require 不该被调用"); });
} catch (e) {
  factoryErr = e;
}
assert("factory 不抛错", !factoryErr, factoryErr ? String(factoryErr) : "");
assert("导出 apply 函数", exported && typeof exported.apply === "function");
assert("导出 inject 数组（空）", exported && Array.isArray(exported.inject) && exported.inject.length === 0,
  exported ? JSON.stringify(exported.inject) : "n/a");

let applyErr = null;
try {
  exported.apply();
} catch (e) {
  applyErr = e;
}
assert("apply() 不抛错", !applyErr, applyErr ? String(applyErr) : "");
assert("插入了 <style id=dsh-hide-ego-fab-style>", head.children.length === 1 && head.children[0].id === "dsh-hide-ego-fab-style",
  `children=${head.children.length}`);

const css = head.children[0] ? head.children[0].textContent : "";
assert("CSS 含 #dsh-ego-fab", css.includes("#dsh-ego-fab"));
assert("CSS 用 display: none !important", /display:\s*none\s*!important/.test(css));
assert("CSS 带 off 开关作用域", css.includes(':not([data-hide-ego-fab="off"])'));
assert("CSS 不碰 #dsh-ego-panel", !css.includes("#dsh-ego-panel"));

// 幂等：再调一次不该新增 style 标签
try { exported.apply(); } catch (e) { assert("二次 apply 不抛错", false, String(e)); }
assert("二次 apply 不重复插入", head.children.length === 1, `children=${head.children.length}`);

// document.head 缺席时的延后路径：应当注册 DOMContentLoaded 而不抛错
const noHeadDoc = globalThis.document;
let listened = 0;
globalThis.document = {
  head: null,
  getElementById: () => null,
  createElement: noHeadDoc.createElement,
  addEventListener(ev) { if (ev === "DOMContentLoaded") listened++; },
};
let lateErr = null;
try { exported.apply(); } catch (e) { lateErr = e; }
assert("无 head 时延后到 DOMContentLoaded 且不抛错", !lateErr && listened === 1, `listened=${listened} err=${lateErr}`);
globalThis.document = noHeadDoc;

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.extra ? "   [" + r.extra + "]" : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
