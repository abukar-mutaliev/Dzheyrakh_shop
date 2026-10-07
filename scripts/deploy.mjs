import { createHmac, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const infra = path.join(root, "infra", "supabase");
const supabaseEnvPath = path.join(infra, ".env");
const examplePath = path.join(infra, ".env.example");

function run(command, args, options = {}) {
  const inherit = options.inherit === true;
  return spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: inherit ? "utf8" : "utf8",
    input: options.input,
    stdio: inherit ? "inherit" : "pipe",
    windowsHide: true,
  });
}

function output(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function gitUpdate() {
  const inside = run("git", ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0) {
    console.log("Git: это не репозиторий, обновление пропущено.");
    return;
  }

  const remotes = run("git", ["remote"]);
  if (!(remotes.stdout ?? "").trim()) {
    console.log("Git: удалённого репозитория нет, pull пропущен.");
    return;
  }

  const fetch = run("git", ["fetch", "--prune"]);
  if (fetch.status !== 0) {
    console.log("Git: fetch не удался, остаются текущие файлы.");
    const details = output(fetch);
    if (details) console.log(details);
    return;
  }

  const upstream = run("git", [
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "@{upstream}",
  ]);
  if (upstream.status !== 0) {
    console.log("Git: у ветки нет upstream, pull пропущен.");
    return;
  }

  const behind = run("git", ["rev-list", "--count", "HEAD..@{upstream}"]);
  const count = Number((behind.stdout ?? "0").trim());
  if (!Number.isFinite(count) || count === 0) {
    console.log("Git: новых коммитов нет.");
    return;
  }

  const dirty = run("git", ["status", "--porcelain"]);
  if ((dirty.stdout ?? "").trim()) {
    console.log(
      `Git: на origin ${count} новых коммитов, но есть локальные изменения. pull не делаю.`,
    );
    process.exitCode = 1;
    return;
  }

  const pull = run("git", ["pull", "--ff-only"], { inherit: true });
  if (pull.status !== 0) {
    console.log("Git: fast-forward не получился.");
    process.exitCode = 1;
    return;
  }
  console.log(`Git: подтянуто коммитов: ${count}.`);
}

function parseEnv(text) {
  const values = new Map();
  for (const line of text.split(/\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) values.set(match[1], match[2].trim());
  }
  return values;
}

function isPlaceholder(value) {
  if (value == null) return true;
  const normalized = value.trim();
  return normalized === "" || normalized === "change-me";
}

function upsert(text, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(text)) return text.replace(pattern, `${key}=${value}`);
  const suffix = text.endsWith("\n") || text.length === 0 ? "" : "\n";
  return `${text}${suffix}${key}=${value}\n`;
}

function b64url(text) {
  return Buffer.from(text).toString("base64url");
}

function signJwt(secret, role) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url('{"alg":"HS256","typ":"JWT"}');
  const payload = b64url(
    `{"role":"${role}","iss":"supabase","iat":${now},"exp":${now + 315360000}}`,
  );
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function ensureKeys() {
  if (!fs.existsSync(examplePath)) {
    throw new Error("Нет infra/supabase/.env.example");
  }
  if (!fs.existsSync(supabaseEnvPath)) {
    fs.copyFileSync(examplePath, supabaseEnvPath);
    console.log("Создан infra/supabase/.env из примера.");
  }

  let text = fs.readFileSync(supabaseEnvPath, "utf8").replace(/\r\n/g, "\n");
  const values = parseEnv(text);
  const created = [];

  if (isPlaceholder(values.get("POSTGRES_PASSWORD"))) {
    const password = randomBytes(24).toString("hex");
    text = upsert(text, "POSTGRES_PASSWORD", password);
    values.set("POSTGRES_PASSWORD", password);
    created.push("POSTGRES_PASSWORD");
  }

  if (isPlaceholder(values.get("JWT_SECRET"))) {
    const secret = randomBytes(32).toString("hex");
    text = upsert(text, "JWT_SECRET", secret);
    values.set("JWT_SECRET", secret);
    created.push("JWT_SECRET");
  }

  const secret = values.get("JWT_SECRET");
  if (isPlaceholder(values.get("ANON_KEY"))) {
    text = upsert(text, "ANON_KEY", signJwt(secret, "anon"));
    created.push("ANON_KEY");
  }
  if (isPlaceholder(values.get("SERVICE_ROLE_KEY"))) {
    text = upsert(text, "SERVICE_ROLE_KEY", signJwt(secret, "service_role"));
    created.push("SERVICE_ROLE_KEY");
  }

  fs.writeFileSync(supabaseEnvPath, text);
  if (created.length === 0) {
    console.log("Ключи: уже заданы, ничего не меняю.");
  } else {
    console.log(`Ключи: созданы ${created.join(", ")}.`);
  }
  return parseEnv(text);
}

function domainReady(value) {
  return Boolean(value) && !value.includes("example.ru") && !value.includes("example.com");
}

function syncAppEnv(supabaseEnv) {
  const apiDomain = supabaseEnv.get("API_DOMAIN") ?? "";
  const shopDomain = supabaseEnv.get("SHOP_DOMAIN") ?? "";
  if (!domainReady(apiDomain) || !domainReady(shopDomain)) {
    console.log("Приложение: домены ещё примеры, .env.local не трогаю.");
    return;
  }

  const localPath = path.join(root, ".env.local");
  const example = path.join(root, ".env.local.example");
  let text = fs.existsSync(localPath)
    ? fs.readFileSync(localPath, "utf8")
    : fs.readFileSync(example, "utf8");
  text = text.replace(/\r\n/g, "\n");
  const current = parseEnv(text);
  const siteUrl = supabaseEnv.get("SITE_URL") || `https://${shopDomain}`;
  const updates = [
    ["SUPABASE_URL", `https://${apiDomain}`],
    ["SUPABASE_ANON_KEY", supabaseEnv.get("ANON_KEY") ?? ""],
    ["SUPABASE_SERVICE_ROLE_KEY", supabaseEnv.get("SERVICE_ROLE_KEY") ?? ""],
    ["AUTH_SITE_URL", siteUrl],
  ];

  const filled = [];
  for (const [key, value] of updates) {
    const currentValue = current.get(key);
    const missing = isPlaceholder(currentValue);
    const sampleHost = String(currentValue ?? "").includes("example.");
    if (!value || (!missing && !sampleHost)) continue;
    text = upsert(text, key, value);
    filled.push(key);
  }

  if (!fs.existsSync(localPath) || filled.length > 0) {
    fs.writeFileSync(localPath, text.endsWith("\n") ? text : `${text}\n`);
  }
  if (filled.length === 0) {
    console.log("Приложение: ключи в .env.local уже заданы.");
  } else {
    console.log(`Приложение: в .env.local записаны ${filled.join(", ")}.`);
  }
}

function migrationFiles() {
  const files = [];
  const shopSql = path.join(infra, "volumes", "db", "shop.sql");
  if (fs.existsSync(shopSql)) files.push({ name: "shop.sql", full: shopSql });

  const directory = path.join(infra, "migrations");
  if (!fs.existsSync(directory)) return files;
  for (const name of fs.readdirSync(directory).filter((item) => item.endsWith(".sql")).sort()) {
    files.push({ name, full: path.join(directory, name) });
  }
  return files;
}

function compose(args, options = {}) {
  return run("docker", ["compose", ...args], { cwd: infra, ...options });
}

function waitForDatabase() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const inspect = run("docker", ["inspect", "-f", "{{.State.Health.Status}}", "shop-db"]);
    const status = (inspect.stdout ?? "").trim();
    if (status === "healthy") return true;
    if (status === "unhealthy") return false;
    sleep(2000);
  }
  return false;
}

function psqlFile(sql) {
  return compose(
    ["exec", "-T", "db", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
    { input: sql },
  );
}

function psqlValue(sql) {
  return compose(
    [
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tA",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ],
  );
}

function quoteLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function applyMigrations(domainsReady) {
  const info = run("docker", ["info"]);
  if (info.status !== 0) {
    console.log("Миграции: Docker не запущен, база не обновлялась.");
    process.exitCode = 1;
    return;
  }

  const services = domainsReady ? ["up", "-d"] : ["up", "-d", "db"];
  if (!domainsReady) {
    console.log("Домены ещё примеры: поднимаю только базу, Caddy не стартую.");
  }
  const up = compose(services, { inherit: true });
  if (up.status !== 0) {
    console.log("Миграции: docker compose up не удался.");
    process.exitCode = 1;
    return;
  }
  if (!waitForDatabase()) {
    console.log("Миграции: shop-db не стала healthy.");
    process.exitCode = 1;
    return;
  }

  const bootstrap = psqlFile(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);
  if (bootstrap.status !== 0) {
    console.log(output(bootstrap) || "Не удалось создать schema_migrations.");
    process.exitCode = 1;
    return;
  }

  const applied = psqlValue("select filename from public.schema_migrations");
  if (applied.status !== 0) {
    console.log(output(applied) || "Не удалось прочитать schema_migrations.");
    process.exitCode = 1;
    return;
  }
  const done = new Set(
    (applied.stdout ?? "")
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );

  const pending = migrationFiles().filter((file) => !done.has(file.name));
  if (pending.length === 0) {
    console.log("Миграции: новых файлов нет.");
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(file.full, "utf8");
    const result = psqlFile(sql);
    if (result.status !== 0) {
      console.log(`Миграция ${file.name} не применилась.`);
      console.log(output(result));
      process.exitCode = 1;
      return;
    }
    const mark = psqlValue(
      `insert into public.schema_migrations (filename) values (${quoteLiteral(file.name)})`,
    );
    if (mark.status !== 0) {
      console.log(output(mark) || `Не удалось записать ${file.name} в schema_migrations.`);
      process.exitCode = 1;
      return;
    }
    console.log(`Миграция применена: ${file.name}`);
  }
}

function restartApp() {
  const enabled = run("systemctl", ["is-enabled", "shop"]);
  if (enabled.error) {
    console.log("Сборка: systemd нет, npm run build не запускаю.");
    return;
  }
  if ((enabled.stdout ?? "").trim() !== "enabled") {
    console.log("Сборка: юнит shop не включён, npm run build не запускаю.");
    return;
  }

  console.log("Собираю приложение и перезапускаю shop.");
  const install = run("npm", ["ci"], { inherit: true });
  if (install.status !== 0) {
    process.exitCode = 1;
    return;
  }
  const build = run("npm", ["run", "build"], { inherit: true });
  if (build.status !== 0) {
    process.exitCode = 1;
    return;
  }
  const restart = run("sudo", ["-n", "systemctl", "restart", "shop"]);
  if (restart.status !== 0) {
    console.log("Перезапуск не выполнен. Команда: sudo systemctl restart shop");
    process.exitCode = 1;
    return;
  }
  console.log("Сервис shop перезапущен.");
}

gitUpdate();
const supabaseEnv = ensureKeys();
syncAppEnv(supabaseEnv);
applyMigrations(domainReady(supabaseEnv.get("API_DOMAIN")) && domainReady(supabaseEnv.get("SHOP_DOMAIN")));
if (process.exitCode) process.exit(process.exitCode);
restartApp();
