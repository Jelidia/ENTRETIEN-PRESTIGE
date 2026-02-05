"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CompanyInfo = {
  name?: string | null;
};

type CompanyContextValue = {
  company: CompanyInfo | null;
  refresh: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export function CompanyProvider({
  children,
  initialCompany = null,
}: {
  children: React.ReactNode;
  initialCompany?: CompanyInfo | null;
}) {
  const [company, setCompany] = useState<CompanyInfo | null>(initialCompany);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/access");
    if (!response.ok) {
      return;
    }
    const json = await response.json().catch(() => ({}));
    const name = json?.companyName ?? json?.data?.companyName ?? null;
    setCompany((prev) => ({ ...(prev ?? {}), name }));
  }, []);

  useEffect(() => {
    if (initialCompany) {
      return;
    }
    void refresh();
  }, [initialCompany, refresh]);

  const value = useMemo<CompanyContextValue>(
    () => ({ company, refresh }),
    [company, refresh]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    return { company: null, refresh: async () => undefined };
  }
  return context;
}
