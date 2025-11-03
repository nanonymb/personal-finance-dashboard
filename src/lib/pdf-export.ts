import pdfMake from 'pdfmake/build/pdfmake';

// Create a promise for lazy-loading fonts (client-side only)
let fontsPromise: Promise<void> | undefined;
if (typeof window !== 'undefined') {
  fontsPromise = import('pdfmake/build/vfs_fonts').then(() => {
  }).catch((err) => {
    console.error('Failed to load pdfMake fonts:', err);
  });
}

import type { TDocumentDefinitions, Content, Column } from 'pdfmake/interfaces';
import { Transaction } from '@/types/Transaction';

const parseDateForSorting = (date: string): string => {
  const [day, month, year] = date.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

interface UserInfo {
  name: string;
  address: string;
  plz: string;
  city: string;
  logoBase64: string | null;
}

interface ExportData {
  year: string;
  month?: string;
  months: Array<{
    month: string;
    transactions: Transaction[];
  }>;
}

export const exportArchiveToPDF = async (
  data: ExportData,
  userInfo: UserInfo,
  t: (key: string) => string,
  currency: string,
  dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd'
) => {
  if (fontsPromise) {
    await fontsPromise;
  }

  const formatDate = (date: string): string => {
    const [d, m, y] = date.split('.');
    return dateFormat === 'yyyy-mm-dd'
      ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      : `${d}/${m}/${y}`;
  };

  const currentDate = new Date().toLocaleDateString('de-DE');

  // Header columns
  const headerColumns: Column[] = [];

  if (userInfo.name) {
    headerColumns.push({
      text: `${userInfo.name}\n${userInfo.address}\n${userInfo.plz} ${userInfo.city}`,
      fontSize: 10,
      width: 'auto',
    });
  }

  headerColumns.push({ text: '', width: '*' });

  if (userInfo.logoBase64) {
    headerColumns.push({
      image: userInfo.logoBase64,
      width: 60,
      height: 60,
      alignment: 'right',
    });
  }

  // Content array
  const contentArray: Content[] = [];

  const nonEmptyMonths = data.months.filter(m => m.transactions.length > 0);

  if (nonEmptyMonths.length === 0) {
    contentArray.push({
      text: t('archive.no_transactions_in_year') + ` ${data.year}`,
      style: 'header',
      alignment: 'center',
      margin: [0, 100, 0, 0],
    });
  } else {
    nonEmptyMonths.forEach((monthData, index) => {
      const monthNum = parseInt(monthData.month, 10);
      const monthName = t(`archive.months_pdf.${monthNum - 1}`);

      contentArray.push({
        text: `${monthName} ${data.year}`,
        style: 'header',
        pageBreak: index > 0 ? 'before' : undefined,
      });

      // Sort transactions descending (latest date first) to match UI
      const sortedTransactions = monthData.transactions.slice().sort((a, b) => {
        const dateA = parseDateForSorting(a.date);
        const dateB = parseDateForSorting(b.date);
        return dateB.localeCompare(dateA); // Descending order
      });

      // Filter from sorted transactions
      const income = sortedTransactions.filter(t => t.transaction_type === 'income');
      const expenses = sortedTransactions.filter(t => t.transaction_type === 'expense');
      const incomeTotal = income.reduce((s, tx) => s + Math.abs(tx.amount), 0);
      const expenseTotal = expenses.reduce((s, tx) => s + Math.abs(tx.amount), 0);
      const net = incomeTotal - expenseTotal;

      // Income Table
      if (income.length > 0) {
        contentArray.push(
          { text: t('transaction_list.income'), style: 'subheader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: t('archive.description'), style: 'tableHeader' },
                  { text: t('archive.date'), style: 'tableHeader' },
                  { text: t('archive.amount'), style: 'tableHeader' },
                ],
                ...income.map(tx => [
                  tx.description,
                  formatDate(tx.date),
                  `${currency}${Math.abs(tx.amount).toFixed(2)}`,
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          },
          {
            text: `${t('archive.total_income')}: ${currency}${incomeTotal.toFixed(2)}`,
            bold: true,
            fontSize: 11,
            alignment: 'right',
            margin: [0, 5, 0, 15],
          }
        );
      } else {
        contentArray.push({
          text: t('transaction_list.no_income_transactions'),
          fontSize: 11,
          margin: [0, 5, 0, 10],
          color: '#777',
        });
      }

      // Expenses Table
      if (expenses.length > 0) {
        contentArray.push(
          { text: t('transaction_list.expenses'), style: 'subheader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: t('archive.description'), style: 'tableHeader' },
                  { text: t('archive.date'), style: 'tableHeader' },
                  { text: t('archive.amount'), style: 'tableHeader' },
                ],
                ...expenses.map(tx => [
                  tx.description,
                  formatDate(tx.date),
                  `-${currency}${Math.abs(tx.amount).toFixed(2)}`,
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          },
          {
            text: `${t('archive.total_expenses')}: -${currency}${expenseTotal.toFixed(2)}`,
            bold: true,
            fontSize: 11,
            alignment: 'right',
            margin: [0, 5, 0, 15],
          }
        );
      } else {
        contentArray.push({
          text: t('transaction_list.no_expense_transactions'),
          fontSize: 11,
          margin: [0, 5, 0, 10],
          color: '#777',
        });
      }

      // Net Balance
      contentArray.push({
        text: `${t('archive.net_balance')}: ${net >= 0 ? '+' : ''}${currency}${net.toFixed(2)}`,
        bold: true,
        fontSize: 12,
        color: net >= 0 ? '#2e8033' : '#9c3f36',
        alignment: 'right',
        margin: [0, 10, 0, 20],
      });
    });
  }

  // Document Definition
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 110, 40, 60],
    header: (): Content => ({
      margin: [40, 40, 40, 0],
      columns: headerColumns,
    }),
    footer: (currentPage: number, pageCount: number): Content => ({
      columns: [
        { text: `${t('archive.print_date')}: ${currentDate}`, fontSize: 9, margin: [40, 20, 0, 10] },
        { text: `${t('archive.page')} ${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 9, margin: [0, 20, 40, 10] },
      ],
    }),
    content: contentArray,
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 20, 0, 10] },
      subheader: { fontSize: 13, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, fillColor: '#eeeeee' },
    },
  };

  const fileName = `archive_${data.year}${data.month ? `_M${data.month}` : ''}.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
};