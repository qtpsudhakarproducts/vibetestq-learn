const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function element() {
  const classes=new Set();
  return {events:{},attrs:{},dataset:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,f){this.events[k]=f;},focus(){this.focused=true;},classList:{toggle(k){if(classes.has(k)){classes.delete(k);return false;}classes.add(k);return true;},contains(k){return classes.has(k);},add(k){classes.add(k);},remove(k){classes.delete(k);}}};
}
const root=element(),theme=element(),menu=element(),links=element(),sections=[element(),element()],headers=[element(),element()],week=element(),weekHeader=element();
headers.forEach((h,i)=>{h.parentElement=sections[i];sections[i].querySelector=()=>h;});weekHeader.closest=()=>week;
const document={documentElement:root,events:{},querySelector(s){return {'.ap-theme':theme,'.ap-menu':menu,'.ap-links':links}[s]||null;},querySelectorAll(s){return {'.toc-section-header':headers,'.toc-section':sections,'.week-header':[weekHeader]}[s]||[];},addEventListener(k,f){this.events[k]=f;}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/academy/portal.js'),'utf8'),{document,localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
theme.events.click();assert.equal(root.dataset.theme,'dark');assert.equal(theme.attrs['aria-label'],'Switch to light theme');theme.events.click();assert.equal(root.dataset.theme,'light');
menu.events.click();assert.equal(menu.attrs['aria-expanded'],'true');document.events.keydown({key:'Escape'});assert.equal(menu.attrs['aria-expanded'],'false');assert.equal(menu.focused,true);
headers[0].events.click();assert.equal(headers[0].attrs['aria-expanded'],'true');
headers[1].events.keydown({key:'Enter',preventDefault(){}});assert.equal(headers[1].attrs['aria-expanded'],'true');assert.equal(headers[0].attrs['aria-expanded'],'false');
headers[1].events.keydown({key:' ',preventDefault(){}});assert.equal(headers[1].attrs['aria-expanded'],'false');
weekHeader.events.click();assert.equal(weekHeader.attrs['aria-expanded'],'true');weekHeader.events.click();assert.equal(weekHeader.attrs['aria-expanded'],'false');
const readerContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/academy/bar.js'),'utf8'),readerContext);
for(const [route,active] of [['/learn/','learn'],['/playwright/index.html','curriculum'],['/practicehub/','practice'],['/projects/','practice'],['/playwright/assessments/','quizzes'],['/iqs/','interviews']])assert.equal(readerContext.window.AcademyBar.activeKey(route),active);
(async function checkSchedule() {
  function node(tag) { return {tag,children:[],dataset:{},appendChild(child){this.children.push(child);},replaceChildren(fragment){this.children=fragment.children;}}; }
  const sessions=node('div');sessions.dataset.academySessions='2';sessions.children=[node('published-fallback')];
  const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../upcoming-trainings.json'),'utf8'));
  const scheduleDocument={documentElement:element(),querySelector(s){return s==='[data-academy-sessions]'?sessions:null;},querySelectorAll(){return [];},createElement:node,createDocumentFragment(){return node('fragment');}};
  const script=fs.readFileSync(path.join(__dirname,'../assets/academy/portal.js'),'utf8');
  let requests=0;
  const context={document:scheduleDocument,window:{location:{origin:'https://academy.vibetestq.com'}},URL,localStorage:{getItem(){return null;}},fetch:async function(url){requests++;assert.equal(url,'/upcoming-trainings.json');return {ok:true,json:async()=>data};}};
  vm.runInNewContext(script,context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests,1);assert.equal(sessions.children.length,2);
  const first=sessions.children[0];
  assert.equal(first.children.find(n=>n.tag==='h3').textContent,data.trainings[0].name);
  assert.equal(first.children.find(n=>n.tag==='a'&&n.textContent==='View program →').href,'https://academy.vibetestq.com/'+data.trainings[0].detailsUrl);
  sessions.children=[node('published-fallback')];context.fetch=async()=>{throw Error('offline');};
  vm.runInNewContext(script,context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(sessions.children[0].tag,'published-fallback');
  console.log('PASS: blocked storage, menu dismissal, keyboard curriculum controls, week toggles, reader routes, shared schedule refresh and offline fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
