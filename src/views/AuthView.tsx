/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMagaStore } from '../store';
import { Lock, Mail, User as UserIcon, Globe, ShieldCheck } from 'lucide-react';

export default function AuthView() {
  const login = useMagaStore(state => state.login);
  const register = useMagaStore(state => state.register);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Iltimos, elektron pochtangizni kiriting');
      return;
    }
    if (!password || password.length < 4) {
      setError('Parol kamida 4 ta belgidan iborat boʻlishi kerak');
      return;
    }

    if (isLogin) {
      login(email, name || undefined);
    } else {
      if (!name) {
        setError('Iltimos, ismingizni kiriting');
        return;
      }
      register(email, name);
    }
  };

  const handleGoogleLogin = () => {
    const randomNames = ['Davronbek', 'Ahmadilla', 'Zilola', 'Maftuna', 'Husniddin'];
    const selectedName = randomNames[Math.floor(Math.random() * randomNames.length)];
    login('user@google.com', selectedName);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 z-10 bg-slate-50">
      
      {/* Gentle Light Background Halo */}
      <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-100/30 blur-[80px] pointer-events-none" />

      {/* Language Selector Indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-xs text-slate-500 font-bold shadow-sm">
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        Oʻzbekcha
      </div>

      <div className="w-full max-w-md">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 border border-blue-500 shadow-md mb-3"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans"
          >
            Maga Flow
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] text-slate-400 mt-1 font-mono font-bold tracking-widest uppercase"
          >
            Swiss Minimalist Premium Fintech
          </motion.p>
        </div>

        {/* Premium Pure White Card Container */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.03)] relative overflow-hidden"
        >
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200/50 rounded-2xl mb-8 relative">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className="relative py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10"
            >
              {isLogin && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-white border border-slate-200/50 rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className={isLogin ? 'text-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-600'}>
                Kirish (Login)
              </span>
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className="relative py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10"
            >
              {!isLogin && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-white border border-slate-200/50 rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className={!isLogin ? 'text-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-600'}>
                Roʻyxatdan oʻtish
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {/* Name field (Registration only) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="relative"
                >
                  <label
                    className={`absolute left-10 transition-all pointer-events-none font-sans font-semibold ${
                      focusedInput === 'name' || name
                        ? 'top-1.5 text-[9px] text-blue-600 font-mono uppercase tracking-wider font-bold'
                        : 'top-3.5 text-xs text-slate-400'
                    }`}
                  >
                    Toʻliq Ismingiz
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-xl px-10 pt-5.5 pb-2 text-xs text-slate-900 outline-none transition-all ${
                        focusedInput === 'name'
                          ? 'border-blue-500 ring-1 ring-blue-500 bg-white'
                          : 'border-slate-100'
                      }`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="relative">
              <label
                className={`absolute left-10 transition-all pointer-events-none font-sans font-semibold ${
                  focusedInput === 'email' || email
                    ? 'top-1.5 text-[9px] text-blue-600 font-mono uppercase tracking-wider font-bold'
                    : 'top-3.5 text-xs text-slate-400'
                }`}
              >
                Elektron Pochta (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl px-10 pt-5.5 pb-2 text-xs text-slate-900 outline-none transition-all ${
                    focusedInput === 'email'
                      ? 'border-blue-500 ring-1 ring-blue-500 bg-white'
                      : 'border-slate-100'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <label
                className={`absolute left-10 transition-all pointer-events-none font-sans font-semibold ${
                  focusedInput === 'password' || password
                    ? 'top-1.5 text-[9px] text-blue-600 font-mono uppercase tracking-wider font-bold'
                    : 'top-3.5 text-xs text-slate-400'
                }`}
              >
                Maxfiy Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl px-10 pt-5.5 pb-2 text-xs text-slate-900 outline-none transition-all ${
                    focusedInput === 'password'
                      ? 'border-blue-500 ring-1 ring-blue-500 bg-white'
                      : 'border-slate-100'
                  }`}
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-rose-600 font-mono font-bold bg-rose-50 border border-rose-100 px-3.5 py-2.5 rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide text-xs shadow-sm cursor-pointer"
            >
              {isLogin ? 'KIRISH' : 'ROʻYXATDAN OʻTISH'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">yoki</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Google Login */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            type="button"
            className="w-full py-3.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.39 3.62v3h3.86c2.26-2.08 3.67-5.14 3.67-8.45z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.11C3.18 21.88 7.39 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29a7.18 7.18 0 0 1 0-4.58V6.6H1.21a11.94 11.94 0 0 0 0 10.8l4.06-3.11z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 6.6l4.06 3.11c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            Google orqali kirish
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
