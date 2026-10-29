import { useEffect, useState } from 'react';
import { BArchiveContext } from './archiveContext';
import { ARCHIVE_KEY, createArchiveBridge } from './archiveBridge';

export default function ArchiveBridgeProvider({ children }) {
  const [bridge] = useState(() => createArchiveBridge({ getStorage: () => window.localStorage }));
  const [snapshot, setSnapshot] = useState(() => bridge.getSnapshot());
  useEffect(() => {
    const unsubscribe = bridge.subscribe(() => setSnapshot(bridge.getSnapshot()));
    const onStorage = event => { if (event.key === ARCHIVE_KEY || event.key === null) bridge.refresh(); };
    window.addEventListener('storage', onStorage);
    return () => { unsubscribe(); window.removeEventListener('storage', onStorage); };
  }, [bridge]);
  return <BArchiveContext.Provider value={{ ...snapshot, createWorkWithReview: bridge.createWorkWithReview, addReview: bridge.addReview, updateReview: bridge.updateReview, refresh: bridge.refresh }}>{children}</BArchiveContext.Provider>;
}
