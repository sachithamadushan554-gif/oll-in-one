
import React from "react";

export enum InvoiceStatus {
  Paid = 'Paid',
  Partial = 'Partial',
  Overdue = 'Overdue'
}

export interface Customer {
  name: string;
  phone: string;
  address: string;
  photoUrl?: string;
  nickname?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  barcode?: string;
  imei?: string; // New field for default/tracking IMEI
  defaultDownPayment?: number;
  defaultInstallmentCount?: number;
  allowedInstallmentMonths?: number[];
  interestRates?: Record<number, number>; // Mapping: Month Count -> Total Interest Amount
}

export interface BlacklistedCustomer {
    id: string;
    name: string;
    phone: string;
    reason: string;
    createdAt: string;
}

export interface InvoiceItem {
    productId?: number;
    description: string;
    imei: string;
    quantity: number;
    price: number;
    amount: number;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
}

export interface Installment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  snoozedUntil?: string;
  paymentId?: string;
  paidAmount?: number;
  paidAt?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Invoice {
  id: string;
  accountNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discount?: Discount;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  interestRate?: number;
  installments: Installment[];
  payments: Payment[];
  status: InvoiceStatus;
  createdAt: string;
  paymentMode?: 'full' | 'installment';
  // Legal/Compliance fields for installments
  idNumber?: string;
  signature?: string;
  idPhotoFront?: string;
  idPhotoBack?: string;
  legalData?: { idNumber: string; signature: string; idPhotoFront: string; idPhotoBack: string } | null;
}

export interface ShopDetails {
  name: string;
  address: string;
  phone1: string;
  phone2: string;
  paymentMethod: string;
  logoUrl?: string;
  digitalSeal?: string;
  digitalSignature?: string;
}

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  completed: boolean;
}

export type PaperSize = 'A4' | 'A5' | 'A6';

export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface AppSettings {
    reminderLeadTime: number;
    lastBackupDate?: string;
    nextBackupDate?: string;
    autoBackupEnabled: boolean;
    autoBackupFrequency: BackupFrequency;
    invoicePaperSize: PaperSize;
    lockCode?: string;
    autoLockTimeout?: number;
    viewMode: 'pc' | 'mobile';
    syncId?: string;
    isAutoSyncEnabled: boolean;
    lastSyncedAt?: string;
    whatsappUpcomingTemplate?: string;
    whatsappOverdueTemplate?: string;
}

export interface BlankBillItem {
    model: string;
    imei: string;
    rate: string;
    qty: string;
    amount: string;
}

export interface BlankBillData {
    customer: {
        name: string;
        phone: string;
        address: string;
    };
    invoiceNumber: string;
    date: string;
    items: BlankBillItem[];
    subtotal: string;
    discountValue: string;
    total: string;
    notes?: string;
}

export type BlankBillRecord = BlankBillData;

export type BlankBillTemplateStyle = 'vibrant' | 'professional' | 'modern' | 'classic' | 'compact' | 'creative';

export interface BlankBillSettings {
    paymentMethod: string;
    termsAndConditions: string;
    footerMessage: string;
    templateStyle: BlankBillTemplateStyle;
    quickActionPaymentUrl: string;
    quickActionWebsiteUrl: string;
    paperSize: PaperSize;
    logoOpacity: number;
    viewMode: 'pc' | 'mobile';
}

export interface BlankBillTemplate {
    id: string;
    name: string;
    items: BlankBillItem[];
    discountType: 'percentage' | 'fixed';
    discountValue: number;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'completed';

export interface RecurringInvoice {
    id: string;
    customer: Customer;
    items: InvoiceItem[];
    frequency: RecurringFrequency;
    amount: number;
    startDate: string;
    nextGenerationDate: string;
    lastGeneratedDate?: string;
    status: RecurringStatus;
    totalCycles?: number;
    completedCycles: number;
    notes?: string;
}

export interface AppState {
    invoices: Invoice[];
    products: Product[];
    tasks: Task[];
    settings: AppSettings;
    blacklist?: BlacklistedCustomer[];
    blankBillLog?: BlankBillRecord[];
    blankBillTemplates?: BlankBillTemplate[];
    blankBillSettings?: BlankBillSettings;
    recurringInvoices?: RecurringInvoice[];
}

export interface AppNotification {
  id: string;
  type: 'invoice-reminder' | 'invoice-overdue' | 'system-backup';
  title: string;
  message: string;
  relatedId: string;
  createdAt: string;
  isRead: boolean;
}

export type ActiveTab = 'dashboard' | 'billing' | 'invoices' | 'products' | 'tasks' | 'settings' | 'reports' | 'customers' | 'calendar' | 'recurring' | 'faq';
export type QuickActionId = 'create-new-bill' | 'manage-products' | 'view-all-invoices' | 'manage-tasks';

export interface QuickAction {
    id: QuickActionId;
    name: string;
    icon: React.ReactElement;
}

export type Language = 'en' | 'si';
export type CollageTemplate = 'grid' | 'passport-sheet' | 'mixed-collage' | 'wallet-size';
