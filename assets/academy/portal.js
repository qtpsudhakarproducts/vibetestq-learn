(function () {
  'use strict';
  var root = document.documentElement;
  var theme = document.querySelector('.ap-theme');
  try { var saved = localStorage.getItem('academy-theme'); if (saved === 'dark' || saved === 'light') root.dataset.theme = saved; } catch (e) { /* session theme */ }
  function label() { if (theme) { var dark = root.dataset.theme === 'dark'; theme.textContent = dark ? 'Light' : 'Dark'; theme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); } }
  label();
  if (theme) theme.addEventListener('click', function () { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; try {localStorage.setItem('academy-theme', root.dataset.theme);} catch (e) {} label(); });
  var menu = document.querySelector('.ap-menu'), links = document.querySelector('.ap-links');
  function close() { if (links && menu) {links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');} }
  if (menu && links) {
    menu.addEventListener('click', function () { menu.setAttribute('aria-expanded', String(links.classList.toggle('open'))); });
    links.addEventListener('click', function (e) {if (e.target.closest('a')) close();});
    document.addEventListener('keydown', function (e) {if (e.key === 'Escape' && links.classList.contains('open')) {close();menu.focus();}});
  }
  document.querySelectorAll('.toc-section-header').forEach(function (button) {
    button.setAttribute('role', 'button'); button.tabIndex = 0;
    function toggle() {
      var section = button.parentElement, wasOpen = section.classList.contains('active');
      document.querySelectorAll('.toc-section').forEach(function (s) {s.classList.remove('active');var h=s.querySelector('.toc-section-header');if(h)h.setAttribute('aria-expanded','false');});
      if (!wasOpen) section.classList.add('active'); button.setAttribute('aria-expanded',String(!wasOpen));
    }
    button.setAttribute('aria-expanded', String(button.parentElement.classList.contains('active')));
    button.addEventListener('click', toggle);
    button.addEventListener('keydown', function (e) {if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
  });
  document.querySelectorAll('.week-header').forEach(function (button) {
    var block=button.closest('.week-block'); if(!block)return;
    button.removeAttribute('onclick');button.type='button';button.setAttribute('aria-expanded',String(block.classList.contains('open')));
    button.addEventListener('click',function(){button.setAttribute('aria-expanded',String(block.classList.toggle('open')));});
  });
  // Refresh both schedule previews from one data source. Published HTML remains
  // readable if the request is unavailable or JavaScript is disabled.
  var sessions = document.querySelector('[data-academy-sessions]');
  if (sessions) {
    function el(tag, text, cls) { var n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n; }
    function href(value) { try {var u=new URL(value,window.location.origin+'/');return /^https?:$/.test(u.protocol)?u.href:null;}catch(e){return null;} }
    fetch('/upcoming-trainings.json').then(function(r){if(!r.ok)throw new Error('Schedule unavailable');return r.json();}).then(function(data){
      if (!Array.isArray(data.trainings)) return;
      var limit=Number(sessions.dataset.academySessions), list=limit?data.trainings.slice(0,limit):data.trainings;
      var fragment=document.createDocumentFragment();
      if(!list.length){fragment.appendChild(el('p','No sessions are listed right now. Contact trainings@vibetestq.com for the next batch.'));}
      list.forEach(function(t){
        var card=el('article',null,'ap-card');card.appendChild(el('span',t.type,'ap-tag'));card.appendChild(el('h3',t.name));card.appendChild(el('p',t.description));
        var dl=el('dl');[['Training starts',t.trainingStartDate],['Session time',t.sessionTime],['Training fee',t.pricing],['One-time payment',t.oneTimePayment],['Trainer',t.trainer]].forEach(function(row){dl.appendChild(el('dt',row[0]));dl.appendChild(el('dd',row[1]));});card.appendChild(dl);
        var registration=href(t.contactUrl), details=href(t.detailsUrl);
        if(registration){var a=el('a','Contact on WhatsApp ↗','ap-button');a.href=registration;a.target='_blank';a.rel='noopener';card.appendChild(a);card.appendChild(el('br'));}
        if(details){var b=el('a','View program →');b.href=details;card.appendChild(b);}
        fragment.appendChild(card);
      });
      sessions.replaceChildren(fragment);
    }).catch(function(){ /* keep the published schedule */ });
  }
})();
