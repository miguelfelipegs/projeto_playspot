var esportesCatalogo = [], esporteFiltroAtivo = '', buscaTimeout = null;
function renderizarTopbar(usuario) {
  var c = document.getElementById('topbarAcao');
  if (usuario) {
    c.innerHTML = usuario.foto_url
      ? '<div class="topbar-icon com-foto" id="btnPerfil" title="Minha conta"><img src="' + esc(usuario.foto_url) + '" alt="Minha conta"></div>'
      : '<div class="topbar-icon" id="btnPerfil" title="Minha conta"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>';
    document.getElementById('btnPerfil').addEventListener('click', function() { window.location.href = 'perfil.php'; });
  } else {
    c.innerHTML = '<button class="btn-entrar-mini" onclick="window.location.href=\'login.php\'">Entrar</button>';
  }
}
function carregarFiltros() {
  return api('esportes.php').then(function(d) {
    esportesCatalogo = d.esportes;
    var c = document.getElementById('filtroEsportes'), html = '<div class="chip active" data-esporte="">Todos</div>';
    esportesCatalogo.forEach(function(e) { html += '<div class="chip" data-esporte="' + e.id + '">' + e.emoji + ' ' + e.nome + '</div>'; });
    c.innerHTML = html;
    c.querySelectorAll('.chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        c.querySelectorAll('.chip').forEach(function(x) { x.classList.remove('active'); });
        chip.classList.add('active'); esporteFiltroAtivo = chip.dataset.esporte; carregarLocais();
      });
    });
  });
}
function renderizarLocais(locais) {
  var c = document.getElementById('listaLocais');
  if (!locais.length) { c.innerHTML = '<div class="empty-state"><span>🔍</span>Nenhum local encontrado.</div>'; return; }
  c.innerHTML = locais.map(function(l, i) {
    var tags = l.esportes.map(function(e) { return '<span class="spot-tag">' + e.emoji + ' ' + e.nome + '</span>'; }).join('');
    var badge = l.aberto ? '<div class="spot-badge badge-open">● Aberto</div>' : '<div class="spot-badge badge-busy">● Fechado</div>';
    var j = l.jogadores_hoje === 1 ? '1 jogador confirmado' : l.jogadores_hoje + ' jogadores confirmados';
    var capa = l.foto_url
      ? '<div class="spot-capa"><img src="' + esc(l.foto_url) + '" alt="Foto de ' + esc(l.nome) + '" loading="lazy"></div>'
      : '<div class="spot-capa sem-foto"><span>' + esc(l.emoji_capa || '🏟') + '</span></div>';
    return '<div class="spot-card" style="animation-delay:' + Math.min(i*0.05,0.5) + 's" onclick="window.location.href=\'detalhe.php?id=' + l.id + '\'">'
      + capa
      + '<div class="spot-header"><div class="spot-name">' + esc(l.nome) + '</div>' + badge + '</div>'
      + '<div class="spot-bairro"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/></svg>' + (l.bairro||l.cidade) + '</div>'
      + '<div class="spot-tags">' + tags + '</div>'
      + '<div class="spot-footer"><div class="spot-players"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' + j + '</div>'
      + '<div class="spot-arrow"><svg viewBox="0 0 24 24" fill="white"><path d="M9 18l6-6-6-6"/></svg></div></div></div>';
  }).join('');
}
function carregarLocais() {
  var busca = document.getElementById('buscaInput').value.trim();
  var p = new URLSearchParams();
  if (esporteFiltroAtivo) p.set('esporte', esporteFiltroAtivo);
  if (busca) p.set('busca', busca);
  api('locais.php?' + p.toString()).then(function(d) { renderizarLocais(d.locais); })
    .catch(function(e) { document.getElementById('listaLocais').innerHTML = '<div class="empty-state"><span>⚠️</span>' + e.message + '</div>'; });
}
document.getElementById('buscaInput').addEventListener('input', function() {
  clearTimeout(buscaTimeout); buscaTimeout = setTimeout(carregarLocais, 350);
});
verificarSessao().then(function(u) {
  renderizarTopbar(u); return carregarFiltros();
}).then(function() { carregarLocais(); });
