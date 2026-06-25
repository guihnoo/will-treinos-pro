export const metadata = {
  title: "Política de Privacidade — Will Treinos PRO",
  description: "Como coletamos, usamos e protegemos seus dados no Will Treinos PRO.",
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-[100dvh] bg-black text-zinc-200 px-4 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-400 mb-2">Política de Privacidade</h1>
      <p className="text-zinc-500 text-sm mb-8">Última atualização: junho de 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-white font-semibold mb-2">1. Dados que coletamos</h2>
          <p>Coletamos os dados que você fornece ao se cadastrar: nome, e-mail, telefone e foto de perfil. Também registramos sua atividade dentro do app (check-ins, avaliações, XP) para calcular seu progresso e gamificação.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">2. Como usamos seus dados</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Gerenciar sua conta e acesso ao app</li>
            <li>Calcular seu progresso técnico e XP</li>
            <li>Enviar notificações sobre aulas, avaliações e conquistas</li>
            <li>Gerar relatórios para seu treinador</li>
            <li>Melhorar a plataforma com base no uso agregado</li>
          </ul>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">3. Compartilhamento de dados</h2>
          <p>Seus dados <strong className="text-white">não são vendidos</strong> a terceiros. Seu treinador tem acesso às suas avaliações, presenças e progresso técnico como parte do serviço. Dados financeiros são visíveis apenas para você e para o administrador do sistema.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">4. Perfil público</h2>
          <p>Se você compartilhar seu link de perfil (<code className="text-amber-400">/atleta/seu-id</code>), qualquer pessoa com o link poderá ver seu nome (com inicial do sobrenome), tier, XP e radar de fundamentos. Nenhum dado de contato é exposto nessa página.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">5. Notificações push</h2>
          <p>As notificações são opcionais. Você pode ativá-las ou desativá-las a qualquer momento nas configurações do seu dispositivo ou dentro do app.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">6. Armazenamento e segurança</h2>
          <p>Seus dados são armazenados no Supabase (infraestrutura segura com criptografia em trânsito e em repouso). Utilizamos Row Level Security (RLS) para garantir que cada usuário acesse apenas seus próprios dados.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">7. Seus direitos (LGPD)</h2>
          <p>De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a: acessar seus dados, corrigir informações incorretas, solicitar a exclusão da sua conta e dos seus dados, e retirar seu consentimento a qualquer momento.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">8. Contato</h2>
          <p>Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato pelo e-mail do administrador do sistema ou diretamente com seu treinador.</p>
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
        <a href="/termos" className="text-amber-400 text-sm hover:underline mr-6">Termos de Uso</a>
        <a href="/dashboard" className="text-zinc-500 text-sm hover:underline">Voltar ao app</a>
      </div>
    </main>
  );
}
