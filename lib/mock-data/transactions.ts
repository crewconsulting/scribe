import { Transaction } from '@/types/transactions';
import { addDays, subDays, format } from 'date-fns';

// 過去2年分のデータを生成
const generateHistoricalData = () => {
  const today = new Date();
  const transactions: Transaction[] = [];
  let id = 1;

  // 固定の取引を追加
  const fixedTransactions = [
    { amount: 350000, description: 'オフィス賃料', tag: 'オフィス賃料' },
    { amount: 128000, description: 'Amazon AWS', tag: 'Amazon AWS' },
    { amount: 45000, description: 'Microsoft 365 E3', tag: 'Microsoft 365' },
    { amount: 85000, description: 'Google Workspace', tag: 'Google Workspace' },
    { amount: 180000, description: 'Salesforce Sales Cloud', tag: 'Salesforce' },
    { amount: 32000, description: 'Zoom Enterprise', tag: 'Zoom' },
    { amount: 15800, description: 'Slack Enterprise', tag: 'Slack' },
    { amount: 25000, description: 'Adobe Creative Cloud', tag: 'Adobe Creative Cloud' },
    { amount: 25000, description: 'Dropbox Business', tag: 'Dropbox Business' },
  ];

  // 過去730日分のデータを生成
  for (let i = 730; i >= 0; i--) {
    const date = subDays(today, i);
    
    // 毎月1日に固定の取引を追加
    if (date.getDate() === 1) {
      fixedTransactions.forEach(transaction => {
        transactions.push({
          id: id++,
          date: format(date, 'yyyy-MM-dd'),
          ...transaction,
        });
      });
    }

    // ランダムな取引を追加（30%の確率）
    if (Math.random() < 0.3) {
      const randomTag = TRANSACTION_TAGS[Math.floor(Math.random() * (TRANSACTION_TAGS.length - 1)) + 1];
      transactions.push({
        id: id++,
        date: format(date, 'yyyy-MM-dd'),
        amount: Math.floor(Math.random() * 500000) + 10000,
        description: `取引 ${id}`,
        tag: randomTag,
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const TRANSACTION_TAGS = [
  '全て',
  'オフィス賃料',
  'Amazon AWS',
  'Microsoft 365',
  'Google Workspace',
  'Salesforce',
  'Zoom',
  'Slack',
  'Adobe Creative Cloud',
  'Dropbox Business',
  '複合機リース',
  'サーバーリース',
  '法人携帯',
  'インターネット',
  'IP電話',
  '駐車場',
] as const;

export const mockTransactions = generateHistoricalData();