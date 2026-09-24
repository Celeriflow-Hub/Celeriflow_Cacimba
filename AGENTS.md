<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🛑 Regras de Segurança do Projeto (OBRIGATÓRIO)

## 1. PROIBIDO: Scripts de Find-and-Replace em massa
- **NUNCA** rode scripts que alteram múltiplos arquivos de uma vez com regex/replace genérico.
- Se o mesmo padrão aparece em vários arquivos, **cada arquivo deve ser analisado individualmente** para entender como é usado.
- Uma função pode ter o mesmo padrão de código mas ser consumida de formas completamente diferentes.

## 2. OBRIGATÓRIO: Verificar consumidores antes de alterar assinaturas
- Antes de mudar o retorno ou parâmetros de qualquer função exportada (`export async function`, `export function`), **SEMPRE** verifique TODOS os arquivos que importam/chamam essa função.
- Use `grep` para encontrar todos os `import` e usos antes de modificar.
- Se a função retorna `{ error: string }` e um componente client faz `result?.error`, você **NÃO PODE** trocar para `throw`.

## 3. OBRIGATÓRIO: Rodar build antes de commitar
- Sempre rode `npm run build` e confirme que passa **ANTES** de fazer commit/push.
- Se o build falhar, corrija antes de enviar ao GitHub.

## 4. Padrões de Server Actions neste projeto
- **Actions usadas em `<form action={...}>`**: Devem retornar `void` ou `Promise<void>`. Usar `throw new Error()` para erros.
- **Actions chamadas via `await` em client components**: Devem retornar `{ error: string }` para que o componente trate o erro na UI. **NÃO** trocar para `throw`.
- **Sempre verifique** como a action é usada antes de decidir o padrão de erro.
