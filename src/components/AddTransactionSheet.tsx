/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Wallet as WalletIcon, Check } from 'lucide-react';
import { useMagaStore } from '../store';
import Numpad from './Numpad';

const INCOME_CATEGORIES = [
  '💼 Oylik',
  '📈 Investitsiya',
  '🎁 Sovgʻa',
  '💰 Keshbek',
  '➕ Boshqa'
];

const EXPENSE_CATEGORIES = [
  '🍔 Oziq-ovqat',
  '🚕 Transport',
  '🍿 Koʻngilochar',
  '🏠 Ijara',
  '💡 Kommunal',
  '👕 Kiyim',
  '❤️ Sogʻliq',
  '➕ Boshqa'
];

export default function AddTransactionSheet() {
  const isAddSheetOpen = useMagaStore(state => state.isAddSheetOpen);
  const setAddSheetOpen = useMagaStore(state => state.setAddSheetOpen);
  const wallets = useMagaStore(state => state.wallets);
  const addTransaction = useMagaStore(state => state.addTransaction);

  const [type, setType] = useState<'daromad' | 'xarajat'>('xarajat');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [dateType, setDateType] = useState<'bugun' | 'kecha' | 'boshqa'>('bugun');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [description, setDescription] = useState('');

  if (!isAddSheetOpen) return null;

  const activeCategories = type === 'daromad' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleCategorySelect = (cat: string) => {
    if (cat === '➕ Boshqa') {
      setShowCustomCategoryInput(true);
      setCategory('Boshqa');
    } else {
      setShowCustomCategoryInput(false);
      setCategory(cat);
    }
  };

  const getFinalDate = () => {
    const today = new Date();
    if (dateType === 'bugun') {
      return today.toISOString().split('T')[0];
    } else if (dateType === 'kecha') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return customDate;
  };

  const handleSave = () => {
    const finalAmount = parseInt(amountStr, 10);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Iltimos, noldan katta miqdor kiriting');
      return;
    }

    const finalCategory = showCustomCategoryInput && customCategory ? `➕ ${customCategory}` : category;
    const finalDate = getFinalDate();

    addTransaction(
      finalAmount,
      type,
      finalCategory,
      finalDate,
      selectedWalletId || wallets[0]?.id || 'wallet-1',
      description || undefined
    );

    // Reset state and close
    setAmountStr('0');
    setDescription('');
    setCustomCategory('');
    setShowCustomCategoryInput(false);
    setAddSheetOpen(false);
  };

  const formattedAmount = parseInt(amountStr, 10).toLocaleString('uz-UZ');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAddSheetOpen(false)}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Sheet container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-white border-t border-slate-100 rounded-t-[32px] p-6 pb-8 z-10 max-h-[92vh] overflow-y-auto shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
        >
          {/* Header indicator bar */}
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

          {/* Close & Title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${type === 'daromad' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              Yangi amal qo'shish
            </h2>
            <button
              onClick={() => setAddSheetOpen(false)}
              className="p-1.5 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type Toggle: Daromad / Xarajat */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 border border-slate-100 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setType('xarajat');
                setCategory(EXPENSE_CATEGORIES[0]);
              }}
              className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'xarajat'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Xarajat (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('daromad');
                setCategory(INCOME_CATEGORIES[0]);
              }}
              className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'daromad'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Daromad (Income)
            </button>
          </div>

          {/* Amount Display */}
          <div className="text-center py-4 mb-5 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r opacity-[0.03] pointer-events-none ${
              type === 'daromad' ? 'from-emerald-500 to-transparent' : 'from-rose-500 to-transparent'
            }`} />
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Kiritilgan miqdor</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className={`text-3xl font-mono font-bold tracking-tight ${
                type === 'daromad' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {formattedAmount}
              </span>
              <span className="text-xs font-bold text-slate-500 ml-1">UZS</span>
            </div>
          </div>

          {/* Wallets Horizontal Picker */}
          <div className="mb-4">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold flex items-center gap-1.5 pl-1">
              <WalletIcon className="w-3.5 h-3.5 text-blue-600" />
              Hisob / Hamyon
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 snap-center cursor-pointer ${
                    selectedWalletId === w.id
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Date Toggle */}
          <div className="mb-5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold flex items-center gap-1.5 pl-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Sana
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDateType('bugun')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  dateType === 'bugun'
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Bugun
              </button>
              <button
                type="button"
                onClick={() => setDateType('kecha')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  dateType === 'kecha'
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Kecha
              </button>
              <button
                type="button"
                onClick={() => setDateType('boshqa')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  dateType === 'boshqa'
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {dateType === 'boshqa' ? customDate : 'Boshqa'}
              </button>
            </div>
            {dateType === 'boshqa' && (
              <motion.input
                type="date"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            )}
          </div>

          {/* Category Pill Grid */}
          <div className="mb-5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold pl-1">
              Kategoriya
            </label>
            <div className="grid grid-cols-4 gap-2">
              {activeCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer truncate ${
                    (category === cat && !showCustomCategoryInput) || (cat === '➕ Boshqa' && showCustomCategoryInput)
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                  title={cat}
                >
                  {cat}
                </button>
              ))}
            </div>

            {showCustomCategoryInput && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2.5"
              >
                <input
                  type="text"
                  placeholder="Kategoriya nomi (masalan: Sport)"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </motion.div>
            )}
          </div>

          {/* Description input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Izoh yozing (ixtiyoriy, masalan: tushlik, taxi...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-950 placeholder-slate-400 outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Custom Numpad */}
          <div className="mb-6">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 text-center font-bold">
              Klaviatura
            </label>
            <Numpad value={amountStr} onChange={setAmountStr} />
          </div>

          {/* Saqlash Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleSave}
            disabled={parseInt(amountStr, 10) <= 0}
            className={`w-full py-4 rounded-2xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
              parseInt(amountStr, 10) > 0
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            SAQLASH
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
