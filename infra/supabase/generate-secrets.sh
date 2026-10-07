#!/bin/sh
# Fill JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY and POSTGRES_PASSWORD
# only when the value is empty or still change-me. Existing secrets stay.
set -eu

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
fi

b64url() {
  openssl base64 -A | tr '+/' '-_' | tr -d '\n='
}

sign_jwt() {
  secret=$1
  role=$2
  now=$(date +%s)
  exp=$((now + 315360000))
  header=$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | b64url)
  payload=$(printf '%s' "{\"role\":\"$role\",\"iss\":\"supabase\",\"iat\":$now,\"exp\":$exp}" | b64url)
  signature=$(printf '%s' "$header.$payload" | openssl dgst -sha256 -hmac "$secret" -binary | b64url)
  printf '%s' "$header.$payload.$signature"
}

set_kv() {
  key=$1
  value=$2
  grep -v "^${key}=" .env > .env.tmp || true
  printf '%s=%s\n' "$key" "$value" >> .env.tmp
  mv .env.tmp .env
}

current=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
if [ -z "$current" ] || [ "$current" = "change-me" ]; then
  set_kv POSTGRES_PASSWORD "$(openssl rand -hex 24)"
fi

jwt_secret=$(grep '^JWT_SECRET=' .env | cut -d= -f2-)
if [ -z "$jwt_secret" ] || [ "$jwt_secret" = "change-me" ]; then
  jwt_secret=$(openssl rand -hex 32)
  set_kv JWT_SECRET "$jwt_secret"
fi

anon_key=$(grep '^ANON_KEY=' .env | cut -d= -f2-)
if [ -z "$anon_key" ] || [ "$anon_key" = "change-me" ]; then
  set_kv ANON_KEY "$(sign_jwt "$jwt_secret" anon)"
fi

service_key=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2-)
if [ -z "$service_key" ] || [ "$service_key" = "change-me" ]; then
  set_kv SERVICE_ROLE_KEY "$(sign_jwt "$jwt_secret" service_role)"
fi

echo "Секреты записаны в infra/supabase/.env"
echo "Скопируйте ANON_KEY в SUPABASE_ANON_KEY и SERVICE_ROLE_KEY в SUPABASE_SERVICE_ROLE_KEY приложения."
echo "SUPABASE_JWT_SECRET приложения = JWT_SECRET из этого файла."
