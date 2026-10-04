(function () {
  'use strict';
  var search=document.getElementById('profile-search'),category=document.getElementById('profile-category'),level=document.getElementById('profile-level'),reset=document.getElementById('profile-reset');
  if(!search||!category||!level||!reset)return;
  var cards=Array.from(document.querySelectorAll('.cp-card')),count=document.getElementById('profile-count'),empty=document.getElementById('profile-empty');
  function filter(){
    var words=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean),visible=0;
    cards.forEach(function(card){var match=(category.value==='all'||category.value===card.dataset.category)&&(level.value==='all'||level.value===card.dataset.level)&&words.every(function(word){return card.dataset.search.indexOf(word)!==-1;});card.hidden=!match;if(match)visible++;});
    count.textContent=visible+' sample '+(visible===1?'profile':'profiles');empty.hidden=visible!==0;
  }
  search.addEventListener('input',filter);category.addEventListener('change',filter);level.addEventListener('change',filter);
  reset.addEventListener('click',function(){search.value='';category.value='all';level.value='all';filter();search.focus();});
})();
