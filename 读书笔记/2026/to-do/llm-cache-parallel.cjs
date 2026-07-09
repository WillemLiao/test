const fs = require('fs');
const path = require('path');

const out = 'E:/我的笔记/test/读书笔记/2026/to-do/Sunrise on the Reaping-html';
const API = process.env.OPENCODE_BASE_URL || 'http://127.0.0.1:10000/v1/chat/completions';
const MODEL = process.env.OPENCODE_MODEL || 'opencode/deepseek-v4-flash-free';
const KEY = process.env.OPENCODE_API_KEY || '123';
const concurrency = Number(process.env.LLM_CONCURRENCY || 5);
const cachePath = path.join(out, 'llm-section-notes-cache.json');
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unesc = s => String(s || '').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const strip = s => unesc(String(s||'').replace(/<[^>]+>/g,' '));
function stripThink(text){ return String(text||'').replace(/<think>[\s\S]*?<\/think>/gi,'').replace(/^[\s\S]*?<\/think>/i,'').trim(); }
function firstJson(text){
  const cleaned = stripThink(text).replace(/^```(?:json)?/i,'').replace(/```$/i,'').trim();
  const start = cleaned.indexOf('{');
  if(start < 0) throw new Error('no json: '+cleaned.slice(0,200));
  let depth=0,inStr=false,escp=false;
  for(let i=start;i<cleaned.length;i++){
    const ch=cleaned[i];
    if(inStr){ if(escp) escp=false; else if(ch==='\\') escp=true; else if(ch==='"') inStr=false; continue; }
    if(ch==='"') inStr=true; else if(ch==='{') depth++; else if(ch==='}' && --depth===0) return JSON.parse(cleaned.slice(start,i+1));
  }
  throw new Error('unclosed json');
}
function sectionsOf(html){
  const starts = [...html.matchAll(/<div class="section" id="s(\d+)"/g)];
  const chapterLinks = html.indexOf('\n<div class="chapter-links">');
  return starts.map((m,i)=>{
    const end = i + 1 < starts.length ? starts[i + 1].index : (chapterLinks > m.index ? chapterLinks : html.length);
    const sectionHtml = html.slice(m.index,end).replace(/\n<div class="dots">· · ·<\/div>\n?$/,'');
    return { id:m[1], start:m.index, end, html:sectionHtml };
  });
}
function sectionText(sectionHtml){ return strip((sectionHtml.match(/<p>[\s\S]*?<\/p>/g)||[]).join(' ')); }
function validNote(note){
  if(!note || typeof note !== 'object') return false;
  const t=String(note.titleZh||'').trim(), s=String(note.summaryZh||'').trim(), f=String(note.focusZh||'').trim(), n=String(note.noteZh||'').trim();
  if(t.length<4 || t.length>30 || /[：:、，,与和的在把被为]$/.test(t)) return false;
  if(/家人与日常压力|抽签压力|阅读抓手|情感锚点|权力视线|生存选择/.test(t)) return false;
  const all=s+f+n;
  if(all.length<60) return false;
  if(/出现\s*reaping|重点看个人命运|注意人物关系|关注情绪变化|这一小节的关键不是逐词翻译|这一节主要推进场景/.test(all)) return false;
  if(!Array.isArray(note.tagsZh) || note.tagsZh.length<2) return false;
  return true;
}
function normalize(data){
  return {
    titleZh:String(data.titleZh||'').trim().slice(0,30),
    summaryZh:String(data.summaryZh||'').trim(),
    focusZh:String(data.focusZh||'').trim(),
    tagsZh:(Array.isArray(data.tagsZh)?data.tagsZh.map(String).filter(Boolean):[]).slice(0,4),
    quoteEn:String(data.quoteEn||'').trim(),
    noteZh:String(data.noteZh||'').trim()
  };
}
async function callLLM(task){
  const prompt = [
    '你是中文英语伴读编辑。请阅读下面英文小说小节，为中文读者生成伴读信息。',
    '返回 ONLY 一个严格 JSON object，不要 Markdown，不要解释。',
    'titleZh 必须具体，不能重复，不能写模板标题。summaryZh 必须写具体发生了什么。focusZh 必须写叙事重点。quoteEn 从原文选一句。noteZh 解释 quote 或转折意义。',
    '禁止：家人与日常压力、抽签压力、阅读抓手、注意人物关系、关注情绪变化、出现 reaping / tribute / Games 时这类模板句。',
    'JSON: {"titleZh":"...","summaryZh":"...","focusZh":"...","tagsZh":["..."],"quoteEn":"...","noteZh":"..."}',
    `bookTitle: Sunrise on the Reaping`,
    `chapterFile: ${task.file}`,
    `section: s${task.id}`,
    'text:', task.text
  ].join('\n');
  const body={model:MODEL,messages:[{role:'system',content:'Return ONLY one strict JSON object. No Markdown. No reasoning. No <think> tags.'},{role:'user',content:prompt}],stream:false,temperature:0.4};
  for(let attempt=1; attempt<=3; attempt++){
    const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${KEY}`},body:JSON.stringify(body)});
    const payload=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(payload?.error?.message||JSON.stringify(payload));
    try{
      const note=normalize(firstJson(payload?.choices?.[0]?.message?.content||''));
      if(validNote(note)) return note;
      if(attempt===3) return note;
    }catch(e){ if(attempt===3) throw e; }
  }
}
function collectTasks(){
  const files=fs.readdirSync(out).filter(n=>/^sunrise_segment_\d+\.html$/.test(n)).sort();
  const tasks=[];
  for(const file of files){
    const html=fs.readFileSync(path.join(out,file),'utf8');
    for(const sec of sectionsOf(html)){
      const key=`${file}#s${sec.id}`;
      if(validNote(cache[key])) continue;
      tasks.push({file,id:sec.id,text:sectionText(sec.html),key});
    }
  }
  return tasks;
}
async function worker(id, queue){
  while(queue.length){
    const task=queue.shift();
    try{
      console.log(`[W${id}] ${task.key}`);
      cache[task.key]=await callLLM(task);
      fs.writeFileSync(cachePath,JSON.stringify(cache,null,2),'utf8');
    }catch(e){
      console.error(`[ERR W${id}] ${task.key}: ${e.message}`);
      task.fail=(task.fail||0)+1;
      if(task.fail<2) queue.push(task);
    }
  }
}
(async()=>{
  const tasks=collectTasks();
  console.log(JSON.stringify({mode:'parallel-cache',concurrency,tasks:tasks.length,cache:Object.keys(cache).length},null,2));
  await Promise.all(Array.from({length:concurrency},(_,i)=>worker(i+1,tasks)));
  const remaining=collectTasks();
  console.log(JSON.stringify({done:true,cache:Object.keys(cache).length,remaining:remaining.length},null,2));
  if(remaining.length) process.exitCode=2;
})();