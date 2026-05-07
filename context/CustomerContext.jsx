import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import initialCustomers, {
  Customer,
  CustomerStatus,
  CustomerTab,
  getTabForStatus,
} from "@/data/customers";

const CustomerContext = createContext(null);

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [callLogs, setCallLogs] = useState([]);

  const getCustomersByTab = useCallback(
    (tab) => {
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
    (id) => customers.find((c) => c.id === id),
    [customers]
  );

  const addCustomer = useCallback((data) => {
    const id = `c_${generateId()}`;
    const today = new Date().toISOString().split("T")[0];
    const name = String(data?.name || "").trim();
    const initials = name
      ? name
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join("")
      : "NC";

    const status = data?.status || "not_responded";
    const newCustomer = {
      id,
      name,
      phone: String(data?.phone || "").trim(),
      email: String(data?.email || "").trim(),
      company: String(data?.company || "").trim(),
      address: String(data?.address || "").trim(),
      avatar: initials,
      status,
      tab: getTabForStatus(status),
      totalItems: 0,
      totalPayment: 0,
      lastContact: today,
      notes: String(data?.notes || "").trim(),
      items: [],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  }, []);

  const updateCustomerStatus = useCallback((id, status) => {
    setCustomers((prev) => {
      const customer = prev.find((c) => c.id === id);
      if (customer) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const newLog = {
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
    (query, tab) => {
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
    (status, tab) => {
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
    (date) => callLogs.filter((l) => l.date === date),
    [callLogs]
  );

  const value = useMemo(
    () => ({
      customers,
      callLogs,
      getCustomersByTab,
      getCustomerById,
      addCustomer,
      updateCustomerStatus,
      searchCustomers,
      filterByStatus,
      getTodayStats,
      getCallLogsByDate,
    }),
    [customers, callLogs, getCustomersByTab, getCustomerById, addCustomer, updateCustomerStatus, searchCustomers, filterByStatus, getTodayStats, getCallLogsByDate]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomers must be used within CustomerProvider");
  return context;
}
