Ative a Persona Guardião de Segurança.

Faça uma varredura nos arquivos modificados recentemente (use @Git para ver os últimos commits alterados).

Verifique obrigatoriamente os 5 pontos críticos:
1. Alguma chave secreta exposta com prefixo NEXT_PUBLIC_? (vazamento de credenciais)
2. Alguma tabela nova no Supabase sem RLS habilitado? (brecha de dados)
3. Algum input de usuário sendo interpolado diretamente em query SQL? (SQL injection)
4. Algum cookie de sessão sem HttpOnly ou SameSite? (XSS/CSRF)
5. Algum upload de arquivo sem validação de tipo MIME e tamanho? (upload malicioso)

Retorne um relatório com:
- ✅ Pontos seguros confirmados
- 🚨 Vulnerabilidades encontradas com severidade e correção recomendada
- 📊 Score de segurança geral (0-100)
