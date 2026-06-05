/**
 * Configura os 4 secrets do GitHub Actions CI (repo guihnoo/will-treinos-pro).
 * Auth: token do Git Credential Manager (GH_TOKEN / GITHUB_TOKEN).
 *
 * Uso:
 *   node scripts/set-github-ci-secrets.mjs
 *   CI_SECRET_VAPID_PUBLIC_KEY=... node scripts/set-github-ci-secrets.mjs  # override VAPID
 */
import { execSync } from "child_process";
import https from "https";

const REPO = "guihnoo/will-treinos-pro";
const PROD_BASE = "https://will-treinos-pro.vercel.app";

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

async function resolveAnonKey() {
  if (process.env.CI_SECRET_SUPABASE_ANON_KEY) {
    return process.env.CI_SECRET_SUPABASE_ANON_KEY;
  }
  const anon =
    (await findInProductionBundles(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    )) ?? null;
  if (!anon) throw new Error("Could not resolve NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return anon;
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

const ghToken = ghTokenFromGitCredential();

const secrets = {
  NEXT_PUBLIC_SUPABASE_URL: "https://armrortldtqxmgvvcbko.supabase.co",
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
