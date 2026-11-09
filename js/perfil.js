function pintarAvatar(u) {
  var el = document.getElementById('perfilAvatar');
  if (u.foto_url) el.innerHTML = '<img src="' + esc(u.foto_url) + '" alt="Sua foto">';
  else el.textContent = u.avatar_iniciais || '??';
  document.getElementById('btnRemoverFotoPerfil').hidden = !u.foto_url;
}
function preencherPerfil(u) {
  pintarAvatar(u);
  document.getElementById('perfilNome').textContent   = u.nome;
  document.getElementById('perfilEmail').textContent  = u.email;
  if (u.bairro) { document.getElementById('perfilBairro').textContent=u.bairro+', '+(u.cidade||'Contagem, MG'); document.getElementById('perfilBairroBlock').style.display='block'; }
  var esp=u.esportes||[];
  if (esp.length>0) { document.getElementById('perfilEsportesTags').innerHTML=esp.map(function(e){return '<span class="spot-tag">'+esc(e.emoji)+' '+esc(e.nome)+'</span>';}).join(''); document.getElementById('perfilEsportesBlock').style.display='block'; }
}
var ICON_RECADOS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
function carregarPresencas() {
  api('perfil_presencas.php').then(function(d){
    var lista=d.presencas||[]; if(!lista.length)return;
    document.getElementById('perfilPresencasList').innerHTML=lista.map(function(p){
      var data=new Date(p.data_jogo+'T00:00:00').toLocaleDateString('pt-BR'), h=p.horario?' às '+p.horario:'', pes=p.qtd_pessoas==1?'1 pessoa':p.qtd_pessoas+' pessoas';
      var rec=p.recados_abertos?'<a class="presenca-recados-link" href="recados.php?local='+p.local_id+'&data='+p.data_jogo+'">'+ICON_RECADOS+'Ver recados do jogo</a>':'';
      return '<div class="infra-item" style="flex-direction:column;align-items:flex-start;gap:2px;"><strong style="color:var(--white);font-size:0.88rem;">'+esc(p.local_nome)+'</strong><span style="font-size:0.75rem;color:var(--muted);">'+data+h+' — '+pes+'</span>'+rec+'</div>';
    }).join('');
    document.getElementById('perfilPresencasBlock').style.display='block';
  }).catch(function(){});
}
// Trocar / remover foto de perfil
document.getElementById('btnTrocarFoto').addEventListener('click',function(){ document.getElementById('perfilFoto').click(); });
document.getElementById('perfilFoto').addEventListener('change',function(e){
  var arq=e.target.files&&e.target.files[0]; e.target.value=''; if(!arq)return;
  limparMsg('perfilMsg');
  prepararFoto(arq).then(function(dataUrl){
    document.getElementById('perfilAvatar').style.opacity='0.5';
    return api('perfil_foto.php',{method:'POST',body:JSON.stringify({foto:dataUrl})});
  }).then(function(d){
    window.usuarioAtual.foto_url=d.foto_url; pintarAvatar(window.usuarioAtual);
    mostrarMsg('perfilMsg','Foto atualizada!','success'); setTimeout(function(){limparMsg('perfilMsg');},2500);
  }).catch(function(err){ mostrarMsg('perfilMsg',err.message); })
  .finally(function(){ document.getElementById('perfilAvatar').style.opacity=''; });
});
document.getElementById('btnRemoverFotoPerfil').addEventListener('click',function(){
  if(!confirm('Remover sua foto de perfil?'))return;
  api('perfil_foto.php',{method:'POST',body:JSON.stringify({remover:true})}).then(function(){
    window.usuarioAtual.foto_url=null; pintarAvatar(window.usuarioAtual);
  }).catch(function(err){ mostrarMsg('perfilMsg',err.message); });
});
document.getElementById('btnLogout').addEventListener('click',function(){
  api('logout.php',{method:'POST'}).catch(function(){}).then(function(){window.location.href='index.php';});
});
exigirSessao().then(function(u){ if(!u)return; preencherPerfil(u); carregarPresencas(); });
