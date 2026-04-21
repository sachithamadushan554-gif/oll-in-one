import React from 'react';
// FIX: Corrected import path for types
import type { Invoice, Payment, ShopDetails, PaperSize } from '../types';

interface PrintableReceiptProps {
  invoice: Invoice;
  payment: Payment;
  shopDetails: ShopDetails;
  paperSize: PaperSize;
}

const getPaperStyles = (paperSize: PaperSize) => {
    switch (paperSize) {
        case 'A6':
            return {
                container: 'p-4 text-[9px]',
                h1: 'text-xl',
                h2: 'text-lg',
                section: 'my-4',
                sectionGrid: 'grid-cols-1 gap-2',
                customerName: 'text-base',
                detailsContainer: 'text-left text-xs',
                tableCell: 'p-1.5',
                summaryContainer: 'w-full',
                balanceDueContainer: 'p-2 text-base',
                footer: 'mt-8 pt-4',
            };
        case 'A5':
            return {
                container: 'p-6 text-xs',
                h1: 'text-3xl',
                h2: 'text-2xl',
                section: 'my-6',
                sectionGrid: 'grid-cols-2 gap-6',
                customerName: 'text-lg',
                detailsContainer: 'text-right text-sm',
                tableCell: 'p-2',
                summaryContainer: 'w-2/3',
                balanceDueContainer: 'p-3 text-lg',
                footer: 'mt-10 pt-5',
            };
        case 'A4':
        default:
            return {
                container: 'p-10 text-sm',
                h1: 'text-4xl',
                h2: 'text-3xl',
                section: 'my-8',
                sectionGrid: 'grid-cols-2 gap-8',
                customerName: 'text-lg',
                detailsContainer: 'text-right text-sm',
                tableCell: 'p-3',
                summaryContainer: 'w-1/2',
                balanceDueContainer: 'p-3 text-lg',
                footer: 'mt-12 pt-6',
            };
    }
};


const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ invoice, payment, shopDetails, paperSize }) => {
  // Logic for calculating balance remains the same, it's correct.
  const sortedPayments = [...(invoice.payments || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentPaymentIndex = sortedPayments.findIndex(p => p.id === payment.id);
  const paymentsToConsider = currentPaymentIndex !== -1 ? sortedPayments.slice(0, currentPaymentIndex + 1) : [];
  const amountPaidUpToThisPoint = paymentsToConsider.reduce((sum, p) => sum + p.amount, 0);
  const balanceAfterPayment = invoice.totalAmount - amountPaidUpToThisPoint;

  const styles = getPaperStyles(paperSize);
  const logoHeightClass = paperSize === 'A6' ? 'max-h-10' : paperSize === 'A5' ? 'max-h-12' : 'max-h-16';

  return (
    <div className={`print-page ${paperSize.toLowerCase()} bg-white text-gray-800 font-sans mx-auto border-2 border-gray-300 ${styles.container}`}>
      {/* Header */}
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
        <div className="flex items-start gap-4">
          {shopDetails.logoUrl && (
              <img src={shopDetails.logoUrl} alt="Shop Logo" className={`${logoHeightClass} w-auto object-contain`} />
          )}
          <div>
            <h1 className={`${styles.h1} font-bold tracking-wider text-gray-900`}>{shopDetails.name}</h1>
            <p className="text-gray-600">{shopDetails.address}</p>
            <p className="text-gray-600">Tel: {shopDetails.phone1}, {shopDetails.phone2}</p>
          </div>
        </div>
        <h2 className={`${styles.h2} font-semibold text-gray-700 uppercase pt-2 flex-shrink-0`}>Receipt</h2>
      </header>

      {/* Customer and Receipt Details */}
      <section className={`${styles.section} grid ${styles.sectionGrid}`}>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Received From</h3>
          <p className={`font-bold ${styles.customerName}`}>{invoice.customer.name}</p>
          {invoice.customer.phone && <p className="text-gray-600">{invoice.customer.phone}</p>}
        </div>
        <div className={styles.detailsContainer}>
            <div className="mb-2">
                <span className="font-semibold text-gray-600">Receipt No: </span>
                <span className="font-mono">{payment.id}</span>
            </div>
            <div className="mb-2">
                <span className="font-semibold text-gray-600">Payment Date: </span>
                <span>{payment.date}</span>
            </div>
            <div>
                <span className="font-semibold text-gray-600">Original Invoice: </span>
                <span className="font-mono">{invoice.id.substring(0, 8)}</span>
            </div>
        </div>
      </section>

      {/* Payment Details Table */}
      <section className={styles.section}>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${styles.tableCell} font-semibold uppercase`}>Description</th>
              <th className={`${styles.tableCell} font-semibold uppercase text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className={styles.tableCell}>
                {payment.note || `Payment towards Invoice #${invoice.id.substring(0, 8)}`}
              </td>
              <td className={`${styles.tableCell} text-right font-medium`}>Rs. {payment.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Summary Section */}
      <section className="mt-8 flex justify-end">
        <div className={`${styles.summaryContainer} space-y-2`}>
          <div className="flex justify-between text-gray-700">
            <span>Total Paid this transaction:</span>
            <span className="font-semibold">Rs. {payment.amount.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className={`flex justify-between font-bold bg-gray-100 rounded-md ${styles.balanceDueContainer}`}>
            <span>Invoice Balance Due:</span>
            <span>Rs. {balanceAfterPayment.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${styles.footer} border-t border-gray-300 text-center text-gray-500`}>
        <p className="font-semibold mb-1">Thank you for your payment!</p>
        <p>This is a computer-generated receipt and does not require a signature.</p>
      </footer>
    </div>
  );
};

export default PrintableReceipt;