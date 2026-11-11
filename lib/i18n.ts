/**
 * UI texts for the three supported locales.
 * Keys are used across pages and components. Add new keys to all three
 * dictionaries, or TypeScript will fail the build.
 */

export type Locale = "uz-Latn" | "uz-Cyrl" | "ru";

export type Copy = {
  about: string;
  aboutText: string;
  all: string;
  apply: string;
  backHome: string;
  banner: string;
  cards: [string, string][];
  comingSoon: string;
  contact: string;
  daysAgo: string;
  details: string;
  email: string;
  hasAccount: string;
  headline: string;
  homes: string[];
  housingSubtitle: string;
  housingTitle: string;
  jobsSubtitle: string;
  jobsTitle: string;
  language: string;
  listings: string;
  login: string;
  messages: string;
  name: string;
  noAccount: string;
  password: string;
  perMonth: string;
  phone: string;
  photoNote: string;
  popular: string;
  pricing: string;
  profile: string;
  register: string;
  rooms: string;
  search: string;
  services: string[];
  servicesSubtitle: string;
  servicesTitle: string;
  settings: string;
  submitLogin: string;
  submitRegister: string;
  subtitle: string;
  theme: string;
  vacancies: string;
  vacancyNames: string[];
};

const uzLatn: Copy = {
  about: "Biz haqimizda",
  aboutText:
    "VOOSITA WORK — O‘zbekiston uchun yagona platforma: ish, xizmat va uy-joy e’lonlari. Barcha asosiy imkoniyatlar bepul.",
  all: "Barchasi",
  apply: "Ariza yuborish",
  backHome: "Bosh sahifa",
  banner: "VOOSITA WORK — barcha e’lonlar bepul",
  cards: [
    ["Ish", "Vakansiyalar va ish qidiruvchilar"],
    ["Xizmatlar", "Ustalar va mutaxassislar"],
    ["Uy-joy", "Ijara va sotuv e’lonlari"],
    ["Ijara", "Kvartiralar va xonalar"],
  ],
  comingSoon: "Tez orada",
  contact: "Bog‘lanish",
  daysAgo: "kun oldin",
  details: "Batafsil",
  email: "Email",
  hasAccount: "Akkauntingiz bormi? Kirish",
  headline: "O‘zbekiston uchun yagona platforma",
  homes: ["2 xonali kvartira, Chilonzor", "3 xonali kvartira, Yakkasaroy"],
  housingSubtitle: "Ijara va sotuv uchun uy-joy e’lonlari",
  housingTitle: "Uy-joy",
  jobsSubtitle: "Ochiq vakansiyalar",
  jobsTitle: "Ish",
  language: "Til",
  listings: "Uy-joy e’lonlari",
  login: "Kirish",
  messages: "Xabarlar",
  name: "Ismingiz",
  noAccount: "Akkaunt yo‘qmi? Ro‘yxatdan o‘tish",
  password: "Parol",
  perMonth: "oyiga",
  phone: "Telefon",
  photoNote: "Fotolar namuna uchun",
  popular: "Mashhur xizmatlar",
  pricing: "Tariflar",
  profile: "Profil",
  register: "Ro‘yxatdan o‘tish",
  rooms: "xona",
  search: "Ish, xizmat yoki uy-joy qidirish",
  services: ["Ustalar", "Dasturchilar", "Repetitorlar", "Transport"],
  servicesSubtitle: "Tekshirilgan ustalar va mutaxassislar",
  servicesTitle: "Xizmatlar",
  settings: "Sozlamalar",
  submitLogin: "Kirish",
  submitRegister: "Ro‘yxatdan o‘tish",
  subtitle: "Ish topish, xizmat tanlash va uy-joy ijaraga olish — bepul",
  theme: "Qorong‘u tema",
  vacancies: "Vakansiyalar",
  vacancyNames: [
    "Frontend dasturchi",
    "Marketing menejeri",
    "Sotuv bo‘yicha mutaxassis",
  ],
};

const uzCyrl: Copy = {
  about: "Биз ҳақимизда",
  aboutText:
    "VOOSITA WORK — Ўзбекистон учун ягона платформа: иш, хизмат ва уй-жой эълонлари. Барча асосий имкониятлар бепул.",
  all: "Барчаси",
  apply: "Ариза юбориш",
  backHome: "Бош саҳифа",
  banner: "VOOSITA WORK — барча эълонлар бепул",
  cards: [
    ["Иш", "Вакансиялар ва иш қидирувчилар"],
    ["Хизматлар", "Усталар ва мутахассислар"],
    ["Уй-жой", "Ижара ва сотув эълонлари"],
    ["Ижара", "Квартиралар ва хоналар"],
  ],
  comingSoon: "Тез орада",
  contact: "Боғланиш",
  daysAgo: "кун олдин",
  details: "Батафсил",
  email: "Email",
  hasAccount: "Аккаунтингиз борми? Кириш",
  headline: "Ўзбекистон учун ягона платформа",
  homes: ["2 хонали квартира, Чилонзор", "3 хонали квартира, Яккасарой"],
  housingSubtitle: "Ижара ва сотув учун уй-жой эълонлари",
  housingTitle: "Уй-жой",
  jobsSubtitle: "Очиқ вакансиялар",
  jobsTitle: "Иш",
  language: "Тил",
  listings: "Уй-жой эълонлари",
  login: "Кириш",
  messages: "Хабарлар",
  name: "Исмингиз",
  noAccount: "Аккаунт йўқми? Рўйхатдан ўтиш",
  password: "Парол",
  perMonth: "ойига",
  phone: "Телефон",
  photoNote: "Суратлар намуна учун",
  popular: "Машҳур хизматлар",
  pricing: "Тарифлар",
  profile: "Профил",
  register: "Рўйхатдан ўтиш",
  rooms: "хона",
  search: "Иш, хизмат ёки уй-жой қидириш",
  services: ["Усталар", "Дастурчилар", "Репетиторлар", "Транспорт"],
  servicesSubtitle: "Текширилган усталар ва мутахассислар",
  servicesTitle: "Хизматлар",
  settings: "Созламалар",
  submitLogin: "Кириш",
  submitRegister: "Рўйхатдан ўтиш",
  subtitle: "Иш топиш, хизмат танлаш ва уй-жой ижарага олиш — бепул",
  theme: "Қоронғи мавзу",
  vacancies: "Вакансиялар",
  vacancyNames: [
    "Frontend дастурчи",
    "Маркетинг менежери",
    "Савдо бўйича мутахассис",
  ],
};

const ru: Copy = {
  about: "О проекте",
  aboutText:
    "VOOSITA WORK — единая платформа для Узбекистана: поиск работы, специалистов и жилья. Все основные возможности бесплатны.",
  all: "Все",
  apply: "Откликнуться",
  backHome: "На главную",
  banner: "VOOSITA WORK — все объявления бесплатно",
  cards: [
    ["Работа", "Вакансии и соискатели"],
    ["Услуги", "Мастера и специалисты"],
    ["Жильё", "Объявления о продаже"],
    ["Аренда", "Квартиры и комнаты"],
  ],
  comingSoon: "Скоро",
  contact: "Связаться",
  daysAgo: "дн. назад",
  details: "Подробнее",
  email: "Email",
  hasAccount: "Уже есть аккаунт? Войти",
  headline: "Единая платформа для Узбекистана",
  homes: ["2-комн. квартира, Чиланзар", "3-комн. квартира, Яккасарайский р-н"],
  housingSubtitle: "Объявления об аренде и продаже жилья",
  housingTitle: "Жильё",
  jobsSubtitle: "Открытые вакансии",
  jobsTitle: "Работа",
  language: "Язык",
  listings: "Объявления о жилье",
  login: "Войти",
  messages: "Сообщения",
  name: "Ваше имя",
  noAccount: "Нет аккаунта? Регистрация",
  password: "Пароль",
  perMonth: "в месяц",
  phone: "Телефон",
  photoNote: "Фото приведены для примера",
  popular: "Популярные услуги",
  pricing: "Тарифы",
  profile: "Профиль",
  register: "Регистрация",
  rooms: "комн.",
  search: "Поиск работы, услуг или жилья",
  services: ["Мастера", "Программисты", "Репетиторы", "Транспорт"],
  servicesSubtitle: "Проверенные мастера и специалисты",
  servicesTitle: "Услуги",
  settings: "Настройки",
  submitLogin: "Войти",
  submitRegister: "Зарегистрироваться",
  subtitle: "Поиск работы, услуг и жилья в одном месте — бесплатно",
  theme: "Тёмная тема",
  vacancies: "Вакансии",
  vacancyNames: [
    "Frontend-разработчик",
    "Менеджер по маркетингу",
    "Специалист по продажам",
  ],
};

export const copy: Record<Locale, Copy> = {
  "uz-Latn": uzLatn,
  "uz-Cyrl": uzCyrl,
  ru,
};
