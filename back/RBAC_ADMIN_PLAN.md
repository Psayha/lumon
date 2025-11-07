# 🔐 RBAC для Админ-панели - Подробный план

> **Дата:** 6 ноября 2025  
> **Статус:** Планирование

---

## 📋 Что такое RBAC?

**RBAC (Role-Based Access Control)** — система контроля доступа на основе ролей. Каждый админ получает роль, которая определяет:
- Какие вкладки он может видеть
- Какие действия может выполнять
- Какие данные может просматривать/изменять

---

## 🎯 Цель

Ограничить доступ к функциям админ-панели в зависимости от роли администратора:
- **super_admin** — полный доступ ко всему
- **admin** — доступ к просмотру и редактированию (без удаления критичных данных)
- **viewer** — только просмотр (read-only)

---

## 📊 Текущая структура

### База данных
```sql
-- Текущая таблица admin_users (БЕЗ ролей)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Админ-панель
- **3 вкладки:**
  1. Компании (`CompaniesTab`) — управление компаниями и пользователями
  2. Юр документы (`LegalDocsTab`) — управление юридическими документами
  3. Документы для ИИ (`AIDocumentsTab`) — управление документами для обучения ИИ

- **Текущее состояние:** Все админы имеют одинаковый доступ ко всем вкладкам

---

## 🏗️ План реализации

### Этап 1: Расширение БД (миграция)

**Файл:** `back/supabase/migrations/20251106000001_admin_roles.sql`

```sql
-- Добавляем поле role в admin_users
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'viewer' 
CHECK (role IN ('super_admin', 'admin', 'viewer'));

-- Создаём индекс для быстрого поиска по ролям
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Обновляем существующих админов (если есть) на super_admin
UPDATE admin_users SET role = 'super_admin' WHERE role IS NULL OR role = '';

-- Комментарий
COMMENT ON COLUMN admin_users.role IS 'Роль администратора: super_admin (полный доступ), admin (редактирование), viewer (только просмотр)';
```

### Этап 2: Обновление workflow admin.login

**Файл:** `back/n8n/workflows/admin.login.json`

Добавить возврат роли в ответе:
```json
{
  "success": true,
  "data": {
    "token": "...",
    "admin": {
      "id": "...",
      "username": "...",
      "role": "super_admin" // ← добавить
    }
  }
}
```

### Этап 3: Хранение роли в frontend

**Файл:** `adminpage/AdminPage.tsx`

```typescript
interface AdminContext {
  id: string;
  username: string;
  role: 'super_admin' | 'admin' | 'viewer';
}

const [adminContext, setAdminContext] = useState<AdminContext | null>(null);

// Сохранять при логине
const handleLogin = (token: string, admin: AdminContext) => {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_context', JSON.stringify(admin));
  setAdminContext(admin);
  setIsAuthenticated(true);
};
```

### Этап 4: Определение прав доступа

**Матрица прав:**

| Роль | Компании | Юр документы | Документы ИИ | Действия |
|------|----------|--------------|--------------|----------|
| **super_admin** | ✅ Полный доступ | ✅ Полный доступ | ✅ Полный доступ | Создание, редактирование, удаление, экспорт |
| **admin** | ✅ Просмотр + редактирование | ✅ Просмотр + редактирование | ✅ Просмотр + редактирование | Создание, редактирование (без удаления критичных) |
| **viewer** | 👁️ Только просмотр | 👁️ Только просмотр | 👁️ Только просмотр | Только просмотр, экспорт |

### Этап 5: Ограничение доступа к вкладкам

**Файл:** `adminpage/AdminPage.tsx`

```typescript
// Фильтруем вкладки по роли
const getAvailableTabs = () => {
  const allTabs = [
    { id: 'companies' as const, label: 'Компании', icon: Building2 },
    { id: 'legal' as const, label: 'Юр документы', icon: FileText },
    { id: 'ai-docs' as const, label: 'Документы для ИИ', icon: Database },
  ];

  // viewer видит все вкладки, но только в режиме просмотра
  // admin и super_admin видят все вкладки
  return allTabs;
};

// Показываем badge для viewer
{adminContext?.role === 'viewer' && (
  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
    Только просмотр
  </span>
)}
```

### Этап 6: Ограничение действий в компонентах

**Пример для CompaniesTab:**

```typescript
interface CompaniesTabProps {
  adminRole: 'super_admin' | 'admin' | 'viewer';
}

export const CompaniesTab: React.FC<CompaniesTabProps> = ({ adminRole }) => {
  const canEdit = adminRole !== 'viewer';
  const canDelete = adminRole === 'super_admin';
  const canCreate = adminRole !== 'viewer';

  return (
    <>
      {/* Кнопка создания */}
      {canCreate && (
        <button onClick={handleCreate}>Создать компанию</button>
      )}

      {/* Кнопка редактирования */}
      {canEdit && (
        <button onClick={handleEdit}>Редактировать</button>
      )}

      {/* Кнопка удаления */}
      {canDelete && (
        <button onClick={handleDelete} className="text-red-600">
          Удалить
        </button>
      )}

      {/* Badge для viewer */}
      {adminRole === 'viewer' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              У вас роль "Только просмотр". Вы можете просматривать данные, но не можете их изменять.
            </span>
          </div>
        </div>
      )}
    </>
  );
};
```

### Этап 7: Визуальные индикаторы

**Badge в header:**
```typescript
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-600">{adminContext?.username}</span>
  <span className={`px-2 py-1 text-xs rounded ${
    adminContext?.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
    adminContext?.role === 'admin' ? 'bg-blue-100 text-blue-800' :
    'bg-gray-100 text-gray-800'
  }`}>
    {adminContext?.role === 'super_admin' ? '👑 Супер-админ' :
     adminContext?.role === 'admin' ? '🔧 Админ' :
     '👁️ Только просмотр'}
  </span>
</div>
```

**Блокировка форм для viewer:**
```typescript
<input
  disabled={adminRole === 'viewer'}
  className={adminRole === 'viewer' ? 'opacity-50 cursor-not-allowed' : ''}
/>
```

---

## 📝 Детали реализации

### 1. Миграция БД

**Шаги:**
1. Создать файл `back/supabase/migrations/20251106000001_admin_roles.sql`
2. Добавить поле `role` в `admin_users`
3. Установить значение по умолчанию `'viewer'`
4. Обновить существующих админов на `'super_admin'`
5. Применить миграцию на сервере

### 2. Обновление admin.login workflow

**Изменения:**
- В ноде "Build Response" добавить `role` из `admin_users`
- Вернуть роль в ответе вместе с токеном

### 3. Frontend изменения

**Файлы для изменения:**
- `adminpage/AdminPage.tsx` — хранение контекста, фильтрация вкладок
- `adminpage/components/AdminLogin.tsx` — сохранение роли при логине
- `adminpage/tabs/CompaniesTab.tsx` — ограничение действий
- `adminpage/tabs/LegalDocsTab.tsx` — ограничение действий
- `adminpage/tabs/AIDocumentsTab.tsx` — ограничение действий

**Новый файл:**
- `adminpage/hooks/useAdminRole.ts` — хук для проверки прав

### 4. Хук useAdminRole

```typescript
// adminpage/hooks/useAdminRole.ts
export const useAdminRole = () => {
  const [adminContext, setAdminContext] = useState<AdminContext | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin_context');
    if (saved) {
      setAdminContext(JSON.parse(saved));
    }
  }, []);

  const hasPermission = (permission: 'create' | 'edit' | 'delete' | 'view') => {
    if (!adminContext) return false;
    
    switch (permission) {
      case 'view':
        return true; // Все роли могут просматривать
      case 'create':
      case 'edit':
        return adminContext.role !== 'viewer';
      case 'delete':
        return adminContext.role === 'super_admin';
      default:
        return false;
    }
  };

  return {
    adminContext,
    role: adminContext?.role || null,
    hasPermission,
    isViewer: adminContext?.role === 'viewer',
    isAdmin: adminContext?.role === 'admin' || adminContext?.role === 'super_admin',
    isSuperAdmin: adminContext?.role === 'super_admin',
  };
};
```

---

## 🎨 UI/UX улучшения

### 1. Badge роли в header
- Показывать роль рядом с username
- Цветовая индикация (purple для super_admin, blue для admin, gray для viewer)

### 2. Блокировка кнопок для viewer
- Disabled состояние для всех кнопок редактирования
- Tooltip: "Только просмотр. Обратитесь к администратору для изменений."

### 3. Информационный баннер для viewer
- Показывать вверху каждой вкладки
- Иконка + текст: "У вас роль 'Только просмотр'. Вы можете просматривать данные, но не можете их изменять."

### 4. Визуальная индикация readonly полей
- Opacity 50% для всех input/textarea/select
- Cursor: not-allowed

---

## ✅ Критерии готовности

- [ ] Миграция БД применена, поле `role` добавлено в `admin_users`
- [ ] Workflow `admin.login` возвращает роль в ответе
- [ ] Frontend сохраняет роль при логине
- [ ] Хук `useAdminRole` создан и работает
- [ ] Вкладки фильтруются по роли (если нужно)
- [ ] Кнопки создания/редактирования/удаления блокируются для viewer
- [ ] Badge роли отображается в header
- [ ] Информационный баннер показывается для viewer
- [ ] Все формы блокируются для viewer
- [ ] Тестирование: viewer не может изменить данные

---

## 🚀 Порядок реализации

1. **Миграция БД** (5 мин)
   - Создать файл миграции
   - Применить на сервере

2. **Обновление workflow** (10 мин)
   - Добавить возврат роли в `admin.login`

3. **Frontend базовая структура** (20 мин)
   - Создать `useAdminRole` хук
   - Обновить `AdminLogin` для сохранения роли
   - Обновить `AdminPage` для хранения контекста

4. **Ограничение доступа** (30 мин)
   - Обновить все 3 вкладки
   - Добавить проверки прав
   - Блокировать кнопки для viewer

5. **UI улучшения** (20 мин)
   - Badge роли
   - Информационный баннер
   - Визуальная индикация readonly

**Итого:** ~1.5 часа работы

---

## 📚 Дополнительные возможности (опционально)

### Расширенные права
Вместо простых ролей можно использовать систему разрешений:
```sql
CREATE TABLE admin_permissions (
  admin_user_id UUID REFERENCES admin_users(id),
  permission VARCHAR(50), -- 'companies.create', 'companies.delete', etc.
  granted BOOLEAN DEFAULT true
);
```

### Аудит действий
Логировать все действия админов:
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(id),
  action VARCHAR(100),
  resource VARCHAR(100),
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

**Готов начать реализацию!** 🚀

