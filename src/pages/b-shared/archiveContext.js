import { createContext, useContext } from 'react';

// App의 ArchiveBridgeProvider가 제공된 Figma 저장 형식을 팀 형식으로 연결한다.
export const BArchiveContext = createContext(null);

export function useBArchive() {
  return useContext(BArchiveContext);
}
