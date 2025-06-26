// Vendor types
export interface Vendor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: Address;
  taxId: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  joinDate: string;
  rating: number;
  totalSales: number;
  productCount: number;
  description?: string;
  logo?: string;
  website?: string;
  bankDetails?: BankDetails;
  commissionRate: number;
  category: string[];
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Product types for vendors
export interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  sku: string;
  images: string[];
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  stock: number;
  lowStockThreshold: number;
  dimensions?: ProductDimensions;
  weight?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  views: number;
  sales: number;
  rating: number;
  reviewCount: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

// Order types for vendors
export interface VendorOrder {
  id: string;
  vendorId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: VendorOrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  vendorAmount: number; // After commission deduction
  commissionAmount: number;
  shippingAddress: Address;
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface VendorOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

// Analytics types
export interface VendorAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  monthlyOrders: number;
  averageOrderValue: number;
  topProducts: ProductSales[];
  revenueChart: ChartData[];
  ordersChart: ChartData[];
  recentOrders: VendorOrder[];
  productPerformance: ProductPerformance[];
}

export interface ProductSales {
  productId: string;
  productName: string;
  sales: number;
  revenue: number;
  image?: string;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  views: number;
  sales: number;
  conversionRate: number;
  revenue: number;
  stock: number;
  status: string;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

// Communication types
export interface Message {
  id: string;
  vendorId: string;
  fromVendor: boolean;
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
  attachments?: MessageAttachment[];
  threadId?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  url: string;
}

// Form types
export interface VendorRegistrationForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: Address;
  taxId: string;
  description: string;
  website?: string;
  category: string[];
  logo?: FileList;
  businessLicense?: FileList;
  taxDocument?: FileList;
}

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  dimensions?: ProductDimensions;
  weight?: number;
  tags: string[];
  images?: FileList;
}

export interface MessageForm {
  subject: string;
  content: string;
  attachments?: FileList;
}

// Authentication types
export interface VendorAuth {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  role: 'vendor';
  status: string;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Settings types
export interface VendorSettings {
  id: string;
  vendorId: string;
  emailNotifications: NotificationSettings;
  smsNotifications: NotificationSettings;
  businessHours: BusinessHours[];
  autoReplyMessage?: string;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  currency: string;
  timezone: string;
}

export interface NotificationSettings {
  newOrders: boolean;
  orderUpdates: boolean;
  lowStock: boolean;
  messages: boolean;
  promotions: boolean;
}

export interface BusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}
