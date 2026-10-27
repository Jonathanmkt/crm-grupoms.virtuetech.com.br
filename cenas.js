/* =====================================================================
   cenas.js — o movimento do deck da proposta CRM · MS GA

   Mesmo desenho do deck da Trilha da Felicidade (trabalhos/2026-08-...):
   o módulo `vt-navegacao.js` decide QUANDO o passo acende e emite `vt:passo`;
   este arquivo decide COMO ele aparece, com GSAP. Nada roda no relógio — a
   única exceção é o clarão da capa, que fica minutos no ar.

   Vocabulário declarativo: o autor da lâmina marca a INTENÇÃO no HTML.
     data-anim    sobe | esquerda | direita | escala | surge | parado
     data-cascata filhos entram em escada
     data-lista   os <li> entram em escada, depois do cartão
     data-depois  seletor de um filho que entra DEPOIS do cartão (problema → solução)
     data-barras  as barras crescem de baixo para cima
     data-traca   o traço do SVG se desenha
   ===================================================================== */
(function () {
  'use strict';

  var suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* 200–500 ms é a faixa de animação de interface que não parece lenta nem passa
     despercebida (a mesma régua auditada no deck da Trilha). */
  gsap.defaults({ ease: 'power3.out', duration: suave ? 0.4 : 0.01 });

  /* ---- escala do quadro: enquadramento, não animação ---- */
  function escala() {
    var l = innerWidth || 1920, a = innerHeight || 1080;
    document.documentElement.style.setProperty('--e', Math.min(l / 1920, a / 1080) || 1);
  }
  addEventListener('resize', escala);
  if (window.ResizeObserver) new ResizeObserver(escala).observe(document.documentElement);
  escala();

  var GESTOS = {
    sobe:     { y: 34, opacity: 0 },
    esquerda: { x: -44, opacity: 0 },
    direita:  { x: 44, opacity: 0 },
    escala:   { scale: 0.95, opacity: 0, transformOrigin: 'center top' },
    surge:    { opacity: 0 },
    parado:   {}
  };

  /* o desenho do traço: dash do tamanho do caminho, que se recolhe */
  /* 🔴 O LAÇO DO TRACEJADO (padrão `editor-de-video/padroes/LACO-INFINITO.md`):
     depois que o traço se desenha, os tracinhos ESCORREM no sentido do fluxo —
     o movimento mostra o SENTIDO que a seta parada só sugere.
     ⚠️ A conta que fecha o laço: o offset anda EXATAMENTE a soma do
     `stroke-dasharray` por ciclo (aqui 14+14 = 28), senão o tracejado
     "escorrega" no reinício. A soma sai do CSS, não é escrita aqui — troque o
     tracejado no CSS e o laço continua emendando.
     Amplitude baixa (opacidade .8, 20 px/s): é para ser sentido, não visto. */
  function escorre(c) {
    var soma = (getComputedStyle(c).strokeDasharray || '').split(/[ ,]+/)
      .reduce(function (a, v) { return a + (parseFloat(v) || 0); }, 0);
    if (!soma) return;
    c.style.opacity = '0.8';
    gsap.to(c, { strokeDashoffset: -soma, duration: soma / VELOCIDADE, ease: 'none', repeat: -1 });
  }

  /* Conector verde em laço. Padrão de 14 + 14 px (a mesma conta do tracejado de
     volta); o fundo anda EXATAMENTE 28 px por ciclo, então emenda sem solavanco.
     ⚠️ Nasce da mesma constante: troque PASSO e os dois lados continuam certos. */
  var PASSO = 28, VELOCIDADE = 20;
  function fluem(i) {
    if (i.__flui) return; i.__flui = true;
    var cor = getComputedStyle(i).backgroundColor;
    i.style.backgroundColor = 'transparent';
    i.style.backgroundImage = 'repeating-linear-gradient(90deg,' + cor + ' 0,' + cor + ' ' + (PASSO / 2) + 'px,transparent ' + (PASSO / 2) + 'px,transparent ' + PASSO + 'px)';
    i.style.backgroundSize = PASSO + 'px 100%';
    i.style.opacity = '0.8';
    gsap.fromTo(i, { backgroundPositionX: '0px' }, { backgroundPositionX: PASSO + 'px',
      duration: PASSO / VELOCIDADE, ease: 'none', repeat: -1 });
  }

  function traca(svg) {
    /* só os caminhos do diagrama: o bloco pode trazer outros SVGs (as curvas da melhoria) */
    var raiz = svg.tagName.toLowerCase() === 'svg' ? svg : svg.querySelector('svg');
    var p = raiz.querySelectorAll('path');
    p.forEach(function (c, i) {
      var len = c.getTotalLength();
      if (i === 0) {
        /* o caminho principal é tracejado no CSS; aqui ele é revelado por máscara
           de dash: um traço único do comprimento todo, que anda */
        gsap.fromTo(c, { strokeDasharray: len + ' ' + len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: suave ? 1.3 : 0.01, ease: 'power2.inOut',
            onComplete: function () {
              c.style.strokeDasharray = ''; c.style.strokeDashoffset = '';
              if (suave) escorre(c);
            } });
      } else {
        gsap.from(c, { opacity: 0, duration: suave ? 0.3 : 0.01, delay: suave ? 1.1 : 0 });
      }
    });
  }

  /* A rolagem do chat: o rolo sobe até a última mensagem VISÍVEL ficar rente ao
     fundo da janela. Mensagem escondida (`.rev` sem `.rev-on`) ocupa lugar mas
     fica fora do cálculo — por isso a conta olha a última que já apareceu. */
  function ajustaRolo(rolo, ate, animar) {
    var corpo = rolo.parentNode;
    var filhos = [].slice.call(rolo.children).filter(function (n) {
      return !n.classList.contains('rev') || n.classList.contains('rev-on');
    });
    var alvo = ate || filhos[filhos.length - 1];
    if (!alvo) return;
    var sobra = alvo.offsetTop + alvo.offsetHeight + 20 - corpo.clientHeight;
    gsap.to(rolo, { y: -Math.max(0, sobra), duration: (animar && suave) ? 0.45 : 0.01, ease: 'power2.out',
      overwrite: 'auto' });
  }



  /* o número que entra contando: de ZERO até o valor, uma vez, e para.
     data-conta (valor), data-prefixo, data-sufixo, data-casas (decimais),
     data-atraso (s), data-duracao (s). O texto já nasce com o valor final: se a
     animação não rodar (aba oculta, impressão), a tela mostra o número certo. */
  function conta(el) {
    var alvo = parseFloat(el.dataset.conta);
    if (isNaN(alvo)) return;
    var prefixo = el.dataset.prefixo || '', sufixo = el.dataset.sufixo || '';
    var casas = parseInt(el.dataset.casas, 10) || 0;
    var atraso = parseFloat(el.dataset.atraso) || 0;
    var dur = parseFloat(el.dataset.duracao) || 0.9;
    var cursor = { v: 0 };
    el.textContent = prefixo + (0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + sufixo;
    gsap.to(cursor, {
      v: alvo, duration: suave ? dur : 0.01, delay: suave ? atraso : 0, ease: 'power2.out',
      onUpdate: function () {
        el.textContent = prefixo + cursor.v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + sufixo;
      },
      onComplete: function () {
        el.textContent = prefixo + alvo.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + sufixo;
      }
    });
  }

  /* ================= as ações de um passo (lâmina de TELA e de etapa) =================
     data-revela="#a,#b"   acende elementos `.rev` (entram de baixo, ou de lado com data-de-x)
     data-esconde="#a"     apaga elementos `.rev-on`
     data-classe="#x:+on,#y:-on"  liga/desliga classes (o estado da tela)
     data-legenda="..."    troca a frase da legenda da lâmina */
  function muda(sec, lista, desfaz) {
    lista.split(',').forEach(function (it) {
      var p = it.trim().split(':'); if (p.length < 2) return;
      var alvo = sec.querySelector(p[0]); if (!alvo) return;
      var add = p[1].charAt(0) !== '-'; var nome = p[1].replace(/^[+-]/, '');
      if (desfaz) add = !add;
      alvo.classList.toggle(nome, add);
    });
  }

  function aplicaAcoes(el) {
    var sec = el.closest('section');
    if (el.dataset.revela) {
      var rv = sec.querySelectorAll(el.dataset.revela);
      var ritmo = parseFloat(el.dataset.revelaRitmo) || 0.4;
      rv.forEach(function (n, k) {
        n.classList.add('rev-on');
        var dx = parseFloat(n.dataset.deX) || 0;
        gsap.from(n, { x: dx, y: dx ? 0 : 20, opacity: 0, delay: suave ? 0.15 + k * ritmo : 0,
          duration: dx ? (suave ? 0.5 : 0.01) : undefined, clearProps: 'transform,opacity' });
        var rolo = n.closest('.wa-rolo');
        if (rolo) gsap.delayedCall(suave ? 0.15 + k * ritmo : 0, function () { ajustaRolo(rolo, n, true); });
        [].slice.call(n.querySelectorAll('.draw')).forEach(function (p, q) {
          var len = p.getTotalLength();
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: suave ? 1.4 : 0.01, delay: suave ? 0.3 + q * 0.25 : 0, ease: 'power2.inOut',
            onComplete: function () { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; } });
        });
        [].concat(n.hasAttribute('data-conta') ? [n] : [], [].slice.call(n.querySelectorAll('[data-conta]'))).forEach(conta);
      });
    }
    if (el.dataset.esconde) {
      sec.querySelectorAll(el.dataset.esconde).forEach(function (n) {
        gsap.to(n, { opacity: 0, duration: suave ? 0.25 : 0.01, onComplete: function () {
          n.classList.remove('rev-on'); gsap.set(n, { clearProps: 'opacity' }); } });
      });
    }
    if (el.dataset.classe) muda(sec, el.dataset.classe, false);
    if (el.dataset.legenda) {
      var lg = sec.querySelector('.tela-leg');
      if (lg) gsap.to(lg, { opacity: 0, duration: 0.12, onComplete: function () {
        lg.textContent = el.dataset.legenda; gsap.to(lg, { opacity: 1, duration: 0.25 }); } });
    }
  }

  /* ================= o mouse simulado =================
     `data-cursor="#alvo"` (ou "#a;#b" para arrastar, com data-arrasta="#cartao").
     Não é clicável: ilustra. O ponto de clique sai do retângulo REAL do alvo, medido na
     hora, dividido pela escala do quadro (--e): o quadro é escalado por CSS, e medir sem
     dividir erraria o clique em toda tela que não for 1920 px. */
  function rodaCursor(el) {
    var sec = el.closest('section'), app = sec.querySelector('.app');
    if (!app) { aplicaAcoes(el); return; }
    var cur = app.querySelector('.cur');
    var e = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--e')) || 1;
    function ponto(sel) {
      var t = app.querySelector(sel.trim()); if (!t) return null;
      var r = t.getBoundingClientRect(), a = app.getBoundingClientRect();
      return { x: (r.left - a.left) / e + (r.width / e) * 0.45, y: (r.top - a.top) / e + (r.height / e) * 0.55 };
    }
    var alvos = el.dataset.cursor.split(';').map(ponto).filter(Boolean);
    if (!alvos.length || !suave) { aplicaAcoes(el); return; }
    if (!cur.__vivo) { gsap.set(cur, { x: app.clientWidth - 200, y: app.clientHeight - 90, opacity: 1 }); cur.__vivo = true; }
    var card = el.dataset.arrasta ? app.querySelector(el.dataset.arrasta) : null;
    var tl = gsap.timeline({ delay: 0.1 });
    var ant = { x: gsap.getProperty(cur, 'x'), y: gsap.getProperty(cur, 'y') };
    alvos.forEach(function (p, i) {
      var dur = i === 0 ? 1.0 : 0.9;
      var pos = i === 0 ? undefined : '>+0.15';
      tl.to(cur, { x: p.x, y: p.y, duration: dur, ease: 'power2.inOut' }, pos);
      if (card && i > 0) tl.to(card, { x: p.x - alvos[0].x, y: p.y - alvos[0].y, duration: dur, ease: 'power2.inOut' }, '<');
      if (card && i === 0) tl.add(function () { card.classList.add('pegado'); }, '>+0.05');
    });
    var fim = alvos[alvos.length - 1];
    tl.to(cur, { scale: 0.8, duration: 0.1 }, '>+0.1');
    tl.add(function () {
      var r = document.createElement('div'); r.className = 'rip';
      r.style.left = fim.x + 'px'; r.style.top = fim.y + 'px'; app.appendChild(r);
      gsap.fromTo(r, { scale: 0.2, opacity: 0.9 }, { scale: 1.7, opacity: 0, duration: 0.6, ease: 'power2.out',
        onComplete: function () { r.remove(); } });
      if (card) { card.classList.remove('pegado'); gsap.set(card, { clearProps: 'transform' }); }
      aplicaAcoes(el);
    });
    tl.to(cur, { scale: 1, duration: 0.14 });
  }

  function anima(el) {
    var gesto = GESTOS[el.dataset.anim] || GESTOS.sobe;
    var alvos = el.hasAttribute('data-cascata') ? el.children : el;
    gsap.from(alvos, Object.assign({}, gesto, {
      stagger: el.hasAttribute('data-cascata') ? 0.12 : 0,
      clearProps: 'transform,opacity,clipPath'
    }));

    /* problema → solução: o filho marcado entra depois, para a plateia ouvir o
       problema antes de ver a resposta */
    if (el.dataset.depois) {
      gsap.from(el.querySelectorAll(el.dataset.depois), {
        opacity: 0, y: 14, duration: suave ? 0.6 : 0.01,
        delay: suave ? (parseFloat(el.dataset.depoisAtraso) || 0.9) : 0, clearProps: 'all'
      });
    }
    if (el.hasAttribute('data-lista')) {
      gsap.from(el.querySelectorAll('li'), {
        opacity: 0, x: -18, stagger: suave ? 0.12 : 0, delay: suave ? 0.25 : 0, clearProps: 'all'
      });
    }
    /* o conector que chega ao cartão se desenha junto com ele */
    var lig = el.querySelector('.lig i, .lig2 i');
    if (lig) gsap.from(lig, { scaleX: 0, duration: suave ? 0.45 : 0.01, delay: suave ? 0.12 : 0, clearProps: 'all' });

    if (el.hasAttribute('data-barras')) {
      gsap.from(el.children, { scaleY: 0, transformOrigin: 'bottom center',
        stagger: suave ? 0.08 : 0, duration: suave ? 0.6 : 0.01, ease: 'power3.out', clearProps: 'all' });
    }
    el.querySelectorAll('[data-conta]').forEach(function (n) {
      var dono = n.closest('.passo');
      if (dono && dono !== el && !dono.classList.contains('passo-visivel')) return;
      conta(n);
    });
    if (el.hasAttribute('data-conta')) conta(el);
    /* passo com mouse simulado: o cursor anda até o alvo, clica, e SÓ ENTÃO a tela muda */
    if (el.hasAttribute('data-cursor')) rodaCursor(el); else aplicaAcoes(el);
    var fill = el.querySelector('.tl-fill');
    if (fill) gsap.from(fill, { scaleX: 0, duration: suave ? 1.4 : 0.01, delay: suave ? 0.3 : 0, ease: 'power2.inOut', clearProps: 'all' });
    if (el.hasAttribute('data-traca')) {
      traca(el);
      /* os conectores verdes entram no laço junto com o tracejado de volta:
         quando o traço termina de se desenhar (1,3 s), eles passam de barra
         cheia a tracejado que corre para a frente, na MESMA velocidade. */
      if (suave) gsap.delayedCall(1.3, function () {
        el.closest('section').querySelectorAll('.lig2 i').forEach(fluem);
      });
    }
  }

  document.addEventListener('vt:passo', function (e) { anima(e.detail.elemento); });

  /* ---- rolagem entre lâminas: tween, não smooth nativo (ver deck da Trilha) ---- */
  var secoes = [].slice.call(document.querySelectorAll('body > section'));
  var deslize = null;
  secoes.forEach(function (sec) {
    sec.scrollIntoView = function () {
      /* ⚠️ Quem rola é o `scrollingElement` (o <html>), não o <body>: o overflow
         do body sobe para a janela quando o html não declara o dele. Escrever
         `body.scrollTop` não move nada e não dá erro. */
      var alvo = document.scrollingElement || document.documentElement;
      if (document.hidden) { alvo.scrollTop = sec.offsetTop; return; }
      var cursor = { v: alvo.scrollTop };
      if (deslize) deslize.kill();
      deslize = gsap.to(cursor, {
        v: sec.offsetTop, duration: suave ? 0.62 : 0.01, ease: 'power2.inOut',
        onUpdate: function () { alvo.scrollTop = cursor.v; }
      });
    };
  });

  /* ---- a abertura da lâmina: entra com o que a apresenta (`data-abre`), o
     resto espera o clique. Os passos abertos recebem `passo-visivel`, a mesma
     classe que o módulo usa para contar — senão o 1º clique pareceria morto. */
  var atual = secoes[0];
  function abertura(sec) {
    var lista = [].slice.call(sec.querySelectorAll('.passo'));
    var quantos = Math.min(parseInt(sec.dataset.abre, 10) || 1, lista.length);
    var ja = lista.filter(function (el) { return el.classList.contains('passo-visivel'); }).length;
    if (ja >= quantos) return;
    var tl = gsap.timeline({ delay: suave ? 0.15 : 0 });
    lista.slice(ja, quantos).forEach(function (el, i) {
      tl.add(function () { el.classList.add('passo-visivel'); anima(el); }, i * (suave ? 0.3 : 0));
    });
  }
  var olho = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting || en.target === atual) return;
      atual = en.target;
      gsap.from(atual.querySelector('.quadro'), { opacity: 0, duration: 0.5, ease: 'power2.out' });
      abertura(atual);
    });
  }, { threshold: 0.6 });
  secoes.forEach(function (s) { olho.observe(s); });

  /* ---- a primeira lâmina também espera o clique (`data-clique`) ----
     O módulo revela de saída todos os passos da lâmina em que o deck abre (é
     feito para a capa). Aqui, depois dele, recolhemos o que passa de `data-abre`. */
  addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      var s = secoes[0];
      if (!s || !s.hasAttribute('data-clique')) return;
      var n = parseInt(s.dataset.abre, 10) || 1;
      [].slice.call(s.querySelectorAll('.passo')).forEach(function (el, i) {
        if (i >= n) el.classList.remove('passo-visivel');
      });
    }, 0);
  });

  /* recuar desfaz o que o passo tinha feito (revela, esconde e classe) */
  var viu = new MutationObserver(function (lista) {
    lista.forEach(function (m) {
      var p = m.target;
      if (!p.dataset || p.classList.contains('passo-visivel')) return;
      var sec = p.closest('section');
      if (p.dataset.revela) sec.querySelectorAll(p.dataset.revela).forEach(function (n) {
        n.classList.remove('rev-on');
        var rolo = n.closest('.wa-rolo'); if (rolo) ajustaRolo(rolo, null, true);
      });
      if (p.dataset.esconde) sec.querySelectorAll(p.dataset.esconde).forEach(function (n) { n.classList.add('rev-on'); });
      if (p.dataset.classe) muda(sec, p.dataset.classe, true);
    });
  });
  [].forEach.call(document.querySelectorAll('[data-revela],[data-esconde],[data-classe]'), function (p) {
    viu.observe(p, { attributes: true, attributeFilter: ['class'] });
  });
  window.vtDeck = { aplicaAcoes: aplicaAcoes };

  /* ---- a respiração da capa: a única coisa que roda sozinha ---- */
  if (suave) {
    gsap.to('.capa .clarao', { x: -70, y: 52, scale: 1.075, duration: 12, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }

  /* ---- seta e clique avançam; o resto (roda, F) é do módulo ---- */
  var FRENTE = ['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'];
  var TRAS   = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
  addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (FRENTE.indexOf(e.key) >= 0) { e.preventDefault(); vtNavegacao.avancar(); }
    else if (TRAS.indexOf(e.key) >= 0) { e.preventDefault(); vtNavegacao.recuar(); }
  });
  addEventListener('click', function (e) {
    if (e.target.closest('#cheia')) return;
    vtNavegacao.avancar();
  });
  document.getElementById('cheia').addEventListener('click', function () { vtNavegacao.telaCheia(); });
  addEventListener('fullscreenchange', function () {
    document.body.classList.toggle('cheia', !!document.fullscreenElement);
  });
  var sono;
  addEventListener('mousemove', function () {
    document.body.classList.remove('quieto');
    document.body.classList.add('mexeu');
    clearTimeout(sono);
    sono = setTimeout(function () {
      document.body.classList.add('quieto');
      document.body.classList.remove('mexeu');
    }, 2600);
  });
})();
