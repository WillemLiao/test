const fs = require('fs');
const file = 'E:/我的笔记/test/读书笔记/2026/to-do/apply-sunrise-highlights.cjs';
const content = String.raw`const fs = require('fs');
const path = require('path');

const out = 'E:/我的笔记/test/读书笔记/2026/to-do/Sunrise on the Reaping-html';
const cachePath = path.join(out, 'llm-section-notes-cache.json');
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function stripTags(s){ return String(s||'').replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim(); }
function sectionsOf(html){
  const starts=[...html.matchAll(/<div class="section" id="s(\d+)"/g)];
  const chapterLinks=html.indexOf('\n<div class="chapter-links">');
  return starts.map((m,i)=>{ const end=i+1<starts.length?starts[i+1].index:(chapterLinks>m.index?chapterLinks:html.length); return {id:m[1],start:m.index,end,html:html.slice(m.index,end)}; });
}
function normalizeText(s){ return String(s||'').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim(); }
function firstSentence(text){ return (normalizeText(text).match(/[^.!?]+[.!?]["”’']?/)||[])[0]||''; }
function candidatePhrases(note, sectionText){
  const phrases=[];
  if(note?.quoteEn) phrases.push({text:note.quoteEn, cls:'highlight'});
  const summary = `${note?.titleZh||''} ${note?.summaryZh||''} ${note?.focusZh||''} ${note?.noteZh||''}`;
  const names = [...new Set((summary.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g)||[]))].filter(x=>!['The','This','That','Chapter','Part'].includes(x)).slice(0,3);
  for(const n of names) phrases.push({text:n, cls:'hl-b'});
  const lower = sectionText.toLowerCase();
  const specials = [['reaping day','hl-r'],['Quarter Quell','hl-r'],['Hunger Games','hl-r'],['Capitol','hl-r'],['Peacekeepers','hl-r'],['Lenore Dove','hl-p'],['Happy birthday','hl-g'],['mockingjay','hl-g'],['tesserae','hl-r'],['flint striker','hl-g'],['District 12','hl-b'],['Haymitch','hl-b'],['Louella','hl-p'],['Maysilee','hl-p']];
  for(const [txt,cls] of specials){ if(lower.includes(txt.toLowerCase())) phrases.push({text:txt,cls}); }
  return phrases.filter(p=>p.text && p.text.length>=5).slice(0,4);
}
function markInText(text, phrase, cls){
  if(!phrase) return {text, changed:false};
  let target = normalizeText(phrase);
  if(target.length > 180) target = firstSentence(target) || target.slice(0,140);
  if(text.includes(target) && !text.includes(`<span class="${cls}">${target}</span>`)) return {text:text.replace(target, `<span class="${cls}">${target}</span>`), changed:true};
  const words = target.split(/\s+/).filter(Boolean);
  for(let len=Math.min(12,words.length); len>=5; len--){
    for(let i=0;i+len<=words.length;i++){
      const chunk=words.slice(i,i+len).join(' ');
      if(text.includes(chunk) && !text.includes(`<span class="${cls}">${chunk}</span>`)) return {text:text.replace(chunk, `<span class="${cls}">${chunk}</span>`), changed:true};
    }
  }
  return {text, changed:false};
}
function applyHighlights(sectionHtml, note){
  const bodyMatch = sectionHtml.match(/<div class="body">([\s\S]*?)<div class="key">/);
  if(!bodyMatch) return sectionHtml;
  const bodyInnerOriginal = bodyMatch[1];
  let bodyInner = bodyInnerOriginal.replace(/<span class="(highlight|hl-b|hl-r|hl-p|hl-g)">([\s\S]*?)<\/span>/g, '$2');
  const bodyText = stripTags(bodyInner);
  let count=0;
  const phrases=candidatePhrases(note, bodyText);
  bodyInner = bodyInner.replace(/<p>([\s\S]*?)<\/p>/g, (m, inner) => {
    let next=inner;
    for(const p of phrases){
      if(count>=4) break;
      const result=markInText(next,p.text,p.cls);
      if(result.changed){ next=result.text; count++; }
    }
    return `<p>${next}</p>`;
  });
  return sectionHtml.replace(bodyInnerOriginal, bodyInner);
}
function processFile(file){
  const fp=path.join(out,file); let html=fs.readFileSync(fp,'utf8'); const secs=sectionsOf(html); const parts=[]; let cursor=0;
  for(const sec of secs){ parts.push(html.slice(cursor,sec.start)); const note=cache[`${file}#s${sec.id}`]; parts.push(note?applyHighlights(sec.html,note):sec.html); cursor=sec.end; }
  parts.push(html.slice(cursor)); fs.writeFileSync(fp,parts.join(''),'utf8');
}
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(out).filter(n=>/^sunrise_segment_\d+\.html$/.test(n)).sort();
for(const f of files) processFile(f);
console.log(JSON.stringify({files:files.length},null,2));
`;
fs.writeFileSync(file, content, 'utf8');
console.log('rewritten');