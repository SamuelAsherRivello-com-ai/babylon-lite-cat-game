import type { ReactNode } from "react";
import { createContext, useContext } from "react";

const ContentShellContext = createContext({ paused: false });

export function ContentShellProvider({ paused, children }: { paused: boolean; children: ReactNode }) {
  return <ContentShellContext.Provider value={{ paused }}>{children}</ContentShellContext.Provider>;
}

export function useContentShell() {
  return useContext(ContentShellContext);
}
