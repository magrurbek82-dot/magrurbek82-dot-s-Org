/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'daromad' | 'xarajat';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: 'karta' | 'naqd' | 'jamgirma' | 'boshqa';
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  walletId: string;
  description?: string;
}

export interface User {
  email: string;
  name: string;
  passcodeEnabled: boolean;
  faceIdEnabled: boolean;
  premiumUser: boolean;
  dailyLimit: number;
  onboardingCompleted: boolean;
  joinedDate: string;
}

export type ActiveTab = 'home' | 'tahlil' | 'maga-ai' | 'settings';
