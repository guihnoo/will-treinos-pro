const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://armrortldtqxmgvvcbko.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybXJvcnRsZHRxeG1ndnZjYmtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM5ODE0MywiZXhwIjoyMDkyOTc0MTQzfQ.70TdDAGqdm-6SF0H2Gr2_zZo1U6goHWv-HkmTav_roo"
);

(async () => {
  console.log("🔍 Procurando Cityvoleicampeonatos@gmail.com...\n");

  const { data: authUsers, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Erro:", error);
  } else {
    const cityUser = authUsers?.users?.find((u) =>
      u.email?.toLowerCase().includes("cityvolei")
    );

    if (cityUser) {
      console.log("✓ Encontrado!");
      console.log(`Email: ${cityUser.email}`);
      console.log(`user_metadata:`, cityUser.user_metadata);
    } else {
      console.log("❌ Usuário com 'cityvolei' não encontrado");
      console.log("\nTodos os usuários registrados:");
      authUsers?.users?.forEach((u) => {
        console.log(`- ${u.email}`);
      });
    }
  }

  process.exit(0);
})();
