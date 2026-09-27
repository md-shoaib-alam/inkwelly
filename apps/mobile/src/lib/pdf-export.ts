import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ExportReceiptData {
  receiptNumber: string;
  paidDate: string;
  studentName: string;
  studentId?: string;
  parentName?: string;
  className?: string;
  paymentMethod: string;
  paidAmount: number;
  remarks?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolContact?: string;
  schoolLogo?: string;
  feeItems: Array<{
    feeCategoryName: string;
    paidAmount: number;
  }>;
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

/**
 * Recreates the exact school-web receipt layout in HTML and compiles it to a PDF on the mobile device.
 * Then pops the native OS Share/Save-to-Files dialogue sheet.
 */
export async function shareReceiptAsPDF(receipt: ExportReceiptData) {
  const schoolName = receipt.schoolName || "DEMO ACADEMY";
  const schoolAddress = receipt.schoolAddress || "123 Education Lane, Knowledge City, State 456789";
  const schoolContact = receipt.schoolContact || "+91 98765 43210";
  const inWords = `${numberToWords(receipt.paidAmount)} Rupees Only`;

  // Render items rows
  const itemsHtml = receipt.feeItems.map((item, idx) => `
    <tr style="font-size: 11px;">
      <td style="border-right: 1px solid black; padding: 8px; text-align: center;">${idx + 1}</td>
      <td style="border-right: 1px solid black; padding: 8px;">
        <div style="font-weight: bold; text-transform: capitalize;">${item.feeCategoryName || 'Fee Collection'}</div>
        <div style="font-size: 9px; color: #666; font-style: italic; margin-top: 2px;">Academic Fee Session 2025-26</div>
      </td>
      <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold;">
        ${item.paidAmount.toFixed(2)}
      </td>
    </tr>
  `).join('');

  // Exact replication of HTML/CSS structure from AdminReceiptTemplate
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt_${receipt.receiptNumber}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            font-size: 12px;
            line-height: 1.5;
          }
          .border-box {
            border: 1px solid black;
            width: 100%;
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 1px solid black;
            padding: 12px;
          }
          .logo-container {
            width: 56px;
            height: 56px;
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f9f9f9;
            margin-right: 16px;
            font-weight: bold;
            font-size: 24px;
            overflow: hidden;
          }
          .logo-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
            text-align: center;
            margin-right: 56px;
          }
          .header-text h1 {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 2px 0;
            letter-spacing: 0.5px;
          }
          .header-text p {
            font-size: 10px;
            margin: 0 0 2px 0;
          }
          .copy-title {
            text-align: center;
            font-weight: bold;
            border-bottom: 1px solid black;
            padding: 4px 0;
            text-transform: uppercase;
            background-color: #f4f4f5;
            font-size: 11px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1px solid black;
          }
          .info-table td {
            padding: 8px;
            vertical-align: top;
            width: 50%;
          }
          .info-line {
            margin-bottom: 4px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 95px;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1px solid black;
          }
          .item-table th {
            border-bottom: 1px solid black;
            border-right: 1px solid black;
            background-color: #f4f4f5;
            padding: 8px;
            font-size: 10px;
            text-transform: uppercase;
          }
          .item-table th:last-child {
            border-right: none;
          }
          .total-row {
            background-color: #f4f4f5;
            font-weight: bold;
            text-transform: uppercase;
          }
          .total-row td {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 8px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1px solid black;
            background-color: #fafafa;
            font-size: 10px;
          }
          .meta-table td {
            border-right: 1px solid black;
            padding: 6px 8px;
            width: 33.33%;
          }
          .meta-table td:last-child {
            border-right: none;
          }
          .footer-section {
            width: 100%;
            border-collapse: collapse;
          }
          .footer-section td {
            padding: 12px;
            vertical-align: top;
          }
          .notes {
            font-size: 9px;
            color: #555;
            line-height: 1.4;
          }
          .notes p {
            margin: 0 0 2px 0;
          }
          .sig-box {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            height: 80px;
            text-align: center;
          }
          .sig-line {
            width: 120px;
            border-bottom: 1px solid black;
            margin-bottom: 4px;
          }
          .sig-label {
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <div class="logo-container">
              ${receipt.schoolLogo ? `<img src="${receipt.schoolLogo}" class="logo-image" />` : `
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                </svg>
              `}
            </div>
            <div class="header-text">
              <h1>${schoolName}</h1>
              <p>${schoolAddress}</p>
              <p style="font-weight: bold; margin-top: 2px;">Toll free No. ${schoolContact}</p>
              <p style="color: #444;">Email: info@demoacademy.org | Website: www.demoacademy.org</p>
            </div>
          </div>
          
          <div class="copy-title">STUDENT COPY</div>
          
          <table class="info-table">
            <tr>
              <td style="border-right: 1px solid black;">
                <div class="info-line"><span class="info-label">Student ID:</span> <span style="font-family: monospace;">${receipt.studentId?.substring(0, 12).toUpperCase() || "N/A"}</span></div>
                <div class="info-line"><span class="info-label">Student Name:</span> <span style="font-weight: bold; text-transform: uppercase;">${receipt.studentName}</span></div>
                <div class="info-line"><span class="info-label">Mr./Mrs.:</span> <span style="font-weight: bold; text-transform: uppercase; color: #444;">${receipt.parentName || "Guardian"}</span></div>
                <div class="info-line"><span class="info-label">Class:</span> <span>${receipt.className || "N/A"}</span></div>
              </td>
              <td style="background-color: #fafafa;">
                <div class="info-line"><span class="info-label">Receipt No.:</span> <span style="font-weight: bold;">${receipt.receiptNumber}</span></div>
                <div class="info-line"><span class="info-label">Receipt Date:</span> <span>${receipt.paidDate}</span></div>
                <div class="info-line"><span class="info-label">Session:</span> <span>2025-26</span></div>
                <div class="info-line"><span class="info-label">Payment Mode:</span> <span style="text-transform: capitalize; font-weight: 500;">${receipt.paymentMethod}</span></div>
              </td>
            </tr>
          </table>

          <table class="item-table">
            <thead>
              <tr>
                <th style="width: 8%;">S.No.</th>
                <th style="width: 67%; text-align: left;">Particulars</th>
                <th style="width: 25%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="2" style="border-right: 1px solid black; text-align: left; font-weight: bold; padding-left: 12px;">WE THANKFULLY ACKNOWLEDGE THE RECEIPT OF RS.:</td>
                <td style="text-align: right; font-family: monospace;">${receipt.paidAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <table class="meta-table">
            <tr>
              <td><span style="font-weight: bold;">Bank Name:</span> <span style="text-transform: capitalize;">${receipt.paymentMethod === 'cash' ? 'Cash Counter' : receipt.paymentMethod}</span></td>
              <td><span style="font-weight: bold;">Txn Date:</span> <span>${receipt.paidDate}</span></td>
              <td><span style="font-weight: bold;">Txn No:</span> <span style="font-family: monospace;">${receipt.receiptNumber.toUpperCase()}</span></td>
            </tr>
          </table>

          <div style="border-bottom: 1px solid black; padding: 8px; font-size: 10px;">
            <span style="font-weight: bold;">In Words:</span>
            <span style="font-weight: bold; text-transform: capitalize; color: #111;">${inWords}</span>
          </div>

          <div style="border-bottom: 1px solid black; padding: 8px; font-size: 10px; min-height: 25px;">
            <span style="font-weight: bold;">Remarks:</span>
            <span style="font-style: italic;">${receipt.remarks || "N/A"}</span>
          </div>

          <table class="footer-section">
            <tr>
              <td style="width: 65%; border-right: 1px solid black;">
                <div class="notes">
                  <p style="font-weight: bold; color: #000; border-bottom: 1px solid #eee; padding-bottom: 3px; margin-bottom: 5px;">Note:</p>
                  <p>1. Fees once paid are not transferable or refundable under any circumstances.</p>
                  <p>2. Kindly deposit the fee on or before the due date to avoid any inconvenience and fine.</p>
                  <p>3. This receipt is not Addition to Bank Challan / NEFT / Transfer, this is in confirmation of as above transaction.</p>
                  <p>4. This Receipt is valid subject to successful Confirmation of payment.</p>
                  <p>5. Subject to standard School Jurisdiction only.</p>
                  <p>6. For any queries please Email: accounts@demoacademy.org.</p>
                  <p>7. This is a computer generated receipt, no signature is required.</p>
                </div>
              </td>
              <td style="width: 35%; vertical-align: bottom;">
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <div class="sig-label">Accounts Officer</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Receipt ${receipt.receiptNumber}`,
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (error) {
    console.error('Failed to print and share PDF receipt:', error);
    throw error;
  }
}

/**
 * Directly triggers the native OS Print Dialogue / Preview UI for the receipt.
 */
export async function printReceiptAsPDF(receipt: ExportReceiptData) {
  const schoolName = receipt.schoolName || "DEMO ACADEMY";
  const schoolAddress = receipt.schoolAddress || "123 Education Lane, Knowledge City, State 456789";
  const schoolContact = receipt.schoolContact || "+91 98765 43210";
  const inWords = `${numberToWords(receipt.paidAmount)} Rupees Only`;

  const itemsHtml = receipt.feeItems.map((item, idx) => `
    <tr style="font-size: 11px;">
      <td style="border-right: 1px solid black; padding: 8px; text-align: center;">${idx + 1}</td>
      <td style="border-right: 1px solid black; padding: 8px;">
        <div style="font-weight: bold; text-transform: capitalize;">${item.feeCategoryName || 'Fee Collection'}</div>
        <div style="font-size: 9px; color: #666; font-style: italic; margin-top: 2px;">Academic Fee Session 2025-26</div>
      </td>
      <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold;">
        ${item.paidAmount.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt_${receipt.receiptNumber}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            font-size: 12px;
            line-height: 1.5;
          }
          .border-box {
            border: 1px solid black;
            width: 100%;
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 1px solid black;
            padding: 12px;
          }
          .logo-container {
            width: 56px;
            height: 56px;
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f9f9f9;
            margin-right: 16px;
            font-weight: bold;
            font-size: 24px;
            overflow: hidden;
          }
          .logo-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
            text-align: center;
            margin-right: 56px;
          }
          .header-text h1 {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 2px 0;
            letter-spacing: 0.5px;
          }
          .header-text p {
            font-size: 10px;
            margin: 0 0 2px 0;
          }
          .copy-title {
            text-align: center;
            font-weight: bold;
            border-bottom: 1px solid black;
            padding: 4px 0;
            text-transform: uppercase;
            background-color: #f4f4f5;
            font-size: 11px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1px solid black;
          }
          .info-table td {
            padding: 8px;
            vertical-align: top;
            width: 50%;
          }
          .info-line {
            margin-bottom: 4px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 95px;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1px solid black;
          }
          .item-table th {
            border-bottom: 1px solid black;
            border-right: 1px solid black;
            background-color: #f4f4f5;
            padding: 8px;
            font-size: 10px;
            text-transform: uppercase;
          }
          .item-table th:last-child {
            border-right: none;
          }
          .total-row {
            background-color: #f4f4f5;
            font-weight: bold;
            text-transform: uppercase;
          }
          .total-row td {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 8px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1px solid black;
            background-color: #fafafa;
            font-size: 10px;
          }
          .meta-table td {
            border-right: 1px solid black;
            padding: 6px 8px;
            width: 33.33%;
          }
          .meta-table td:last-child {
            border-right: none;
          }
          .footer-section {
            width: 100%;
            border-collapse: collapse;
          }
          .footer-section td {
            padding: 12px;
            vertical-align: top;
          }
          .notes {
            font-size: 9px;
            color: #555;
            line-height: 1.4;
          }
          .notes p {
            margin: 0 0 2px 0;
          }
          .sig-box {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            height: 80px;
            text-align: center;
          }
          .sig-line {
            width: 120px;
            border-bottom: 1px solid black;
            margin-bottom: 4px;
          }
          .sig-label {
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <div class="logo-container">
              ${receipt.schoolLogo ? `<img src="${receipt.schoolLogo}" class="logo-image" />` : '&#127891;'}
            </div>
            <div class="header-text">
              <h1>${schoolName}</h1>
              <p>${schoolAddress}</p>
              <p style="font-weight: bold; margin-top: 2px;">Toll free No. ${schoolContact}</p>
              <p style="color: #444;">Email: info@demoacademy.org | Website: www.demoacademy.org</p>
            </div>
          </div>
          
          <div class="copy-title">STUDENT COPY</div>
          
          <table class="info-table">
            <tr>
              <td style="border-right: 1px solid black;">
                <div class="info-line"><span class="info-label">Student ID:</span> <span style="font-family: monospace;">${receipt.studentId?.substring(0, 12).toUpperCase() || "N/A"}</span></div>
                <div class="info-line"><span class="info-label">Student Name:</span> <span style="font-weight: bold; text-transform: uppercase;">${receipt.studentName}</span></div>
                <div class="info-line"><span class="info-label">Mr./Mrs.:</span> <span style="font-weight: bold; text-transform: uppercase; color: #444;">${receipt.parentName || "Guardian"}</span></div>
                <div class="info-line"><span class="info-label">Class:</span> <span>${receipt.className || "N/A"}</span></div>
              </td>
              <td style="background-color: #fafafa;">
                <div class="info-line"><span class="info-label">Receipt No.:</span> <span style="font-weight: bold;">${receipt.receiptNumber}</span></div>
                <div class="info-line"><span class="info-label">Receipt Date:</span> <span>${receipt.paidDate}</span></div>
                <div class="info-line"><span class="info-label">Session:</span> <span>2025-26</span></div>
                <div class="info-line"><span class="info-label">Payment Mode:</span> <span style="text-transform: capitalize; font-weight: 500;">${receipt.paymentMethod}</span></div>
              </td>
            </tr>
          </table>

          <table class="item-table">
            <thead>
              <tr>
                <th style="width: 8%;">S.No.</th>
                <th style="width: 67%; text-align: left;">Particulars</th>
                <th style="width: 25%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="2" style="border-right: 1px solid black; text-align: left; font-weight: bold; padding-left: 12px;">WE THANKFULLY ACKNOWLEDGE THE RECEIPT OF RS.:</td>
                <td style="text-align: right; font-family: monospace;">${receipt.paidAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <table class="meta-table">
            <tr>
              <td><span style="font-weight: bold;">Bank Name:</span> <span style="text-transform: capitalize;">${receipt.paymentMethod === 'cash' ? 'Cash Counter' : receipt.paymentMethod}</span></td>
              <td><span style="font-weight: bold;">Txn Date:</span> <span>${receipt.paidDate}</span></td>
              <td><span style="font-weight: bold;">Txn No:</span> <span style="font-family: monospace;">${receipt.receiptNumber.toUpperCase()}</span></td>
            </tr>
          </table>

          <div style="border-bottom: 1px solid black; padding: 8px; font-size: 10px;">
            <span style="font-weight: bold;">In Words:</span>
            <span style="font-weight: bold; text-transform: capitalize; color: #111;">${inWords}</span>
          </div>

          <div style="border-bottom: 1px solid black; padding: 8px; font-size: 10px; min-height: 25px;">
            <span style="font-weight: bold;">Remarks:</span>
            <span style="font-style: italic;">${receipt.remarks || "N/A"}</span>
          </div>

          <table class="footer-section">
            <tr>
              <td style="width: 65%; border-right: 1px solid black;">
                <div class="notes">
                  <p style="font-weight: bold; color: #000; border-bottom: 1px solid #eee; padding-bottom: 3px; margin-bottom: 5px;">Note:</p>
                  <p>1. Fees once paid are not transferable or refundable under any circumstances.</p>
                  <p>2. Kindly deposit the fee on or before the due date to avoid any inconvenience and fine.</p>
                  <p>3. This receipt is not Addition to Bank Challan / NEFT / Transfer, this is in confirmation of as above transaction.</p>
                  <p>4. This Receipt is valid subject to successful Confirmation of payment.</p>
                  <p>5. Subject to standard School Jurisdiction only.</p>
                  <p>6. For any queries please Email: accounts@demoacademy.org.</p>
                  <p>7. This is a computer generated receipt, no signature is required.</p>
                </div>
              </td>
              <td style="width: 35%; vertical-align: bottom;">
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <div class="sig-label">Accounts Officer</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  try {
    await Print.printAsync({ html: htmlContent });
  } catch (error) {
    console.error('Failed to trigger native print layout view:', error);
    throw error;
  }
}
