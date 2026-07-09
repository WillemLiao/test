const fs = require('fs');
const path = require('path');

const out = 'E:/我的笔记/test/读书笔记/2026/to-do/Sunrise on the Reaping-html';
const targetFiles = process.argv.slice(2).length ? process.argv.slice(2) : ['sunrise_segment_01.html'];
const API = process.env.OPENCODE_BASE_URL || 'http://127.0.0.1:10000/v1/chat/completions';
const MODEL = process.env.OPENCODE_MODEL || 'opencode/deepseek-v4-flash-free';
const KEY = process.env.OPENCODE_API_KEY || '123';
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
    const sectionHtml = html.slice(m.index, end).replace(/\n<div class="dots">· · ·<\/div>\n?$/,'');
    return { id: m[1], start: m.index, end, html: sectionHtml };
  });
}
function sectionText(sectionHtml){
  return strip((sectionHtml.match(/<p>[\s\S]*?<\/p>/g)||[]).join(' '));
}
function sectionQuote(sectionHtml){
  const en = sectionHtml.match(/<div class="en">[\s\S]*?·\s*([\s\S]*?)<\/div>/);
  return en ? strip(en[1]) : '';
}
function normalizeNote(data, fallbackText){
  const tags = Array.isArray(data.tagsZh) ? data.tagsZh.map(String).filter(Boolean).slice(0,4) : [];
  return {
    titleZh: String(data.titleZh || '').trim().slice(0, 24),
    summaryZh: String(data.summaryZh || '').trim(),
    focusZh: String(data.focusZh || '').trim(),
    tagsZh: tags.length ? tags : ['情节'],
    quoteEn: String(data.quoteEn || '').trim() || sectionQuote(fallbackText),
    noteZh: String(data.noteZh || '').trim()
  };
}
async function callLLM({bookTitle, chapter, sectionIndex, previousSummary, text}){
  const prompt = [
    '你是中文英语伴读编辑。请阅读下面英文小说小节，为中文读者生成伴读信息。',
    '',
    '硬性要求：',
    '1. 返回 ONLY 一个严格 JSON object，不要 Markdown，不要解释。',
    '2. titleZh 必须具体，必须根据本小节真实内容命名，不能写“家人与日常压力”“抽签压力”“阅读抓手”这类模板标题。',
    '3. summaryZh 必须写这一小节具体发生了什么，包含人物动作、关系变化或情绪变化，不能写泛泛阅读建议。',
    '4. focusZh 是这一小节的叙事重点，不要写“注意人物关系”这种空话。',
    '5. quoteEn 必须从原文中选一句最能代表本节内容的英文原句。',
    '6. noteZh 解释 quoteEn 或本节转折的意义。',
    '7. 全部中文使用简体中文。',
    '',
    '返回 JSON 形状：',
    '{"titleZh":"...","summaryZh":"...","focusZh":"...","tagsZh":["..."],"quoteEn":"...","noteZh":"..."}',
    '',
    `bookTitle: ${bookTitle}`,
    `chapter: ${chapter}`,
    `sectionIndex: ${sectionIndex}`,
    `previousSectionSummary: ${previousSummary || '无'}`,
    'text:',
    text
  ].join('\n');
  const body = { model: MODEL, messages: [
    {role:'system', content:'Return ONLY one strict JSON object. No Markdown. No explanations. Do not include reasoning or <think> tags.'},
    {role:'user', content: prompt}
  ], stream:false, temperature:0.35 };
  for(let attempt=1; attempt<=3; attempt++){
    const res = await fetch(API, {method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${KEY}`}, body:JSON.stringify(body)});
    const payload = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(payload?.error?.message || JSON.stringify(payload));
    const raw = payload?.choices?.[0]?.message?.content || '';
    try { return firstJson(raw); }
    catch(e){ if(attempt===3) throw e; }
  }
}
function tagHtml(tags){
  const colors=['gold','blue','purple','green'];
  return tags.slice(0,4).map((t,i)=>`<span class="tag ${colors[i%colors.length]}">${esc(t)}</span>`).join('');
}
function applyNote(sectionHtml, note){
  let next = sectionHtml.replace(/<div class="zh">[\s\S]*?<\/div><div class="en">/, `<div class="zh">${esc(note.titleZh)}</div><div class="en">`);
  next = next.replace(/<div class="en">([\s\S]*?)<\/div>/, (m, old) => {
    const prefix = old.includes('·') ? old.split('·')[0].trim() : old.trim();
    return `<div class="en">${esc(prefix)} · ${esc(note.quoteEn)}</div>`;
  });
  next = next.replace(/<div class="tags">[\s\S]*?<\/div>/, `<div class="tags">${tagHtml(note.tagsZh)}</div>`);
  next = next.replace(/<div class="key"><span class="lbl">[\s\S]*?<\/span><p>[\s\S]*?<\/p><\/div>/, `<div class="key"><span class="lbl">✦ 本节摘要</span><p>${esc(note.summaryZh)} ${esc(note.focusZh)} ${esc(note.noteZh)}</p></div>`);
  return next;
}
async function processFile(name){
  const fp = path.join(out, name);
  let html = fs.readFileSync(fp, 'utf8');
  const sections = sectionsOf(html);
  let previousSummary = '';
  const parts=[]; let cursor=0;
  for(const sec of sections){
    parts.push(html.slice(cursor, sec.start));
    const text = sectionText(sec.html);
    const key = `${name}#s${sec.id}`;
    let note = cache[key];
    if(!note){
      console.log(`[LLM] ${key} ${text.slice(0,60).replace(/\s+/g,' ')}...`);
      const data = await callLLM({bookTitle:'Sunrise on the Reaping', chapter:name.replace(/\D+/g,''), sectionIndex:sec.id, previousSummary, text});
      note = normalizeNote(data, sec.html);
      cache[key] = note;
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
    }
    previousSummary = note.summaryZh;
    parts.push(applyNote(sec.html, note));
    cursor = sec.start + sec.html.length;
  }
  parts.push(html.slice(cursor));
  html = parts.join('');
  // Update right-side nav labels to match generated titles.
  for(const sec of sections){
    const note = cache[`${name}#s${sec.id}`];
    if(note?.titleZh){
      const re = new RegExp(`(<a class="nav-item" href="#s${sec.id}"><span class="num">${Number(sec.id)}<\\/span>)([\\s\\S]*?)(<\\/a>)`);
      html = html.replace(re, `$1${esc(note.titleZh)}$3`);
    }
  }
  fs.writeFileSync(fp, html, 'utf8');
  console.log(`[OK] ${name} sections=${sections.length}`);
}
(async()=>{
  const files = process.argv.slice(2);
  if(!files.length) throw new Error('pass files');
  for(const f of files) await processFile(f);
})();