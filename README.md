# VOOSITA

Маркетплейс Узбекистана: **работа + специалисты + жильё**.

Вдохновлено возможностями **Profi.ru** (специалисты, отзывы, портфолио, верификация) и **Cian.ru** (фильтры жилья, избранное, детальные карточки).

## Стек
- Next.js 14 (App Router) + TypeScript
- Чистый CSS, Lucide icons, Inter
- 3 локали: uz-Latn / uz-Cyrl / ru + тёмная тема
- Supabase schema (profiles, listings, reviews, portfolio, favorites, bot_checks)

## Новые возможности

### Защита от ботов (первый визит)
- Клиентский fingerprint: webdriver, headless UA, canvas, plugins, cores, deviceMemory и др.
- Score ≥ 45 → soft challenge «Men odamman»
- Результат кэшируется в localStorage на 7 дней

### Профили (как Profi.ru)
- `/profile` — детальный профиль специалиста
- Рейтинг + количество отзывов
- Бейдж «Pasport tekshirildi»
- Вкладки: Haqida / Portfolio / Otzyvlar
- Форма оценки 1–5 ★ + текст отзыва
- Портфолио с результатами работ

### Специалисты `/services`
- Карточки с рейтингом, отзывами, верификацией, тегами
- Переход в полный профиль

### Жильё `/housing` (как Cian.ru)
- Фильтры: комнаты (1 / 2 / 3 / 3+), тип ремонта
- Параметры: площадь, этаж, мебель, техника, город
- Избранное (сердечко)
- Детальные карточки

### Авторизация
- Модалка вход / регистрация (заглушка под Supabase Auth)

## Запуск
```bash
cd voosita
npm install
npm run dev
```

## Структура
```
app/
  page.tsx          главная
  jobs/             вакансии
  services/         специалисты (Profi-style)
  housing/          жильё (Cian-style filters)
  profile/          профиль + отзывы + портфолио
components/
  bot-guard.tsx     проверка ботов
  auth-modal.tsx
  site-header.tsx
  home-page.tsx
  section-page.tsx
lib/
  i18n.ts
  bot-detect.ts
supabase/
  schema.sql        + portfolio, favorites, bot_checks, reviews
```

Исходные требования VOOSITA сохранены. Все новые панели и параметры адаптированы под Узбекистан и 3 языка.

## Серверная часть и оплата

### API
| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/payments/create` | Создать платёж → вернуть checkout URL |
| POST | `/api/webhooks/payment` | Webhook провайдера → **только здесь** активируется подписка |

### Страницы
- `/pricing` — тарифы (Basic / Pro / Business)
- `/pay/checkout` — mock-оплата (эмулирует Click/Payme)

### Правила безопасности (как в промпте)
1. Ключи только в `.env` / серверных переменных
2. Подписка **не** активируется на клиенте
3. Активация только после успешного webhook с проверкой подписи
4. В production — JWT/сессия + rate limit + CAPTCHA

### Подключение реального Click / Payme
1. Скопировать `.env.example` → `.env.local`
2. Вписать `CLICK_SECRET` / `PAYME_KEY`
3. В `lib/server/payments.ts` заменить mock-ветку на вызов API провайдера
4. Указать URL webhook в кабинете провайдера:  
   `https://your-domain.com/api/webhooks/payment`
