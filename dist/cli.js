#!/usr/bin/env node
#!/usr/bin/env node
import{existsSync as F,readFileSync as ce,writeFileSync as J}from"fs";import{readFileSync as te,writeFileSync as I,existsSync as $,mkdirSync as oe,renameSync as ne}from"fs";import{execSync as re}from"child_process";import{join as b}from"path";var h=".claude",c=b(h,"session.md"),D=b(h,"settings.json"),S="CLAUDE.md",w="@.claude/session.md",N=3,A=150,f=`<!-- sc: no previous session recorded -->
`;function y(e){$(e)||oe(e,{recursive:!0})}function _(e,s={}){if(!$(e))return s;try{return JSON.parse(te(e,"utf8"))}catch{return s}}function L(e,s){I(e,JSON.stringify(s,null,2)+`
`,"utf8")}function u(e,s){let o=e+".tmp";I(o,s,"utf8"),ne(o,e)}function g(e,s=""){try{return re(`git ${e}`,{encoding:"utf8",stdio:["pipe","pipe","pipe"]}).trim()}catch{return s}}function j(e,s){let o=e.split(/\s+/).filter(Boolean);return o.length<=s?e:o.slice(0,s).join(" ")+" \u2026[trimmed]"}var ie="## Pinned decisions";function R(e){if(!e.includes(ie))return{pinned:"",rest:e};let s=e.indexOf(`
---
`);return s===-1?{pinned:e.trim(),rest:""}:{pinned:e.slice(0,s).trim(),rest:e.slice(s)}}function T(e){return e.split(/^---$/m).map(s=>s.trim()).filter(s=>s&&!s.startsWith("<!--"))}function W(e){return e.map(s=>`---
${s}
`).join(`
`)+`
`}async function M(){let e=[];y(h),e.push("\u2713 .claude/ directory ready"),F(c)?e.push("\xB7 .claude/session.md already exists"):(J(c,f,"utf8"),e.push("\u2713 .claude/session.md created"));let s=F(S),o=s?ce(S,"utf8"):"";o.includes(w)?e.push("\xB7 CLAUDE.md already has @import"):(o=`
<!-- sc: session continuity -->
${w}
`+o,J(S,o,"utf8"),e.push(`\u2713 CLAUDE.md ${s?"updated":"created"} with @import`));let t=_(D,{}),r={type:"command",command:"sc snapshot"};t.hooks||(t.hooks={}),t.hooks.Stop||(t.hooks.Stop=[]),t.hooks.Stop.some(a=>Array.isArray(a.hooks)&&a.hooks.some(d=>d.command&&d.command.includes("sc snapshot")))?e.push("\xB7 Stop hook already registered"):(t.hooks.Stop.push({hooks:[r]}),e.push("\u2713 Stop hook registered in .claude/settings.json")),t.hooks.PreCompact||(t.hooks.PreCompact=[]),t.hooks.PreCompact.some(a=>Array.isArray(a.hooks)&&a.hooks.some(d=>d.command&&d.command.includes("sc snapshot")))?e.push("\xB7 PreCompact hook already registered"):(t.hooks.PreCompact.push({hooks:[r]}),e.push("\u2713 PreCompact hook registered in .claude/settings.json")),L(D,t);let l=!1;try{let{execSync:a}=await import("child_process");a("claude --version",{stdio:"pipe"}),l=!0,e.push("\u2713 claude CLI found \u2014 narrative snapshots enabled")}catch{e.push("\u26A0 claude CLI not found \u2014 snapshots will be objective-only (git state, no narrative)")}console.log(`
sc init complete
`),e.forEach(a=>console.log(" ",a)),console.log(`
How it works:`),console.log("  \u2022 When a Claude session ends, sc snapshot runs automatically"),console.log("  \u2022 The snapshot is saved to .claude/session.md"),console.log("  \u2022 CLAUDE.md imports it, so every new session starts with full context"),l||(console.log(`
  To enable narrative summaries, install the Claude CLI:`),console.log("  https://docs.anthropic.com/en/docs/claude-code")),console.log()}import{spawnSync as ae}from"child_process";import{existsSync as le,readFileSync as de}from"fs";var pe=`You are summarizing a Claude Code development session for the developer who just finished it.
Given the git state below, write a concise session snapshot in this exact format (no other text):

**Status:** <one sentence \u2014 what was being worked on and where things stand>

**Decisions made:**
- <decision 1 \u2014 include the "why" if inferable from context>
- <decision 2>

**Next steps:**
- <most important thing to do next>
- <second thing if applicable>

**Blockers:** <"None" or a brief description>

Rules:
- Total response must be under 120 words
- Be specific \u2014 name files, functions, or commands if relevant
- If git state shows no meaningful changes, say "No significant changes this session"
- Do not add headings, preamble, or closing remarks \u2014 just the five fields above

Git state:
`;function ue(){return{branch:g("branch --show-current","unknown"),status:g("status --short","(no changes)"),log:g("log --oneline -5","(no commits)"),diffStat:g("diff --stat HEAD","").split(`
`).slice(0,10).join(`
`)}}function me(e,s){let{branch:o,status:t,log:r,diffStat:i}=s;return[`## Session \u2014 ${e} | branch: ${o}`,"","**Git status:**","```",t||"(clean)","```","","**Recent commits:**","```",r||"(none)","```",i?`
**Diff stat:**
\`\`\`
${i}
\`\`\``:""].filter(n=>n!==void 0).join(`
`).trim()}function fe(e){let s=[`Branch: ${e.branch}`,`Status:
${e.status}`,`Recent commits:
${e.log}`,e.diffStat?`Diff stat:
${e.diffStat}`:""].filter(Boolean).join(`

`),o=pe+s,t=ae("claude",["-p",o],{encoding:"utf8",timeout:15e3,stdio:["pipe","pipe","pipe"]});return t.status!==0||t.error||!t.stdout.trim()?null:t.stdout.trim()}async function x(){y(h);let e=new Date().toISOString(),s=ue(),o=me(e,s),t=fe(s);if(t){let v=j(t,A);o+=`

**Narrative:**
`+v}else o+="\n\n**Narrative:** [unavailable \u2014 run `claude --version` to enable]";let r=le(c)?de(c,"utf8"):"",{pinned:i,rest:n}=R(r),l=T(n),a=[o,...l].slice(0,N),d=(i?i+`
`:"")+W(a);u(c,d),process.stderr.write(`[sc] snapshot written \u2014 ${e}
`)}import{existsSync as he,readFileSync as ge}from"fs";async function H(){if(!he(c)){console.log("No session file found. Run `sc init` first.");return}let e=ge(c,"utf8").trim();if(!e||e.startsWith("<!--")){console.log("No session recorded yet. End a Claude session to generate the first snapshot.");return}console.log(`
\u2500\u2500 Current session state (`+c+`) \u2500\u2500
`),console.log(e),console.log(`
\u2500\u2500 end \u2500\u2500
`)}import{existsSync as Se}from"fs";import{createInterface as ye}from"readline";async function U(){if(!Se(c)){console.log("Nothing to clear \u2014 .claude/session.md does not exist.");return}if(!await xe("Clear all session history? This cannot be undone. (y/N) ")){console.log("Aborted.");return}u(c,f),console.log("Session history cleared.")}function xe(e){return new Promise(s=>{let o=ye({input:process.stdin,output:process.stdout});o.question(e,t=>{o.close(),s(t.trim().toLowerCase()==="y")})})}async function G(){console.log("Writing snapshot\u2026"),await x(),console.log("Done. Run `sc status` to review.")}import{existsSync as Ee,readFileSync as ke}from"fs";var B="## Pinned decisions",ve="<!-- sc: pinned decisions survive the rolling session window -->";async function q(e){let s=e[0];(!s||!s.trim())&&(console.error('Usage: sc decide "Your decision or rationale here"'),process.exit(1));let o=s.trim(),t=`- ${o}`,r=new Date().toISOString(),i=`${t} _(${r})_`,n=Ee(c)?ke(c,"utf8"):f,l;if(n.includes(B))l=n.replace(/(## Pinned decisions\n(?:<!--[^>]*-->\n)?)([\s\S]*?)(\n---|\n<!-- sc:|$)/,(a,d,v,se)=>`${d}${v}
${i}${se}`);else{let a=`${B}
${ve}
${i}

`,d=n.indexOf(`---
`);d===-1||n.trim()===f.trim()?l=a+(n.startsWith("<!--")?"":n):l=n.slice(0,d)+a+n.slice(d)}u(c,l),console.log(`Decision pinned: "${o}"`)}import{execSync as $e}from"child_process";import{readFileSync as be,writeFileSync as Ae,unlinkSync as P}from"fs";import{tmpdir as _e}from"os";import{join as Le}from"path";import{existsSync as O,readFileSync as z,readdirSync as De,mkdirSync as we,unlinkSync as cs,accessSync as Ne,constants as Oe}from"fs";import{join as C,basename as X}from"path";import{homedir as Ce}from"os";import{createHash as Pe}from"crypto";var m=C(Ce(),".sc","sessions");function K(){O(m)||we(m,{recursive:!0})}function Ie(e){return Pe("sha1").update(e).digest("hex").slice(0,12)}function Y(e){return C(m,`${Ie(e)}.json`)}function E(e){let s=Y(e);if(!O(s))return{path:e,name:X(e),pinned:[],sessions:[]};try{return JSON.parse(z(s,"utf8"))}catch{return{path:e,name:X(e),pinned:[],sessions:[]}}}function k(e,s){K(),u(Y(e),JSON.stringify(s,null,2)+`
`)}function V(){let e=[];try{K(),Ne(m,Oe.W_OK),e.push({name:"Sessions directory",ok:!0,detail:m})}catch{e.push({name:"Sessions directory",ok:!1,detail:`Not writable: ${m}`})}let s=[];try{s=De(m).filter(i=>i.endsWith(".json")),e.push({name:"Session files",ok:!0,detail:`${s.length} project(s) tracked`})}catch{e.push({name:"Session files",ok:!1,detail:"Cannot read sessions directory"})}let o=[],t=[],r=null;for(let i of s)try{let n=JSON.parse(z(C(m,i),"utf8"));n.path&&!O(n.path)&&o.push({name:n.name,path:n.path});let l=n.sessions?.[0]?.timestamp;l&&(!r||l>r)&&(r=l)}catch{t.push(i)}if(t.length>0?e.push({name:"Data integrity",ok:!1,detail:`${t.length} corrupt file(s): ${t.join(", ")}`}):e.push({name:"Data integrity",ok:!0,detail:"All session files parse correctly"}),o.length>0?e.push({name:"Orphaned sessions",ok:!1,detail:`${o.length} project(s) no longer exist on disk`,orphaned:o}):e.push({name:"Orphaned sessions",ok:!0,detail:"All tracked projects exist on disk"}),r){let i=Math.floor((Date.now()-new Date(r).getTime())/864e5);e.push({name:"Last activity",ok:i<30,detail:i===0?"Today":`${i} day(s) ago`})}else e.push({name:"Last activity",ok:!0,detail:"No sessions saved yet"});return e}async function Q(e){let s=e[0]||process.cwd(),o=E(s);if(o.sessions.length===0){console.log("No sessions to edit.");return}let t=o.sessions[0],r=Le(_e(),`sc-edit-${Date.now()}.json`);Ae(r,JSON.stringify(t,null,2)+`
`,"utf8");let i=process.env.EDITOR||"nano";try{$e(`${i} "${r}"`,{stdio:"inherit"})}catch{console.error("Editor exited with an error.");try{P(r)}catch{}return}let n;try{n=JSON.parse(be(r,"utf8"))}catch{console.error("Failed to parse edited file \u2014 changes discarded.");try{P(r)}catch{}return}try{P(r)}catch{}o.sessions[0]=n,k(s,o),console.log(`Session updated (${n.timestamp}).`)}async function Z(e){let s=e[0]||process.cwd(),o=E(s);if(o.sessions.length===0){console.log("Nothing to undo.");return}let t=o.sessions.shift();k(s,o),console.log(`Removed session from ${t.timestamp}: "${t.status}"`)}var[,,p,...je]=process.argv;function Re(){let e=V(),s=e.every(t=>t.ok);console.log(s?`\u2705 All checks passed
`:`\u26A0\uFE0F  Issues found
`);for(let t of e)console.log(`${t.ok?"\u2705":"\u274C"} ${t.name}: ${t.detail}`);let o=e.find(t=>t.name==="Orphaned sessions"&&!t.ok);if(o?.orphaned){console.log(`
To fix orphaned sessions, run:`);for(let t of o.orphaned)console.log(`  npx session-continuity migrate "${t.path}" "<new-path>"`)}s||process.exit(1)}var ee={init:M,snapshot:x,status:H,clear:U,rotate:G,decide:q,edit:Q,undo:Z,doctor:Re};(!p||p==="--help"||p==="-h")&&(console.log(`
sc \u2014 session continuity for Claude Code

Commands:
  sc init              Wire up this project (run once per project)
  sc snapshot          Write a session snapshot (called automatically by Stop hook)
  sc status            Show the current session state
  sc clear             Reset session history
  sc rotate            Manually trigger a snapshot write (use before force-quit)
  sc decide "<why>"    Pin a permanent decision that survives the rolling window
  sc edit [path]       Open the most recent session entry in $EDITOR
  sc undo [path]       Remove the most recent session entry
  sc doctor            Check setup health: directory, data integrity, orphaned sessions

Options:
  --version, -v  Print version
  --help, -h     Show this help
`),process.exit(0));if(p==="--version"||p==="-v"){let{createRequire:e}=await import("module"),o=e(import.meta.url)("../package.json");console.log(o.version),process.exit(0)}ee[p]||(console.error(`Unknown command: ${p}. Run 'sc --help' for usage.`),process.exit(1));try{await ee[p](je)}catch(e){console.error(`sc ${p} failed:`,e.message),process.exit(1)}
