#!/usr/bin/env node
#!/usr/bin/env node
import{existsSync as L,readFileSync as Q,writeFileSync as j}from"fs";import{readFileSync as X,writeFileSync as w,existsSync as C,mkdirSync as z,renameSync as K}from"fs";import{execSync as Y}from"child_process";import{join as N}from"path";var h=".claude",r=N(h,"session.md"),E=N(h,"settings.json"),S="CLAUDE.md",v="@.claude/session.md",D=3,I=150,u=`<!-- sc: no previous session recorded -->
`;function y(e){C(e)||z(e,{recursive:!0})}function P(e,t={}){if(!C(e))return t;try{return JSON.parse(X(e,"utf8"))}catch{return t}}function O(e,t){w(e,JSON.stringify(t,null,2)+`
`,"utf8")}function m(e,t){let o=e+".tmp";w(o,t,"utf8"),K(o,e)}function g(e,t=""){try{return Y(`git ${e}`,{encoding:"utf8",stdio:["pipe","pipe","pipe"]}).trim()}catch{return t}}function b(e,t){let o=e.split(/\s+/).filter(Boolean);return o.length<=t?e:o.slice(0,t).join(" ")+" \u2026[trimmed]"}var V="## Pinned decisions";function $(e){if(!e.includes(V))return{pinned:"",rest:e};let t=e.indexOf(`
---
`);return t===-1?{pinned:e.trim(),rest:""}:{pinned:e.slice(0,t).trim(),rest:e.slice(t)}}function A(e){return e.split(/^---$/m).map(t=>t.trim()).filter(t=>t&&!t.startsWith("<!--"))}function _(e){return e.map(t=>`---
${t}
`).join(`
`)+`
`}async function R(){let e=[];y(h),e.push("\u2713 .claude/ directory ready"),L(r)?e.push("\xB7 .claude/session.md already exists"):(j(r,u,"utf8"),e.push("\u2713 .claude/session.md created"));let t=L(S),o=t?Q(S,"utf8"):"";o.includes(v)?e.push("\xB7 CLAUDE.md already has @import"):(o=`
<!-- sc: session continuity -->
${v}
`+o,j(S,o,"utf8"),e.push(`\u2713 CLAUDE.md ${t?"updated":"created"} with @import`));let s=P(E,{}),a={type:"command",command:"sc snapshot"};s.hooks||(s.hooks={}),s.hooks.Stop||(s.hooks.Stop=[]),s.hooks.Stop.some(c=>Array.isArray(c.hooks)&&c.hooks.some(d=>d.command&&d.command.includes("sc snapshot")))?e.push("\xB7 Stop hook already registered"):(s.hooks.Stop.push({hooks:[a]}),e.push("\u2713 Stop hook registered in .claude/settings.json")),s.hooks.PreCompact||(s.hooks.PreCompact=[]),s.hooks.PreCompact.some(c=>Array.isArray(c.hooks)&&c.hooks.some(d=>d.command&&d.command.includes("sc snapshot")))?e.push("\xB7 PreCompact hook already registered"):(s.hooks.PreCompact.push({hooks:[a]}),e.push("\u2713 PreCompact hook registered in .claude/settings.json")),O(E,s);let l=!1;try{let{execSync:c}=await import("child_process");c("claude --version",{stdio:"pipe"}),l=!0,e.push("\u2713 claude CLI found \u2014 narrative snapshots enabled")}catch{e.push("\u26A0 claude CLI not found \u2014 snapshots will be objective-only (git state, no narrative)")}console.log(`
sc init complete
`),e.forEach(c=>console.log(" ",c)),console.log(`
How it works:`),console.log("  \u2022 When a Claude session ends, sc snapshot runs automatically"),console.log("  \u2022 The snapshot is saved to .claude/session.md"),console.log("  \u2022 CLAUDE.md imports it, so every new session starts with full context"),l||(console.log(`
  To enable narrative summaries, install the Claude CLI:`),console.log("  https://docs.anthropic.com/en/docs/claude-code")),console.log()}import{spawnSync as Z}from"child_process";import{existsSync as ee,readFileSync as te}from"fs";var se=`You are summarizing a Claude Code development session for the developer who just finished it.
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
`;function oe(){return{branch:g("branch --show-current","unknown"),status:g("status --short","(no changes)"),log:g("log --oneline -5","(no commits)"),diffStat:g("diff --stat HEAD","").split(`
`).slice(0,10).join(`
`)}}function ne(e,t){let{branch:o,status:s,log:a,diffStat:i}=t;return[`## Session \u2014 ${e} | branch: ${o}`,"","**Git status:**","```",s||"(clean)","```","","**Recent commits:**","```",a||"(none)","```",i?`
**Diff stat:**
\`\`\`
${i}
\`\`\``:""].filter(n=>n!==void 0).join(`
`).trim()}function ie(e){let t=[`Branch: ${e.branch}`,`Status:
${e.status}`,`Recent commits:
${e.log}`,e.diffStat?`Diff stat:
${e.diffStat}`:""].filter(Boolean).join(`

`),o=se+t,s=Z("claude",["-p",o],{encoding:"utf8",timeout:15e3,stdio:["pipe","pipe","pipe"]});return s.status!==0||s.error||!s.stdout.trim()?null:s.stdout.trim()}async function x(){y(h);let e=new Date().toISOString(),t=oe(),o=ne(e,t),s=ie(t);if(s){let k=b(s,I);o+=`

**Narrative:**
`+k}else o+="\n\n**Narrative:** [unavailable \u2014 run `claude --version` to enable]";let a=ee(r)?te(r,"utf8"):"",{pinned:i,rest:n}=$(a),l=A(n),c=[o,...l].slice(0,D),d=(i?i+`
`:"")+_(c);m(r,d),process.stderr.write(`[sc] snapshot written \u2014 ${e}
`)}import{existsSync as re,readFileSync as ce}from"fs";async function T(){if(!re(r)){console.log("No session file found. Run `sc init` first.");return}let e=ce(r,"utf8").trim();if(!e||e.startsWith("<!--")){console.log("No session recorded yet. End a Claude session to generate the first snapshot.");return}console.log(`
\u2500\u2500 Current session state (`+r+`) \u2500\u2500
`),console.log(e),console.log(`
\u2500\u2500 end \u2500\u2500
`)}import{existsSync as ae}from"fs";import{createInterface as le}from"readline";async function W(){if(!ae(r)){console.log("Nothing to clear \u2014 .claude/session.md does not exist.");return}if(!await de("Clear all session history? This cannot be undone. (y/N) ")){console.log("Aborted.");return}m(r,u),console.log("Session history cleared.")}function de(e){return new Promise(t=>{let o=le({input:process.stdin,output:process.stdout});o.question(e,s=>{o.close(),t(s.trim().toLowerCase()==="y")})})}async function F(){console.log("Writing snapshot\u2026"),await x(),console.log("Done. Run `sc status` to review.")}import{existsSync as pe,readFileSync as ue}from"fs";var M="## Pinned decisions",me="<!-- sc: pinned decisions survive the rolling session window -->";async function H(e){let t=e[0];(!t||!t.trim())&&(console.error('Usage: sc decide "Your decision or rationale here"'),process.exit(1));let o=t.trim(),s=`- ${o}`,a=new Date().toISOString(),i=`${s} _(${a})_`,n=pe(r)?ue(r,"utf8"):u,l;if(n.includes(M))l=n.replace(/(## Pinned decisions\n(?:<!--[^>]*-->\n)?)([\s\S]*?)(\n---|\n<!-- sc:|$)/,(c,d,k,q)=>`${d}${k}
${i}${q}`);else{let c=`${M}
${me}
${i}

`,d=n.indexOf(`---
`);d===-1||n.trim()===u.trim()?l=c+(n.startsWith("<!--")?"":n):l=n.slice(0,d)+c+n.slice(d)}m(r,l),console.log(`Decision pinned: "${o}"`)}import{existsSync as J,readFileSync as fe,readdirSync as he,mkdirSync as ge,unlinkSync as Xe,accessSync as Se,constants as ye}from"fs";import{join as U,basename as Ke}from"path";import{homedir as xe}from"os";var f=U(xe(),".sc","sessions");function ke(){J(f)||ge(f,{recursive:!0})}function G(){let e=[];try{ke(),Se(f,ye.W_OK),e.push({name:"Sessions directory",ok:!0,detail:f})}catch{e.push({name:"Sessions directory",ok:!1,detail:`Not writable: ${f}`})}let t=[];try{t=he(f).filter(i=>i.endsWith(".json")),e.push({name:"Session files",ok:!0,detail:`${t.length} project(s) tracked`})}catch{e.push({name:"Session files",ok:!1,detail:"Cannot read sessions directory"})}let o=[],s=[],a=null;for(let i of t)try{let n=JSON.parse(fe(U(f,i),"utf8"));n.path&&!J(n.path)&&o.push({name:n.name,path:n.path});let l=n.sessions?.[0]?.timestamp;l&&(!a||l>a)&&(a=l)}catch{s.push(i)}if(s.length>0?e.push({name:"Data integrity",ok:!1,detail:`${s.length} corrupt file(s): ${s.join(", ")}`}):e.push({name:"Data integrity",ok:!0,detail:"All session files parse correctly"}),o.length>0?e.push({name:"Orphaned sessions",ok:!1,detail:`${o.length} project(s) no longer exist on disk`,orphaned:o}):e.push({name:"Orphaned sessions",ok:!0,detail:"All tracked projects exist on disk"}),a){let i=Math.floor((Date.now()-new Date(a).getTime())/864e5);e.push({name:"Last activity",ok:i<30,detail:i===0?"Today":`${i} day(s) ago`})}else e.push({name:"Last activity",ok:!0,detail:"No sessions saved yet"});return e}var[,,p,...Ee]=process.argv;function ve(){let e=G(),t=e.every(s=>s.ok);console.log(t?`\u2705 All checks passed
`:`\u26A0\uFE0F  Issues found
`);for(let s of e)console.log(`${s.ok?"\u2705":"\u274C"} ${s.name}: ${s.detail}`);let o=e.find(s=>s.name==="Orphaned sessions"&&!s.ok);if(o?.orphaned){console.log(`
To fix orphaned sessions, run:`);for(let s of o.orphaned)console.log(`  npx session-continuity migrate "${s.path}" "<new-path>"`)}t||process.exit(1)}var B={init:R,snapshot:x,status:T,clear:W,rotate:F,decide:H,doctor:ve};(!p||p==="--help"||p==="-h")&&(console.log(`
sc \u2014 session continuity for Claude Code

Commands:
  sc init              Wire up this project (run once per project)
  sc snapshot          Write a session snapshot (called automatically by Stop hook)
  sc status            Show the current session state
  sc clear             Reset session history
  sc rotate            Manually trigger a snapshot write (use before force-quit)
  sc decide "<why>"    Pin a permanent decision that survives the rolling window
  sc doctor            Check setup health: directory, data integrity, orphaned sessions

Options:
  --version, -v  Print version
  --help, -h     Show this help
`),process.exit(0));if(p==="--version"||p==="-v"){let{createRequire:e}=await import("module"),o=e(import.meta.url)("../package.json");console.log(o.version),process.exit(0)}B[p]||(console.error(`Unknown command: ${p}. Run 'sc --help' for usage.`),process.exit(1));try{await B[p](Ee)}catch(e){console.error(`sc ${p} failed:`,e.message),process.exit(1)}
