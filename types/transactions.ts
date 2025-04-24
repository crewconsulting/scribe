export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  tag: string | null;
}

export interface SortConfig {
  key: keyof Transaction;
  direction: 'asc' | 'desc';
}

export interface TransactionFilters {
  searchTerm: string;
  selectedTag: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  page: number;
  pageSize: number;
  sort: SortConfig;
}