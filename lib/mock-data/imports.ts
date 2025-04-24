import { ImportHistory, ImportedTransaction } from '@/types/imports';
import { subDays, subHours } from 'date-fns';

export const mockImportHistory: ImportHistory[] = [
  {
    id: '1',
    filename: 'credit_card_202403.csv',
    created_at: subHours(new Date(), 2).toISOString(),
    totalCount: 15,
    transactions: [
      {
        id: '1',
        date: '2024-03-01',
        amount: 350000,
        description: 'オフィス賃料',
        tag: 'オフィス賃料',
      },
      {
        id: '2',
        date: '2024-03-01',
        amount: 128000,
        description: 'Amazon AWS',
        tag: 'Amazon AWS',
      },
      {
        id: '3',
        date: '2024-03-15',
        amount: 45000,
        description: 'Microsoft 365 E3',
        tag: 'Microsoft 365',
      },
    ],
  },
  {
    id: '2',
    filename: 'credit_card_202402.csv',
    created_at: subDays(new Date(), 30).toISOString(),
    totalCount: 12,
    transactions: [
      {
        id: '4',
        date: '2024-02-01',
        amount: 350000,
        description: 'オフィス賃料',
        tag: 'オフィス賃料',
      },
      {
        id: '5',
        date: '2024-02-01',
        amount: 125000,
        description: 'Amazon AWS',
        tag: 'Amazon AWS',
      },
    ],
  },
];