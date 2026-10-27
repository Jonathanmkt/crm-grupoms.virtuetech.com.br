# crm-grupoms.virtuetech.com.br

Apresentação da proposta do CRM ao Grupo MS, publicada em
`https://crm-grupoms.virtuetech.com.br` pelo GitHub Pages (repositório
`Jonathanmkt/crm-grupoms.virtuetech.com.br`, branch `main`, raiz). DNS na Cloudflare: `CNAME`
`crm-grupoms` → `jonathanmkt.github.io`, sem proxy — o mesmo padrão de `mdf.virtuetech.com.br`.

**Esta pasta é só a cópia publicada.** A fonte que continua sendo editada é
`C:\Projetos\APPS\crm-aulas-esportivas\apresentacao\`. Não edite aqui: atualize lá e recopie.

## O que mudou em relação à fonte

Só o `<head>` do `index.html` (= `APRESENTACAO.html`):

- `<meta name="robots">` e `<meta name="googlebot">` com `noindex,nofollow,noarchive` — a peça tem
  preço da proposta e não deve ser indexada;
- `<link rel="icon" href="data:,">` — evita o `404` do `favicon.ico`.

Mais `robots.txt` (`Disallow: /`), `CNAME` e `.nojekyll`. **Não entram aqui:** `servidor-dev.py`,
`descartes/`, `NOTAS.md`, `BRIEFING.md`, `README.md` da fonte.

## Como atualizar

```bash
SRC=/c/Projetos/APPS/crm-aulas-esportivas/apresentacao
DST=/c/Projetos/SITES/crm-grupoms.virtuetech.com.br
cp -p "$SRC/sistema.css" "$SRC/cenas.js" "$DST/"
cp -p "$SRC"/mira/vt-navegacao.* "$DST/mira/"
cp -p "$SRC/vendor/gsap.min.js" "$DST/vendor/"
# index.html: recopie APRESENTACAO.html e reinsira, logo depois do <meta name="viewport">, as 3 linhas
# descritas acima (robots, googlebot, icon).
```

Depois: commit (Engenheiro de Documentação) e `git push` (CEO). O Pages republica sozinho em
cerca de 1 minuto.

## Limite conhecido

O GitHub Pages não deixa definir cabeçalho HTTP, então **não há `X-Robots-Tag`**. A proteção
contra indexação é o `<meta robots>` + `robots.txt`. O repositório é público: o conteúdo pode ser
lido no GitHub por quem souber o nome.
