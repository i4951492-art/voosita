# Деплой VOOSITA на Cloudflare Pages

## Важно

Cloudflare Pages отлично хостит **статику**.  
API-роуты Next.js (`/api/payments`, `/api/webhooks`) на чистом Pages **не работают** — для них нужен Cloudflare Workers или другой бэкенд.

| Что работает на Pages (static) | Что нужно отдельно |
|-------------------------------|--------------------|
| Главная, jobs, services, housing, profile, pricing UI | `/api/payments/create` |
| Языки, тёмная тема, бот-проверка | `/api/webhooks/payment` |
| Клиентская логика | Реальная оплата Click/Payme |

Для полного сайта с оплатой удобнее **Vercel**.  
Для публичного демо интерфейса — Cloudflare Pages отлично.

---

## Способ 1: Static export → Cloudflare Pages

### 1. Включить static export

В `next.config.mjs`:

```js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

### 2. Собрать

```bash
cd voosita
npm install
npm run build
```

Появится папка `out/`.

### 3. Загрузить на Cloudflare Pages

**Вариант A — через сайт Cloudflare**
1. https://dash.cloudflare.com → Pages → Create project
2. Upload assets → загрузите содержимое папки `out/`
3. Deploy

**Вариант B — через GitHub (удобнее)**
1. Создайте репозиторий, залейте код `voosita`
2. Cloudflare Pages → Connect to Git → выберите репо
3. Build settings:
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npx next build`
   - Build output directory: `out`
4. В Environment variables (если нужны): ничего обязательного для static
5. Save and Deploy

Сайт будет доступен по адресу вида:
`https://voosita-xxxx.pages.dev`

---

## Способ 2: Полный Next.js (с API) — лучше Vercel

```bash
# Установите Vercel CLI
npm i -g vercel
cd voosita
vercel
```

Или через GitHub + vercel.com — API-роуты и webhook заработают сразу.

---

## Способ 3: Cloudflare Pages + Workers (для оплаты)

1. UI деплоите на Pages (static)
2. API (`/api/payments`, `/api/webhooks`) переносите в Cloudflare Workers
3. Настройте Custom Domain / Route

Это сложнее, имеет смысл когда уже есть продакшен-оплата.

---

## Быстрый чеклист для демо на Cloudflare

1. `output: 'export'` в next.config.mjs  
2. `npm run build`  
3. Загрузить `out/` в Pages  
4. Открыть `*.pages.dev` с Android  

Готово.
