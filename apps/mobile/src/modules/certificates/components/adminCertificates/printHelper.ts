import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import { CertificateRecord, formatDate, getBodyText } from './types';

export const handlePrintCertificate = async (
  cert: CertificateRecord,
  tenantDetails: any,
  user: any
) => {
  const studentName = cert.content?.studentName || cert.student?.user?.name || '  ';
  const classInfo = cert.content?.class;
  const className = classInfo ? `${classInfo.grade} - ${classInfo.name}` : '  ';
  const dob = formatDate(cert.content?.dateOfBirth || '');
  const parentName = cert.content?.parentName || '  ';
  const admissionDate = formatDate(cert.content?.admissionDate || '');
  const rollNumber = cert.content?.rollNumber || cert.student?.rollNumber || '  ';
  const gender = cert.content?.gender || '  ';
  const issueDate = formatDate(cert.issueDate);
  const bodyText = getBodyText(cert, tenantDetails, user?.tenantName);
  const notes = cert.content?.notes || '';
  const isRevoked = cert.status === 'revoked';
  const schoolName = tenantDetails.tenantName || user?.tenantName || '';
  const affiliation = tenantDetails.affiliation || '';
  const address = tenantDetails.tenantAddress || '';

  const remarksHtml = notes ? `
  <div class="remarks-box" style="border: 1px dashed #FCD34D; background-color: #FAFAFA; border-radius: 8px; padding: 12px; max-width: 600px; margin: 15px auto 0 auto; box-sizing: border-box; text-align: left;">
    <div class="remarks-label" style="font-size: 10px; font-weight: bold; color: #78350F; letter-spacing: 1px; margin-bottom: 4px;">REMARKS</div>
    <div class="remarks-val" style="font-size: 13px; font-style: italic; color: #4B5563;">${notes}</div>
  </div>
  ` : '';

  const revokedHtml = isRevoked ? `
  <div class="revoked-watermark" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; background-color: rgba(255,255,255,0.75); border-radius: 6px; z-index: 100; pointer-events: none;">
    <div class="revoked-stamp" style="font-size: 72px; font-weight: 900; color: #DC2626; border: 8px solid #DC2626; padding: 15px 30px; border-radius: 20px; transform: rotate(-20deg); letter-spacing: 2px;">REVOKED</div>
  </div>
  ` : '';

  const certHtml = `
    <div class="print-container bg-white" style="box-sizing: border-box; width: 210mm; height: 297mm; padding: 10mm; margin: auto; display: flex; align-items: center;">
      <div class="relative cert-frame flex flex-col border-amber-800 rounded-lg bg-white mx-auto text-zinc-900" style="position: relative; display: flex; flex-direction: column; border: 6px double #d97706; box-sizing: border-box; padding: 40px; height: 277mm; max-height: 277mm; width: 100%;">
        
        <!-- Decorative Corners -->
        <div style="position: absolute; width: 30px; height: 30px; border-color: #d97706; border-style: solid; border-width: 0; top: 10px; left: 10px; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 4px;"></div>
        <div style="position: absolute; width: 30px; height: 30px; border-color: #d97706; border-style: solid; border-width: 0; top: 10px; right: 10px; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 4px;"></div>
        <div style="position: absolute; width: 30px; height: 30px; border-color: #d97706; border-style: solid; border-width: 0; bottom: 10px; left: 10px; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 4px;"></div>
        <div style="position: absolute; width: 30px; height: 30px; border-color: #d97706; border-style: solid; border-width: 0; bottom: 10px; right: 10px; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 4px;"></div>

        <!-- School Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <div style="width: 58px; height: 58px; border-radius: 50%; background-color: #FFFBEB; display: flex; align-items: center; justify-content: center; border: 2px solid #FEF3C7; color: #d97706;">
              <svg style="width: 34px; height: 34px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>
            </div>
          </div>
          <div>
            <h2 style="font-size: 26px; font-weight: bold; color: #78350F; text-transform: uppercase; font-family: 'Georgia', serif; white-space: nowrap; margin: 3px 0;">${schoolName}</h2>
            <p style="font-size: 13px; color: #4B5563; font-style: italic; margin: 2px 0;">${affiliation}</p>
            <p style="font-size: 11px; color: #6B7280; margin: 2px 0;">${address}</p>
          </div>
        </div>

        <!-- Certificate Title -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h3 style="font-size: 34px; font-weight: 500; color: #78350F; letter-spacing: 4px; text-transform: uppercase; margin: 3px 0 0 0;">
            ${cert.certificateType.toUpperCase()}
          </h3>
          <h4 style="font-size: 18px; font-weight: 600; color: #d97706; letter-spacing: 5px; margin: 3px 0 8px 0;">CERTIFICATE</h4>
          <p style="font-size: 11px; font-family: monospace; color: #6B7280;">CERTIFICATE NO: <span style="color: #111827; font-weight: 800;">${cert.certificateNo}</span></p>
        </div>

        <!-- Body -->
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; flex: 1;">
          <p style="font-size: 16px; font-style: italic; color: #4B5563; margin-bottom: 12px;">This is to certify that</p>
          <div style="border-bottom: 2px solid rgba(217, 119, 6, 0.3); display: inline-block; min-width: 300px; padding-bottom: 12px; margin-bottom: 30px;">
            <p style="font-size: 26px; font-weight: bold; color: #111827; text-transform: uppercase; margin: 0; font-family: 'Georgia', serif;">
              ${studentName}
            </p>
          </div>

          <!-- Detail Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; border: 1px solid #E5E7EB; background-color: #F9FAFB; border-radius: 8px; padding: 20px 32px; width: 100%; box-sizing: border-box; text-align: left; margin-top: 15px; margin-bottom: 30px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="font-size: 11px; font-weight: bold; color: #4B5563; text-transform: uppercase; margin: 0 0 2px 0; tracking-wider">Roll Number</p>
              <p style="font-size: 15px; font-weight: bold; color: #1F2937; margin: 0;">${rollNumber}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="font-size: 11px; font-weight: bold; color: #4B5563; text-transform: uppercase; margin: 0 0 2px 0; tracking-wider">Class / Grade</p>
              <p style="font-size: 15px; font-weight: bold; color: #1F2937; margin: 0;">${className}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="font-size: 11px; font-weight: bold; color: #4B5563; text-transform: uppercase; margin: 0 0 2px 0; tracking-wider">Date of Birth</p>
              <p style="font-size: 15px; font-weight: bold; color: #1F2937; margin: 0;">${dob}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="font-size: 11px; font-weight: bold; color: #4B5563; text-transform: uppercase; margin: 0 0 2px 0; tracking-wider">Gender</p>
              <p style="font-size: 15px; font-weight: bold; color: #1F2937; margin: 0;">${gender}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="font-size: 11px; font-weight: bold; color: #4B5563; text-transform: uppercase; margin: 0 0 2px 0; tracking-wider">Parent's Name</p>
              <p style="font-size: 15px; font-weight: bold; color: #1F2937; margin: 0;">${parentName}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="font-size: 11px; font-weight: bold; color: #4B5563; text-transform: uppercase; margin: 0 0 2px 0; tracking-wider">Admission Date</p>
              <p style="font-size: 15px; font-weight: bold; color: #1F2937; margin: 0;">${admissionDate}</p>
            </div>
          </div>

          <p style="font-size: 15px; line-height: 1.7; color: #374151; max-width: 650px; margin: 10px auto 25px auto; font-weight: 500;">${bodyText}</p>
          
          ${remarksHtml}
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 15px; border-top: 1px solid #F3F4F6; width: 100%;">
          <div style="text-align: left;">
            <p style="font-size: 10px; font-weight: bold; color: #9CA3AF; letter-spacing: 1px; margin-bottom: 4px; text-transform: uppercase;">DATE OF ISSUE</p>
            <p style="font-size: 14px; font-weight: bold; color: #374151;">${issueDate}</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 140px; height: 1.5px; background-color: #9CA3AF; margin-bottom: 6px;"></div>
            <p style="font-size: 12px; font-weight: bold; color: #111827; text-transform: uppercase;">PRINCIPAL</p>
          </div>
        </div>

        ${revokedHtml}
      </div>
    </div>
  `;

  const htmlContent = `
    <html>
      <head>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { 
              margin: 0 !important; 
              padding: 0 !important;
              background: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            padding: 0;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
      </head>
      <body>
        ${certHtml}
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      Alert.alert('Error', 'Failed to initialize print window.');
      return;
    }

    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(htmlContent);
    iframe.contentWindow?.document.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 500);
  } else {
    try {
      await Print.printAsync({ html: htmlContent });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to print certificate.');
    }
  }
};
