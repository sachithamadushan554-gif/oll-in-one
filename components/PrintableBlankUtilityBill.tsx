import React from 'react';
import type { ShopDetails, PaperSize } from '../types';

interface PrintableBlankUtilityBillProps {
  shopDetails: ShopDetails;
  paperSize?: PaperSize;
}

const PrintableBlankUtilityBill: React.FC<PrintableBlankUtilityBillProps> = ({ shopDetails, paperSize = 'A6' }) => {
  return (
    <div className={`print-page ${paperSize.toLowerCase()} p-6 bg-white text-gray-800 font-sans text-sm mx-auto border border-gray-300`}>
      {/* Header */}
      <header className="text-center pb-3 border-b-2 border-gray-800">
        <h1 className="text-2xl font-bold tracking-wider text-gray-900">{shopDetails.name}</h1>
        <p className="text-xs text-gray-600">{shopDetails.address}</p>
        <p className="text-xs text-gray-600">Tel: {shopDetails.phone1}, {shopDetails.phone2}</p>
      </header>
      
      <h2 className="text-xl font-semibold text-gray-700 text-center uppercase my-4">Utility Bill Receipt</h2>

      {/* Details */}
      <section className="my-4 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-600 w-20">Date:</span>
          <span className="border-b border-dotted border-gray-400 flex-grow"></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-600 w-20">Customer:</span>
          <span className="border-b border-dotted border-gray-400 flex-grow"></span>
        </div>
        <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-600 w-20">Phone:</span>
            <span className="border-b border-dotted border-gray-400 flex-grow"></span>
        </div>
        <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-600 w-20">Bill Type:</span>
            <span className="border-b border-dotted border-gray-400 flex-grow"></span>
        </div>
        <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-600 w-20">Account No:</span>
            <span className="border-b border-dotted border-gray-400 flex-grow"></span>
        </div>
      </section>

      {/* Payment Details Table */}
      <section className="my-4 pt-2">
        <table className="w-full text-left text-xs">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-2">Bill Amount</td>
              <td className="p-2 text-right">Rs. <span className="inline-block w-20 border-b border-dotted border-gray-400"></span></td>
            </tr>
             <tr className="border-b border-gray-200">
              <td className="p-2">Service Fee</td>
              <td className="p-2 text-right">Rs. <span className="inline-block w-20 border-b border-dotted border-gray-400"></span></td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="font-bold">
                <td className="p-2 text-right">Total Paid:</td>
                <td className="p-2 text-right text-base">Rs. <span className="inline-block w-24 border-b-2 border-gray-600"></span></td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Footer */}
      <footer className="mt-6 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500">
        <p className="font-semibold mb-1">Thank you for your payment!</p>
      </footer>
    </div>
  );
};

export default PrintableBlankUtilityBill;
