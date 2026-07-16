/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMagaStore } from './store';

// Import Custom Views
import AuthView from './views/AuthView';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import AiView from './views/AiView';

// Import Components
import BackgroundEffects from './components/BackgroundEffects';
import AddTransactionSheet from './components/AddTransactionSheet';

// Icons
import { Home, ChartColumn, Settings, Plus, Bell, X, Sparkles, BellOff } from 'lucide-react';

export default function App() {
  const isAuthenticated = useMagaStore(state => state.isAuthenticated);
  const user = useMagaStore(state => state.user);
  const activeTab = useMagaStore(state => state.activeTab);
  const setActiveTab = useMagaStore(state => state.setActiveTab);
  const setAddSheetOpen = useMagaStore(state => state.setAddSheetOpen);
  const notifications = useMagaStore(state => state.notifications);
  const markNotificationsAsRead = useMagaStore(state => state.markNotificationsAsRead);
  const clearNotifications = useMagaStore(state => state.clearNotifications);

  const [showNotifications, setShowNotifications] = useState(false);

  // Unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setTimeout(() => {
        markNotificationsAsRead();
      }, 1000);
    }
  };

  // Select View to Render
  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardView />;
      case 'tahlil':
        return <AnalyticsView />;
      case 'maga-ai':
        return <AiView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 font-sans flex justify-center overflow-x-hidden antialiased">
      {/* Global Light Theme Background Effects */}
      <BackgroundEffects />

      {/* Main Container - Framed like a high-end mobile app shell */}
      <div className="relative w-full max-w-md min-h-screen flex flex-col bg-slate-50/20 border-x border-slate-200/50 shadow-sm z-10">
        
        {/* APP ROOT SWITCH */}
        {!isAuthenticated ? (
          <AuthView />
        ) : !user?.onboardingCompleted ? (
          <OnboardingView />
        ) : (
          /* Main Authenticated Application Layout */
          <>
            {/* Top Navigation Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-5 py-3.5 flex items-center justify-between z-30 shadow-[0_1px_10px_rgba(0,0,0,0.015)]">
              {/* Left Profile Avatar Button */}
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 group focus:outline-none cursor-pointer"
              >
                <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 transition-all group-hover:scale-102">
                  {user?.name?.slice(0, 2).toUpperCase() || 'MF'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider leading-none">Mening hisobim</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{user?.name}</p>
                </div>
              </button>

              {/* Logo Title */}
              <h1 
                onClick={() => setActiveTab('home')}
                className="text-sm font-extrabold tracking-tight text-slate-900 cursor-pointer font-sans select-none flex items-center gap-1.5"
              >
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                Maga Flow
              </h1>

              {/* Right Notification Bell */}
              <div className="relative">
                <button
                  onClick={handleNotificationBellClick}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-all cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[8px] font-bold flex items-center justify-center border border-white"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* Notifications Panel overlay */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      className="absolute right-0 mt-3 w-72 bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.06)] z-50 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-900">Bildirishnomalar</span>
                        <div className="flex gap-2">
                          <button
                            onClick={clearNotifications}
                            className="text-[9px] font-mono text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                          >
                            Tozalash
                          </button>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-none">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-[10px] font-mono flex flex-col items-center gap-1.5">
                            <BellOff className="w-5 h-5 opacity-40 text-slate-400" />
                            Bildirishnomalar yo'q
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-xl border text-[10px] leading-relaxed font-sans ${
                                n.read 
                                  ? 'bg-slate-50 border-slate-100 text-slate-500' 
                                  : 'bg-blue-50/60 border-blue-100 text-blue-900'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-0.5 font-bold">
                                <span className={n.read ? 'text-slate-700' : 'text-blue-700'}>Xabar</span>
                                <span className="text-[8px] text-slate-400 font-mono font-medium">{n.timestamp}</span>
                              </div>
                              <p>{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-grow px-5 overflow-y-auto relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="h-full"
                >
                  {renderActiveView()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Bottom Navigation Pill */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[360px] px-3 z-40">
              <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/50 rounded-[24px] h-16 flex items-center justify-between px-5 shadow-[0_10px_35px_rgba(0,0,0,0.03)] relative">
                <div className="flex items-center justify-between w-full relative">
                  
                  {/* HOME */}
                  <button
                    onClick={() => setActiveTab('home')}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-all cursor-pointer relative py-1"
                  >
                    <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-blue-600' : ''}`} />
                    <span className={`text-[9px] font-bold ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
                      Home
                    </span>
                    {activeTab === 'home' && (
                      <motion.div
                        layoutId="navDot"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-blue-600"
                      />
                    )}
                  </button>

                  {/* TAHLIL */}
                  <button
                    onClick={() => setActiveTab('tahlil')}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-all cursor-pointer relative py-1 mr-6"
                  >
                    <ChartColumn className={`w-4 h-4 ${activeTab === 'tahlil' ? 'text-blue-600' : ''}`} />
                    <span className={`text-[9px] font-bold ${activeTab === 'tahlil' ? 'text-blue-600' : 'text-slate-400'}`}>
                      Tahlil
                    </span>
                    {activeTab === 'tahlil' && (
                      <motion.div
                        layoutId="navDot"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-blue-600"
                      />
                    )}
                  </button>

                  {/* FAB - ADD AMAL */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAddSheetOpen(true)}
                      className="relative w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border border-blue-500 cursor-pointer focus:outline-none"
                    >
                      <Plus className="w-6 h-6 stroke-[2.5px]" />
                    </motion.button>
                  </div>

                  {/* MAGA AI */}
                  <button
                    onClick={() => setActiveTab('maga-ai')}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-all cursor-pointer relative py-1 ml-6"
                  >
                    <Sparkles className={`w-4 h-4 ${activeTab === 'maga-ai' ? 'text-blue-600' : ''}`} />
                    <span className={`text-[9px] font-bold ${activeTab === 'maga-ai' ? 'text-blue-600' : 'text-slate-400'}`}>
                      Maga AI
                    </span>
                    {activeTab === 'maga-ai' && (
                      <motion.div
                        layoutId="navDot"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-blue-600"
                      />
                    )}
                  </button>

                  {/* SETTINGS */}
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-all cursor-pointer relative py-1"
                  >
                    <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-blue-600' : ''}`} />
                    <span className={`text-[9px] font-bold ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
                      Settings
                    </span>
                    {activeTab === 'settings' && (
                      <motion.div
                        layoutId="navDot"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-blue-600"
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom sliding sheet */}
            <AddTransactionSheet />
          </>
        )}
      </div>
    </div>
  );
}
