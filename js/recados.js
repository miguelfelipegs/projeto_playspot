/* Play Spot — Recados do jogo
   Mural de recados (não é conversa em tempo real): os recados carregam ao abrir
   a página, ao enviar, ao tocar em "Atualizar" e, no máximo, 1 vez por minuto
   enquanto a aba estiver aberta. Assim o site fica leve para a hospedagem. */
var INTERVALO_MS = 60000;          // atualização automática: 1x por minuto
var ESPERA_MANUAL_MS = 5000;       // botão Atualizar: no máximo 1 clique a cada 5 s
var ultimaAtualizacao = 0;
var params = new URLSearchParams(location.search);
var LOCAL = parseInt(params.get('local'), 10), DATA = params.get('data') || '';
var meuId = null, ultimoId = 0, idsNaTela = {}, sala = null, timer = null, carregando = false, enviando = false;
var mensagemDenunciada = null;
var MOTIVOS = ['Ofensa ou xingamento', 'Assédio ou ameaça', 'Conteúdo impróprio', 'Spam ou propaganda', 'Pedido de contato pessoal', 'Outro'];
var ICON_FLAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';

var $lista = document.getElementById('listaMensagens');
var $campo = document.getElementById('campoMensagem');
var $enviar = document.getElementById('btnEnviar');

if (!LOCAL || !/^\d{4}-\d{2}-\d{2}$/.test(DATA)) { location.href = 'index.php'; }

/* ── Carregamento e atualização ─────────────────────────── */
function buscar() {
  if (carregando) return Promise.resolve();
  carregando = true;
  document.getElementById('btnAtualizar').classList.add('girando');
  var q = 'recados.php?local=' + LOCAL + '&data=' + DATA + '&depois=' + ultimoId + '&completo=1';
  return api(q).then(function(d) {
    ultimaAtualizacao = Date.now();
    var h = new Date();
    document.getElementById('statusAtualizacao').textContent = 'Atualizado às ' + String(h.getHours()).padStart(2, '0') + ':' + String(h.getMinutes()).padStart(2, '0') + ' · toque em ↻ para ver novos recados';
    meuId = d.meu_id;
    if (d.sala) aplicarSala(d.sala);
    if (ultimoId === 0 && !d.mensagens.length) mostrarVazio();
    adicionarMensagens(d.mensagens, false);
    (d.removidas || []).forEach(removerDaTela);
  }).finally(function() {
    carregando = false;
    setTimeout(function() { document.getElementById('btnAtualizar').classList.remove('girando'); }, 400);
  });
}

function iniciar() {
  buscar().then(function() {
    rolarParaFim(false);
    agendar();
  }).catch(function(e) {
    if (e.status === 401) { location.href = 'login.php?voltar=' + encodeURIComponent('recados.php' + location.search); return; }
    var link = e.status === 403 || e.status === 404
      ? '<a href="detalhe.php?id=' + LOCAL + '">Ir para o local e confirmar presença</a>'
      : '<a href="#" onclick="location.reload();return false;">Tentar de novo</a>';
    $lista.innerHTML = '<div class="ch-estado"><span class="emoji">🔒</span><div><strong>Não foi possível abrir os recados</strong>' + esc(e.message) + '</div>' + link + '</div>';
    document.getElementById('salaSub').textContent = 'Recados indisponíveis';
  });
}

function atualizarAgora() {
  return buscar().catch(function(e) {
    if (e.status === 401 || e.status === 403) { clearTimeout(timer); location.reload(); }
  });
}
function agendar() {
  clearTimeout(timer);
  timer = setTimeout(function tick() {
    if (!document.hidden && Date.now() - ultimaAtualizacao >= INTERVALO_MS - 1000) atualizarAgora();
    timer = setTimeout(tick, INTERVALO_MS);
  }, INTERVALO_MS);
}
// Voltou para a aba depois de um tempo? Atualiza uma vez (no máximo a cada 30 s).
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && meuId && Date.now() - ultimaAtualizacao > 30000) atualizarAgora();
});
document.getElementById('btnAtualizar').addEventListener('click', function() {
  if (!meuId || Date.now() - ultimaAtualizacao < ESPERA_MANUAL_MS) return;
  atualizarAgora().then(agendar);
});

/* ── Sala e participantes ───────────────────────────────── */
function aplicarSala(s) {
  var primeira = !sala; sala = s;
  document.title = 'Recados · ' + s.local.nome + ' — Play Spot';
  var capa = document.getElementById('salaEmoji');
  if (s.local.foto_url) { capa.innerHTML = '<img src="' + esc(s.local.foto_url) + '" alt="">'; capa.classList.add('com-foto'); }
  else capa.textContent = s.local.emoji_capa || '🏟';
  document.getElementById('salaNome').textContent = s.local.nome;
  document.getElementById('salaSub').innerHTML = 'Recados do jogo · <strong>' + esc(rotuloData(s.data)) + '</strong>' + (s.local.bairro ? ' · ' + esc(s.local.bairro) : '');
  document.getElementById('linkLocal').href = 'detalhe.php?id=' + s.local.id;
  document.getElementById('qtdParticipantes').textContent = s.participantes.length;
  document.getElementById('listaParticipantes').innerHTML = s.participantes.map(function(p) {
    var det = [];
    if (p.horario) det.push('chega às ' + p.horario);
    det.push(p.pessoas === 1 ? '1 pessoa' : p.pessoas + ' pessoas');
    return '<div class="ch-pessoa">' + avatarHTML(p) + '<div class="ch-pessoa-info"><div class="ch-pessoa-nome">' + esc(p.nome) + (p.eu ? ' <em>(você)</em>' : '') + '</div>'
      + '<div class="ch-pessoa-det">' + esc(det.join(' · ')) + '</div></div></div>';
  }).join('');
  if (primeira) {
    document.getElementById('composer').hidden = !s.pode_escrever;
    document.getElementById('somenteLeitura').hidden = s.pode_escrever;
  }
}

/* ── Mensagens ──────────────────────────────────────────── */
function mostrarVazio() {
  $lista.innerHTML = '<div class="ch-sistema">Só quem confirmou presença neste jogo vê estes recados</div>'
    + '<div class="ch-estado" id="estadoVazio"><span class="emoji">👋</span><div><strong>Nenhum recado ainda</strong>Deixe o primeiro recado e combine o jogo com a galera!</div></div>';
}

function criarMensagem(m) {
  var minha = m.usuario_id === meuId;
  var el = document.createElement('div');
  el.className = 'msg' + (minha ? ' minha' : '');
  el.dataset.id = m.id; el.dataset.autor = m.usuario_id;
  el.innerHTML = avatarHTML(m.autor)
    + '<div class="msg-col"><div class="msg-nome">' + esc(m.autor.nome) + '</div>'
    + '<div class="msg-bolha">' + esc(m.texto) + '<span class="msg-hora">' + esc(m.hora) + '</span></div></div>'
    + (minha ? '' : '<button type="button" class="msg-denunciar" title="Denunciar recado" aria-label="Denunciar recado">' + ICON_FLAG + '</button>');
  if (!minha) el.querySelector('.msg-denunciar').addEventListener('click', function() { abrirDenuncia(m); });
  return el;
}

function adicionarMensagens(lista, minhaEnviada) {
  if (!lista.length) return;
  var estavaNoFim = pertoDoFim(), chegouDeOutro = false, autorNovo = false;
  var vazio = document.getElementById('estadoVazio'); if (vazio) vazio.remove();
  if (!$lista.querySelector('.ch-sistema')) {
    $lista.innerHTML = '<div class="ch-sistema">Só quem confirmou presença neste jogo vê estes recados</div>';
  }
  lista.forEach(function(m) {
    if (idsNaTela[m.id]) return;
    idsNaTela[m.id] = true;
    // O recado que eu acabei de enviar não avança o marcador: assim a próxima
    // atualização ainda traz os recados que a galera mandou antes dele.
    if (!minhaEnviada && m.id > ultimoId) ultimoId = m.id;
    if (m.usuario_id !== meuId) chegouDeOutro = true;
    if (sala && !sala.participantes.some(function(p) { return p.id === m.usuario_id; })) autorNovo = true;
    var el = criarMensagem(m);
    // mantém a ordem pelo id, mesmo se duas respostas chegarem fora de ordem
    var depois = null, filhos = $lista.querySelectorAll('.msg');
    for (var i = filhos.length - 1; i >= 0; i--) { if (+filhos[i].dataset.id < m.id) break; depois = filhos[i]; }
    $lista.insertBefore(el, depois);
  });
  agruparMensagens();
  // Alguém que acabou de entrar mandou mensagem: atualiza a lista "Quem vai jogar" na hora
  if (autorNovo && !carregando) setTimeout(function() { buscar().catch(function() {}); }, 300);
  if (minhaEnviada || estavaNoFim) rolarParaFim(true);
  else if (chegouDeOutro) document.getElementById('btnNovas').hidden = false;
}

function removerDaTela(id) {
  var el = $lista.querySelector('.msg[data-id="' + id + '"]');
  if (el) { el.remove(); agruparMensagens(); }
}

/** Mensagens seguidas da mesma pessoa ficam agrupadas (nome no topo, foto embaixo). */
function agruparMensagens() {
  var msgs = $lista.querySelectorAll('.msg');
  for (var i = 0; i < msgs.length; i++) {
    var a = msgs[i].dataset.autor;
    msgs[i].classList.toggle('primeira', i === 0 || msgs[i - 1].dataset.autor !== a);
    msgs[i].classList.toggle('ultima', i === msgs.length - 1 || msgs[i + 1].dataset.autor !== a);
    var nome = msgs[i].querySelector('.msg-nome');
    if (nome) nome.style.display = msgs[i].classList.contains('primeira') ? '' : 'none';
  }
}

function pertoDoFim() { return $lista.scrollHeight - $lista.scrollTop - $lista.clientHeight < 120; }
function rolarParaFim(suave) {
  $lista.scrollTo({ top: $lista.scrollHeight, behavior: suave ? 'smooth' : 'auto' });
  document.getElementById('btnNovas').hidden = true;
}
$lista.addEventListener('scroll', function() { if (pertoDoFim()) document.getElementById('btnNovas').hidden = true; });
document.getElementById('btnNovas').addEventListener('click', function() { rolarParaFim(true); });

/* ── Enviar ─────────────────────────────────────────────── */
function atualizarCampo() {
  $campo.style.height = 'auto';
  $campo.style.height = Math.min($campo.scrollHeight, 130) + 'px';
  var n = $campo.value.length, c = document.getElementById('contador');
  c.textContent = n > 400 ? n + '/500' : '';
  c.classList.toggle('limite', n >= 500);
  $enviar.disabled = enviando || !$campo.value.trim();
}
$campo.addEventListener('input', function() { atualizarCampo(); limparMsg('recadosMsg'); });
$campo.addEventListener('keydown', function(e) {
  // No PC, Enter envia (Shift+Enter quebra linha). No celular, Enter quebra linha.
  var toque = window.matchMedia('(pointer: coarse)').matches;
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !toque) { e.preventDefault(); enviar(); }
});
$enviar.addEventListener('click', enviar);

function enviar() {
  var texto = $campo.value.trim();
  if (!texto || enviando) return;
  enviando = true; $enviar.disabled = true; limparMsg('recadosMsg');
  api('recados.php', { method: 'POST', body: JSON.stringify({ local: LOCAL, data: DATA, texto: texto }) })
    .then(function(d) {
      $campo.value = ''; adicionarMensagens([d.mensagem], true);
      buscar().catch(function() {}); // aproveita para trazer recados novos da galera
      agendar();
    })
    .catch(function(e) { mostrarMsg('recadosMsg', e.message); })
    .finally(function() { enviando = false; atualizarCampo(); $campo.focus(); });
}

/* ── Denúncia ───────────────────────────────────────────── */
document.getElementById('denMotivos').innerHTML = MOTIVOS.map(function(m, i) {
  return '<label class="den-motivo"><input type="radio" name="motivo" value="' + esc(m) + '"' + (i === 0 ? ' checked' : '') + '>' + esc(m) + '</label>';
}).join('');
function abrirDenuncia(m) {
  mensagemDenunciada = m;
  document.getElementById('denPreview').textContent = m.autor.nome + ': ' + m.texto;
  limparMsg('denMsg');
  document.getElementById('modalDenuncia').classList.add('open');
}
function fecharDenuncia() { document.getElementById('modalDenuncia').classList.remove('open'); mensagemDenunciada = null; }
document.getElementById('btnCancelarDen').addEventListener('click', fecharDenuncia);
document.getElementById('modalDenuncia').addEventListener('click', function(e) { if (e.target.id === 'modalDenuncia') fecharDenuncia(); });
document.getElementById('btnEnviarDen').addEventListener('click', function() {
  if (!mensagemDenunciada) return;
  var btn = this, motivo = document.querySelector('input[name="motivo"]:checked').value;
  btn.disabled = true;
  api('recados_denunciar.php', { method: 'POST', body: JSON.stringify({ mensagem_id: mensagemDenunciada.id, motivo: motivo }) })
    .then(function(d) { fecharDenuncia(); mostrarToast(d.mensagem || 'Denúncia enviada.'); })
    .catch(function(e) { mostrarMsg('denMsg', e.message); })
    .finally(function() { btn.disabled = false; });
});

/* ── Painel de participantes (celular) e outros ─────────── */
function painel(abrir) {
  document.getElementById('painelPessoas').classList.toggle('open', abrir);
  document.getElementById('backdropPessoas').classList.toggle('open', abrir);
}
document.getElementById('btnPessoas').addEventListener('click', function() { painel(true); });
document.getElementById('btnFecharPessoas').addEventListener('click', function() { painel(false); });
document.getElementById('backdropPessoas').addEventListener('click', function() { painel(false); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { painel(false); fecharDenuncia(); } });
document.getElementById('btnVoltar').addEventListener('click', function() { location.href = 'detalhe.php?id=' + LOCAL; });

// Aviso de segurança: some depois de fechado (lembrado neste navegador)
try { if (localStorage.getItem('ps_aviso_recados') === '1') document.getElementById('avisoSeguranca').hidden = true; } catch (e) {}
document.getElementById('btnFecharAviso').addEventListener('click', function() {
  document.getElementById('avisoSeguranca').hidden = true;
  try { localStorage.setItem('ps_aviso_recados', '1'); } catch (e) {}
});

iniciar();
