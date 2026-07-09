const fs = require('fs');
const file = 'E:/我的笔记/test/读书笔记/2026/to-do/llm-rewrite-section-notes.cjs';
let text = fs.readFileSync(file, 'utf8');
const oldText = `function sectionsOf(html){
  const matches = [...html.matchAll(/<div class="section" id="s(\\d+)"[\\s\\S]*?(?=\\n<div class="dots">|\\n<div class="chapter-links">)/g)];
  return matches.map((m,i)=>({id:m[1], start:m.index, end:i+1<matches.length?matches[i+1].index:html.indexOf('\\n<div class="chapter-links">', m.index), html:m[0]}));
}`;
const newText = `function sectionsOf(html){
  const starts = [...html.matchAll(/<div class="section" id="s(\\d+)"/g)];
  const chapterLinks = html.indexOf('\\n<div class="chapter-links">');
  return starts.map((m,i)=>{
    const end = i + 1 < starts.length ? starts[i + 1].index : (chapterLinks > m.index ? chapterLinks : html.length);
    const sectionHtml = html.slice(m.index, end).replace(/\\n<div class="dots">· · ·<\\/div>\\n?$/,'');
    return { id: m[1], start: m.index, end, html: sectionHtml };
  });
}`;
if (!text.includes(oldText)) throw new Error('sectionsOf block not found');
text = text.replace(oldText, newText);
fs.writeFileSync(file, text, 'utf8');
console.log('patched sectionsOf');