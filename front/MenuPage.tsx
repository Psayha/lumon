import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  MessageSquare, 
  FileText, 
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { AppHeader } from '../src/components/AppHeader';
// import { AppFooter } from '../src/components/AppFooter';
import { AgreementModal } from '../src/components/modals/AgreementModal';
import { CompanyModal } from '../src/components/modals/CompanyModal';
import { OnboardingModal } from '../src/components/modals/OnboardingModal';
import { PricingModal } from '../src/components/modals/PricingModal';
import ConsultationModal from '../src/components/modals/ConsultationModal';

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  
  // Modal states
  const [showAgreement, setShowAgreement] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState<string[]>([]);

  // Фиксируем страницу - предотвращаем скролл body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const menuItems = [
    { title: 'CRM', description: 'Вся автоматизация через CRM', icon: MessageSquare, path: '/app/crm', bgColor: 'bg-orange-100 dark:bg-orange-900/20', iconColor: 'text-orange-600 dark:text-orange-400' },
    { title: 'Аналитика', description: 'Отчеты и метрики', icon: BarChart3, path: '/app/analytics', bgColor: 'bg-indigo-100 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { title: 'База знаний', description: 'Документы и материалы', icon: FileText, path: '/app/knowledge', bgColor: 'bg-pink-100 dark:bg-pink-900/20', iconColor: 'text-pink-600 dark:text-pink-400' },
    { title: 'Тарифы', description: 'Управление подпиской', icon: CreditCard, path: '/app/payment', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' }
  ];

  // Check if user has completed onboarding flow
  useEffect(() => {
    const hasCompletedFlow = localStorage.getItem('lumon-onboarding-completed');
    if (!hasCompletedFlow) {
      setShowAgreement(true);
    }
  }, []);

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  // Modal handlers
  const handleAgreementAccept = () => {
    setShowAgreement(false);
    setShowCompany(true);
  };

  const handleAgreementDecline = () => {
    setShowAgreement(false);
    // User declined, could redirect to exit page or show message
    console.log('User declined agreement');
  };

  const handleConnectCompany = () => {
    setShowCompany(false);
    setShowOnboarding(true);
  };

  const handleCompanyLater = () => {
    setShowCompany(false);
    setShowPricing(true);
  };

  const handleOnboardingComplete = (answers: string[]) => {
    setOnboardingAnswers(answers);
    setShowOnboarding(false);
    setShowPricing(true);
  };

  const handleSelectPlan = (plan: 'basic' | 'pro') => {
    setShowPricing(false);
    localStorage.setItem('lumon-onboarding-completed', 'true');
    localStorage.setItem('lumon-selected-plan', plan);
    console.log('Selected plan:', plan);
    console.log('Onboarding answers:', onboardingAnswers);
  };

  const handlePricingClose = () => {
    setShowPricing(false);
    localStorage.setItem('lumon-onboarding-completed', 'true');
  };

  return (
    <>
      {/* Контент занимает весь экран, включая safe-area */}
      <div 
        className="fixed gradient-bg overflow-hidden flex flex-col inset-0"
        style={{
          height: '100dvh'
        }}
      >
        <AppHeader showHomeButton={false} />
        
        {/* Фоновые эффекты */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
        </div>
        
        {/* Скроллируемый контент с отступом от header */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-[calc(var(--safe-top,0px)+52px)] pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <AnimatePresence>
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05, // Faster stagger
                  ease: "easeOut"
                }}
                onHoverStart={() => setHoveredItem(index)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                <motion.div
                  className="group cursor-pointer h-full"
                  whileHover={{ 
                    scale: 1.05,
                    y: -5
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    damping: 20, 
                    stiffness: 300 
                  }}
                >
                  <div
                    onClick={() => handleItemClick(item.path)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(item.path);
                      }
                    }}
                    aria-label={`Перейти к ${item.title}`}
                    className="relative h-full"
                  >
                    {/* Карточка с backdrop-blur */}
                    <div className="relative backdrop-blur-xl bg-white/80 dark:bg-white/[0.02] rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/[0.05] p-4 sm:p-6 h-full flex flex-col items-center text-center group-hover:shadow-2xl transition-all duration-300">
                      
                      {/* Анимированный фон при hover */}
                      {hoveredItem === index && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            animate={{
                              background: [
                                "linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 25%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 75%, rgba(99, 102, 241, 0.1) 100%)",
                                "linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 25%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 75%, rgba(59, 130, 246, 0.1) 100%)"
                              ]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                        </motion.div>
                      )}

                      {/* Иконка с анимацией */}
                      <motion.div 
                        className={`w-14 h-14 sm:w-16 sm:h-16 ${item.bgColor} rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg relative z-10`}
                        whileHover={{ 
                          scale: 1.1,
                          rotate: [0, -5, 5, 0]
                        }}
                        transition={{ 
                          duration: 0.3,
                          rotate: { duration: 0.6 }
                        }}
                      >
                        <motion.div
                          animate={hoveredItem === index ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          } : {}}
                          transition={{
                            duration: 1.5,
                            repeat: hoveredItem === index ? Infinity : 0,
                            ease: "easeInOut"
                          }}
                        >
                          <item.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${item.iconColor} transition-colors duration-300`} />
                        </motion.div>
                      </motion.div>

                      {/* Заголовок */}
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 transition-colors duration-300 relative z-10">
                        {item.title}
                      </h3>

                      {/* Описание */}
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300 relative z-10 flex-1">
                        {item.description}
                      </p>

                      {/* Индикатор hover */}
                      <motion.div
                        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        initial={{ width: 0, opacity: 0 }}
                        animate={hoveredItem === index ? { width: 32, opacity: 1 } : { width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
            {/* Отступ от подвала */}
            <div className="pb-4"></div>
          </div>
        </div>

        {/* Кнопка консультации */}
        <motion.button
          onClick={() => setShowConsultation(true)}
          className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 backdrop-blur-xl border border-white/20 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Получить консультацию"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>

        {/* <AppFooter showHomeButton={true} /> */}
      </div>

      {/* Градиентное размытие сверху с плавным переходом */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] pointer-events-none overflow-hidden"
        style={{
          height: `calc(var(--safe-top, 0px) + 40px)`,
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 bg-white/10 dark:bg-black/10"
          style={{
            height: `calc(var(--safe-top, 0px) + 40px)`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      </div>
      
      {/* Правая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-right, 0px)'
        }}
      />
      
      {/* Левая safe-area с glass эффектом */}
      <div 
        className="fixed top-0 left-0 bottom-0 z-[100] backdrop-blur-xl pointer-events-none bg-white/10 dark:bg-black/10"
        style={{
          width: 'var(--safe-left, 0px)'
        }}
      />

      {/* Modals */}
      <AgreementModal
        isOpen={showAgreement}
        onAccept={handleAgreementAccept}
        onDecline={handleAgreementDecline}
      />

      <CompanyModal
        isOpen={showCompany}
        onConnectCompany={handleConnectCompany}
        onLater={handleCompanyLater}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <PricingModal
        isOpen={showPricing}
        onSelectPlan={handleSelectPlan}
        onClose={handlePricingClose}
      />

      <ConsultationModal
        isOpen={showConsultation}
        onClose={() => setShowConsultation(false)}
      />
    </>
  );
};

export default MenuPage;
