/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMagaStore } from '../store';
import { Sparkles, ArrowRight, Wallet, TrendingDown, ArrowLeft, CheckCircle } from 'lucide-react';

export default function OnboardingView() {
  const user = useMagaStore(state => state.user);
  const completeOnboarding = useMagaStore(state => state.completeOnboarding);

  const [step, setStep] = useState(1);
  const [walletName, setWalletName] = useState('Uzcard (Karta)');
  const [walletBalanceStr, setWalletBalanceStr] = useState('3000000'); // 3M UZS default
  const [dailyLimitStr, setDailyLimitStr] = useState('500000'); // 500k UZS default

  const handleWalletBalanceChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setWalletBalanceStr(clean || '0');
  };

  const handleDailyLimitChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setDailyLimitStr(clean || '0');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!walletName.trim()) {
        alert('Hamyon nomini kiriting');
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleFinish = () => {
    const balance = parseInt(walletBalanceStr, 10) || 0;
    const limit = parseInt(dailyLimitStr, 10) || 0;
    
    completeOnboarding(walletName, balance, limit);
  };

  const formatUZS = (str: string) => {
    const val = parseInt(str, 10);
    return isNaN(val) ? '0 UZS' : val.toLocaleString('uz-UZ') + ' UZS';
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 z-10 bg-slate-50">
      {/* Soft Light Halo Accents */}
      <div className="absolute top-[20%] right-[10%] w-72 h-72 rounded-full bg-blue-100/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-72 h-72 rounded-full bg-emerald-100/30 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Onboarding White Premium Card */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.03)] relative overflow-hidden">
          
          {/* Stepper Header Indicators */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Onboarding
            </span>
            <div className="flex gap-1.5">
              <div className={`w-6 h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'bg-blue-600' : 'bg-slate-100'}`} />
              <div className={`w-6 h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'bg-blue-600' : 'bg-slate-100'}`} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-1"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Greeting */}
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                    Xush kelibsiz, <span className="text-blue-600 font-extrabold">{user?.name || 'Foydalanuvchi'}</span>!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Maga Flow bilan moliyaviy muvozanatga erishish oson. Keling, birinchi hamyoningizni sozlaymiz.
                  </p>
                </div>

                {/* Wallet creation box */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Hamyon turi</p>
                      <p className="text-xs text-slate-900 font-bold">Tizimdagi ilk hisob raqami</p>
                    </div>
                  </div>

                  {/* Input Wallet Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold pl-1">Hamyon nomi</label>
                    <input
                      type="text"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      placeholder="Masalan: Uzcard (Karta) yoki Naqd pul"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-sans"
                    />
                    <div className="flex gap-1.5 pt-1.5 overflow-x-auto scrollbar-none">
                      {['Uzcard (Karta)', 'Naqd pul', 'Humo (Karta)', 'Jamgʻarma'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWalletName(preset)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                            walletName === preset
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Starting Balance */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold pl-1">Boshlangʻich balans</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={walletBalanceStr}
                        onChange={(e) => handleWalletBalanceChange(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-12 py-3 font-mono text-base text-slate-900 font-bold outline-none focus:border-blue-500 transition-all"
                      />
                      <span className="absolute right-4 top-3.5 text-[10px] text-slate-400 font-mono font-bold">UZS</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono pl-1">
                      Real qiymat: <span className="text-slate-700 font-bold">{formatUZS(walletBalanceStr)}</span>
                    </span>
                  </div>
                </div>

                {/* Continue button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="w-full py-4.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer mt-4"
                >
                  DAVOM ETISH
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="step-2"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Section header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={handleBack}
                      className="p-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Orqaga</span>
                  </div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900 font-sans">
                    Kunlik xarajat limitini belgilang
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Xarajatlaringiz nazorati uchun kunlik sarflash chegarasini kiriting. Ushbu limitdan oshsangiz, Maga AI sizni ogohlantiradi.
                  </p>
                </div>

                {/* Limit input box */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Kunlik Chegara</p>
                      <p className="text-xs text-slate-900 font-bold">Smart xarajat nazorati</p>
                    </div>
                  </div>

                  {/* Input Daily Limit */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold pl-1">Chegara miqdori</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dailyLimitStr}
                        onChange={(e) => handleDailyLimitChange(e.target.value)}
                        placeholder="500,000"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-12 py-3 font-mono text-base text-slate-900 font-bold outline-none focus:border-blue-500 transition-all text-center"
                      />
                      <span className="absolute right-4 top-3.5 text-[10px] text-slate-400 font-mono font-bold">UZS</span>
                    </div>
                    <div className="flex gap-1.5 pt-1.5 justify-center">
                      {['100000', '300000', '500000', '1000000'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDailyLimitStr(preset)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                            dailyLimitStr === preset
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {(parseInt(preset) / 1000) + 'K'}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono text-center pt-2">
                      Siz kiritgan limit: <span className="text-slate-700 font-bold">{formatUZS(dailyLimitStr)}</span>
                    </span>
                  </div>
                </div>

                {/* Finish button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFinish}
                  className="w-full py-4.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer mt-4"
                >
                  <CheckCircle className="w-4 h-4" />
                  BOSHLADIK (START)
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
