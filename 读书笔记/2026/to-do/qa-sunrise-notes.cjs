const fs = require('fs');
const path = require('path');

const out = 'E:/我的笔记/test/读书笔记/2026/to-do/Sunrise on the Reaping-html';
const files = fs.readdirSync(out).filter(n => /^sunrise_segment_\d+\.html$/.test(n)).sort();
const strip = s => String(s||'').replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
function sectionsOf(html){
  const starts = [...html.matchAll(/<div class="section" id="s(\d+)"/g)];
  const chapterLinks = html.indexOf('\n<div class="chapter-links">');
  return starts.map((m,i)=>{
    const end = i + 1 < starts.length ? starts[i + 1].index : (chapterLinks > m.index ? chapterLinks : html.length);
    return { id:m[1], html:html.slice(m.index,end) };
  });
}
function extract(sec){
  const title = strip((sec.html.match(/<div class="zh">([\s\S]*?)<\/div>/)||[])[1]||'');
  const key = strip((sec.html.match(/<div class="key"><span class="lbl">[\s\S]*?<\/span><p>([\s\S]*?)<\/p><\/div>/)||[])[1]||'');
  const label = strip((sec.html.match(/<div class="key"><span class="lbl">([\s\S]*?)<\/span>/)||[])[1]||'');
  const tags = [...sec.html.matchAll(/<span class="tag[^>]*">([\s\S]*?)<\/span>/g)].map(m=>strip(m[1]));
  return {title,key,label,tags};
}
const badPatterns = [
  /出现\s*reaping/i,
  /tribute\s*\/\s*Games/i,
  /家人与日常压力/,
  /抽签压力$/,
  /阅读抓手/,
  /重点看个人命运/,
  /注意人物关系/,
  /关注情绪变化/,
  /这一小节的关键不是逐词翻译/,
  /这一节主要推进场景和人物情绪/,
  /不能写泛泛/,
];
function titleLooksBad(t){
  if(!t || t.length < 4) return '标题过短或缺失';
  if(t.length > 30) return '标题过长';
  if(/[：:、，,与和的在把被为]$/.test(t)) return '标题疑似截断';
  if(/小节\s*\d+|第\s*\d+\s*小节/.test(t)) return '标题是占位编号';
  if(/家人与日常压力|抽签压力|阅读抓手|情感锚点|权力视线|生存选择/.test(t)) return '标题仍是模板词';
  return '';
}
function keyLooksBad(k){
  if(!k || k.length < 45) return '摘要过短或缺失';
  if(badPatterns.some(re=>re.test(k))) return '摘要含旧模板或空泛句';
  if(!/[。！？]/.test(k)) return '摘要不像完整中文句子';
  return '';
}
const issues=[];
const titleMap = new Map();
for(const file of files){
  const html=fs.readFileSync(path.join(out,file),'utf8');
  const sections=sectionsOf(html);
  sections.forEach(sec=>{
    const data=extract(sec);
    const loc=`${file}#s${sec.id}`;
    const tb=titleLooksBad(data.title); if(tb) issues.push({loc,type:'title',reason:tb,value:data.title});
    const kb=keyLooksBad(data.key); if(kb) issues.push({loc,type:'summary',reason:kb,value:data.key.slice(0,160)});
    if(data.label !== '✦ 本节摘要') issues.push({loc,type:'label',reason:'key label 不是本节摘要',value:data.label});
    if(data.tags.length < 2) issues.push({loc,type:'tags',reason:'标签少于2个',value:data.tags.join(',')});
    const key=data.title;
    if(key){ if(!titleMap.has(key)) titleMap.set(key,[]); titleMap.get(key).push(loc); }
  });
}
for(const [title,locs] of titleMap.entries()){
  if(locs.length > 1) issues.push({loc:locs.join(', '),type:'duplicate-title',reason:`标题重复 ${locs.length} 次`,value:title});
}
const report={
  checkedAt:new Date().toISOString(),
  files:files.length,
  sections:[...titleMap.values()].reduce((a,b)=>a+b.length,0),
  issueCount:issues.length,
  issues
};
fs.writeFileSync(path.join(out,'qa-report.json'), JSON.stringify(report,null,2), 'utf8');
console.log(JSON.stringify({files:report.files,sections:report.sections,issueCount:report.issueCount,topIssues:issues.slice(0,20)},null,2));