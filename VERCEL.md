# Деплой VOOSITA на Vercel

## Способ A — через сайт (без командной строки) ★ рекомендуется

### 1. Загрузить код на GitHub
1. Создайте аккаунт на https://github.com (если нет)
2. New repository → имя например `voosita` → Create
3. Загрузите папку проекта:
   - через сайт GitHub: **Add file → Upload files** (перетащите все файлы из `voosita/`)
   - или через Git на компьютере:

```bash
cd voosita
git init
git add .
git commit -m "VOOSITA initial"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/voosita.git
git push -u origin main
```

### 2. Подключить к Vercel
1. Откройте https://vercel.com → Sign up / Log in (удобно через GitHub)
2. **Add New… → Project**
3. Import репозиторий `voosita`
4. Framework Preset: **Next.js** (определится сам)
5. Root Directory: оставьте `.`
6. Environment Variables (пока можно пусто, или добавьте):
   - `NEXT_PUBLIC_APP_URL` = `https://ваш-проект.vercel.app` (после первого деплоя можно обновить)
7. **Deploy**

Через 1–2 минуты появится ссылка вида:
`https://voosita-xxx.vercel.app`

Её можно открывать с Android и с любого устройства.

### 3. После деплоя
- Главная, /jobs, /services, /housing, /profile, /pricing — работают
- /api/payments/create и webhook — работают (mock-оплата)
- При смене кода: `git push` → Vercel сам пересоберёт сайт

---

## Способ B — через Vercel CLI

```bash
cd voosita
npm install -g vercel
vercel login
vercel
```

Следуйте вопросам в терминале. В конце получите URL.

Для продакшена:
```bash
vercel --prod
```

---

## Домен (по желанию)
В проекте Vercel → Settings → Domains → добавить свой домен (например voosita.uz).

---

## Оплата в продакшене
1. Vercel → Project → Settings → Environment Variables
2. Добавить:
   - `CLICK_SECRET`
   - `PAYME_KEY`
   - `NEXT_PUBLIC_APP_URL` = ваш прод-URL
3. В кабинете Click/Payme указать webhook:
   `https://ваш-домен.vercel.app/api/webhooks/payment`
