var API='api', esportesCatalogo=[], infraIdSeq=0;
function api(endpoint,options){options=options||{};return fetch(API+'/'+endpoint,Object.assign({headers:{'Content-Type':'application/json'},credentials:'same-origin'},options)).then(function(res){return res.json().catch(function(){return{};}).then(function(d){if(!res.ok)throw new Error(d.erro||'Erro.');return d;});});}
function mostrarMsg(id,txt,tipo){var el=document.getElementById(id);if(!el)return;el.textContent=txt;el.className='form-msg show '+(tipo||'error');}
function limparMsg(id){var el=document.getElementById(id);if(el)el.className='form-msg';}
async function verificarSessaoAdmin(){try{var d=await api('admin_sessao.php');if(d.logado)mostrarShell();else document.getElementById('adminLoginWrap').style.display='flex';}catch(e){document.getElementById('adminLoginWrap').style.display='flex';}}
function mostrarShell(){document.getElementById('adminLoginWrap').style.display='none';document.getElementById('adminShell').classList.add('active');carregarDashboard();carregarLocaisTabela();}
document.getElementById('btnAdminLogin').addEventListener('click',async function(){
  limparMsg('loginMsg');var senha=document.getElementById('adminSenha').value;if(!senha){mostrarMsg('loginMsg','Informe a senha.');return;}
  try{await api('admin_login.php',{method:'POST',body:JSON.stringify({senha:senha})});document.getElementById('adminSenha').value='';mostrarShell();}catch(e){mostrarMsg('loginMsg',e.message);}
});
document.getElementById('adminSenha').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('btnAdminLogin').click();});
document.getElementById('btnAdminSair').addEventListener('click',async function(){await api('admin_logout.php',{method:'POST'});document.getElementById('adminShell').classList.remove('active');document.getElementById('adminLoginWrap').style.display='flex';});
var titulos={dashboard:['Dashboard','Visão geral da plataforma'],locais:['Locais','Gerencie os espaços esportivos'],config:['Configurações','Segurança do painel'],denuncias:['Denúncias','Moderação dos recados dos jogos']};
document.querySelectorAll('.admin-nav-item[data-page]').forEach(function(btn){
  btn.addEventListener('click',function(){
    var page=btn.dataset.page;
    document.querySelectorAll('.admin-nav-item[data-page]').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    document.querySelectorAll('.admin-page').forEach(function(p){p.style.display='none';});
    document.getElementById('page-'+page).style.display='block';
    document.getElementById('pageTitle').textContent=titulos[page][0];
    document.getElementById('pageSub').textContent=titulos[page][1];
    document.getElementById('adminSidebar').classList.remove('open');
    if(page==='dashboard')carregarDashboard();
    if(page==='locais')carregarLocaisTabela();
    if(page==='denuncias')carregarDenuncias();
  });
});
document.getElementById('menuToggle').addEventListener('click',function(){document.getElementById('adminSidebar').classList.toggle('open');});
async function carregarDashboard(){
  try{var d=await api('admin_stats.php'),s=d.stats;
    document.getElementById('statLocais').textContent=s.total_locais;
    document.getElementById('statAbertos').textContent=s.total_abertos;
    document.getElementById('statUsuarios').textContent=s.total_usuarios;
    document.getElementById('statPresencas').textContent=s.presencas_hoje;
    atualizarBadgeDenuncias(s.denuncias_pendentes||0);
    document.getElementById('rankAtivos').innerHTML=s.mais_ativos.length?s.mais_ativos.map(function(l){return'<div class="rank-row"><div><div class="rank-name">'+l.nome+'</div><div class="rank-sub">'+(l.bairro||'—')+'</div></div><div class="rank-count">'+l.total_presencas+'</div></div>';}).join(''):'<div class="rank-row"><span class="rank-sub">Nenhuma confirmação ainda.</span></div>';
  }catch(e){console.error(e);}
}
async function carregarLocaisTabela(){
  var tbody=document.getElementById('tabelaLocais');
  try{var d=await api('admin_locais.php');
    if(!d.locais.length){tbody.innerHTML='<tr class="empty-row"><td colspan="6">Nenhum local cadastrado.</td></tr>';return;}
    tbody.innerHTML=d.locais.map(function(l){
      var capa=l.foto_url?'<div class="loc-emoji-mini com-foto"><img src="'+escA(l.foto_url)+'" alt="" loading="lazy"></div>':'<div class="loc-emoji-mini">'+escA(l.emoji_capa||'🏟')+'</div>';
      return'<tr><td><div class="loc-nome-cell">'+capa+escA(l.nome)+'</div></td>'
        +'<td>'+(l.bairro||'—')+'</td>'
        +'<td>'+l.esportes.map(function(e){return'<span class="tag-mini">'+e.emoji+' '+e.nome+'</span>';}).join('')+'</td>'
        +'<td><span class="status-pill '+(l.aberto?'aberto':'fechado')+'">'+(l.aberto?'Aberto':'Fechado')+'</span></td>'
        +'<td>'+l.jogadores_hoje+'</td>'
        +'<td><div class="row-actions">'
        +'<div class="icon-btn" onclick="editarLocal('+l.id+')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>'
        +'<div class="icon-btn danger" onclick="excluirLocal('+l.id+',\''+l.nome.replace(/'/g,"\\'")+'\')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></div>'
        +'</div></td></tr>';
    }).join('');
  }catch(e){tbody.innerHTML='<tr class="empty-row"><td colspan="6">'+e.message+'</td></tr>';}
}
async function garantirCatalogo(){if(!esportesCatalogo.length){var d=await api('esportes.php');esportesCatalogo=d.esportes;}}
function novaLinhaInfra(desc,disp){
  var id='infra-'+(infraIdSeq++),row=document.createElement('div');
  row.className='infra-row';
  row.innerHTML='<input type="checkbox"'+(disp?' checked':'')+'><input type="text" class="input-field" placeholder="Ex: Iluminação noturna" value="'+((desc||'').replace(/"/g,'&quot;'))+'"><div class="icon-btn danger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>';
  row.querySelector('.icon-btn').addEventListener('click',function(){row.remove();});
  return row;
}
document.getElementById('btnAddInfra').addEventListener('click',function(){document.getElementById('fInfraRows').appendChild(novaLinhaInfra('',true));});
async function abrirModalLocal(local){
  await garantirCatalogo(); limparMsg('modalLocalMsg');
  document.getElementById('modalLocalTitulo').textContent=local?'Editar local':'Novo local';
  document.getElementById('fLocalId').value=local?local.id:'';
  document.getElementById('fNome').value=local?local.nome:'';
  document.getElementById('fEmoji').value=local?local.emoji_capa:'🏟';
  fotoLocalNova=null; removerFotoLocal=false; fotoLocalAtual=local?(local.foto_url||null):null; pintarFotoLocal();
  document.getElementById('fEndereco').value=local?(local.endereco||''):'';
  document.getElementById('fBairro').value=local?(local.bairro||''):'';
  document.getElementById('fCidade').value=local?local.cidade:'Contagem, MG';
  document.getElementById('fLatitude').value=local?(local.latitude||''):'';
  document.getElementById('fLongitude').value=local?(local.longitude||''):'';
  document.getElementById('fAberto').checked=local?!!local.aberto:true;
  document.getElementById('fEsportes').innerHTML=esportesCatalogo.map(function(e){return'<div class="chip'+(local&&local.esportes.indexOf(e.id)!==-1?' active':'')+'" data-id="'+e.id+'">'+e.emoji+' '+e.nome+'</div>';}).join('');
  document.querySelectorAll('#fEsportes .chip').forEach(function(c){c.addEventListener('click',function(){c.classList.toggle('active');});});
  var ic=document.getElementById('fInfraRows');ic.innerHTML='';
  if(local&&local.infraestrutura.length){local.infraestrutura.forEach(function(i){ic.appendChild(novaLinhaInfra(i.descricao,!!i.disponivel));});}
  else{ic.appendChild(novaLinhaInfra('',true));}
  document.getElementById('modalLocal').classList.add('open');
}
function fecharModalLocal(){document.getElementById('modalLocal').classList.remove('open');}
document.getElementById('btnNovoLocal').addEventListener('click',function(){abrirModalLocal(null);});
document.getElementById('btnFecharModalLocal').addEventListener('click',fecharModalLocal);
document.getElementById('btnCancelarLocal').addEventListener('click',fecharModalLocal);
document.getElementById('modalLocal').addEventListener('click',function(e){if(e.target.id==='modalLocal')fecharModalLocal();});
async function editarLocal(id){try{var d=await api('admin_locais.php?id='+id);abrirModalLocal(d.local);}catch(e){alert(e.message);}}
async function excluirLocal(id,nome){
  if(!confirm('Excluir "'+nome+'"? Esta ação não pode ser desfeita.'))return;
  try{await api('admin_locais.php?id='+id,{method:'DELETE'});carregarLocaisTabela();carregarDashboard();}catch(e){alert(e.message);}
}
document.getElementById('btnSalvarLocal').addEventListener('click',async function(){
  limparMsg('modalLocalMsg');
  var id=document.getElementById('fLocalId').value;
  var nome=document.getElementById('fNome').value.trim();
  if(!nome){mostrarMsg('modalLocalMsg','O nome é obrigatório.');return;}
  var latR=document.getElementById('fLatitude').value.trim(), lngR=document.getElementById('fLongitude').value.trim();
  var lat=latR!==''?parseFloat(latR.replace(',','.')):null, lng=lngR!==''?parseFloat(lngR.replace(',','.')):null;
  if(latR!==''&&isNaN(lat)){mostrarMsg('modalLocalMsg','Latitude inválida.');return;}
  var esportes=Array.from(document.querySelectorAll('#fEsportes .chip.active')).map(function(c){return parseInt(c.dataset.id);});
  var infra=Array.from(document.querySelectorAll('#fInfraRows .infra-row')).map(function(r){return{descricao:r.querySelector('input[type="text"]').value.trim(),disponivel:r.querySelector('input[type="checkbox"]').checked};}).filter(function(i){return i.descricao!=='';});
  var payload={foto:fotoLocalNova||undefined,remover_foto:(!fotoLocalNova&&removerFotoLocal)||undefined,nome:nome,emoji_capa:document.getElementById('fEmoji').value.trim()||'🏟',endereco:document.getElementById('fEndereco').value.trim(),bairro:document.getElementById('fBairro').value.trim(),cidade:document.getElementById('fCidade').value.trim(),latitude:lat,longitude:lng,aberto:document.getElementById('fAberto').checked,esportes:esportes,infraestrutura:infra};
  var btn=document.getElementById('btnSalvarLocal');btn.disabled=true;btn.textContent='Salvando...';
  try{
    if(id){await api('admin_locais.php?id='+id,{method:'PUT',body:JSON.stringify(payload)});}
    else{await api('admin_locais.php',{method:'POST',body:JSON.stringify(payload)});}
    fecharModalLocal();carregarLocaisTabela();carregarDashboard();
  }catch(e){mostrarMsg('modalLocalMsg',e.message);}
  finally{btn.disabled=false;btn.textContent='Salvar local';}
});
document.getElementById('btnTrocarSenha').addEventListener('click',async function(){
  limparMsg('senhaMsg');
  var sa=document.getElementById('senhaAtual').value,sn=document.getElementById('senhaNova').value;
  if(!sa||!sn){mostrarMsg('senhaMsg','Preencha os dois campos.');return;}
  try{var d=await api('admin_trocar_senha.php',{method:'POST',body:JSON.stringify({senha_atual:sa,senha_nova:sn})});mostrarMsg('senhaMsg',d.mensagem,'success');document.getElementById('senhaAtual').value='';document.getElementById('senhaNova').value='';}
  catch(e){mostrarMsg('senhaMsg',e.message);}
});
/* ── Denúncias dos recados ── */
function escA(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function atualizarBadgeDenuncias(n){
  var b=document.getElementById('badgeDenuncias');b.textContent=n;b.hidden=!n;
  document.getElementById('statDenuncias').textContent=n;
  document.getElementById('cardDenuncias').classList.toggle('tem',n>0);
}
document.getElementById('cardDenuncias').addEventListener('click',function(){document.querySelector('.admin-nav-item[data-page="denuncias"]').click();});
async function carregarDenuncias(){
  var box=document.getElementById('listaDenuncias');
  try{var d=await api('admin_denuncias.php');atualizarBadgeDenuncias(d.denuncias.length);
    if(!d.denuncias.length){box.innerHTML='<div class="den-vazio">✅ Nenhuma denúncia pendente. Os recados estão tranquilos!</div>';return;}
    box.innerHTML=d.denuncias.map(function(x){
      var data=new Date(x.data_jogo+'T00:00:00').toLocaleDateString('pt-BR');
      return '<div class="den-card" data-id="'+x.mensagem_id+'">'
        +'<div class="den-topo"><span class="den-qtd">🚩 '+x.total_denuncias+(x.total_denuncias===1?' denúncia':' denúncias')+'</span><span class="den-motivos-txt">'+escA(x.motivos)+'</span></div>'
        +'<blockquote class="den-texto">'+escA(x.texto)+'</blockquote>'
        +'<div class="den-meta"><span><strong>'+escA(x.autor_nome)+'</strong> ('+escA(x.autor_email)+')</span><span>'+escA(x.local_nome)+' · jogo de '+data+' · enviada '+escA(String(x.criado_em).slice(11,16))+'</span></div>'
        +'<div class="den-acoes"><button class="den-btn apagar" data-acao="remover">Apagar mensagem</button><button class="den-btn manter" data-acao="ignorar">Manter</button></div></div>';
    }).join('');
    box.querySelectorAll('.den-btn').forEach(function(b){b.addEventListener('click',async function(){
      var card=b.closest('.den-card'),acao=b.dataset.acao;
      if(acao==='remover'&&!confirm('Apagar este recado para todos?'))return;
      card.style.opacity='0.5';
      try{await api('admin_denuncias.php',{method:'POST',body:JSON.stringify({mensagem_id:+card.dataset.id,acao:acao})});card.remove();
        var restantes=box.querySelectorAll('.den-card').length;atualizarBadgeDenuncias(restantes);
        if(!restantes)box.innerHTML='<div class="den-vazio">✅ Nenhuma denúncia pendente. Os recados estão tranquilos!</div>';
      }catch(e){card.style.opacity='';alert(e.message);}
    });});
  }catch(e){box.innerHTML='<div class="den-vazio">'+escA(e.message)+'<br><small>Se aparecer erro de tabela, rode o script SQL de atualização (v6) no phpMyAdmin.</small></div>';}
}
/* ── Foto do local ── */
var fotoLocalNova=null, fotoLocalAtual=null, removerFotoLocal=false;
function pintarFotoLocal(){
  var prev=document.getElementById('fFotoPrev'), src=fotoLocalNova||(!removerFotoLocal&&fotoLocalAtual);
  var emoji=document.getElementById('fEmoji').value.trim()||'🏟';
  prev.innerHTML=src?'<img src="'+escA(src)+'" alt="Foto do local">':'<span class="foto-local-vazio">'+escA(emoji)+'<small>sem foto</small></span>';
  document.getElementById('btnRemoverFotoLocal').hidden=!src;
  document.getElementById('btnEscolherFoto').textContent=src?'Trocar foto':'Escolher foto';
}
/** Reduz a foto no navegador (lado maior até 1280 px, JPG) para o envio ficar leve. */
function prepararFotoLocal(arq){
  return new Promise(function(res,rej){
    if(!/^image\/(jpeg|png|webp)$/i.test(arq.type)&&!/\.(jpe?g|png|webp)$/i.test(arq.name))return rej(new Error('Escolha uma imagem JPG, PNG ou WEBP.'));
    if(arq.size>25*1024*1024)return rej(new Error('A imagem é muito grande (máximo 25 MB).'));
    var url=URL.createObjectURL(arq),img=new Image();
    img.onload=function(){
      var esc=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.round(img.naturalWidth*esc),h=Math.round(img.naturalHeight*esc);
      var cv=document.createElement('canvas');cv.width=w;cv.height=h;var ctx=cv.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
      res(cv.toDataURL('image/jpeg',0.85));
    };
    img.onerror=function(){URL.revokeObjectURL(url);rej(new Error('Não foi possível abrir essa imagem.'));};
    img.src=url;
  });
}
document.getElementById('btnEscolherFoto').addEventListener('click',function(){document.getElementById('fFoto').click();});
document.getElementById('fFoto').addEventListener('change',function(e){
  var arq=e.target.files&&e.target.files[0];e.target.value='';if(!arq)return;
  limparMsg('modalLocalMsg');document.getElementById('fFotoDica').textContent='Preparando foto...';
  prepararFotoLocal(arq).then(function(d){fotoLocalNova=d;removerFotoLocal=false;pintarFotoLocal();document.getElementById('fFotoDica').textContent='Foto pronta. Ela será enviada ao clicar em "Salvar local".';})
    .catch(function(err){mostrarMsg('modalLocalMsg',err.message);document.getElementById('fFotoDica').textContent='Opcional. Sem foto, o site mostra o emoji de capa.';});
});
document.getElementById('btnRemoverFotoLocal').addEventListener('click',function(){
  if(fotoLocalNova){fotoLocalNova=null;}else{removerFotoLocal=true;}
  pintarFotoLocal();document.getElementById('fFotoDica').textContent=removerFotoLocal?'A foto será removida ao clicar em "Salvar local".':'Opcional. Sem foto, o site mostra o emoji de capa.';
});
document.getElementById('fEmoji').addEventListener('input',function(){if(!fotoLocalNova&&(removerFotoLocal||!fotoLocalAtual))pintarFotoLocal();});
verificarSessaoAdmin();
