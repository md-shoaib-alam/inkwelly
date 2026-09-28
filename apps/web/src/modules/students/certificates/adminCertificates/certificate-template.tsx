'use client';

import { GraduationCap } from 'lucide-react';

interface CertificateTemplateProps {
  cert: any;
  formatDate: (d: string) => string;
  schoolName?: string;
  affiliation?: string;
  schoolAddress?: string;
}

export function CertificateTemplate({ cert, formatDate, schoolName, affiliation, schoolAddress }: CertificateTemplateProps) {
  if (!cert) return null;

  const displaySchoolName = schoolName || '';
  const displayAffiliation = affiliation || '';
  const displayAddress = schoolAddress || '';

  const getParentName = () => cert.content?.parentName || '';

  const getBodyText = () => {
    const studentName = cert.content?.studentName || cert.student?.user?.name || 'the student';
    const className = cert.content?.class
      ? `${cert.content.class.grade} - ${cert.content.class.name} (${cert.content.class.section})`
      : 'the institution';

    switch (cert.certificateType) {
      case 'transfer': return `This certificate is issued to certify that ${studentName} has been a bonafide student of class ${className} of this institution. The student is leaving the school and this transfer certificate is issued for admission to another institution.`;
      case 'bonafide': return `This is to certify that ${studentName} is a bonafide student of class ${className} of ${displaySchoolName}. This certificate is issued for the purpose of ${cert.content?.notes ? `"${String(cert.content.notes)}"` : 'official verification'}.`;
      case 'character': return `This is to certify that ${studentName} has been a student of this institution in class ${className}. During the student's tenure, they have maintained good conduct, discipline, and character. The student bears a good moral character.`;
      case 'migration': return `This migration certificate is issued to facilitate the transfer of ${studentName} from ${displaySchoolName} to another recognized educational institution. The student has successfully completed the academic requirements of class ${className}.`;
      case 'provisional': return `This provisional certificate is issued to ${studentName} pending the issuance of the final certificate. The student has appeared for the qualifying examination from class ${className} of this institution.`;
      default: return `This certificate is issued to ${studentName} of class ${className}.`;
    }
  };

  return (
    <div className="print-container bg-white">
      <div className="relative cert-frame flex flex-col border-4 border-double border-amber-600 rounded-lg p-8 sm:p-12 bg-white mx-auto dark:bg-white dark:text-zinc-900 min-h-[250mm]">
        
        {/* Decorative Corners */}
        <div className="absolute top-2 left-2 size-12 border-t-[3px] border-l-[3px] border-amber-600 rounded-tl-md" />
        <div className="absolute top-2 right-2 size-12 border-t-[3px] border-r-[3px] border-amber-600 rounded-tr-md" />
        <div className="absolute bottom-2 left-2 size-12 border-b-[3px] border-l-[3px] border-amber-600 rounded-bl-md" />
        <div className="absolute bottom-2 right-2 size-12 border-b-[3px] border-r-[3px] border-amber-600 rounded-br-md" />

        {/* School Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="flex items-center justify-center gap-4">
            <div className="size-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border-2 border-amber-200">
              <GraduationCap className="size-10" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-semibold text-amber-900 tracking-tight uppercase font-serif whitespace-nowrap" style={{ fontFamily: 'Georgia, serif' }}>{displaySchoolName}</h2>
            <p className="text-sm font-medium text-zinc-700 italic">{displayAffiliation}</p>
            <p className="text-xs text-zinc-600">{displayAddress}</p>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center mb-10">
          <h3 className="text-4xl font-semibold text-amber-800 uppercase tracking-[0.2em] mb-2 drop-shadow-sm">
            {(cert.certificateType || '').toUpperCase().split(' ')[0]}
          </h3>
          <h4 className="text-xl font-semibold text-amber-700 uppercase tracking-widest mb-3">CERTIFICATE</h4>
          <p className="text-xs text-zinc-500 font-mono">CERTIFICATE NO: <span className="font-bold text-zinc-800">{cert.certificateNo}</span></p>
        </div>

        {/* Body */}
        <div className="space-y-8 max-w-2xl mx-auto text-center flex-1">
          <p className="text-lg text-zinc-700 italic leading-relaxed">This is to certify that</p>
          <div className="relative py-2 px-4 inline-block mx-auto min-w-[300px] border-b-2 border-amber-600/30">
            <p className="text-3xl font-bold text-zinc-900 uppercase tracking-wider font-serif">
              {cert.content?.studentName || cert.student?.user?.name || ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-left border border-zinc-200 bg-zinc-50/50 rounded-xl p-8 mt-6">
            <DetailRow label="Roll Number" value={cert.content?.rollNumber || cert.student?.rollNumber || ''} />
            <DetailRow label="Class / Grade" value={cert.content?.class ? `${cert.content.class.grade} - ${cert.content.class.name}` : ''} />
            <DetailRow label="Date of Birth" value={formatDate(cert.content?.dateOfBirth || '')} />
            <DetailRow label="Gender" value={cert.content?.gender || ''} />
            <DetailRow label="Parent's Name" value={getParentName()} />
            <DetailRow label="Admission Date" value={formatDate(cert.content?.admissionDate || '')} />
          </div>

          <p className="text-md text-[#374151] leading-[1.8] font-normal mt-6 px-4">{getBodyText()}</p>
          
          {cert.content?.notes && (
            <div className="mt-6 p-4 border border-dashed border-amber-300 rounded-lg bg-zinc-50/50">
              <p className="text-[10px] uppercase font-bold text-amber-800 mb-1 tracking-wider">REMARKS</p>
              <p className="text-sm text-zinc-600 italic">{String(cert.content.notes)}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-auto pt-6 border-t border-amber-100">
          <div className="text-left">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">DATE OF ISSUE</p>
            <p className="text-sm font-semibold text-[#1F2937]">{formatDate(cert.issueDate)}</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b-2 border-zinc-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">PRINCIPAL</p>
          </div>
        </div>

        {cert.status === 'revoked' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-50">
            <span className="text-9xl font-black text-red-600 rotate-[-25deg] border-[20px] border-red-600 p-8 rounded-3xl">REVOKED</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-base font-bold text-[#1F2937]">{value || ''}</p>
    </div>
  );
}
