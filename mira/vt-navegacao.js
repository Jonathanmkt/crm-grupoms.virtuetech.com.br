/* =====================================================================
   vt-navegacao.js — os três requisitos de navegação do CEO, num módulo só.

   TELA CHEIA (F) · RODA DO MOUSE COM TRAVA · PASSO A PASSO QUE OBEDECE AO CLIQUE

   Escrito em 21/08/2026 pelo `arquiteto-da-estrutura`, por decisão do CEO no
   dia em que o cargo `designer-de-apresentacoes` nasceu:

     · "opção de tela cheia e tbm opções de avançar e retroceder no scroll do
        mouse além das setas do teclado"
     · "com muita animação e efeitos, porém TUDO OBEDECENDO AOS CLIQUES"

   POR QUE ESTE ARQUIVO EXISTE, E NÃO UM PLUGIN DA MIRA
   Plugin do Mira é prompt, não código: o sistema de plugins RECUSA arquivo
   executável (`.js`, `.py`, `.bat`…), porque o plugin ativa sozinho no início
   da sessão e código de terceiro entrando sem barreira é risco que não se
   conserta depois. Então o código mora aqui, no git da empresa, e o plugin
   `virtuetech-navegacao` é só a instrução que manda copiá-lo para o deck.

   ONDE ELE VIVE NO DECK
   Em `mira/vt-navegacao.js`, ao lado dos módulos nativos, e declarado no fim
   do `index.html` junto com eles:

       <script defer src="mira/vt-navegacao.js"></script>

   ⚠️ CONVIVÊNCIA COM O QUE JÁ EXISTE
   O deck do Mira já traz a sua própria navegação por seta e a rolagem nativa
   do navegador. Este módulo **não substitui nem duplica as setas** — ele
   acrescenta o que falta e cede o teclado nos mesmos casos em que o módulo
   nativo cede: modo de edição (`me-on`), modo de desenho (`md-on`), campo de
   texto em foco e atalho com Ctrl/Alt/Meta. *Duplicar a seta faria cada toque
   pular dois slides — o tipo de defeito que só aparece na frente da plateia.*
   ===================================================================== */
(function () {
    'use strict';

    var secoes = Array.prototype.slice.call(document.querySelectorAll('body > section'));
    if (!secoes.length) return;

    /* ---------------------------------------------------------------- passos
       Um "passo" é o que aparece a cada clique DENTRO de um slide — o que o
       reveal.js chama de fragmento. É ele que cumpre o "tudo obedecendo aos
       cliques": o slide não entrega tudo de uma vez, e a animação não corre
       sozinha no relógio.

       O autor do slide marca com `class="passo"`. Nada mais é preciso: o
       módulo esconde todos ao entrar no slide e revela um por avanço.

       ⚠️ Recuar ESCONDE o último passo revelado, não volta de slide. Só depois
       que o slide está inteiro desmontado é que o recuo troca de seção — senão
       quem voltou um passo perderia o slide inteiro. */
    function passos(sec) {
        return Array.prototype.slice.call(sec.querySelectorAll('.passo'));
    }

    function prepararPassos(sec) {
        passos(sec).forEach(function (el, i) {
            // O primeiro estado é "escondido"; a classe `passo-visivel` é o que
            // o CSS do tema usa para animar a entrada.
            el.classList.toggle('passo-visivel', false);
            el.setAttribute('data-passo-indice', String(i));
        });
    }

    function visiveis(sec) {
        return passos(sec).filter(function (el) {
            return el.classList.contains('passo-visivel');
        }).length;
    }

    /* ---------------------------------------------------------------- seções */
    function atual() {
        var meio = window.innerHeight / 2, achado = 0;
        secoes.forEach(function (s, i) {
            var r = s.getBoundingClientRect();
            if (r.top <= meio && r.bottom > meio) achado = i;
        });
        return achado;
    }

    var emTransicao = false;

    function irPara(i) {
        i = Math.max(0, Math.min(secoes.length - 1, i));
        if (i === atual()) return false;
        emTransicao = true;
        prepararPassos(secoes[i]);
        secoes[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
        // A rolagem suave não avisa quando termina em navegador nenhum de forma
        // confiável. 650 ms é a trava: enquanto ela corre, roda e seta não
        // acumulam um segundo salto por cima do primeiro.
        window.setTimeout(function () { emTransicao = false; }, 650);
        return true;
    }

    /* ---------------------------------------------------------------- avanço */
    function avancar() {
        var sec = secoes[atual()];
        var lista = passos(sec);
        var jaVisiveis = visiveis(sec);
        if (jaVisiveis < lista.length) {
            lista[jaVisiveis].classList.add('passo-visivel');
            sec.dispatchEvent(new CustomEvent('vt:passo', {
                bubbles: true,
                detail: { indice: jaVisiveis, total: lista.length, elemento: lista[jaVisiveis] }
            }));
            return true;
        }
        return irPara(atual() + 1);
    }

    function recuar() {
        var sec = secoes[atual()];
        var lista = passos(sec);
        var jaVisiveis = visiveis(sec);
        if (jaVisiveis > 0) {
            lista[jaVisiveis - 1].classList.remove('passo-visivel');
            return true;
        }
        // Voltando para um slide anterior, ele volta INTEIRO — quem recua quer
        // rever o que já mostrou, não remontá-lo passo a passo.
        var alvo = atual() - 1;
        var ok = irPara(alvo);
        if (ok) {
            passos(secoes[Math.max(0, alvo)]).forEach(function (el) {
                el.classList.add('passo-visivel');
            });
        }
        return ok;
    }

    /* ------------------------------------------------------------- o guarda
       As mesmas condições em que o módulo nativo do Mira cede o teclado. Sem
       isto, arrastar um elemento no modo de edição trocaria de slide. */
    function ocupado(e) {
        if (document.body.classList.contains('me-on')) return true;
        if (document.body.classList.contains('md-on')) return true;
        if (e && (e.ctrlKey || e.metaKey || e.altKey)) return true;
        var t = document.activeElement;
        return !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '')));
    }

    /* --------------------------------------------------------- tela cheia (F)
       Fullscreen API do navegador: não depende de rede, então funciona igual
       num deck aberto por `file://`. */
    function telaCheia() {
        var d = document;
        if (d.fullscreenElement) {
            (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
        } else {
            var el = d.documentElement;
            (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
        }
    }

    document.addEventListener('keydown', function (e) {
        if (ocupado(e)) return;
        if (e.key === 'f' || e.key === 'F') { e.preventDefault(); telaCheia(); return; }
        // As setas continuam sendo do módulo nativo — aqui só o que ele não faz.
        if (e.key === 'Home') { e.preventDefault(); irPara(0); }
        else if (e.key === 'End') { e.preventDefault(); irPara(secoes.length - 1); }
    });

    /* ------------------------------------------------------ roda do mouse
       🔴 A ARMADILHA, E ELA É A RAZÃO DESTE BLOCO INTEIRO

       Nenhuma ferramenta do mercado resolve isto de fábrica — nem o reveal.js
       (a opção `mouseWheel` existe e vem desligada, sem debounce documentado),
       nem o impress.js, cuja issue de rajada na roda está aberta desde 2014.
       Levantado no dossiê `2026-08-21-stack-de-apresentacao-html-...` do
       `pesquisador-de-comunicacao`.

       O problema: um gesto de trackpad dispara DEZENAS de eventos de roda. Sem
       trava, um toque pula meia apresentação — e o sintoma aparece na frente
       da plateia, nunca no teste.

       A trava tem três partes, e as três são necessárias:
         1. LIMIAR   — só age depois de acumular deslocamento suficiente;
         2. DESCANSO — depois de agir, ignora tudo por um tempo;
         3. ZERAGEM  — se o gesto para, o acumulado morre, para que dois
                       gestinhos separados não somem um salto que ninguém pediu.

       Os números são conservadores de propósito: **pular um slide a menos é
       um toque a mais; pular um a mais é perder o fio na frente de quem
       assiste.** */
    var LIMIAR = 90;      // deslocamento acumulado antes de virar um avanço
    var DESCANSO = 700;   // ms de silêncio depois de cada avanço
    var ESQUECE = 220;    // ms sem evento e o acumulado zera

    var acumulado = 0, ultimoEvento = 0, ultimaAcao = 0;

    window.addEventListener('wheel', function (e) {
        if (ocupado(e)) return;

        var agora = Date.now();
        if (agora - ultimoEvento > ESQUECE) acumulado = 0;
        ultimoEvento = agora;

        // Tomamos conta da roda: sem isto o navegador rola a página por baixo e
        // o deck fica entre dois slides.
        e.preventDefault();

        if (emTransicao || agora - ultimaAcao < DESCANSO) return;

        acumulado += e.deltaY;
        if (Math.abs(acumulado) < LIMIAR) return;

        var frente = acumulado > 0;
        acumulado = 0;
        ultimaAcao = agora;
        if (frente) avancar(); else recuar();
    }, { passive: false });

    /* ------------------------------------------------------------- partida */
    function iniciar() {
        secoes.forEach(prepararPassos);
        // O slide em que a página abre começa montado: ninguém clicou ainda
        // para escondê-lo, e um deck que abre em branco parece quebrado.
        passos(secoes[atual()]).forEach(function (el) {
            el.classList.add('passo-visivel');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    /* Porta pública: é por aqui que uma animação sabe que o passo dela chegou,
       em vez de correr sozinha no relógio.

         document.addEventListener('vt:passo', function (e) {
             if (e.detail.elemento.id === 'grafico') desenhaGrafico();
         });
    */
    window.vtNavegacao = {
        avancar: avancar,
        recuar: recuar,
        irPara: irPara,
        telaCheia: telaCheia,
        atual: atual
    };
})();
