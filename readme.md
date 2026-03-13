# Saponix

## Автодеплой на GitHub Pages

Проект настроен на автоматический деплой через GitHub Actions.

### Как это работает
- Workflow: `.github/workflows/deploy-pages.yml`
- Триггеры:
  - push в `main`
  - ручной запуск через `workflow_dispatch`
- Сборка: `npm ci && npm run build`
- Публикация: содержимое `dist/` в GitHub Pages.

### Что нужно включить в GitHub
1. В репозитории откройте **Settings → Pages**.
2. В **Build and deployment** выберите **Source: GitHub Actions**.
3. Убедитесь, что изменения попадают в ветку `main`.

После этого каждый push в `main` будет автоматически деплоить свежую версию на:
`https://jeklon.github.io/Saponix/`
