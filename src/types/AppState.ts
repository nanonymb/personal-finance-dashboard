import { Transaction } from '@/types/Transaction';
import { Note } from '@/types/Note';

export interface SettingsState {
  currency: string;
  dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd';
  language: string;
}

export interface TransactionState {
  transactions: Transaction[];
}

export interface NoteState {
  notes: Note[];
}