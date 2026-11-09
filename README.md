# PlaySpot

> Plataforma web para localizar espaços públicos destinados a esportes na cidade de Contagem-MG e organizar partidas neles.
> **"Conectando jovens ao esporte"**

🌐 **Aplicação:** [playspot.free.je](https://playspot.free.je) · 📄 **Site técnico:** [playspotweb.free.nf](https://playspotweb.free.nf) · 💻 **Repositório:** [github.com/miguelfelipegs/projeto_playspot](https://github.com/miguelfelipegs/projeto_playspot)

---

## 📌 Informações Gerais

| | |
|---|---|
| **Projeto** | PlaySpot |
| **Equipe** | Miguel Felipe, Emanuella Maximiano, Bruno de Castro, João Pedro, Abner, Pietro e Vitor Gabriel |
| **Curso** | Técnico em Informática |
| **Instituição** | Fundação de Ensino de Contagem (FUNEC) – Unidade Riacho |
| **Turma** | 2º ano A |
| **Orientador** | Leonardo Pacheco |
| **Coorientador** | Ronaldo Brito |
| **Público-alvo** | Público geral, com foco em jovens e adolescentes |
| **Evento** | XIII Mostra de Tecnologia FUNEC Riacho (2026) |

---

## 🎯 Objetivo do Projeto

Desenvolver uma plataforma web que permita localizar espaços públicos destinados a esportes em Contagem (quadras, praças, ginásios, pistas de skate e ciclovias), conhecer a infraestrutura de cada um e organizar partidas, sinalizando quando e com quantas pessoas o usuário vai jogar.

**Objetivos específicos**

- Catalogar e verificar os espaços esportivos públicos da cidade.
- Informar, para cada local, as modalidades, a infraestrutura disponível, se está aberto e como chegar.
- Permitir que o usuário confirme presença ("Quero Jogar") e veja quantas pessoas vão jogar em cada local no dia.
- Aproximar quem vai ao mesmo jogo por meio de recados, com segurança e moderação.
- Contribuir para os Objetivos de Desenvolvimento Sustentável da ONU **3 – Saúde e Bem-Estar** e **11 – Cidades e Comunidades Sustentáveis**.

---

## 👥 Público-Alvo

Público geral, com foco na população jovem e adolescente de Contagem que quer praticar esportes em espaços públicos e gratuitos.

---

## 🧩 Problema a Ser Resolvido

Contagem possui muitos espaços públicos destinados ao esporte, mas eles não têm a visibilidade que deveriam: não há um lugar confiável que diga onde ficam, que estrutura oferecem, se estão abertos ou se haverá alguém para jogar. Com isso, muitos jovens deixam de praticar atividades físicas e optam por atividades sedentárias, e os espaços que a prefeitura disponibiliza acabam subutilizados.

**Validação com o público**

- Pesquisa com **87 respostas**: **73,3%** disseram que as quadras que conhecem **não** têm infraestrutura para todos os esportes, e **87,2%** conhecem locais esportivos públicos **mal cuidados**.
- Segunda consulta, com **44 participantes** (81,8% entre 15 e 18 anos): **93,2%** usariam uma plataforma como o PlaySpot.

---

## 💡 Solução Proposta

Uma aplicação web responsiva, acessada pelo navegador do celular ou do computador, sem instalação, que reúne os espaços esportivos públicos de Contagem com informações verificadas e permite organizar partidas neles. Assim, a plataforma incentiva a prática de esportes e o uso das estruturas que a prefeitura disponibiliza.

Foram catalogados **18 locais reais** em **5 modalidades**: futebol, basquete, vôlei, skate e ciclismo.

---

## ⚙️ Funcionalidades do Sistema

### Para o visitante
- [x] Lista de locais com busca por nome ou bairro
- [x] Filtro por modalidade esportiva
- [x] Página de detalhe com foto, situação (aberto/fechado), esportes, infraestrutura disponível e indisponível
- [x] Mapa do local e rota pelo Google Maps
- [x] Quantidade de jogadores confirmados no dia e horários marcados

### Para o usuário cadastrado
- [x] Cadastro e login (com retorno ao local que estava sendo visto)
- [x] Foto de perfil (no cadastro ou no perfil)
- [x] Sinalização de presença — **"Quero Jogar Aqui"**: esporte, data, horário e número de pessoas
- [x] **Recados do jogo**: mural de mensagens entre quem confirmou presença no mesmo local e dia
- [x] Denúncia de recados inadequados
- [x] Perfil com esportes favoritos e últimas confirmações

### Para o administrador
- [x] Painel com estatísticas (locais, usuários, confirmações do dia, locais mais ativos)
- [x] Cadastro, edição e exclusão de locais, com foto, coordenadas, esportes e infraestrutura
- [x] Moderação dos recados denunciados
- [x] Troca da senha do painel

### Segurança
- Senhas armazenadas com hash (`password_hash`) e consultas ao banco preparadas (proteção contra SQL Injection)
- Recados visíveis apenas para quem confirmou presença no jogo
- Bloqueio automático de telefone, e-mail, links e redes sociais nos recados, filtro de palavrões e limite de envio
- Upload de imagens validado e regravado no servidor

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3 e JavaScript (sem frameworks)
- **Back-end:** PHP (API própria em JSON)
- **Banco de Dados:** MySQL
- **Hospedagem:** InfinityFree
- **Mapas:** Google Maps Embed
- **Versionamento:** Git e GitHub
- **IDE:** VS Code

---

## 🗂️ Estrutura do Projeto

```
/htdocs
│
├── api/                 # Endpoints PHP que respondem em JSON
│   ├── helpers.php      # Conexão, sessão e funções comuns
│   ├── locais.php       # Lista, busca e filtro de locais
│   ├── local.php        # Detalhe de um local
│   ├── presenca.php     # Confirmação de presença ("Quero Jogar")
│   ├── recados.php      # Recados do jogo
│   ├── cadastro.php, login.php, logout.php, sessao.php
│   ├── perfil_foto.php, perfil_presencas.php
│   └── admin_*.php      # Rotas do painel administrativo
├── config/              # db.php (conexão) e scripts SQL do banco
├── css/                 # style.css, detalhe.css, recados.css, admin.css
├── js/                  # Lógica de cada página (common.js, index.js, detalhe.js...)
├── uploads/             # Fotos de perfil (avatars) e dos locais (locais)
├── index.php            # Lista de locais
├── detalhe.php          # Página do local
├── cadastro.php         # Criação de conta
├── login.php            # Entrada
├── perfil.php           # Perfil do usuário
├── recados.php          # Recados do jogo
└── admin.php            # Painel administrativo
```

---

## 🧪 Requisitos Funcionais

- **RF01** – O sistema deve permitir que o usuário crie uma conta, com foto de perfil opcional.
- **RF02** – O sistema deve permitir que o usuário entre e saia da sua conta.
- **RF03** – O sistema deve listar os locais esportivos e permitir buscá-los por nome ou bairro e filtrá-los por modalidade.
- **RF04** – O sistema deve exibir os detalhes de cada local: foto, endereço, situação, esportes, infraestrutura, mapa e rota.
- **RF05** – O sistema deve permitir que o usuário logado confirme presença em um local, informando esporte, data, horário e número de pessoas.
- **RF06** – O sistema deve exibir quantos jogadores confirmaram presença em cada local no dia.
- **RF07** – O sistema deve permitir a troca de recados entre usuários que confirmaram presença no mesmo local e data.
- **RF08** – O sistema deve permitir denunciar recados inadequados.
- **RF09** – O sistema deve permitir que o administrador cadastre, edite e exclua locais.
- **RF10** – O sistema deve permitir que o administrador modere os recados denunciados.

---

## 🚫 Requisitos Não Funcionais

- **RNF01** – O sistema deve ser acessível por navegador, sem instalação.
- **RNF02** – A interface deve ser simples, intuitiva e responsiva (celular e computador).
- **RNF03** – O sistema deve garantir segurança no acesso: senhas com hash, sessões e consultas preparadas.
- **RNF04** – O sistema deve proteger os usuários jovens nos recados (bloqueio de contatos, filtro e moderação).
- **RNF05** – O sistema deve funcionar nos computadores da escola e em hospedagem gratuita (InfinityFree).

---

## 📅 Cronograma do Projeto

| Etapa | Descrição | Responsável | Período |
|------|-----------|-------------|------|
| 1 | Início da Mostra Tecnológica | Equipe | 24/03 a 26/03 |
| 2 | Pesquisa e verificação dos locais | Equipe | 01/04 a 16/05 |
| 3 | Primeiro protótipo, design e inserção dos dados | Equipe de Desenvolvimento | 18/05 a 01/08 |
| 4 | Novas funcionalidades | Equipe de Desenvolvimento | 03/08 a 29/08 |
| 5 | Testes, ajustes e polimento final | Equipe | até 17/10 |
| 6 | Preparação e confecção dos materiais de apresentação | Equipe | 18/09 a 10/10 |
| 7 | Apresentação na Mostra Tecnológica | Equipe | 01/11 a 07/11 |

---

## 🧑‍💻 Integrantes da Equipe

| Nome | Função | Responsabilidade |
|------|-------|-----------------|
| Miguel Felipe | Desenvolvedor / Coordenador Geral | Coordenar e desenvolver a aplicação |
| Pietro | Desenvolvedor | Desenvolver a aplicação |
| Emanuella Maximiano | Designer | Desenvolver o design da aplicação |
| Abner | Designer | Desenvolver o design da aplicação |
| Bruno de Castro | Pesquisa | Realizar as pesquisas e o levantamento dos locais |
| Vitor Gabriel | Testador | Testar a aplicação e apontar erros |
| João Pedro | Documentação | Documentar os avanços do projeto |

---

## 🔐 Controle de Acesso

| Perfil | O que pode fazer |
|---|---|
| **Visitante** | Ver a lista de locais, buscar, filtrar e ver os detalhes de cada local |
| **Usuário** | Tudo do visitante, mais confirmar presença, usar os recados do jogo, denunciar recados e editar a foto de perfil |
| **Administrador** | Acesso ao painel: gerenciar locais e fotos, ver estatísticas e moderar denúncias |

---

## 📷 Protótipos / Telas

- Aplicação: [playspot.free.je](https://playspot.free.je)
- Site técnico (mapa e especificações): [playspotweb.free.nf](https://playspotweb.free.nf)

---

## 📦 Como Executar o Projeto

### Online
Acesse [playspot.free.je](https://playspot.free.je) em qualquer navegador.

### Localmente (XAMPP ou similar)
1. Copie o conteúdo da pasta `htdocs` para a pasta `htdocs` do XAMPP.
2. No phpMyAdmin, crie um banco de dados e importe o arquivo `config/playspot.sql`.
3. Edite `config/db.php` com o servidor, o nome do banco, o usuário e a senha.
4. Inicie o Apache e o MySQL e acesse `http://localhost/` no navegador.

---

## 🚀 Próximos Passos

- Permitir que os usuários avaliem a condição dos espaços
- Ampliar a área atendida para outras regiões
- Versão em aplicativo para celular
