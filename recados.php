<?php /* Play Spot — Recados do jogo */ header('Cache-Control: no-cache, must-revalidate'); ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content">
<title>Play Spot — Recados do jogo</title>
<link rel="icon" href="favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/recados.css?v=20261001b">
</head><body>
<div class="ch-app">

  <!-- Cabeçalho -->
  <header class="ch-header">
    <button class="ch-back" type="button" id="btnVoltar" title="Voltar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <div class="ch-emoji" id="salaEmoji">💬</div>
    <div class="ch-titles">
      <div class="ch-title" id="salaNome">Recados do jogo</div>
      <div class="ch-sub" id="salaSub">Carregando…</div>
    </div>
    <button class="ch-refresh" type="button" id="btnAtualizar" title="Atualizar recados" aria-label="Atualizar recados">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
    </button>
    <button class="ch-people-btn" type="button" id="btnPessoas" title="Quem vai jogar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <span id="qtdParticipantes">0</span>
    </button>
  </header>

  <div class="ch-body">
    <!-- Conversa -->
    <main class="ch-main">
      <div class="ch-aviso" id="avisoSeguranca">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <p><strong>Jogue seguro:</strong> não compartilhe telefone, endereço ou redes sociais. Marque encontros só no local do jogo e denuncie recados estranhos.</p>
        <button type="button" id="btnFecharAviso" title="Fechar aviso">✕</button>
      </div>

      <div class="ch-msgs" id="listaMensagens" aria-live="polite">
        <div class="ch-estado"><div class="ch-spinner"></div>Carregando recados…</div>
      </div>

      <button class="ch-novas" type="button" id="btnNovas" hidden>Novos recados ↓</button>
      <div class="ch-status" id="statusAtualizacao"></div>

      <!-- Campo de envio -->
      <div class="ch-composer" id="composer" hidden>
        <div class="form-msg" id="recadosMsg"></div>
        <div class="ch-composer-row">
          <textarea id="campoMensagem" rows="1" maxlength="500" placeholder="Escreva um recado…" aria-label="Recado"></textarea>
          <button class="ch-send" type="button" id="btnEnviar" title="Enviar" disabled>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/></svg>
          </button>
        </div>
        <div class="ch-contador" id="contador"></div>
      </div>
      <div class="ch-readonly" id="somenteLeitura" hidden>Este jogo já passou. Os recados agora são só para leitura.</div>
    </main>

    <!-- Quem vai jogar (lateral no PC, painel no celular) -->
    <aside class="ch-side" id="painelPessoas">
      <div class="ch-side-head">
        <div class="ch-side-title">Quem vai jogar</div>
        <button type="button" class="ch-side-close" id="btnFecharPessoas" title="Fechar">✕</button>
      </div>
      <div class="ch-people" id="listaParticipantes"></div>
      <a class="ch-side-link" id="linkLocal" href="index.php">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Ver detalhes do local
      </a>
    </aside>
  </div>
</div>
<div class="ch-backdrop" id="backdropPessoas"></div>

<!-- Modal de denúncia -->
<div class="modal-overlay" id="modalDenuncia">
  <div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="denTitulo">
    <div class="modal-handle"></div>
    <div class="modal-title" id="denTitulo">Denunciar recado</div>
    <div class="modal-sub">A equipe do Play Spot vai analisar. Quem enviou não fica sabendo que foi você.</div>
    <blockquote class="den-preview" id="denPreview"></blockquote>
    <div class="modal-label" style="margin-bottom:8px;">Motivo</div>
    <div class="den-motivos" id="denMotivos"></div>
    <div class="form-msg" id="denMsg"></div>
    <div class="den-acoes">
      <button type="button" class="btn-sec" id="btnCancelarDen">Cancelar</button>
      <button type="button" class="modal-confirm" id="btnEnviarDen" style="margin:0;">Enviar denúncia</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span id="toastMsg"></span></div>

<script src="js/common.js?v=20261001b"></script><script src="js/recados.js?v=20261001b"></script>
</body></html>
