var API = 'api';
function api(endpoint, options) {
  options = options || {};
  return fetch(API + '/' + endpoint, Object.assign({ headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' }, options))
    .then(function(res) {
      return res.json().catch(function() { return {}; }).then(function(dados) {
        if (!res.ok) { var e = new Error(dados.erro || 'Erro inesperado.'); e.status = res.status; throw e; }
        return dados;
      });
    });
}
function mostrarMsg(elId, texto, tipo) {
  var el = document.getElementById(elId); if (!el) return;
  el.textContent = texto; el.className = 'form-msg show ' + (tipo || 'error');
}
function limparMsg(elId) {
  var el = document.getElementById(elId); if (!el) return; el.className = 'form-msg';
}
function mostrarToast(texto) {
  var t = document.getElementById('toast'); if (!t) return;
  var m = document.getElementById('toastMsg'); if (m) m.textContent = texto;
  t.classList.add('show'); setTimeout(function() { t.classList.remove('show'); }, 3200);
}
function irPara(p) { window.location.href = p; }
function exigirSessao() {
  return api('sessao.php').then(function(d) {
    if (!d.logado) { window.location.href = 'login.php'; return null; }
    window.usuarioAtual = d.usuario; return d.usuario;
  }).catch(function() { window.location.href = 'login.php'; return null; });
}
function verificarSessao() {
  return api('sessao.php').then(function(d) {
    if (!d.logado) return null;
    window.usuarioAtual = d.usuario; return d.usuario;
  }).catch(function() { return null; });
}

/* ── Utilidades compartilhadas (v6) ───────────────────────── */
function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
/** Círculo com a foto do usuário ou, se não tiver, as iniciais. */
function avatarHTML(u, classe) {
  u = u || {};
  var c = 'avatar-mini' + (classe ? ' ' + classe : '');
  if (u.foto_url) return '<span class="' + c + '"><img src="' + esc(u.foto_url) + '" alt="" loading="lazy"></span>';
  return '<span class="' + c + '">' + esc(u.avatar_iniciais || '?') + '</span>';
}
/**
 * Lê a foto escolhida, recorta em quadrado e reduz para 256x256 (JPG).
 * Assim o upload fica leve (~30 KB) mesmo com fotos grandes do celular.
 */
function prepararFoto(arquivo) {
  return new Promise(function(resolve, reject) {
    if (!arquivo) return reject(new Error('Nenhuma foto escolhida.'));
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(arquivo.type) && !/\.(jpe?g|png|webp)$/i.test(arquivo.name))
      return reject(new Error('Escolha uma imagem JPG, PNG ou WEBP.'));
    if (arquivo.size > 15 * 1024 * 1024) return reject(new Error('A foto é muito grande (máximo 15 MB).'));
    var url = URL.createObjectURL(arquivo), img = new Image();
    img.onload = function() {
      var lado = Math.min(img.naturalWidth, img.naturalHeight), tam = Math.min(256, lado);
      var cv = document.createElement('canvas'); cv.width = tam; cv.height = tam;
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tam, tam);
      ctx.drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, tam, tam);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = function() { URL.revokeObjectURL(url); reject(new Error('Não foi possível abrir essa imagem. Tente outra foto.')); };
    img.src = url;
  });
}
/** "2026-09-28" -> "hoje", "amanhã" ou "sáb, 04/10" */
function rotuloData(iso) {
  var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]), h = new Date(); h.setHours(0, 0, 0, 0);
  var dif = Math.round((d - h) / 86400000);
  if (dif === 0) return 'hoje';
  if (dif === 1) return 'amanhã';
  if (dif === -1) return 'ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') + ', ' + p[2] + '/' + p[1];
}

/* ── Voltar para a página de origem depois de entrar/criar conta ── */
/** Só aceita páginas do próprio site (evita mandar o usuário para sites externos). */
function destinoSeguro(v) {
  return (typeof v === 'string' && /^(index|detalhe|perfil|recados)\.php(\?[\w=&%.\-]*)?$/.test(v)) ? v : null;
}
/** Página para onde voltar, vinda do ?voltar= da URL atual (ou null). */
function voltarAtual() {
  return destinoSeguro(new URLSearchParams(window.location.search).get('voltar'));
}
/** Monta o link de login/cadastro levando junto a página de origem. */
function linkComVoltar(pagina, voltar) {
  voltar = destinoSeguro(voltar);
  return pagina + (voltar ? '?voltar=' + encodeURIComponent(voltar) : '');
}
