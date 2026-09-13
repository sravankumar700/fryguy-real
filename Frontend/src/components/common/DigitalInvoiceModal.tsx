import React from "react";
import { X, Printer, CheckCircle2, ShieldCheck, Download } from "lucide-react";

interface DigitalInvoiceModalProps {
  invoiceData: {
    brandName: string;
    brandSlug?: string;
    logoUrl?: string;
    invoiceNumber: string;
    orderNumber: number;
    source?: string;
    orderType?: string;
    table?: string;
    customer?: string;
    date: string;
    items: {
      name: string;
      variant?: string;
      qty: number;
      price: number;
      addons?: string[];
    }[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    transactionRef?: string;
  };
  onClose: () => void;
}

export function DigitalInvoiceModal({ invoiceData, onClose }: DigitalInvoiceModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="digital-invoice-overlay" className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        id="digital-invoice-modal-card"
        className="bg-white w-full max-w-md rounded-2xl border border-[#E8E2DE] shadow-2xl overflow-hidden my-auto"
      >
        {/* Top Action Bar */}
        <div className="p-3.5 bg-[#171717] text-white flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-[#218739]" />
            Paperless Digital Invoice
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-invoice-btn"
              onClick={handlePrint}
              className="px-2.5 py-1 rounded bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              id="close-invoice-btn"
              onClick={onClose}
              className="p-1 text-[#A3A3A3] hover:text-white rounded hover:bg-[#3A3A3A]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div className="p-6 sm:p-7 space-y-5 bg-white text-[#171717]" id="printable-invoice-content">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-[#E8E2DE]">
            <div className="flex justify-center mb-2">
              <img
                src={invoiceData.brandSlug === "fryguy" || !invoiceData.brandSlug ? "/favicon.svg" : (invoiceData.logoUrl || "/favicon.svg")}
                alt="Brand Logo"
                className="w-12 h-12 object-contain rounded-xl shadow-xs"
              />
            </div>
            <div className="inline-block font-['Archivo_Black'] text-2xl tracking-tight text-[#ED1C24] uppercase">
              {invoiceData.brandName}
            </div>
            <p className="text-[11px] text-[#737373] mt-0.5 uppercase tracking-wider font-semibold">
              The Destination Food Hub • Central Location
            </p>
            <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#FFE8E9] text-[#B90F18] font-bold text-[10px] tracking-wider uppercase">
              Paid • {invoiceData.paymentMethod}
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#737373] block text-[10px] uppercase font-bold">Invoice Number</span>
              <span className="font-mono font-bold text-[#171717]">{invoiceData.invoiceNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[#737373] block text-[10px] uppercase font-bold">Order Number</span>
              <span className="font-['Archivo_Black'] text-[#ED1C24]">#{invoiceData.orderNumber}</span>
            </div>
            <div>
              <span className="text-[#737373] block text-[10px] uppercase font-bold">Location / Table</span>
              <span className="font-semibold text-[#171717]">{invoiceData.table || "Table"}</span>
            </div>
            <div className="text-right">
              <span className="text-[#737373] block text-[10px] uppercase font-bold">Date & Time</span>
              <span className="text-[#3A3A3A]">
                {new Date(invoiceData.date).toLocaleDateString()} {new Date(invoiceData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {invoiceData.customer && (
              <div className="col-span-2 pt-1">
                <span className="text-[#737373] block text-[10px] uppercase font-bold">Customer</span>
                <span className="font-medium text-[#171717]">{invoiceData.customer}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-[#E8E2DE] py-3">
            <div className="text-[11px] font-bold text-[#737373] uppercase grid grid-cols-12 pb-1.5 border-b border-[#F2ECE8]">
              <span className="col-span-7">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>

            <div className="space-y-2.5 pt-2">
              {invoiceData.items.map((it, idx) => (
                <div key={idx} className="text-xs grid grid-cols-12 items-start">
                  <div className="col-span-7 pr-1">
                    <div className="font-semibold text-[#171717] leading-snug">{it.name}</div>
                    {it.variant && (
                      <div className="text-[10px] text-[#737373]">{it.variant}</div>
                    )}
                    {it.addons && it.addons.length > 0 && (
                      <div className="text-[10px] text-[#B90F18] font-medium">
                        + {it.addons.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-center font-bold text-[#3A3A3A]">
                    {it.qty}
                  </div>
                  <div className="col-span-3 text-right font-['Archivo_Black'] text-[#171717]">
                    ₹{it.price * it.qty}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#737373]">
              <span>Subtotal</span>
              <span className="font-medium">₹{invoiceData.subtotal}</span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between text-[#218739] font-semibold">
                <span>Promotional Discount</span>
                <span>-₹{invoiceData.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-['Archivo_Black'] text-[#171717] pt-2 border-t border-[#E8E2DE]">
              <span>Total Paid</span>
              <span className="text-[#ED1C24]">₹{invoiceData.total}</span>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="text-center pt-3 border-t border-dashed border-[#E8E2DE] text-[10px] text-[#737373] space-y-1">
            <p className="flex items-center justify-center gap-1 font-semibold text-[#171717]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#218739]" />
              Digital Record Verified • Transaction Ref: {invoiceData.transactionRef || "TXN-VERIFIED"}
            </p>
            <p>100% Paperless Food Destination Platform</p>
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="p-3 bg-[#FFF9F5] border-t border-[#E8E2DE] text-center print:hidden">
          <button
            id="done-viewing-invoice-btn"
            onClick={onClose}
            className="w-full py-2 bg-[#171717] text-white rounded-xl text-xs font-['Archivo_Black'] hover:bg-[#3A3A3A] transition-colors"
          >
            CLOSE INVOICE
          </button>
        </div>
      </div>
    </div>
  );
}
