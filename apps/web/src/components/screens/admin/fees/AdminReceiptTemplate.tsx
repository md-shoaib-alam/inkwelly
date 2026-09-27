import React from "react";
import { GraduationCap } from "lucide-react";
import type { FeeReceipt } from "./types";

interface AdminReceiptTemplateProps {
  receipt: FeeReceipt;
  parentName?: string;
  className?: string;
  remainingAmount?: number;
  schoolName?: string;
  schoolAddress?: string;
  schoolContact?: string;
  schoolLogo?: string;
}

// Convert amount to words helper
function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  
  const tempNum = num.toString().split(".");
  const number = parseInt(tempNum[0]);
  
  let words = '';
  
  if (number < 20) {
    words += a[number];
  } else if (number < 100) {
    words += b[Math.floor(number / 10)] + ' ' + a[number % 10];
  } else if (number < 1000) {
    words += a[Math.floor(number / 100)] + 'Hundred ' + numberToWords(number % 100);
  } else if (number < 100000) {
    words += numberToWords(Math.floor(number / 1000)) + 'Thousand ' + numberToWords(number % 1000);
  } else if (number < 10000000) {
    words += numberToWords(Math.floor(number / 100000)) + 'Lakh ' + numberToWords(number % 100000);
  } else {
    words += numberToWords(Math.floor(number / 10000000)) + 'Crore ' + numberToWords(number % 10000000);
  }
  
  return words.trim();
}

export const AdminReceiptTemplate = React.forwardRef<HTMLDivElement, AdminReceiptTemplateProps>(
  ({ receipt, parentName = "", className = "", remainingAmount = 0, schoolName = "DEMO ACADEMY", schoolAddress = "123 Education Lane, Knowledge City, State 456789", schoolContact = "+91 98765 43210", schoolLogo }, ref) => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const inWords = `${numberToWords(receipt.paidAmount)} Rupees Only`;

    return (
      <div ref={ref} className="p-4 bg-white text-black w-full max-w-[800px] mx-auto font-sans print:p-6 text-[12px] leading-relaxed">
        {/* Main Box Border */}
        <div className="border border-black">
          {/* Header Panel */}
          <div className="flex items-center border-b border-black p-3">
            <div className="w-16 h-16 border border-zinc-300 flex items-center justify-center bg-zinc-50 shrink-0 mr-4 overflow-hidden">
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
              ) : (
                <GraduationCap size={40} className="text-black" />
              )}
            </div>
            <div className="flex-1 text-center pr-12">
              <h1 className="text-base font-bold uppercase tracking-wide">{schoolName}</h1>
              <p className="text-[10px] leading-normal font-medium">{schoolAddress}</p>
              <p className="text-[10px] font-semibold mt-0.5">Toll free No. {schoolContact}</p>
              <p className="text-[10px] font-medium">Email: info@demoacademy.org Website: www.demoacademy.org</p>
            </div>
          </div>

          {/* Subheader / Copy Title */}
          <div className="text-center font-bold border-b border-black py-1 uppercase tracking-wide bg-zinc-50 text-[11px]">
            Student Copy
          </div>

          {/* Student & Parent Details Grid */}
          <div className="grid grid-cols-12 border-b border-black">
            {/* Left Block: Student Info */}
            <div className="col-span-7 border-r border-black p-2.5 space-y-1">
              <div><span className="font-semibold inline-block w-24">Student ID:</span><span className="font-mono">{receipt.studentId?.substring(0, 12).toUpperCase() || "N/A"}</span></div>
              <div><span className="font-semibold inline-block w-24">Student Name:</span><span className="font-bold uppercase">{receipt.studentName}</span></div>
              <div><span className="font-semibold inline-block w-24">Mr./Mrs.:</span><span className="font-bold uppercase text-zinc-700">{parentName || "Guardian"}</span></div>
              <div><span className="font-semibold inline-block w-24">Class:</span><span>{className || "N/A"}</span></div>
            </div>

            {/* Right Block: Receipt Info */}
            <div className="col-span-5 p-2.5 space-y-1 bg-zinc-50/50">
              <div><span className="font-semibold inline-block w-24">Receipt No.:</span><span className="font-bold">{receipt.receiptNumber}</span></div>
              <div><span className="font-semibold inline-block w-24">Receipt Date:</span><span>{receipt.paidDate}</span></div>
              <div><span className="font-semibold inline-block w-24">Session:</span><span>2025-26</span></div>
              <div><span className="font-semibold inline-block w-24">Payment Mode:</span><span className="capitalize font-medium">{receipt.paymentMethod}</span></div>
            </div>
          </div>

          {/* Particulars Table Header */}
          <div className="grid grid-cols-12 border-b border-black font-bold uppercase tracking-wider bg-zinc-100 text-[10px] text-center">
            <div className="col-span-9 border-r border-black py-1.5 text-left pl-3">Particulars</div>
            <div className="col-span-3 py-1.5 text-right pr-4">Amount</div>
          </div>

          {/* Particulars Items */}
          <div className="min-h-[140px] divide-y divide-zinc-200">
            {receipt.feeItems && receipt.feeItems.map((item, index) => (
              <div key={item.id || index} className="grid grid-cols-12 text-[11px] py-2 items-center">
                <div className="col-span-9 pl-3 pr-2">
                  <div className="font-bold capitalize">{item.feeCategoryName || 'Fee Collection'}</div>
                  <div className="text-[9px] text-zinc-500 italic">Academic Fee Session 2025-26</div>
                </div>
                <div className="col-span-3 text-right pr-4 font-mono font-bold">
                  {item.paidAmount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Total Receipt Row */}
          <div className="grid grid-cols-12 border-t border-b border-black font-bold uppercase text-[11px] bg-zinc-50">
            <div className="col-span-9 border-r border-black py-2 pl-3">WE THANKFULLY ACKNOWLEDGE THE RECEIPT OF Rs.:</div>
            <div className="col-span-3 py-2 text-right pr-4 font-mono text-xs">{receipt.paidAmount.toFixed(2)}</div>
          </div>

          {/* Bank Transaction Info */}
          <div className="grid grid-cols-12 border-b border-black text-[10px] bg-zinc-100/50">
            <div className="col-span-4 border-r border-black p-1.5"><span className="font-semibold">Bank Name:</span> <span className="capitalize font-medium">{receipt.paymentMethod === 'cash' ? 'Cash Counter' : receipt.paymentMethod}</span></div>
            <div className="col-span-4 border-r border-black p-1.5"><span className="font-semibold">Txn Date:</span> <span className="font-medium">{receipt.paidDate}</span></div>
            <div className="col-span-4 p-1.5"><span className="font-semibold">Txn No:</span> <span className="font-mono font-medium">{receipt.id.substring(0, 16).toUpperCase()}</span></div>
          </div>

          {/* In Words */}
          <div className="border-b border-black p-2 text-[10px]">
            <span className="font-semibold">In Words : </span>
            <span className="font-bold capitalize text-zinc-900">{inWords}</span>
          </div>

          {/* Remarks */}
          <div className="border-b border-black p-2 text-[10px] min-h-[35px]">
            <span className="font-semibold">Remarks : </span>
            <span className="italic">{receipt.remarks || "N/A"}</span>
          </div>

          {/* Note / Terms Grid */}
          <div className="grid grid-cols-12 text-[9px] leading-relaxed">
            <div className="col-span-8 p-3 border-r border-black space-y-0.5 text-zinc-600">
              <p className="font-bold text-black border-b border-zinc-200 pb-1 mb-1">Note :</p>
              <p>1. Fees once paid are not transferable or refundable under any circumstances.</p>
              <p>2. Kindly deposit the fee on or before the due date to avoid any inconvenience and fine.</p>
              <p>3. This receipt is not Addition to Bank Challan / NEFT / Transfer, this is in confirmation of as above transaction.</p>
              <p>4. This Receipt is valid subject to successful Confirmation of payment.</p>
              <p>5. Subject to standard School Jurisdiction only.</p>
              <p>6. For any queries please Email: accounts@demoacademy.org.</p>
              <p>7. This is a computer generated receipt, no signature is required.</p>
            </div>
            <div className="col-span-4 p-3 flex flex-col justify-end items-center bg-zinc-50/30">
              <div className="w-32 border-b border-black mb-1.5" />
              <p className="font-bold text-[9px] uppercase tracking-wide">Accounts Officer</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AdminReceiptTemplate.displayName = "AdminReceiptTemplate";
