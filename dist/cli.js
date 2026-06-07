#!/usr/bin/env node
#!/usr/bin/env node
import{existsSync as R,readFileSync as z,writeFileSync as k}from"fs";import{readFileSync as B,writeFileSync as I,existsSync as D,mkdirSync as H,renameSync as G}from"fs";import{execSync as J}from"child_process";import{join as v}from"path";var p=".claude",n=v(p,"session.md"),x=v(p,"settings.json"),h="CLAUDE.md",w="@.claude/session.md",N=3,_=150,u=`<!-- sc: no previous session recorded -->
`;function S(e){D(e)||H(e,{recursive:!0})}function L(e,o={}){if(!D(e))return o;try{return JSON.parse(B(e,"utf8"))}catch{return o}}function O(e,o){I(e,JSON.stringify(o,null,2)+`
`,"utf8")}function m(e,o){let t=e+".tmp";I(t,o,"utf8"),G(t,e)}function f(e,o=""){try{return J(`git ${e}`,{encoding:"utf8",stdio:["pipe","pipe","pipe"]}).trim()}catch{return o}}function C(e,o){let t=e.split(/\s+/).filter(Boolean);return t.length<=o?e:t.slice(0,o).join(" ")+" \u2026[trimmed]"}var q="## Pinned decisions";function $(e){if(!e.includes(q))return{pinned:"",rest:e};let o=e.indexOf(`
---
`);return o===-1?{pinned:e.trim(),rest:""}:{pinned:e.slice(0,o).trim(),rest:e.slice(o)}}function b(e){return e.split(/^---$/m).map(o=>o.trim()).filter(o=>o&&!o.startsWith("<!--"))}function A(e){return e.map(o=>`---
${o}
`).join(`
`)+`
`}async function P(){let e=[];S(p),e.push("\u2713 .claude/ directory ready"),R(n)?e.push("\xB7 .claude/session.md already exists"):(k(n,u,"utf8"),e.push("\u2713 .claude/session.md created"));let o=R(h),t=o?z(h,"utf8"):"";t.includes(w)?e.push("\xB7 CLAUDE.md already has @import"):(t=`
<!-- sc: session continuity -->
${w}
`+t,k(h,t,"utf8"),e.push(`\u2713 CLAUDE.md ${o?"updated":"created"} with @import`));let s=L(x,{}),d={type:"command",command:"sc snapshot"};s.hooks||(s.hooks={}),s.hooks.Stop||(s.hooks.Stop=[]),s.hooks.Stop.some(r=>Array.isArray(r.hooks)&&r.hooks.some(a=>a.command&&a.command.includes("sc snapshot")))?e.push("\xB7 Stop hook already registered"):(s.hooks.Stop.push({hooks:[d]}),O(x,s),e.push("\u2713 Stop hook registered in .claude/settings.json"));let c=!1;try{let{execSync:r}=await import("child_process");r("claude --version",{stdio:"pipe"}),c=!0,e.push("\u2713 claude CLI found \u2014 narrative snapshots enabled")}catch{e.push("\u26A0 claude CLI not found \u2014 snapshots will be objective-only (git state, no narrative)")}console.log(`
sc init complete
`),e.forEach(r=>console.log(" ",r)),console.log(`
How it works:`),console.log("  \u2022 When a Claude session ends, sc snapshot runs automatically"),console.log("  \u2022 The snapshot is saved to .claude/session.md"),console.log("  \u2022 CLAUDE.md imports it, so every new session starts with full context"),c||(console.log(`
  To enable narrative summaries, install the Claude CLI:`),console.log("  https://docs.anthropic.com/en/docs/claude-code")),console.log()}import{spawnSync as X}from"child_process";import{existsSync as Y,readFileSync as V}from"fs";var K=`You are summarizing a Claude Code development session for the developer who just finished it.
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
`;function Q(){let e=f("branch --show-current","unknown"),o=f("status --short","(no changes)"),t=f("log --oneline -5","(no commits)"),s=f("diff --stat HEAD","").split(`
`).slice(0,10).join(`
`);return{branch:e,status:o,log:t,diffStat:s}}function Z(e,o){let{branch:t,status:s,log:d,diffStat:i}=o;return[`## Session \u2014 ${e} | branch: ${t}`,"","**Git status:**","```",s||"(clean)","```","","**Recent commits:**","```",d||"(none)","```",i?`
**Diff stat:**
\`\`\`
${i}
\`\`\``:""].filter(c=>c!==void 0).join(`
`).trim()}function ee(e){let o=[`Branch: ${e.branch}`,`Status:
${e.status}`,`Recent commits:
${e.log}`,e.diffStat?`Diff stat:
${e.diffStat}`:""].filter(Boolean).join(`

`),t=K+o,s=X("claude",["-p",t],{encoding:"utf8",timeout:15e3,stdio:["pipe","pipe","pipe"]});return s.status!==0||s.error||!s.stdout.trim()?null:s.stdout.trim()}async function g(){S(p);let e=new Date().toISOString(),o=Q(),t=Z(e,o),s=ee(o);if(s){let E=C(s,_);t+=`

**Narrative:**
`+E}else t+="\n\n**Narrative:** [unavailable \u2014 run `claude --version` to enable]";let d=Y(n)?V(n,"utf8"):"",{pinned:i,rest:c}=$(d),r=b(c),a=[t,...r].slice(0,N),y=(i?i+`
`:"")+A(a);m(n,y),process.stderr.write(`[sc] snapshot written \u2014 ${e}
`)}import{existsSync as oe,readFileSync as te}from"fs";async function W(){if(!oe(n)){console.log("No session file found. Run `sc init` first.");return}let e=te(n,"utf8").trim();if(!e||e.startsWith("<!--")){console.log("No session recorded yet. End a Claude session to generate the first snapshot.");return}console.log(`
\u2500\u2500 Current session state (`+n+`) \u2500\u2500
`),console.log(e),console.log(`
\u2500\u2500 end \u2500\u2500
`)}import{existsSync as se}from"fs";import{createInterface as ne}from"readline";async function j(){if(!se(n)){console.log("Nothing to clear \u2014 .claude/session.md does not exist.");return}if(!await ie("Clear all session history? This cannot be undone. (y/N) ")){console.log("Aborted.");return}m(n,u),console.log("Session history cleared.")}function ie(e){return new Promise(o=>{let t=ne({input:process.stdin,output:process.stdout});t.question(e,s=>{t.close(),o(s.trim().toLowerCase()==="y")})})}async function F(){console.log("Writing snapshot\u2026"),await g(),console.log("Done. Run `sc status` to review.")}import{existsSync as re,readFileSync as ce}from"fs";var T="## Pinned decisions",ae="<!-- sc: pinned decisions survive the rolling session window -->";async function M([e]){(!e||!e.trim())&&(console.error('Usage: sc decide "Your decision or rationale here"'),process.exit(1));let o=e.trim(),t=`- ${o}`,s=new Date().toISOString(),d=`${t} _(${s})_`,i=re(n)?ce(n,"utf8"):u,c;if(i.includes(T))c=i.replace(/(## Pinned decisions\n(?:<!--[^>]*-->\n)?)([\s\S]*?)(\n---|\n<!-- sc:|$)/,(r,a,y,E)=>`${a}${y}
${d}${E}`);else{let r=`${T}
${ae}
${d}

`,a=i.indexOf(`---
`);a===-1||i.trim()===u.trim()?c=r+(i.startsWith("<!--")?"":i):c=i.slice(0,a)+r+i.slice(a)}m(n,c),console.log(`Decision pinned: "${o}"`)}var[,,l,...le]=process.argv,U={init:P,snapshot:g,status:W,clear:j,rotate:F,decide:M};(!l||l==="--help"||l==="-h")&&(console.log(`
sc \u2014 session continuity for Claude Code

Commands:
  sc init              Wire up this project (run once per project)
  sc snapshot          Write a session snapshot (called automatically by Stop hook)
  sc status            Show the current session state
  sc clear             Reset session history
  sc rotate            Manually trigger a snapshot write (use before force-quit)
  sc decide "<why>"    Pin a permanent decision that survives the rolling window

Options:
  --version, -v  Print version
  --help, -h     Show this help
`),process.exit(0));if(l==="--version"||l==="-v"){let{createRequire:e}=await import("module"),t=e(import.meta.url)("../package.json");console.log(t.version),process.exit(0)}U[l]||(console.error(`Unknown command: ${l}. Run 'sc --help' for usage.`),process.exit(1));try{await U[l](le)}catch(e){console.error(`sc ${l} failed:`,e.message),process.exit(1)}
