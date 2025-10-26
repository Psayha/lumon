# 🎨 UI Design System - Lumon

## 🎯 Основные принципы дизайна

### ✅ СОВРЕМЕННЫЙ GRADIENT DESIGN
- Используйте градиентные фоны для создания глубины
- Применяйте полупрозрачные элементы с backdrop-blur
- Создавайте многослойные эффекты с анимациями
- Используйте современные тени и свечения

### ✅ АДАПТИВНЫЕ КОМПОНЕНТЫ
- Компоненты должны адаптироваться к состояниям (listening, typing, recognizing)
- Используйте анимированные переходы между состояниями
- Применяйте цветовую индикацию для разных режимов работы
- Создавайте интерактивные элементы с hover/focus эффектами

### ✅ TELEGRAM-СТИЛЬ ИНТЕРФЕЙС
- Следуйте принципам Telegram Mini Apps
- Используйте округлые углы и мягкие тени
- Применяйте консистентную типографику
- Создавайте интуитивно понятную навигацию

## 📝 КОМПОНЕНТЫ ДИЗАЙНА

### ✅ Gradient Background
```tsx
// Основной градиентный фон
<div className="h-screen gradient-bg relative overflow-hidden flex flex-col">
  {/* Фоновые эффекты */}
  <div className="absolute inset-0 w-full h-full overflow-hidden">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
    <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
  </div>
</div>
```

### ✅ Animated Header Button
```tsx
// Анимированная кнопка с состояниями
<motion.button
  className={`flex items-center justify-center rounded-full px-6 py-2 relative overflow-hidden w-40 h-10 ${
    isRecognizing
      ? "bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-400 shadow-2xl shadow-orange-500/40 ring-4 ring-orange-500/20"
      : isListening
      ? "bg-white dark:bg-gray-800 border-2 border-red-500 dark:border-red-400 shadow-2xl shadow-red-500/40 ring-4 ring-red-500/20"
      : isTyping
      ? "bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-400 shadow-2xl shadow-orange-500/40 ring-4 ring-orange-500/20"
      : "bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700"
  }`}
  whileHover={!isTyping && !isListening && !isRecognizing ? { scale: 1.05 } : {}}
  whileTap={!isTyping && !isListening && !isRecognizing ? { scale: 0.95 } : {}}
>
  {/* Анимированные фоновые эффекты */}
  {isTyping && (
    <motion.div
      className="absolute inset-0 rounded-full"
      animate={{
        background: [
          "linear-gradient(45deg, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.3) 25%, rgba(194, 65, 12, 0.3) 50%, rgba(154, 52, 18, 0.3) 75%, rgba(249, 115, 22, 0.3) 100%)",
          "linear-gradient(45deg, rgba(154, 52, 18, 0.3) 0%, rgba(249, 115, 22, 0.3) 25%, rgba(234, 88, 12, 0.3) 50%, rgba(194, 65, 12, 0.3) 75%, rgba(154, 52, 18, 0.3) 100%)"
        ]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    />
  )}
</motion.button>
```

### ✅ Chat Input Area
```tsx
// Современная область ввода с эффектами
<motion.div 
  className={cn(
    "relative backdrop-blur-2xl bg-white/80 dark:bg-white/[0.02] rounded-2xl shadow-2xl",
    isRecognizing
      ? "border-2 border-orange-500 dark:border-orange-400"
      : isListening
      ? "border-2 border-red-500 dark:border-red-400"
      : "border border-gray-200/50 dark:border-white/[0.05]"
  )}
  initial={{ scale: 0.98 }}
  animate={{ scale: 1 }}
  transition={{ delay: 0.1 }}
>
  {/* Command Palette */}
  <AnimatePresence>
    {showCommandPalette && (
      <motion.div 
        className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-white/95 dark:bg-black/90 rounded-lg z-50 shadow-lg border border-gray-200/50 dark:border-white/10 overflow-hidden"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.15 }}
      >
        {/* Содержимое палитры команд */}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```

### ✅ Modal with Blur Effects
```tsx
// Модальное окно с эффектами блюра
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop с анимированным блюром */}
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[60]"
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onClick={onClose}
      />
      
      {/* Панель с полупрозрачным фоном */}
      <motion.div
        className="fixed left-0 top-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 shadow-2xl z-[61] flex flex-col"
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -320, opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 200,
          opacity: { duration: 0.2 }
        }}
      >
        {/* Содержимое модального окна */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### ✅ Voice Button with States
```tsx
// Кнопка голосового ввода с состояниями
<motion.button
  type="button"
  onClick={onVoiceInput}
  className={cn(
    "p-2 rounded-lg transition-colors relative group w-full max-w-none flex items-center justify-center",
    isListening 
      ? "text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-900/20" 
      : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/90"
  )}
>
  <AnimatePresence mode="wait">
    {isListening ? (
      <motion.div
        key="listening"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <MicOff className="w-4 h-4" />
      </motion.div>
    ) : (
      <motion.div
        key="mic"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Mic className="w-4 h-4" />
      </motion.div>
    )}
  </AnimatePresence>
  
  {/* Анимированный фон при прослушивании */}
  {isListening && (
    <motion.div
      className="absolute inset-0 bg-red-200/50 dark:bg-red-900/20 rounded-lg"
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )}
</motion.button>
```

## 🎨 ЦВЕТОВАЯ ПАЛИТРА

### Основные цвета состояний
```tsx
// Состояния кнопок и элементов
const stateColors = {
  // Обычное состояние
  default: {
    background: "bg-white dark:bg-gray-800",
    border: "border-blue-600 dark:border-blue-400",
    text: "text-gray-900 dark:text-white",
    hover: "hover:bg-blue-50 dark:hover:bg-gray-700"
  },
  
  // Состояние прослушивания
  listening: {
    background: "bg-white dark:bg-gray-800",
    border: "border-red-500 dark:border-red-400",
    shadow: "shadow-2xl shadow-red-500/40",
    ring: "ring-4 ring-red-500/20",
    text: "text-red-600 dark:text-red-400"
  },
  
  // Состояние распознавания
  recognizing: {
    background: "bg-white dark:bg-gray-800",
    border: "border-orange-500 dark:border-orange-400",
    shadow: "shadow-2xl shadow-orange-500/40",
    ring: "ring-4 ring-orange-500/20",
    text: "text-orange-600 dark:text-orange-400"
  },
  
  // Состояние печати
  typing: {
    background: "bg-white dark:bg-gray-800",
    border: "border-orange-500 dark:border-orange-400",
    shadow: "shadow-2xl shadow-orange-500/40",
    ring: "ring-4 ring-orange-500/20",
    text: "text-orange-600 dark:text-orange-400"
  }
};
```

### Градиентные фоны
```tsx
// Фоновые градиенты
const backgroundGradients = {
  // Основной градиент
  primary: "gradient-bg",
  
  // Анимированные круги
  animatedCircles: [
    "bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse",
    "bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700",
    "bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000"
  ],
  
  // Эффекты фокуса
  focusEffect: "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
};
```

## 🎭 АНИМАЦИИ И ПЕРЕХОДЫ

### Основные анимации
```tsx
// Стандартные переходы
const transitions = {
  // Плавные переходы
  smooth: "transition-all duration-300 ease-in-out",
  
  // Быстрые переходы
  quick: "transition-all duration-150 ease-out",
  
  // Spring анимации
  spring: {
    type: "spring",
    damping: 25,
    stiffness: 200
  },
  
  // Framer Motion анимации
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  },
  
  slideIn: {
    initial: { x: -320, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -320, opacity: 0 }
  }
};
```

### Hover эффекты
```tsx
// Стандартные hover эффекты
const hoverEffects = {
  // Масштабирование
  scale: "hover:scale-105",
  
  // Изменение цвета
  color: "hover:text-blue-600 dark:hover:text-blue-400",
  
  // Изменение фона
  background: "hover:bg-gray-100 dark:hover:bg-gray-700",
  
  // Framer Motion hover
  motionHover: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  }
};
```

## 📱 RESPONSIVE DESIGN

### Breakpoints
```tsx
// Адаптивные классы
const responsiveClasses = {
  // Контейнеры
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  
  // Сетки
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  
  // Отступы
  padding: "p-4 sm:p-6 lg:p-8",
  
  // Текст
  text: "text-sm sm:text-base lg:text-lg"
};
```

## 🎯 ЛУЧШИЕ ПРАКТИКИ

### 1. **Используйте backdrop-blur для глубины**
```tsx
// ✅ ПРАВИЛЬНО - создание глубины
<div className="backdrop-blur-2xl bg-white/80 dark:bg-white/[0.02]">
```

### 2. **Применяйте анимированные градиенты**
```tsx
// ✅ ПРАВИЛЬНО - анимированные фоны
<motion.div
  animate={{
    background: [
      "linear-gradient(45deg, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.3) 100%)",
      "linear-gradient(45deg, rgba(154, 52, 18, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)"
    ]
  }}
  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
/>
```

### 3. **Создавайте интерактивные состояния**
```tsx
// ✅ ПРАВИЛЬНО - адаптивные состояния
className={`base-class ${
  isActive ? "active-state" : "default-state"
}`}
```

### 4. **Используйте z-index иерархию**
```tsx
// ✅ ПРАВИЛЬНО - правильная иерархия
const zIndex = {
  content: "z-0",
  header: "z-50",
  modalBackdrop: "z-[60]",
  modalContent: "z-[61]"
};
```

## 🚨 КРИТИЧЕСКИ ВАЖНО

### ❌ НЕ ДЕЛАЙТЕ
```tsx
// ❌ НЕПРАВИЛЬНО - статичные элементы
<div className="bg-white border border-gray-300">

// ❌ НЕПРАВИЛЬНО - отсутствие состояний
<button className="bg-blue-500 text-white">

// ❌ НЕПРАВИЛЬНО - игнорирование анимаций
<div className="opacity-100">
```

### ✅ ДЕЛАЙТЕ ТАК
```tsx
// ✅ ПРАВИЛЬНО - динамические элементы
<motion.div 
  className="backdrop-blur-2xl bg-white/80"
  animate={{ scale: isActive ? 1.05 : 1 }}
>

// ✅ ПРАВИЛЬНО - адаптивные состояния
<button className={`${isActive ? "active-class" : "default-class"}`}>

// ✅ ПРАВИЛЬНО - плавные анимации
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
```

---

**Помни**: Современный дизайн Lumon основан на градиентах, анимациях и интерактивности. Создавайте живые, отзывчивые интерфейсы!
