import React from 'react';
import type { BlankBillData, ShopDetails, BlankBillSettings } from '../types';
import PrintableBlankBill from './PrintableBlankBill';

interface PrintableMultiBlankBillProps {
    bills: BlankBillData[];
    shopDetails: ShopDetails;
    settings: BlankBillSettings;
}

const PrintableMultiBlankBill: React.FC<PrintableMultiBlankBillProps> = ({ bills, shopDetails, settings }) => {
    return (
        <div className="print-page a4 bg-white mx-auto h-[297mm] w-[210mm] overflow-hidden grid grid-cols-2 grid-rows-2 relative print:shadow-none">
            {/* Horizontal Cut Line */}
            <div className="absolute top-1/2 left-0 w-full h-px border-t border-dashed border-slate-200 z-10 pointer-events-none no-print"></div>
            {/* Vertical Cut Line */}
            <div className="absolute left-1/2 top-0 w-px h-full border-l border-dashed border-slate-200 z-10 pointer-events-none no-print"></div>
            
            {bills.map((billData, index) => (
                <div key={index} className="w-full h-full border-r border-b border-slate-50 last:border-0 overflow-hidden">
                    <PrintableBlankBill 
                        billData={billData} 
                        shopDetails={shopDetails} 
                        settings={settings} 
                        isNested={true} 
                    />
                </div>
            ))}
        </div>
    );
};

export default PrintableMultiBlankBill;