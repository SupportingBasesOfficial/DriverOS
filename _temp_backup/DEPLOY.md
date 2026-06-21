# DriverOS - Guia de Deploy

## Requisitos para gerar o APK

1. **Node.js 18+** instalado
2. **Conta Expo** (free): https://expo.dev/signup
3. **Credenciais Supabase** no `.env` do mobile

---

## Passo 1: Verificar o .env do mobile

```powershell
cd apps/mobile
cat .env
```

Deve conter:
```
EXPO_PUBLIC_SUPABASE_URL=https://wobazrdzckzaoununlje.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

Se nao existir, copie do `.env.example` e preencha a `ANON_KEY`.

---

## Passo 2: Instalar EAS CLI e fazer login

```powershell
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Fazer login (use a conta supportingbasesofficial)
eas login
```

---

## Passo 3: Criar projeto no EAS (primeira vez)

```powershell
cd apps/mobile
eas init
```

Isso vai criar o projeto na nuvem da Expo e atualizar o `projectId` no `app.json`.

---

## Passo 4: Gerar o APK

```powershell
# Via script automatizado (da raiz do repo)
cd ../..
pnpm build:apk

# Ou diretamente
cd apps/mobile
eas build --profile preview --platform android
```

O build roda na nuvem da Expo (gratis, ate 30 builds/mes).

---

## Passo 5: Baixar o APK

Voce recebera um email quando o build terminar.
Ou acompanhe em: https://expo.dev/accounts/supportingbasesofficial/projects/driveros

---

## Build de desenvolvimento (mais rapido para testar)

```powershell
cd apps/mobile
eas build --profile development --platform android
```

Gera um `.apk` com o Expo Dev Client (permite reloads rapidos).

---

## Alternativa: Expo Go (sem build)

Se quiser testar sem gerar APK:

```powershell
cd apps/mobile
npx expo start
```

Baixe o app **Expo Go** no celular e escaneie o QR code.

---

## Solucao de Problemas

| Problema | Solucao |
|---|---|
| `projectId` invalido | Rode `eas init` no `apps/mobile` |
| `SUPABASE_URL` nao encontrado | Verifique o `.env` do mobile |
| Build falha no EAS | Verifique os logs em https://expo.dev |
| Nao consigo logar no EAS | Verifique email/senha em https://expo.dev |
