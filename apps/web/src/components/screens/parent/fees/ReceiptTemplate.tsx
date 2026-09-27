import React from "react";
import { GraduationCap } from "lucide-react";

interface ReceiptTemplateProps {
  studentName: string;
  fee: {
    id: string;
    type: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    paidAt?: string;
  };
  schoolName?: string;
  schoolAddress?: string;
  schoolContact?: string;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ studentName, fee, schoolName = "DEMO ACADEMY", schoolAddress = "123 Education Lane, Knowledge City, State 456789", schoolContact = "+91 98765 43210" }, ref) => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return (
      <div ref={ref} className="p-10 bg-white text-black w-full max-w-[700px] mx-auto font-serif print:p-12 border border-zinc-300">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6 mb-8">
          <div className="flex gap-4">
            <div className="size-16 border-2 border-black flex items-center justify-center">
              <GraduationCap size={40} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-semibold uppercase tracking-tight">{schoolName}</h1>
              <p className="text-[10px] leading-tight max-w-[250px]">{schoolAddress}</p>
              <p className="text-[10px] font-bold mt-1">Contact: {schoolContact}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold border-2 border-black px-4 py-1 inline-block mb-3">FEE RECEIPT</h2>
            <div className="text-[11px] font-medium space-y-1">
              <p>Receipt No: <span className="font-bold underline">{fee.id.substring(0, 8).toUpperCase()}</span></p>
              <p>Date: <span className="font-bold underline">{today}</span></p>
            </div>
          </div>
        </div>

        {/* Received From Section */}
        <div className="space-y-6 mb-10 text-sm">
          <div className="flex items-end gap-2">
            <span className="whitespace-nowrap">Received with thanks from:</span>
            <div className="flex-1 border-b border-dotted border-black font-bold pb-0.5">
              {studentName.toUpperCase()}
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="flex items-end gap-2 flex-1">
              <span className="whitespace-nowrap">Of Class:</span>
              <div className="flex-1 border-b border-dotted border-black font-bold pb-0.5">
                GRADE: 2025-26
              </div>
            </div>
            <div className="flex items-end gap-2 flex-1">
              <span className="whitespace-nowrap">Section:</span>
              <div className="flex-1 border-b border-dotted border-black font-bold pb-0.5">
                A
              </div>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="whitespace-nowrap">Towards Payment of:</span>
            <div className="flex-1 border-b border-dotted border-black font-bold pb-0.5 capitalize">
              {fee.type} Fee (Academic Session 2025-26)
            </div>
          </div>
        </div>

        {/* Amount Table */}
        <div className="mb-12">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-zinc-100">
                <th className="border border-black p-2 text-left w-12">S.No.</th>
                <th className="border border-black p-2 text-left">Description</th>
                <th className="border border-black p-2 text-right w-32">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="min-h-[100px]">
                <td className="border border-black p-2 text-left align-top">1.</td>
                <td className="border border-black p-2 text-left align-top h-32">
                  <p className="font-bold capitalize">{fee.type} Fee Collection</p>
                  <p className="text-[10px] mt-2 italic text-zinc-600">Payment received via Online Portal</p>
                </td>
                <td className="border border-black p-2 text-right align-top font-bold">
                  {fee.amount.toLocaleString()}.00
                </td>
              </tr>
              <tr className="bg-zinc-50">
                <td colSpan={2} className="border border-black p-2 text-right font-bold uppercase tracking-wider">
                  Total Amount Received
                </td>
                <td className="border border-black p-2 text-right font-bold text-lg">
                  ₹{fee.paidAmount.toLocaleString()}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-start mb-16 text-[11px] italic">
          <p className="max-w-[300px]">
            * Note: This is an electronically generated document. No physical signature is mandatory for validation. Please keep this for future reference.
          </p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end pt-10">
          <div className="text-center w-48">
            <div className="border-b border-black mb-2" />
            <p className="text-xs font-bold uppercase">Parent's Signature</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-black mb-2" />
            <p className="text-xs font-bold uppercase">Cashier / Accountant</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-4 border-t border-zinc-200 text-center">
          <p className="text-[9px] uppercase tracking-widest text-zinc-400">DEMO ACADEMY: Powered by school Management System</p>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = "ReceiptTemplate";

ReceiptTemplate.displayName = "ReceiptTemplate";
