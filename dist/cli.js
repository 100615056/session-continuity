#!/usr/bin/env node
#!/usr/bin/env node
import{existsSync as $,readFileSync as z,writeFileSync as b}from"fs";import{readFileSync as B,writeFileSync as I,existsSync as D,mkdirSync as H,renameSync as G}from"fs";import{execSync as J}from"child_process";import{join as v}from"path";var m=".claude",i=v(m,"session.md"),x=v(m,"settings.json"),S="CLAUDE.md",w="@.claude/session.md",C=3,N=150,u=`<!-- sc: no previous session recorded -->
`;function g(e){D(e)||H(e,{recursive:!0})}function k(e,o={}){if(!D(e))return o;try{return JSON.parse(B(e,"utf8"))}catch{return o}}function _(e,o){I(e,JSON.stringify(o,null,2)+`
`,"utf8")}function f(e,o){let s=e+".tmp";I(s,o,"utf8"),G(s,e)}function h(e,o=""){try{return J(`git ${e}`,{encoding:"utf8",stdio:["pipe","pipe","pipe"]}).trim()}catch{return o}}function L(e,o){let s=e.split(/\s+/).filter(Boolean);return s.length<=o?e:s.slice(0,o).join(" ")+" \u2026[trimmed]"}var q="## Pinned decisions";function O(e){if(!e.includes(q))return{pinned:"",rest:e};let o=e.indexOf(`
---
`);return o===-1?{pinned:e.trim(),rest:""}:{pinned:e.slice(0,o).trim(),rest:e.slice(o)}}function A(e){return e.split(/^---$/m).map(o=>o.trim()).filter(o=>o&&!o.startsWith("<!--"))}function P(e){return e.map(o=>`---
${o}
`).join(`
`)+`
`}async function R(){let e=[];g(m),e.push("\u2713 .claude/ directory ready"),$(i)?e.push("\xB7 .claude/session.md already exists"):(b(i,u,"utf8"),e.push("\u2713 .claude/session.md created"));let o=$(S),s=o?z(S,"utf8"):"";s.includes(w)?e.push("\xB7 CLAUDE.md already has @import"):(s=`
<!-- sc: session continuity -->
${w}
`+s,b(S,s,"utf8"),e.push(`\u2713 CLAUDE.md ${o?"updated":"created"} with @import`));let t=k(x,{}),c={type:"command",command:"sc snapshot"};t.hooks||(t.hooks={}),t.hooks.Stop||(t.hooks.Stop=[]),t.hooks.Stop.some(n=>Array.isArray(n.hooks)&&n.hooks.some(l=>l.command&&l.command.includes("sc snapshot")))?e.push("\xB7 Stop hook already registered"):(t.hooks.Stop.push({hooks:[c]}),e.push("\u2713 Stop hook registered in .claude/settings.json")),t.hooks.PreCompact||(t.hooks.PreCompact=[]),t.hooks.PreCompact.some(n=>Array.isArray(n.hooks)&&n.hooks.some(l=>l.command&&l.command.includes("sc snapshot")))?e.push("\xB7 PreCompact hook already registered"):(t.hooks.PreCompact.push({hooks:[c]}),e.push("\u2713 PreCompact hook registered in .claude/settings.json")),_(x,t);let d=!1;try{let{execSync:n}=await import("child_process");n("claude --version",{stdio:"pipe"}),d=!0,e.push("\u2713 claude CLI found \u2014 narrative snapshots enabled")}catch{e.push("\u26A0 claude CLI not found \u2014 snapshots will be objective-only (git state, no narrative)")}console.log(`
sc init complete
`),e.forEach(n=>console.log(" ",n)),console.log(`
How it works:`),console.log("  \u2022 When a Claude session ends, sc snapshot runs automatically"),console.log("  \u2022 The snapshot is saved to .claude/session.md"),console.log("  \u2022 CLAUDE.md imports it, so every new session starts with full context"),d||(console.log(`
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
`;function Q(){let e=h("branch --show-current","unknown"),o=h("status --short","(no changes)"),s=h("log --oneline -5","(no commits)"),t=h("diff --stat HEAD","").split(`
`).slice(0,10).join(`
`);return{branch:e,status:o,log:s,diffStat:t}}function Z(e,o){let{branch:s,status:t,log:c,diffStat:r}=o;return[`## Session \u2014 ${e} | branch: ${s}`,"","**Git status:**","```",t||"(clean)","```","","**Recent commits:**","```",c||"(none)","```",r?`
**Diff stat:**
\`\`\`
${r}
\`\`\``:""].filter(a=>a!==void 0).join(`
`).trim()}function ee(e){let o=[`Branch: ${e.branch}`,`Status:
${e.status}`,`Recent commits:
${e.log}`,e.diffStat?`Diff stat:
${e.diffStat}`:""].filter(Boolean).join(`

`),s=K+o,t=X("claude",["-p",s],{encoding:"utf8",timeout:15e3,stdio:["pipe","pipe","pipe"]});return t.status!==0||t.error||!t.stdout.trim()?null:t.stdout.trim()}async function y(){g(m);let e=new Date().toISOString(),o=Q(),s=Z(e,o),t=ee(o);if(t){let E=L(t,N);s+=`

**Narrative:**
`+E}else s+="\n\n**Narrative:** [unavailable \u2014 run `claude --version` to enable]";let c=Y(i)?V(i,"utf8"):"",{pinned:r,rest:a}=O(c),d=A(a),n=[s,...d].slice(0,C),l=(r?r+`
`:"")+P(n);f(i,l),process.stderr.write(`[sc] snapshot written \u2014 ${e}
`)}import{existsSync as oe,readFileSync as se}from"fs";async function W(){if(!oe(i)){console.log("No session file found. Run `sc init` first.");return}let e=se(i,"utf8").trim();if(!e||e.startsWith("<!--")){console.log("No session recorded yet. End a Claude session to generate the first snapshot.");return}console.log(`
\u2500\u2500 Current session state (`+i+`) \u2500\u2500
`),console.log(e),console.log(`
\u2500\u2500 end \u2500\u2500
`)}import{existsSync as te}from"fs";import{createInterface as ne}from"readline";async function j(){if(!te(i)){console.log("Nothing to clear \u2014 .claude/session.md does not exist.");return}if(!await ie("Clear all session history? This cannot be undone. (y/N) ")){console.log("Aborted.");return}f(i,u),console.log("Session history cleared.")}function ie(e){return new Promise(o=>{let s=ne({input:process.stdin,output:process.stdout});s.question(e,t=>{s.close(),o(t.trim().toLowerCase()==="y")})})}async function F(){console.log("Writing snapshot\u2026"),await y(),console.log("Done. Run `sc status` to review.")}import{existsSync as re,readFileSync as ce}from"fs";var T="## Pinned decisions",ae="<!-- sc: pinned decisions survive the rolling session window -->";async function M([e]){(!e||!e.trim())&&(console.error('Usage: sc decide "Your decision or rationale here"'),process.exit(1));let o=e.trim(),s=`- ${o}`,t=new Date().toISOString(),c=`${s} _(${t})_`,r=re(i)?ce(i,"utf8"):u,a;if(r.includes(T))a=r.replace(/(## Pinned decisions\n(?:<!--[^>]*-->\n)?)([\s\S]*?)(\n---|\n<!-- sc:|$)/,(d,n,l,E)=>`${n}${l}
${c}${E}`);else{let d=`${T}
${ae}
${c}

`,n=r.indexOf(`---
`);n===-1||r.trim()===u.trim()?a=d+(r.startsWith("<!--")?"":r):a=r.slice(0,n)+d+r.slice(n)}f(i,a),console.log(`Decision pinned: "${o}"`)}var[,,p,...le]=process.argv,U={init:R,snapshot:y,status:W,clear:j,rotate:F,decide:M};(!p||p==="--help"||p==="-h")&&(console.log(`
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
`),process.exit(0));if(p==="--version"||p==="-v"){let{createRequire:e}=await import("module"),s=e(import.meta.url)("../package.json");console.log(s.version),process.exit(0)}U[p]||(console.error(`Unknown command: ${p}. Run 'sc --help' for usage.`),process.exit(1));try{await U[p](le)}catch(e){console.error(`sc ${p} failed:`,e.message),process.exit(1)}
