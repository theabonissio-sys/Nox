# NOX

Rastreador pessoal de sono, progresso e conquistas. Os dados ficam só no aparelho (IndexedDB).

## Colocar no celular (Android)
O app precisa estar em um endereço `https://` para poder ser instalado. Abrir o `index.html` direto do arquivo não instala.

1. Publique o conteúdo desta pasta em uma hospedagem de arquivos estáticos (por exemplo GitHub Pages ou Netlify).
   - GitHub Pages: crie um repositório, envie todos os arquivos (mantendo as pastas), abra Settings > Pages, escolha o branch `main` e a pasta `/ (root)`.
2. Abra o endereço no Chrome do celular.
3. Menu (três pontos) > "Instalar app" ou "Adicionar à tela inicial".
4. Depois do primeiro carregamento, funciona sem internet.

A hospedagem só entrega os arquivos do app. Seus registros não são enviados para ela.

## Atualizar
Ao mudar qualquer arquivo, troque `nox-v1` em `sw.js` (para `nox-v2` etc.) e publique de novo.

## Estrutura
- `js/logic.js`: regras (XP, níveis, missões, medalhas, estatísticas, backup)
- `js/db.js`: armazenamento local
- `js/app.js`: telas e interações
- `js/share.js`: imagem de conquista
- `css/styles.css`: visual
