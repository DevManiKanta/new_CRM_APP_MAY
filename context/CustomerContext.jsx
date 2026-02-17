import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import initialCustomers, {
  Customer,
  CustomerStatus,
  CustomerTab,
  getTabForStatus,
} from "@/data/customers";

export interface CallLog {
  id: string;
  customerId: string;
  customerName: string;
  status: CustomerStatus;
  timestamp: string;
  date: string;
}

interface CustomerContextValue {
  customers: Customer[];
  callLogs: CallLog[];
  getCustomersByTab: (tab: CustomerTab) => Customer[];
  getCustomerById: (id: string) => Customer | undefined;
  updateCustomerStatus: (id: string, status: CustomerStatus) => void;
  searchCustomers: (query: string, tab: CustomerTab) => Customer[];
  filterByStatus: (status: CustomerStatus | "all", tab: CustomerTab) => Customer[];
  getTodayStats: () => {
    totalCalls: number;
    attempted: number;
    pending: number;
    completed: number;
    interested: number;
    busy: number;
    notResponded: number;
    askedTime: number;
    pickedCall: number;
  };
  getCallLogsByDate: (date: string) => CallLog[];
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

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
    setCustomers((prev) => {
      const customer = prev.find((c) => c.id === id);
      if (customer) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const newLog: CallLog = {
          id: generateId(),
          customerId: id,
          customerName: customer.name,
          status,
          timestamp: now.toISOString(),
          date: dateStr,
        };
        setCallLogs((logs) => [newLog, ...logs]);
      }
      return prev.map((c) => {
        if (c.id !== id) return c;
        const newTab = getTabForStatus(status);
        return {
          ...c,
          status,
          tab: newTab,
          lastContact: new Date().toISOString().split("T")[0],
        };
      });
    });
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

  const getTodayStats = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = callLogs.filter((l) => l.date === today);

    const activeCustomers = customers.filter((c) => c.tab === "active");
    const pendingCount = activeCustomers.filter(
      (c) => c.status === "not_responded" || c.status === "busy"
    ).length;

    return {
      totalCalls: todayLogs.length,
      attempted: todayLogs.length,
      pending: pendingCount,
      completed: todayLogs.filter((l) => l.status === "completed").length,
      interested: todayLogs.filter((l) => l.status === "interested").length,
      busy: todayLogs.filter((l) => l.status === "busy").length,
      notResponded: todayLogs.filter((l) => l.status === "not_responded").length,
      askedTime: todayLogs.filter((l) => l.status === "asked_time").length,
      pickedCall: todayLogs.filter((l) => l.status === "picked_call").length,
    };
  }, [callLogs, customers]);

  const getCallLogsByDate = useCallback(
    (date: string) => callLogs.filter((l) => l.date === date),
    [callLogs]
  );

  const value = useMemo(
    () => ({
      customers,
      callLogs,
      getCustomersByTab,
      getCustomerById,
      updateCustomerStatus,
      searchCustomers,
      filterByStatus,
      getTodayStats,
      getCallLogsByDate,
    }),
    [customers, callLogs, getCustomersByTab, getCustomerById, updateCustomerStatus, searchCustomers, filterByStatus, getTodayStats, getCallLogsByDate]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomers must be used within CustomerProvider");
  return context;
}
