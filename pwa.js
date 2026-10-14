/* পাবলিক অ্যাপ (PWA): সার্ভিস ওয়ার্কার রেজিস্টার + "Install App" বাটন */
(function(){
  if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')){
    window.addEventListener('load', function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
  }
  var deferred = null;
  var TX = {
    en: { install:'Install App', ios:'To install: tap the Share button, then choose “Add to Home Screen”.', other:'To install, use your browser menu and choose “Install app” or “Add to Home screen”.' },
    bn: { install:'অ্যাপ ইনস্টল', ios:'ইনস্টল করতে: Share বাটনে চেপে “Add to Home Screen” বাছুন।', other:'ইনস্টল করতে ব্রাউজারের মেনু থেকে “Install app” বা “Add to Home screen” বাছুন।' }
  };
  function lang(){ return document.documentElement.lang === 'bn' ? 'bn' : 'en'; }
  function standalone(){ return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  function show(){
    var b = document.getElementById('installBtn'); if(!b) return;
    if(standalone()){ b.style.display = 'none'; return; }
    if(deferred || isIOS){ b.style.display = ''; var l = b.querySelector('.lbl'); if(l) l.textContent = TX[lang()].install; }
  }
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; show(); });
  window.addEventListener('appinstalled', function(){ deferred = null; var b = document.getElementById('installBtn'); if(b) b.style.display = 'none'; });
  window.installApp = function(){
    if(deferred){ deferred.prompt(); deferred.userChoice.then(function(){ deferred = null; show(); }); return; }
    alert(isIOS ? TX[lang()].ios : TX[lang()].other);
  };
  document.addEventListener('DOMContentLoaded', show);
  try{ new MutationObserver(show).observe(document.documentElement, {attributes:true, attributeFilter:['lang']}); }catch(e){}
})();
