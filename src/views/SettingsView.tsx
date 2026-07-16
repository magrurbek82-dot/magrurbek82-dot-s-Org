/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMagaStore } from '../store';
import { Shield, Bell, Languages, Smartphone, LogOut, Check, Sparkles, ChevronRight, ToggleLeft, ToggleRight, Fingerprint, Lock, DollarSign, Wallet } from 'lucide-react';

export default function SettingsView() {
  const user = useMagaStore(state => state.user);
  const logout = useMagaStore(state => state.logout);
  const togglePasscode = useMagaStore(state => state.togglePasscode);
  const toggleFaceId = useMagaStore(state => state.toggleFaceId);
  const upgradeToPremium = useMagaStore(state => state.upgradeToPremium);
  const setDailyLimit = useMagaStore(state => state.setDailyLimit);
  const dailyLimit = useMagaStore(state => state.dailyLimit);

  const [activeSubmenu, setActiveSubmenu] = useState<'main' | 'xavfsizlik' | 'bildirishnomalar' | 'til' | 'limit'>('main');
  const [limitInput, setLimitInput] = useState(dailyLimit.toString());

  // Mapped Settings List
  const settingsList = [
    { id: 'limit', label: 'Kunlik xarajat limiti', icon: DollarSign, desc: 'Kunlik limit miqdorini tahrirlash' },
    { id: 'xavfsizlik', label: 'Xavfsizlik & PIN-kod', icon: Shield, desc: 'Passcode, Face ID va qurilmalar' },
    { id: 'bildirishnomalar', label: 'Bildirishnomalar', icon: Bell, desc: 'Limit va ogohlantirishlar' },
    { id: 'til', label: 'Ilova tili (Language)', icon: Languages, desc: 'Oʻzbekcha (Default)' },
  ];

  const handleSubmenuClick = (id: string) => {
    if (id === 'xavfsizlik') setActiveSubmenu('xavfsizlik');
    else if (id === 'bildirishnomalar') setActiveSubmenu('bildirishnomalar');
    else if (id === 'til') setActiveSubmenu('til');
    else if (id === 'limit') {
      setLimitInput(dailyLimit.toString());
      setActiveSubmenu('limit');
    }
  };

  const handleSaveLimit = () => {
    const parsed = parseInt(limitInput.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setDailyLimit(parsed);
      setActiveSubmenu('main');
    }
  };

  const activeDevices = [
    { name: 'iPhone 15 Pro Max', status: 'Online', ip: '195.158.12.84', icon: Smartphone, current: true },
    { name: 'MacBook Air M3', status: 'Offline', ip: '195.158.12.84', icon: Smartphone, current: false },
  ];

  return (
    <div className="space-y-6 pb-28 pt-2 z-10 relative">
      
      {/* Header with Back Button */}
      {activeSubmenu !== 'main' ? (
        <button
          onClick={() => setActiveSubmenu('main')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[11px] font-bold text-slate-500 hover:text-slate-900 shadow-sm cursor-pointer transition-all"
        >
          ← Orqaga sozlamalarga
        </button>
      ) : (
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold mb-0.5">XUSUSIY SOZLAMALAR</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
            Ilova sozlamalari
          </h2>
        </div>
      )}

      {/* Main Settings Subview */}
      {activeSubmenu === 'main' && (
        <>
          {/* Hero Profile Card */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-6 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-50/40 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-4 relative">
              {/* Profile Avatar */}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg font-bold text-blue-600 select-none">
                  {user?.name?.slice(0, 2).toUpperCase() || 'MF'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">{user?.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user?.email}</p>
                <span className="text-[9px] text-slate-400 font-mono block mt-1.5">
                  Aʼzolik sanasi: {user?.joinedDate || 'Iyul, 2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Premium Upgrade Banner */}
          {!user?.premiumUser && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={upgradeToPremium}
              className="relative w-full py-4 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-2xl tracking-wide flex items-center justify-between cursor-pointer overflow-hidden shadow-md"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                Maga PRO-ga o'tish (Deep AI + Limits)
              </span>
              <span className="bg-white/20 text-white px-2.5 py-1 rounded-full font-bold text-[9px]">
                Aktivlashtirish 💎
              </span>
            </motion.button>
          )}

          {/* Settings Options List */}
          <div className="space-y-3">
            {settingsList.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSubmenuClick(item.id)}
                  className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-between cursor-pointer group shadow-[0_4px_20px_rgb(0,0,0,0.01)]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>

          {/* Danger Zone Logout Button */}
          <div className="pt-4 border-t border-slate-100">
            <motion.button
              whileHover={{ y: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="w-full py-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-100/50 text-rose-600 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Tizimdan chiqish (Logout)
            </motion.button>
          </div>
        </>
      )}

      {/* Security Details Subview */}
      {activeSubmenu === 'xavfsizlik' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              Xavfsizlik Sozlamalari
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">PIN-kod va biometrik sozlamalar</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 space-y-4 shadow-sm">
            {/* Passcode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">PIN-kod himoyasi</h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Ilovaga kirishda 4 xonali kod soʻrash</p>
              </div>
              <button
                onClick={togglePasscode}
                className="text-blue-600 cursor-pointer focus:outline-none"
              >
                {user?.passcodeEnabled ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-300" />
                )}
              </button>
            </div>

            {/* Face ID Toggle */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-slate-400" />
                  Face ID orqali kirish
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Biometriya yordamida tezkor autentifikatsiya</p>
              </div>
              <button
                onClick={toggleFaceId}
                className="text-blue-600 cursor-pointer focus:outline-none"
              >
                {user?.faceIdEnabled ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {/* Active Devices */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Faol qurilmalar</h4>
            
            <div className="space-y-2">
              {activeDevices.map((device, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <device.icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{device.name}</span>
                        {device.current && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[8px] text-blue-600 font-mono font-bold">
                            Shu qurilma
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">{device.ip}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-mono text-slate-400">{device.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Daily Limit Subview */}
      {activeSubmenu === 'limit' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kunlik limit miqdori</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Xarajatlaringizni nazorat qilish uchun kunlik limit belgilang</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5 pl-1">Yangi limit (UZS)</label>
              <input
                type="number"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-mono font-bold outline-none text-slate-900 focus:border-blue-500"
                placeholder="Kod kiritish"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveLimit}
              className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Saqlash (Limitni faollashtirish)
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Notifications Submenu */}
      {activeSubmenu === 'bildirishnomalar' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Bildirishnomalar</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Push-bildirishnomalar va limit signallari</p>
          </div>
          <div className="p-5 bg-white border border-slate-100 rounded-2xl text-xs text-slate-400 text-center font-mono py-8 shadow-sm">
            🔔 Kunlik limit ogohlantirishlari yoqilgan (Faol).
          </div>
        </motion.div>
      )}

      {/* Language Submenu */}
      {activeSubmenu === 'til' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Ilova tili</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Interfeys tilini sozlash</p>
          </div>
          <div className="space-y-2">
            {['Oʻzbekcha (Default)', 'English (Tez kunda)', 'Русский (Tez kunda)'].map((lang, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.01)] ${
                  idx === 0
                    ? 'bg-blue-50 border-blue-100 text-blue-600'
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold">{lang}</span>
                {idx === 0 && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
