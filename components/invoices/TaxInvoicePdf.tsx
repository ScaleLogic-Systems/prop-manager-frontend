// components/invoices/TaxInvoicePdf.tsx

'use client';

import React from 'react';

interface TaxInvoiceProps {
  agency: {
    agency_name: string;
    kra_pin?: string;
    branch_id?: string;
    contact_email?: string;
    phone?: string;
  };
  invoice: {
    id: string;
    created_at: string;
    unit_number: string;
    tenant_name: string;
    tenant_kra_pin?: string;
    amount: number;
    vat_amount?: number;
    cu_serial_number?: string;
    cu_invoice_number?: string;
    etims_qr_code_url?: string;
    etims_status: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_category: string;
    taxable_amount: number;
    vat_amount: number;
    total_amount: number;
  }>;
}

export const TaxInvoicePdf: React.FC<TaxInvoiceProps> = ({ agency, invoice, items }) => {
  const taxableTotal = items
    .filter((i) => i.tax_category === 'B_STANDARD_16')
    .reduce((acc, curr) => acc + curr.taxable_amount, 0);

  const exemptTotal = items
    .filter((i) => i.tax_category === 'A_EXEMPT')
    .reduce((acc, curr) => acc + curr.taxable_amount, 0);

  const vatTotal = items.reduce((acc, curr) => acc + curr.vat_amount, 0);
  const grandTotal = invoice.amount;

  return (
    <div className="max-w-3xl mx-auto bg-white text-slate-900 p-8 border border-slate-200 shadow-lg rounded-xl text-xs font-sans">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
            {agency.agency_name}
          </h1>
          <p className="text-slate-500 mt-1">{agency.contact_email} | {agency.phone}</p>
          <div className="mt-2 space-y-0.5">
            <p><span className="font-semibold text-slate-700">KRA PIN:</span> <span className="font-mono">{agency.kra_pin || 'N/A'}</span></p>
            <p><span className="font-semibold text-slate-700">Branch ID:</span> <span className="font-mono">{agency.branch_id || '00'}</span></p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded font-bold text-xs uppercase tracking-wider mb-2">
            Tax Invoice
          </span>
          <p className="font-mono text-slate-600 font-semibold">#{invoice.id}</p>
          <p className="text-slate-500 mt-1">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Bill To Info */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100 flex justify-between">
        <div>
          <h3 className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">Billed To (Tenant)</h3>
          <p className="font-bold text-slate-800 text-sm">{invoice.tenant_name}</p>
          <p className="text-slate-600">Unit Number: <span className="font-semibold">{invoice.unit_number}</span></p>
        </div>
        <div className="text-right">
          <h3 className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">Tenant KRA PIN</h3>
          <p className="font-mono text-slate-800 font-semibold">{invoice.tenant_kra_pin || 'N/A (Individual)'}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-900 text-slate-700 uppercase text-[10px]">
            <th className="py-2 px-1">Description</th>
            <th className="py-2 px-1 text-center">Qty</th>
            <th className="py-2 px-1 text-right">Unit Price</th>
            <th className="py-2 px-1 text-center">Tax Code</th>
            <th className="py-2 px-1 text-right">Taxable</th>
            <th className="py-2 px-1 text-right">VAT</th>
            <th className="py-2 px-1 text-right">Total (KES)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-3 px-1 font-medium text-slate-800">{item.description}</td>
              <td className="py-3 px-1 text-center font-mono">{item.quantity}</td>
              <td className="py-3 px-1 text-right font-mono">{item.unit_price.toLocaleString()}</td>
              <td className="py-3 px-1 text-center font-mono font-bold text-indigo-600">
                {item.tax_category === 'B_STANDARD_16' ? 'B (16%)' : 'A (Exempt)'}
              </td>
              <td className="py-3 px-1 text-right font-mono">{item.taxable_amount.toLocaleString()}</td>
              <td className="py-3 px-1 text-right font-mono">{item.vat_amount.toLocaleString()}</td>
              <td className="py-3 px-1 text-right font-mono font-semibold">{item.total_amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tax Summary & Totals */}
      <div className="flex justify-between items-start border-t border-slate-200 pt-4 mb-8">
        <div className="text-slate-500 space-y-1 text-[11px]">
          <p><span className="font-semibold">Tax Category Codes:</span></p>
          <p>A = Exempt (Residential Rent, 0% VAT)</p>
          <p>B = Standard Rate (Commercial Rent / Utilities, 16% VAT)</p>
        </div>
        <div className="w-64 space-y-2 text-right">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Amount (16%):</span>
            <span className="font-mono">KES {taxableTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Exempt Amount (0%):</span>
            <span className="font-mono">KES {exemptTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
            <span>Total VAT (16%):</span>
            <span className="font-mono">KES {vatTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
            <span>Grand Total:</span>
            <span className="font-mono">KES {grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* KRA eTIMS Verification Footer */}
      <div className="border-t-2 border-dashed border-slate-300 pt-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">KRA eTIMS Fiscal Clearance</p>
          <p className="mt-1"><span className="font-semibold text-slate-700">CU Serial No:</span> <span className="font-mono text-indigo-700">{invoice.cu_serial_number || 'Pending Signature'}</span></p>
          <p><span className="font-semibold text-slate-700">eTIMS Invoice No:</span> <span className="font-mono text-indigo-700">{invoice.cu_invoice_number || 'Pending Signature'}</span></p>
          <p className="text-[10px] text-slate-400 mt-2">This is a legally valid tax invoice generated in compliance with the Kenya Revenue Authority.</p>
        </div>

        {invoice.etims_qr_code_url && (
          <div className="text-center">
            {/* Replace with dynamic QR code component or image source */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(invoice.etims_qr_code_url)}`}
              alt="KRA eTIMS QR Code Verification"
              className="w-20 h-20 border border-slate-300 p-1 rounded bg-white mx-auto"
            />
            <span className="text-[9px] text-slate-400 block mt-1">Scan to Verify KRA Tax Signature</span>
          </div>
        )}
      </div>
    </div>
  );
};