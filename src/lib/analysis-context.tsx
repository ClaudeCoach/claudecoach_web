"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { SessionSummary } from "@/types";

type AnalysisContextValue = {
  sessions: SessionSummary[];
  setSessions: (sessions: SessionSummary[]) => void;
  clearSessions: () => void;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessionsState] = useState<SessionSummary[]>([]);

  return (
    <AnalysisContext.Provider
      value={{
        sessions,
        setSessions: setSessionsState,
        clearSessions: () => setSessionsState([]),
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
