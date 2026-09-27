export interface CertificateRecord {
  id: string;
  certificateType: string;
  certificateNo: string;
  issueDate: string;
  content: {
    notes?: string;
    studentName?: string;
    rollNumber?: string;
    class?: {
      grade: string;
      name: string;
      section: string;
    };
    gender?: string;
    parentName?: string;
    admissionDate?: string;
    dateOfBirth?: string;
    affiliation?: string;
    schoolAddress?: string;
  };
  status: string;
  student?: {
    rollNumber: string;
    gender: string;
    user?: {
      name: string;
      email: string;
    };
  };
}

export const CERT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  transfer: { bg: '#EBF8FF', text: '#2B6CB0', border: '#BEE3F8' },
  bonafide: { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  character: { bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF' },
  migration: { bg: '#FFFBEB', text: '#92400E', border: '#FEF3C7' },
  provisional: { bg: '#ECFEFF', text: '#0891B2', border: '#CFFAFE' },
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

export const getBodyText = (cert: CertificateRecord, tenantDetails: any, userRoleOrName?: string) => {
  const studentName = cert.content?.studentName || cert.student?.user?.name || '  ';
  const classInfo = cert.content?.class;
  const className = classInfo
    ? `${classInfo.grade} - ${classInfo.name} (${classInfo.section})`
    : '  ';
  const schoolName = tenantDetails.tenantName || userRoleOrName || '';

  switch (cert.certificateType) {
    case 'transfer':
      return `This certificate is issued to certify that ${studentName} has been a bonafide student of class ${className} of this institution. The student is leaving the school and this transfer certificate is issued for admission to another institution.`;
    case 'bonafide': {
      const notesText = cert.content?.notes ? `"${String(cert.content.notes)}"` : 'official verification';
      return `This is to certify that ${studentName} is a bonafide student of class ${className} of ${schoolName}. This certificate is issued for the purpose of ${notesText}.`;
    }
    case 'character':
      return `This is to certify that ${studentName} has been a student of this institution in class ${className}. During the student's tenure, they have maintained good conduct, discipline, and character. The student bears a good moral character.`;
    case 'migration':
      return `This migration certificate is issued to facilitate the transfer of ${studentName} from ${schoolName} to another recognized educational institution. The student has successfully completed the academic requirements of class ${className}.`;
    case 'provisional':
      return `This provisional certificate is issued to ${studentName} pending the issuance of the final certificate. The student has appeared for the qualifying examination from class ${className} of this institution.`;
    default:
      return `This certificate is issued to ${studentName} of class ${className}.`;
  }
};
