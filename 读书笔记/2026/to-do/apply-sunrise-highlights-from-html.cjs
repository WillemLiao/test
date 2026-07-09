const fs = require('fs');
const path = require('path');
const out = 'E:/我的笔记/test/读书笔记/2026/to-do/Sunrise on the Reaping-html';
function stripTags(s){ return String(s||'').replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim(); }
function sectionsOf(html){
  const starts=[...html.matchAll(/<div class="section" id="s(\d+)"/g)];
  const chapterLinks=html.indexOf('\n<div class="chapter-links">');
  return starts.map((m,i)=>{ const end=i+1<starts.length?starts[i+1].index:(chapterLinks>m.index?chapterLinks:html.length); return {id:m[1],start:m.index,end,html:html.slice(m.index,end)}; });
}
function enQuote(sectionHtml){
  const en = (sectionHtml.match(/<div class="en">([\s\S]*?)<\/div>/)||[])[1]||'';
  const text = stripTags(en);
  const parts = text.split('·');
  return (parts.length>1 ? parts.slice(1).join('·') : text).trim();
}
function tags(sectionHtml){ return [...sectionHtml.matchAll(/<span class="tag[^>]*">([\s\S]*?)<\/span>/g)].map(m=>stripTags(m[1])).filter(Boolean); }
function title(sectionHtml){ return stripTags((sectionHtml.match(/<div class="zh">([\s\S]*?)<\/div>/)||[])[1]||''); }
function bodyText(sectionHtml){ return stripTags((sectionHtml.match(/<div class="body">([\s\S]*?)<div class="key">/)||[])[1]||''); }
function firstUsefulSentence(text){
  const ss=(String(text).match(/[^.!?]+[.!?]["”’']?|[^.!?]+$/g)||[]).map(x=>x.trim()).filter(x=>x.split(/\s+/).length>=7);
  return ss[0]||'';
}
function candidates(sectionHtml){
  const b=bodyText(sectionHtml), lower=b.toLowerCase();
  const out=[];
  const q=enQuote(sectionHtml);
  if(q && q.length>8) out.push({text:q,cls:'highlight'});
  const nameHits=[...new Set((`${title(sectionHtml)} ${tags(sectionHtml).join(' ')}`.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g)||[]))].slice(0,3);
  for(const n of nameHits) out.push({text:n,cls:'hl-b'});
  for(const tag of tags(sectionHtml)){
    if(lower.includes(tag.toLowerCase()) && /[A-Za-z]/.test(tag)) out.push({text:tag,cls:'hl-p'});
  }
  const specials=[['Haymitch','hl-b'],['Lenore Dove','hl-p'],['Louella','hl-p'],['Maysilee','hl-p'],['Wyatt','hl-b'],['Plutarch','hl-b'],['Snow','hl-r'],['Capitol','hl-r'],['Peacekeepers','hl-r'],['reaping','hl-r'],['Quarter Quell','hl-r'],['Hunger Games','hl-r'],['arena','hl-r'],['mockingjay','hl-g'],['flint striker','hl-g'],['birthday','hl-g'],['District 12','hl-b']];
  for(const [txt,cls] of specials){ if(lower.includes(txt.toLowerCase())) out.push({text:txt,cls}); }
  out.push({text:firstUsefulSentence(b),cls:'highlight'});
  const seen=new Set();
  return out.filter(x=>x.text&&x.text.length>=5&&!seen.has(x.text.toLowerCase())&&(seen.add(x.text.toLowerCase())||true)).slice(0,6);
}
function mark(inner, phrase, cls){
  let target=String(phrase||'').replace(/\s+/g,' ').trim();
  if(!target) return {inner,ok:false};
  if(target.length>180){ const fs=firstUsefulSentence(target); target=fs||target.slice(0,150); }
  const attempts=[target];
  const words=target.split(/\s+/).filter(Boolean);
  for(let len=Math.min(14,words.length); len>=5; len--) attempts.push(words.slice(0,len).join(' '));
  for(const a of attempts){
    if(a && inner.includes(a) && !inner.includes(`<span class="${cls}">${a}</span>`)) return {inner:inner.replace(a,`<span class="${cls}">${a}</span>`),ok:true};
  }
  return {inner,ok:false};
}
function apply(sectionHtml){
  const bodyMatch=sectionHtml.match(/<div class="body">([\s\S]*?)<div class="key">/);
  if(!bodyMatch) return sectionHtml;
  let bodyInner=bodyMatch[1].replace(/<span class="(highlight|hl-b|hl-r|hl-p|hl-g)">([\s\S]*?)<\/span>/g,'$2');
  let count=0;
  const cand=candidates(sectionHtml);
  bodyInner=bodyInner.replace(/<p>([\s\S]*?)<\/p>/g,(m,inner)=>{
    let next=inner;
    for(const c of cand){ if(count>=4) break; const r=mark(next,c.text,c.cls); if(r.ok){ next=r.inner; count++; } }
    return `<p>${next}</p>`;
  });
  return sectionHtml.replace(bodyMatch[1],bodyInner);
}
for(const file of fs.readdirSync(out).filter(n=>/^sunrise_segment_\d+\.html$/.test(n)).sort()){
  const fp=path.join(out,file); let html=fs.readFileSync(fp,'utf8'); const secs=sectionsOf(html); const parts=[]; let cursor=0;
  for(const s of secs){ parts.push(html.slice(cursor,s.start)); parts.push(apply(s.html)); cursor=s.end; }
  parts.push(html.slice(cursor)); fs.writeFileSync(fp,parts.join(''),'utf8');
}
let files=0,sections=0,noHi=0,keyHi=0,totalHi=0;
for(const file of fs.readdirSync(out).filter(n=>/^sunrise_segment_\d+\.html$/.test(n))){
  files++; const html=fs.readFileSync(path.join(out,file),'utf8');
  for(const s of sectionsOf(html)){ sections++; const n=(s.html.match(/<span class="(highlight|hl-b|hl-r|hl-p|hl-g)">/g)||[]).length; totalHi+=n; if(!n) noHi++; }
  for(const m of html.matchAll(/<div class="key">[\s\S]*?<\/div>/g)) keyHi += (m[0].match(/<span class="(highlight|hl-b|hl-r|hl-p|hl-g)">/g)||[]).length;
}
console.log(JSON.stringify({files,sections,totalHi,noHi,keyHi},null,2));