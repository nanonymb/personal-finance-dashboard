export interface Transaction {
  id?: number;
  date: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
}