var fotoCadastro = null; // data URL já recortada/reduzida (ou null)

// "Voltar": se veio de um local, volta para ele; senão, vai para o login
document.getElementById('btnVoltarCadastro').addEventListener('click', function() {
  window.location.href = voltarAtual() || 'login.php';
});

api('esportes.php').then(function(d) {
  var c = document.getElementById('cadEsportes');
  c.innerHTML = d.esportes.map(function(e) { return '<div class="chip" data-esporte-id="' + e.id + '">' + esc(e.emoji) + ' ' + esc(e.nome) + '</div>'; }).join('');
  c.querySelectorAll('.chip').forEach(function(ch) { ch.addEventListener('click', function() { ch.classList.toggle('active'); }); });
}).catch(function(e) { console.error(e); });

// Foto de perfil (opcional)
document.getElementById('cadFoto').addEventListener('change', function(e) {
  var arq = e.target.files && e.target.files[0]; if (!arq) return;
  limparMsg('cadastroMsg');
  var hint = document.getElementById('avatarHint'); hint.textContent = 'Preparando foto...';
  prepararFoto(arq).then(function(dataUrl) {
    fotoCadastro = dataUrl;
    document.getElementById('avatarPreview').innerHTML = '<img src="' + dataUrl + '" alt="Sua foto">';
    hint.textContent = 'Toque para trocar.';
    document.getElementById('btnRemoverFoto').hidden = false;
  }).catch(function(err) {
    hint.textContent = 'Opcional — toque para escolher. Sem foto, usamos suas iniciais.';
    mostrarMsg('cadastroMsg', err.message);
  });
  e.target.value = '';
});
document.getElementById('btnRemoverFoto').addEventListener('click', function(e) {
  e.preventDefault(); e.stopPropagation();
  fotoCadastro = null;
  document.getElementById('avatarPreview').textContent = '📸';
  document.getElementById('avatarHint').textContent = 'Opcional — toque para escolher. Sem foto, usamos suas iniciais.';
  this.hidden = true;
});

document.getElementById('btnCadastro').addEventListener('click', function() {
  limparMsg('cadastroMsg');
  var nome = document.getElementById('cadNome').value.trim();
  var email = document.getElementById('cadEmail').value.trim();
  var senha = document.getElementById('cadSenha').value;
  var bairro = document.getElementById('cadBairro').value.trim();
  var esportes = Array.from(document.querySelectorAll('#cadEsportes .chip.active')).map(function(c) { return parseInt(c.dataset.esporteId); });
  if (!nome || !email || !senha) { mostrarMsg('cadastroMsg', 'Nome, e-mail e senha são obrigatórios.'); return; }
  var btn = this; btn.disabled = true; btn.textContent = 'Criando conta...';
  var corpo = { nome:nome, email:email, senha:senha, bairro:bairro, esportes:esportes };
  if (fotoCadastro) corpo.foto = fotoCadastro;
  api('cadastro.php', { method: 'POST', body: JSON.stringify(corpo) })
    .then(function() { window.location.href = voltarAtual() || 'index.php'; })
    .catch(function(e) { mostrarMsg('cadastroMsg', e.message); document.getElementById('cadastroMsg').scrollIntoView({ behavior: 'smooth', block: 'center' }); btn.disabled = false; btn.textContent = 'Criar minha conta'; });
});
