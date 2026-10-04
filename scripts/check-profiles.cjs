const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'profiles/profiles.json'),'utf8'));
assert.equal(data.market,'India');
assert.equal(data.profiles.length,57);
assert.equal(new Set(data.profiles.map(p=>p.path)).size,57);
assert.equal(Object.keys(data.categories).length,14);
for(const p of data.profiles){
  const html=fs.readFileSync(path.join(root,'profiles',p.path),'utf8');
  const md=fs.readFileSync(path.join(root,'profiles',p.path.replace('.html','.md')),'utf8');
  assert.ok(html.includes(p.resume.name));
  for (const heading of ['Professional Summary','Technical Skills','Work Experience','Project Experience']) {
    assert.ok(html.includes(heading));assert.ok(md.includes('## '+heading));
  }
  assert.ok(html.includes('Print / Save as PDF'));
  assert.ok(html.includes('Download Markdown'));
  assert.ok(!/Suggested portfolio projects|Evidence to prepare|Build the missing skills|Research context/.test(md));
  assert.ok(!/Two projects to discuss|Explain your contribution|Postings behind this update/.test(html));
  assert.ok(p.resume.projects.length>=2);
  assert.ok(p.resume.summary.length>=3);
  assert.ok(p.resume.education);
  const content=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  assert.ok(!/mailto:|linkedin.com\/in\/|github.com\/(?!qtpsudhakar)|self-healing selectors via Playwright/i.test(content));
}
function control(value=''){return {value,events:{},addEventListener(event,fn){this.events[event]=fn;},focus(){this.focused=true;}};}
const search=control(),category=control('all'),level=control('all'),reset=control(),count={},empty={};
const cards=data.profiles.map(p=>({hidden:false,dataset:{category:p.category,level:p.level,search:[p.resume.name,p.role,...p.resume.technologies].join(' ').toLowerCase()}}));
const fields={'profile-search':search,'profile-category':category,'profile-level':level,'profile-reset':reset,'profile-count':count,'profile-empty':empty};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/academy/profiles.js'),'utf8'),{document:{getElementById(id){return fields[id];},querySelectorAll(){return cards;}}});
category.value='manual-testing';category.events.change();
assert.equal(cards.filter(c=>!c.hidden).length,9);
level.value='junior';level.events.change();
assert.equal(cards.filter(c=>!c.hidden).length,3);
search.value='nonexistent skill';search.events.input();
assert.equal(count.textContent,'0 sample profiles');assert.equal(empty.hidden,false);
reset.events.click();assert.equal(cards.filter(c=>!c.hidden).length,57);assert.equal(search.focused,true);assert.equal(empty.hidden,true);
search.value='playwright typescript';search.events.input();
assert.ok(cards.some(c=>!c.hidden));assert.ok(cards.filter(c=>!c.hidden).every(c=>c.dataset.search.includes('playwright')&&c.dataset.search.includes('typescript')));
reset.events.click();level.value='exec';level.events.change();
assert.ok(cards.filter(c=>!c.hidden).every(c=>c.dataset.level==='exec'));
console.log('PASS: 57 profiles, 14 role families, resume sections, print/download actions, HTML/Markdown parity, combined filters, empty state and reset.');
