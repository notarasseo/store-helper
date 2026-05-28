export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: Category;
  price: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  description: string;
}

export interface SaleItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Sale {
  _id: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  profit: number;
  note: string;
  status: 'Valid' | 'Void';
  createdAt: string;
}

export interface DashboardData {
  totalRevenue: number;
  totalProfit: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlySalesCount: number;
  totalProducts: number;
  lowStockProducts: number;
  revenueByDay: { _id: string; revenue: number; profit: number }[];
  topProducts: { _id: string; totalQty: number; totalRevenue: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
