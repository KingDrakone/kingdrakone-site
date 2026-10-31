/* Mostra o leitor e o chat da live do YouTube dentro do site quando o canal está em direto.
   Usa a função /.netlify/functions/ultimos. Fora da Netlify (ou sem live) não faz nada. */
(function () {
  var ENDPOINT = '/.netlify/functions/ultimos';
  var POLL_MS = 90000;
  var liveId = null;

  function build(id) {
    var host = location.hostname;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:20px;align-items:stretch';
    var player = document.createElement('div');
    player.style.cssText = 'flex:2 1 560px;min-width:0;position:relative;aspect-ratio:16/9;background:#0A0710;border:2px solid #000;box-shadow:5px 5px 0 #FF37AF';
    var f1 = document.createElement('iframe');
    f1.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?rel=0&playsinline=1';
    f1.title = 'Live do King Drakone';
    f1.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f1.allowFullscreen = true;
    f1.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
    player.appendChild(f1);
    var chat = document.createElement('div');
    chat.style.cssText = 'flex:1 1 320px;min-width:0;min-height:420px;background:#0A0710;border:2px solid #000;box-shadow:5px 5px 0 #9B4DFF';
    var f2 = document.createElement('iframe');
    f2.src = 'https://www.youtube.com/live_chat?v=' + encodeURIComponent(id) + '&embed_domain=' + encodeURIComponent(host);
    f2.title = 'Chat da live';
    f2.style.cssText = 'width:100%;height:100%;min-height:420px;border:0';
    chat.appendChild(f2);
    wrap.appendChild(player);
    wrap.appendChild(chat);
    return wrap;
  }

  function render() {
    var box = document.getElementById('liveEmbed');
    if (!box) return;
    if (liveId) {
      if (box.getAttribute('data-live') !== liveId || !box.firstChild) {
        box.textContent = '';
        box.appendChild(build(liveId));
        box.setAttribute('data-live', liveId);
      }
      box.style.display = 'block';
    } else {
      box.textContent = '';
      box.removeAttribute('data-live');
      box.style.display = 'none';
    }
  }

  function check() {
    fetch(ENDPOINT).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      liveId = d && d.live && d.live.estado === 'live' ? d.live.id : null;
      render();
    }).catch(function () {});
  }

  function start() {
    check();
    setInterval(check, POLL_MS);
    // a página volta a desenhar-se sozinha; se apagar o leitor, volta a pô-lo
    new MutationObserver(function () {
      var box = document.getElementById('liveEmbed');
      if (liveId && box && !box.firstChild) render();
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
