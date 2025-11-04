# Аудит проекта Lumон2 (Ноябрь 2025)

## Резюме статуса
- Frontend: готовый MVP/Release Candidate. React 18 + TypeScript, Tailwind, маршруты с lazy-loading, ErrorBoundary, ModernSplashScreen, интеграция Telegram, голосовой ассистент, чат UI, 7 модалок. Сборка присутствует в `dist/`.
- Backend-инфраструктура: готова. Docker Compose (n8n + Supabase + Studio), миграции в `base/supabase`, n8n workflows в `back/n8n/workflows/*`.
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) — сборка, rsync фронта/бэка на сервер, настройка Nginx, запуск Docker Compose.
- Документация: подробная. Корневой `README.md` + гайды в `back/*.md` (setup, фиксы, тестирование, todo).

## Сильные стороны
- Vite-конфиг: разделение `vendor`, `drop: ['console','debugger']` для продакшена, ручные чанки.
- TS strict, аккуратный `tsconfig.json` (включены `src` и `front`).
- Tailwind: грамотное покрытие путей `src/**` и `front/**`, тёмная тема через класс.
- Telegram: строгая проверка `initData`, fallback `TelegramOnlyPage`, применение темы Telegram к CSS-переменным, BackButton, safe-area.
- API: `VITE_API_URL` с прод-относительными путями `/webhook/*`, retries/timeout, единые заголовки.
- CI/CD: деплой фронта и бэка, создание сайтов Nginx (frontend + n8n), CORS для домена фронта, автозапуск Compose.

## Обнаруженные несоответствия/риски
1) Порт dev-сервера
- В `vite.config.ts` — `server.port = 3000`.
- В `README.md` — указан `http://localhost:5173`.
- Рекомендация: синхронизировать (документацию обновить под 3000 или вернуть 5173 в конфиг).

2) Неверная ссылка в документации
- В `README.md` упомянут файл `back/SETUP_LOCAL.md` — отсутствует.
- Рекомендация: заменить на `back/README.md`.

3) Прод-прокси до n8n по IP
- В Nginx-конфиге фронта (в CI) `proxy_pass http://91.229.10.47:5678;` для `/webhook/`.
- Рекомендация: использовать поддомен `https://n8n.psayha.ru` как upstream/локальный upstream-блок, чтобы убрать прямой IP.

4) Безопасность/наблюдаемость
- Базовые заголовки есть (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection). Нет CSP/Report-To.
- Healthcheck есть, но нет наблюдаемости/алёртинга.
- Рекомендация: мягкий CSP (report-only), простая проверка сервисов, минимальный мониторинг.

5) Качество кода/тесты
- Нет ESLint/Prettier и тестов (unit/e2e), нет Storybook.
- Рекомендация: добавить ESLint/Prettier (минимальные правила и скрипты), затем unit-тесты ключевых UI/хуков и Storybook для чат/модалок.

6) Логи в продакшене
- Много `console.log`/`console.warn` в Telegram-хуках и `App.tsx` (часть вырезается билдером, но не всё в DEV).
- Рекомендация: оставить только важные предупреждения/ошибки или обернуть DEV-гейтами.

## Текущее положение работ
- Стадия: функционально готовый MVP/Release Candidate. Можно демонстрировать и эксплуатировать в проде.
- Блокеров для запуска нет. Рекомендуется синхронизировать доки (порт, ссылки) и улучшить Nginx-прокси.

## Предложенные следующие шаги (без усложнений)
- Документация: поправить порт dev-сервера и ссылку на setup (см. выше).
- Прокси: заменить IP на поддомен в конфиге фронта (Nginx для `/webhook/`).
- Инструменты качества: добавить ESLint/Prettier и npm-скрипты `lint`, `format`.
- Тесты/UI: начать с unit-тестов для критичных компонентов и Storybook для UI чат/модалок.
- Безопасность: мягкий CSP (report-only), затем по результатам — ужесточение.

## Справочные файлы
- CI/CD: `.github/workflows/deploy.yml`
- Vite: `vite.config.ts`
- Tailwind: `tailwind.config.js`
- TS: `tsconfig.json`
- Telegram: `src/hooks/useTelegram.ts`, `src/App.tsx`
- API-конфиг: `src/config/api.ts`, `src/utils/api.ts`
- Backend: `back/README.md`, `back/docker-compose.yml`, `back/n8n/workflows/*`, `base/supabase/*`
