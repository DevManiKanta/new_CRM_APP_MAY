import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import initialCustomers, {
  Customer,
  CustomerStatus,
  CustomerTab,
  getTabForStatus,
} from "@/data/customers";

interface CustomerContextValue {
  customers: Customer[];
  getCustomersByTab: (tab: CustomerTab) => Customer[];
  getCustomerById: (id: string) => Customer | undefined;
  updateCustomerStatus: (id: string, status: CustomerStatus) => void;
  searchCustomers: (query: string, tab: CustomerTab) => Customer[];
  filterByStatus: (status: CustomerStatus | "all", tab: CustomerTab) => Customer[];
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const getCustomersByTab = useCallback(
    (tab: CustomerTab) => {
      const filtered = customers.filter((c) => c.tab === tab);
      if (tab === "completed") {
        return filtered.sort(
          (a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime()
        );
      }
      return filtered;
    },
    [customers]
  );

  const getCustomerById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  const updateCustomerStatus = useCallback((id: string, status: CustomerStatus) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newTab = getTabForStatus(status);
        return {
          ...c,
          status,
          tab: newTab,
          lastContact: new Date().toISOString().split("T")[0],
        };
      })
    );
  }, []);

  const searchCustomers = useCallback(
    (query: string, tab: CustomerTab) => {
      const q = query.toLowerCase();
      return customers.filter(
        (c) =>
          c.tab === tab &&
          (c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q))
      );
    },
    [customers]
  );

  const filterByStatus = useCallback(
    (status: CustomerStatus | "all", tab: CustomerTab) => {
      if (status === "all") return customers.filter((c) => c.tab === tab);
      return customers.filter((c) => c.tab === tab && c.status === status);
    },
    [customers]
  );

  const value = useMemo(
    () => ({
      customers,
      getCustomersByTab,
      getCustomerById,
      updateCustomerStatus,
      searchCustomers,
      filterByStatus,
    }),
    [customers, getCustomersByTab, getCustomerById, updateCustomerStatus, searchCustomers, filterByStatus]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomers must be used within CustomerProvider");
  return context;
}
