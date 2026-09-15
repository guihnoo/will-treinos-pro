/**
 * Configura os 4 secrets do GitHub Actions CI (repo guihnoo/will-treinos-pro).
 * Auth: token do Git Credential Manager (GH_TOKEN / GITHUB_TOKEN).
 *
 * Uso:
 *   node scripts/set-github-ci-secrets.mjs
 *   CI_SECRET_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... node scripts/set-github-ci-secrets.mjs
 *   CI_SECRET_VAPID_PUBLIC_KEY=... node scripts/set-github-ci-secrets.mjs  # override VAPID
 *
 * A chave pública do Supabase (destino: secret NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * nome mantido por compatibilidade com o código atual) SEMPRE precisa ser uma
 * Publishable Key moderna (formato "sb_publishable_..."). Este script nunca
 * aceita nem procura a chave legacy no formato JWT ("eyJ...") — ver
 * assertPublishableKey() abaixo.
 */
import { execSync } from "child_process";
import https from "https";
import { fileURLToPath } from "url";

const REPO = "guihnoo/will-treinos-pro";
const PROD_BASE = "https://will-treinos-pro.vercel.app";

const PUBLISHABLE_KEY_PREFIX = "sb_publishable_";
// Estrutura documentada pelo Supabase: prefixo + 22 chars random + "_" +
// 8 chars de checksum, ambos os segmentos em [A-Za-z0-9_-]. Fonte única —
// o padrão "ancorado" (match da string inteira, usado para validar) e o
// padrão "de busca" (usado para procurar a chave dentro do texto de um
// bundle) derivam dos MESMOS PUBLISHABLE_KEY_PREFIX/PUBLISHABLE_KEY_BODY,
// para nunca divergir entre si.
const PUBLISHABLE_KEY_CHARSET = "[A-Za-z0-9_-]";
const PUBLISHABLE_KEY_RANDOM_LENGTH = 22;
const PUBLISHABLE_KEY_CHECKSUM_LENGTH = 8;
const PUBLISHABLE_KEY_BODY =
  `${PUBLISHABLE_KEY_CHARSET}{${PUBLISHABLE_KEY_RANDOM_LENGTH}}` +
  `_${PUBLISHABLE_KEY_CHARSET}{${PUBLISHABLE_KEY_CHECKSUM_LENGTH}}`;
const PUBLISHABLE_KEY_PATTERN = new RegExp(`^${PUBLISHABLE_KEY_PREFIX}${PUBLISHABLE_KEY_BODY}$`);
export const PUBLISHABLE_KEY_SEARCH_PATTERN = new RegExp(`${PUBLISHABLE_KEY_PREFIX}${PUBLISHABLE_KEY_BODY}`);

const LEGACY_JWT_PREFIX = "eyJ";

export function isLegacyJwtFormat(value) {
  return typeof value === "string" && value.startsWith(LEGACY_JWT_PREFIX);
}

/**
 * Match ANCORADO da string inteira contra a estrutura exata documentada pelo
 * Supabase: prefixo "sb_publishable_" + 22 caracteres random + "_" + 8
 * caracteres de checksum. Rejeita prefixo sem payload, segmento random com
 * tamanho diferente de 22, checksum com tamanho diferente de 8, separador
 * "_" ausente entre os segmentos, e caracteres fora de [A-Za-z0-9_-]. Não
 * faz trim: espaços antes/depois (ou embutidos) fazem a validação falhar,
 * em vez de serem silenciosamente ignorados — política deliberada de
 * rejeitar whitespace em vez de normalizá-lo.
 */
export function isPublishableKeyFormat(value) {
  return typeof value === "string" && PUBLISHABLE_KEY_PATTERN.test(value);
}

/**
 * Valida que `value` é uma Supabase Publishable Key moderna. Nunca imprime o
 * valor — só o nome da origem (env var, bundle de produção etc.) aparece na
 * mensagem de erro.
 */
export function assertPublishableKey(value, source) {
  if (!value) {
    throw new Error(
      `Não foi possível resolver a Supabase Publishable Key (origem: ${source}). Valor ausente ou vazio.`,
    );
  }
  if (isLegacyJwtFormat(value)) {
    throw new Error(
      `Valor resolvido para a Supabase Publishable Key (origem: ${source}) parece ser uma chave ` +
        `legacy no formato JWT ("eyJ..."). Este script não aceita mais chaves legacy. ` +
        `Configure uma Publishable Key moderna ("${PUBLISHABLE_KEY_PREFIX}...") via ` +
        `CI_SECRET_SUPABASE_PUBLISHABLE_KEY, ou garanta que a produção já publica a chave moderna.`,
    );
  }
  if (!isPublishableKeyFormat(value)) {
    throw new Error(
      `Valor resolvido para a Supabase Publishable Key (origem: ${source}) não está na estrutura ` +
        `documentada pelo Supabase ("${PUBLISHABLE_KEY_PREFIX}" + ${PUBLISHABLE_KEY_RANDOM_LENGTH} ` +
        `caracteres + "_" + ${PUBLISHABLE_KEY_CHECKSUM_LENGTH} caracteres de checksum). ` +
        `Abortando para não configurar um secret incorreto.`,
    );
  }
}

function ghTokenFromGitCredential() {
  const input = "protocol=https\nhost=github.com\n\n";
  const out = execSync("git credential fill", { input, encoding: "utf8" });
  const password = out
    .split("\n")
    .find((line) => line.startsWith("password="))
    ?.slice("password=".length)
    .trim();
  if (!password) throw new Error("Git credential manager did not return a GitHub token");
  return password;
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function collectScriptUrls(pages) {
  const scripts = new Set();
  for (const page of pages) {
    try {
      const html = await httpsGet(`${PROD_BASE}${page}`);
      for (const m of html.matchAll(/\/_next\/static\/[^"']+\.js/g)) {
        scripts.add(m[0]);
      }
    } catch {
      /* ignore */
    }
  }
  return scripts;
}

async function findInProductionBundles(re) {
  const scripts = await collectScriptUrls([
    "/login",
    "/signup",
    "/student",
    "/dashboard",
    "/will/status",
    "/",
  ]);
  for (const s of scripts) {
    const js = await httpsGet(`${PROD_BASE}${s}`);
    const m = js.match(re);
    if (m) return m[0] ?? m[1];
  }
  return null;
}

/**
 * Resolve a Supabase Publishable Key moderna, nesta ordem:
 *   1. CI_SECRET_SUPABASE_PUBLISHABLE_KEY (override preferencial)
 *   2. CI_SECRET_SUPABASE_ANON_KEY (nome legado da env de override, mantido
 *      por compatibilidade temporária — mas o VALOR ainda precisa ser uma
 *      Publishable Key moderna, nunca a anon JWT legacy)
 *   3. Auto-descoberta no bundle de produção, procurando SOMENTE o formato
 *      moderno ("sb_publishable_..."). Sem fallback para o header JWT
 *      legacy ("eyJhbGci...") em nenhuma hipótese.
 * Em qualquer caminho, o valor resolvido passa por assertPublishableKey()
 * antes de ser usado — uma chave legacy nunca chega a ser configurada.
 */
async function resolveAnonKey() {
  if (process.env.CI_SECRET_SUPABASE_PUBLISHABLE_KEY) {
    const value = process.env.CI_SECRET_SUPABASE_PUBLISHABLE_KEY;
    assertPublishableKey(value, "CI_SECRET_SUPABASE_PUBLISHABLE_KEY");
    return value;
  }

  if (process.env.CI_SECRET_SUPABASE_ANON_KEY) {
    const value = process.env.CI_SECRET_SUPABASE_ANON_KEY;
    assertPublishableKey(
      value,
      "CI_SECRET_SUPABASE_ANON_KEY (nome legado da env de override; valor precisa ser moderno)",
    );
    return value;
  }

  const fromProd = await findInProductionBundles(PUBLISHABLE_KEY_SEARCH_PATTERN);
  assertPublishableKey(fromProd, "bundle de produção");
  return fromProd;
}

async function resolveVapidPublicKey() {
  if (process.env.CI_SECRET_VAPID_PUBLIC_KEY) {
    return process.env.CI_SECRET_VAPID_PUBLIC_KEY;
  }
  const fromProd = await findInProductionBundles(
    /((?:BC|BE)[0-9A-Za-z_-]{78,120})/,
  );
  if (fromProd && fromProd.length >= 80) return fromProd;

  const out = execSync("npx --yes web-push generate-vapid-keys", { encoding: "utf8" });
  const match = out.match(/Public Key:\s*\n([A-Za-z0-9_-]+)/);
  if (!match) throw new Error("web-push did not return a public key");
  console.warn(
    "WARN: VAPID de produção indisponível — usando chave gerada para CI. Alinhe com Vercel → NEXT_PUBLIC_VAPID_PUBLIC_KEY se quiser paridade com prod.",
  );
  return match[1];
}

function setSecret(name, value, ghToken) {
  execSync(`gh secret set ${name} --repo ${REPO}`, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    env: { ...process.env, GH_TOKEN: ghToken, GITHUB_TOKEN: ghToken },
  });
  console.log(`OK ${name} (${value.length} chars)`);
}

async function main() {
  const ghToken = ghTokenFromGitCredential();

  const secrets = {
    NEXT_PUBLIC_SUPABASE_URL: "https://armrortldtqxmgvvcbko.supabase.co",
    // Nome do secret mantido por compatibilidade com o código atual — o
    // VALOR resolvido aqui é sempre uma Publishable Key moderna (validado em
    // resolveAnonKey()/assertPublishableKey()), nunca a legacy anon JWT.
    NEXT_PUBLIC_SUPABASE_ANON_KEY: await resolveAnonKey(),
    NEXT_PUBLIC_DEV_ROOT_EMAILS: "guihmonteiro.2014@gmail.com,cityvoleicampeonatos@gmail.com",
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: await resolveVapidPublicKey(),
  };

  for (const [name, value] of Object.entries(secrets)) {
    setSecret(name, value, ghToken);
  }

  console.log(
    execSync(`gh secret list --repo ${REPO}`, {
      encoding: "utf8",
      env: { ...process.env, GH_TOKEN: ghToken, GITHUB_TOKEN: ghToken },
    }),
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await main();
}
