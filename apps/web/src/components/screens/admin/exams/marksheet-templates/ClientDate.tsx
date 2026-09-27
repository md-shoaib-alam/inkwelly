import React, { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => new Date().toLocaleDateString();
const getServerSnapshot = () => '';

export const ClientDate: React.FC = () => {
  const dateStr = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <>{dateStr}</>;
};

