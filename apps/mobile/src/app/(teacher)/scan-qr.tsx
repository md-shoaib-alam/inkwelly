import React, { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { TeacherQRScanModal } from '@/components/teacher/TeacherQRScanModal';

export default function TeacherScanQRScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  const handleClose = useCallback(() => {
    setVisible(false);
    router.back();
  }, [router]);

  return (
    <TeacherQRScanModal
      visible={visible}
      onClose={handleClose}
      onScanned={() => {
        // Will refresh attendance when navigated back
      }}
    />
  );
}
