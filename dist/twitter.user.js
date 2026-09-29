// ==UserScript==
// @name         Twitter downloader
// @namespace    https://twitter.com/
// @version      20260929.173943
// @description  twitter tweet downloader
// @downloadURL  https://github.com/rayfill/userscript-downloader/raw/refs/heads/main/dist/twitter.user.js
// @author       rayfill
// @match        https://x.com/*
// @connect      x.com
// @connect      pbs.twimg.com
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

"use strict";(()=>{var g=unsafeWindow.XMLHttpRequest,o=[];function T(n){o=o.filter(s=>s!==n)}function i(n){T(n),o.push(n)}function y(){if(unsafeWindow.XMLHttpRequest!==g){console.warn("already hooked");return}unsafeWindow.XMLHttpRequest=new Proxy(XMLHttpRequest,{construct(n,s,l){let e=Reflect.construct(n,s,l);e.addEventListener("error",()=>{o.forEach(r=>{r.error!==void 0&&r.error(e.responseURL,new Error)})});let c=0;e.addEventListener("progress",r=>{let a=r.loaded-c;if(r.lengthComputable){let t=r.total,u=r.loaded;o.forEach(p=>{p.progress!==void 0&&p.progress(e.responseURL,a,t,u===t)})}else o.forEach(t=>{t.progress!==void 0&&t.progress(e.responseURL,a)})}),e.addEventListener("load",r=>{let a=e.responseType===""?"text":e.responseType,t=e.response,u=e.responseURL,p=e.getResponseHeader("content-type");o.forEach(d=>{d.load!==void 0&&d.load(a,t,u,p)})});let f=e.send;return e.send=(...r)=>f.apply(e,r),e}})}async function H(){try{i({async load(s,l,e,c){}}),y()}catch(n){console.error(n)}}H();})();
