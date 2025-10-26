# 🎨 Lumon Design System

Современный Design System для Lumon Platform, созданный согласно правилам UI/UX и React 18 паттернам.

## 🎯 Принципы

- **Utility-first подход** - только Tailwind CSS
- **Семантические цвета** - primary, secondary, success, warning, error, info
- **Темная тема** - полная поддержка dark mode
- **Accessibility** - WCAG совместимость
- **React 18** - современные паттерны и хуки

## 📦 Компоненты

### Button
```tsx
import { Button } from '../src/components';

<Button variant="primary" size="md" onClick={handleClick}>
  Нажми меня
</Button>
```

**Варианты:**
- `primary` - основные действия
- `secondary` - второстепенные действия  
- `success` - успешные операции
- `warning` - предупреждения
- `error` - ошибки и опасные действия
- `info` - информационные сообщения

**Размеры:**
- `sm` - маленький
- `md` - средний (по умолчанию)
- `lg` - большой

### Card
```tsx
import { Card } from '../src/components';

<Card variant="elevated" padding="lg">
  <h3>Заголовок карточки</h3>
  <p>Содержимое карточки</p>
</Card>
```

**Варианты:**
- `default` - стандартная тень
- `elevated` - повышенная тень
- `outlined` - только граница

### Input
```tsx
import { Input } from '../src/components';

<Input
  value={value}
  onChange={setValue}
  label="Email"
  placeholder="your@email.com"
  type="email"
  required
/>
```

### Modal
```tsx
import { Modal } from '../src/components';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Подтверждение"
  size="md"
>
  <p>Вы уверены?</p>
</Modal>
```

### Alert
```tsx
import { Alert } from '../src/components';

<Alert variant="success">
  Операция выполнена успешно!
</Alert>
```

### Badge
```tsx
import { Badge } from '../src/components';

<Badge variant="info" size="sm">
  Новое
</Badge>
```

### LoadingSpinner
```tsx
import { LoadingSpinner } from '../src/components';

<LoadingSpinner size="lg" text="Загрузка..." />
```

### ThemeToggle
```tsx
import { ThemeToggle } from '../src/components';

<ThemeToggle />
```

## 🎨 Цветовая палитра

### Основные цвета
- **Primary**: `bg-blue-600` - основные действия
- **Secondary**: `bg-gray-600` - второстепенные действия
- **Success**: `bg-green-600` - успешные операции
- **Warning**: `bg-yellow-600` - предупреждения
- **Error**: `bg-red-600` - ошибки
- **Info**: `bg-indigo-600` - информация

### Темная тема
Все компоненты поддерживают темную тему через `dark:` префиксы:
```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

## 🎯 Лучшие практики

### 1. Используйте семантические цвета
```tsx
// ✅ ПРАВИЛЬНО
<Button variant="success">Сохранить</Button>
<Alert variant="error">Ошибка</Alert>

// ❌ НЕПРАВИЛЬНО
<button className="bg-green-500">Сохранить</button>
```

### 2. Поддерживайте темную тему
```tsx
// ✅ ПРАВИЛЬНО
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ❌ НЕПРАВИЛЬНО
<div className="bg-white text-black">
```

### 3. Используйте accessibility
```tsx
// ✅ ПРАВИЛЬНО
<button 
  className="bg-blue-600 text-white focus:ring-2 focus:ring-blue-500"
  aria-label="Сохранить изменения"
>
  Сохранить
</button>
```

## 🚀 React 18 Паттерны

### Lazy Loading
```tsx
import { Suspense, lazy } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### Error Boundaries
```tsx
import { ErrorBoundary } from '../src/components';

<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

### Custom Hooks
```tsx
import { useTheme, useLocalStorage } from '../src/hooks';

const { theme, toggleTheme } = useTheme();
const [value, setValue] = useLocalStorage('key', 'default');
```

## 📱 Responsive Design

Все компоненты адаптивны и используют mobile-first подход:

```tsx
<div className="
  grid 
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  gap-4 sm:gap-6 lg:gap-8
  p-4 sm:p-6 lg:p-8
">
```

## 🎭 Анимации

Простые переходы для лучшего UX:

```tsx
<div className="
  transition-colors duration-150
  hover:shadow-lg hover:scale-105
  focus:ring-2 focus:ring-blue-500
">
```

---

**Помни**: Design System должен быть простым, консистентным и доступным!
