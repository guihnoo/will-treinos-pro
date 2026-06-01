export const metadata = {
  title: "Termos de Uso — Will Treinos PRO",
  description: "Termos e condições de uso da plataforma Will Treinos PRO.",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-200 px-4 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-400 mb-2">Termos de Uso</h1>
      <p className="text-zinc-500 text-sm mb-8">Última atualização: junho de 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-white font-semibold mb-2">1. Sobre a plataforma</h2>
          <p>O Will Treinos PRO é uma plataforma de gestão esportiva voltada para treinamentos de vôlei de alta performance. Ao utilizar o app, você concorda com estes termos.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">2. Acesso e cadastro</h2>
          <p>O acesso é exclusivo por convite do treinador responsável. Você é responsável por manter suas credenciais em segurança e por toda atividade realizada na sua conta.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">3. Uso aceitável</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Utilize o app apenas para fins relacionados ao seu treinamento</li>
            <li>Não compartilhe seu acesso com terceiros</li>
            <li>Não tente manipular o sistema de XP ou gamificação</li>
            <li>Respeite os outros membros nas funcionalidades sociais (feed, comentários)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">4. Conteúdo do usuário</h2>
          <p>Ao publicar conteúdo no feed (posts, comentários, fotos), você garante que tem direito sobre esse conteúdo e concede ao Will Treinos PRO licença para exibi-lo dentro da plataforma. O administrador pode remover conteúdo inadequado sem aviso prévio.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">5. Gamificação e XP</h2>
          <p>O sistema de XP, tiers e conquistas é um recurso motivacional. O Will Treinos PRO se reserva o direito de ajustar fórmulas, multiplicadores e thresholds a qualquer momento para manter o equilíbrio do sistema.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">6. Pagamentos</h2>
          <p>Os valores de mensalidade são definidos pelo administrador do sistema e registrados na plataforma apenas para controle interno. O Will Treinos PRO não processa pagamentos diretamente — transações são realizadas por acordo entre aluno e treinador.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">7. Disponibilidade</h2>
          <p>O serviço é oferecido "como está". Podemos realizar manutenções, atualizações ou suspender temporariamente o acesso sem aviso prévio. Não nos responsabilizamos por perdas decorrentes de indisponibilidade.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">8. Encerramento de conta</h2>
          <p>O treinador pode suspender ou remover sua conta a qualquer momento. Você pode solicitar a exclusão dos seus dados seguindo o processo descrito na Política de Privacidade.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">9. Alterações nos termos</h2>
          <p>Podemos atualizar estes termos periodicamente. Continuando a usar o app após mudanças publicadas, você aceita os novos termos.</p>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-2">10. Lei aplicável</h2>
          <p>Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca do administrador do sistema para dirimir eventuais conflitos.</p>
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
        <a href="/privacidade" className="text-amber-400 text-sm hover:underline mr-6">Política de Privacidade</a>
        <a href="/dashboard" className="text-zinc-500 text-sm hover:underline">Voltar ao app</a>
      </div>
    </main>
  );
}
