export type CustomerStatus =
  | "not_responded"
  | "busy"
  | "picked_call"
  | "asked_time"
  | "interested"
  | "completed";

export type CustomerTab = "active" | "follow_later" | "completed";

export interface PurchasedItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  date: string;
  category: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  avatar: string;
  status: CustomerStatus;
  tab: CustomerTab;
  totalItems: number;
  totalPayment: number;
  lastContact: string;
  notes: string;
  items: PurchasedItem[];
}

export const STATUS_CONFIG: Record<
  CustomerStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  not_responded: {
    label: "Not Responded",
    color: "#EF4444",
    bg: "#FEE2E2",
    icon: "phone-missed",
  },
  busy: {
    label: "Busy",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "clock",
  },
  picked_call: {
    label: "Picked Call",
    color: "#3B82F6",
    bg: "#DBEAFE",
    icon: "phone-call",
  },
  asked_time: {
    label: "Asked Time",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    icon: "calendar",
  },
  interested: {
    label: "Interested",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "star",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bg: "#D1FAE5",
    icon: "check-circle",
  },
};

export function getTabForStatus(status: CustomerStatus): CustomerTab {
  switch (status) {
    case "not_responded":
    case "busy":
    case "picked_call":
      return "active";
    case "asked_time":
    case "interested":
      return "follow_later";
    case "completed":
      return "completed";
  }
}

const initialCustomers: Customer[] = [
  {
    id: "c1",
    name: "Sarah Mitchell",
    phone: "+1234567890",
    email: "sarah@techcorp.com",
    company: "TechCorp Solutions",
    address: "425 Market St, San Francisco, CA",
    avatar: "SM",
    status: "not_responded",
    tab: "active",
    totalItems: 5,
    totalPayment: 12500,
    lastContact: "2026-02-10",
    notes: "Interested in enterprise plan. Follow up on pricing.",
    items: [
      { id: "i1", name: "Enterprise License", quantity: 1, price: 5000, date: "2026-01-15", category: "Software" },
      { id: "i2", name: "Support Package", quantity: 1, price: 2500, date: "2026-01-15", category: "Service" },
      { id: "i3", name: "Training Sessions", quantity: 3, price: 1500, date: "2026-01-20", category: "Service" },
      { id: "i4", name: "API Access", quantity: 1, price: 2000, date: "2026-02-01", category: "Software" },
      { id: "i5", name: "Data Migration", quantity: 1, price: 1500, date: "2026-02-05", category: "Service" },
    ],
  },
  {
    id: "c2",
    name: "James Rodriguez",
    phone: "+1987654321",
    email: "james@globalretail.com",
    company: "Global Retail Inc",
    address: "789 Broadway, New York, NY",
    avatar: "JR",
    status: "busy",
    tab: "active",
    totalItems: 3,
    totalPayment: 8750,
    lastContact: "2026-02-12",
    notes: "CEO very busy. Try calling after 4 PM.",
    items: [
      { id: "i6", name: "POS System", quantity: 2, price: 3000, date: "2026-01-10", category: "Hardware" },
      { id: "i7", name: "Inventory Module", quantity: 1, price: 2750, date: "2026-01-18", category: "Software" },
      { id: "i8", name: "Staff Training", quantity: 1, price: 3000, date: "2026-02-01", category: "Service" },
    ],
  },
  {
    id: "c3",
    name: "Emily Chen",
    phone: "+1122334455",
    email: "emily@designstudio.co",
    company: "Design Studio Co",
    address: "100 Pine Ave, Los Angeles, CA",
    avatar: "EC",
    status: "picked_call",
    tab: "active",
    totalItems: 4,
    totalPayment: 6200,
    lastContact: "2026-02-13",
    notes: "Picked call, wants a demo next week.",
    items: [
      { id: "i9", name: "Design Suite Pro", quantity: 1, price: 2200, date: "2026-01-05", category: "Software" },
      { id: "i10", name: "Cloud Storage 1TB", quantity: 1, price: 1200, date: "2026-01-12", category: "Software" },
      { id: "i11", name: "Collaboration Tools", quantity: 1, price: 1800, date: "2026-01-25", category: "Software" },
      { id: "i12", name: "Onboarding", quantity: 1, price: 1000, date: "2026-02-10", category: "Service" },
    ],
  },
  {
    id: "c4",
    name: "Michael Brown",
    phone: "+1555666777",
    email: "michael@buildright.io",
    company: "BuildRight IO",
    address: "55 Construction Blvd, Denver, CO",
    avatar: "MB",
    status: "not_responded",
    tab: "active",
    totalItems: 2,
    totalPayment: 4500,
    lastContact: "2026-02-08",
    notes: "Left voicemail twice. Try email follow up.",
    items: [
      { id: "i13", name: "Project Tracker", quantity: 1, price: 2500, date: "2025-12-20", category: "Software" },
      { id: "i14", name: "Reporting Add-on", quantity: 1, price: 2000, date: "2026-01-05", category: "Software" },
    ],
  },
  {
    id: "c5",
    name: "Lisa Park",
    phone: "+1444555666",
    email: "lisa@healthplus.com",
    company: "HealthPlus Medical",
    address: "300 Wellness Dr, Austin, TX",
    avatar: "LP",
    status: "asked_time",
    tab: "follow_later",
    totalItems: 6,
    totalPayment: 18900,
    lastContact: "2026-02-11",
    notes: "Asked to call back next Monday. Very interested in full suite.",
    items: [
      { id: "i15", name: "EMR System", quantity: 1, price: 8000, date: "2025-11-15", category: "Software" },
      { id: "i16", name: "Patient Portal", quantity: 1, price: 3500, date: "2025-12-01", category: "Software" },
      { id: "i17", name: "Billing Module", quantity: 1, price: 2400, date: "2025-12-15", category: "Software" },
      { id: "i18", name: "Staff Licenses x10", quantity: 10, price: 2000, date: "2026-01-10", category: "Software" },
      { id: "i19", name: "Setup & Config", quantity: 1, price: 1500, date: "2026-01-20", category: "Service" },
      { id: "i20", name: "Custom Reports", quantity: 1, price: 1500, date: "2026-02-05", category: "Service" },
    ],
  },
  {
    id: "c6",
    name: "David Kim",
    phone: "+1777888999",
    email: "david@financegroup.com",
    company: "Finance Group Ltd",
    address: "800 Wall St, Chicago, IL",
    avatar: "DK",
    status: "interested",
    tab: "follow_later",
    totalItems: 4,
    totalPayment: 22000,
    lastContact: "2026-02-14",
    notes: "Very interested. Wants to discuss bulk pricing for 50+ seats.",
    items: [
      { id: "i21", name: "Trading Platform", quantity: 1, price: 10000, date: "2026-01-01", category: "Software" },
      { id: "i22", name: "Compliance Module", quantity: 1, price: 5000, date: "2026-01-10", category: "Software" },
      { id: "i23", name: "Analytics Dashboard", quantity: 1, price: 4000, date: "2026-01-20", category: "Software" },
      { id: "i24", name: "Priority Support", quantity: 1, price: 3000, date: "2026-02-01", category: "Service" },
    ],
  },
  {
    id: "c7",
    name: "Anna Williams",
    phone: "+1333222111",
    email: "anna@edulearn.org",
    company: "EduLearn Academy",
    address: "150 Campus Way, Boston, MA",
    avatar: "AW",
    status: "asked_time",
    tab: "follow_later",
    totalItems: 3,
    totalPayment: 7800,
    lastContact: "2026-02-09",
    notes: "Board meeting this week. Call back Friday.",
    items: [
      { id: "i25", name: "LMS Platform", quantity: 1, price: 4000, date: "2025-12-10", category: "Software" },
      { id: "i26", name: "Student Portal", quantity: 1, price: 2300, date: "2026-01-05", category: "Software" },
      { id: "i27", name: "Implementation", quantity: 1, price: 1500, date: "2026-01-25", category: "Service" },
    ],
  },
  {
    id: "c8",
    name: "Robert Taylor",
    phone: "+1666777888",
    email: "robert@logisticspro.com",
    company: "LogisticsPro",
    address: "600 Harbor Rd, Seattle, WA",
    avatar: "RT",
    status: "completed",
    tab: "completed",
    totalItems: 5,
    totalPayment: 15600,
    lastContact: "2026-02-07",
    notes: "Deal closed. All products delivered and setup complete.",
    items: [
      { id: "i28", name: "Fleet Manager", quantity: 1, price: 5000, date: "2025-11-01", category: "Software" },
      { id: "i29", name: "Route Optimizer", quantity: 1, price: 3500, date: "2025-11-15", category: "Software" },
      { id: "i30", name: "GPS Trackers x20", quantity: 20, price: 4000, date: "2025-12-01", category: "Hardware" },
      { id: "i31", name: "Warehouse Module", quantity: 1, price: 2100, date: "2025-12-20", category: "Software" },
      { id: "i32", name: "Training Program", quantity: 1, price: 1000, date: "2026-01-10", category: "Service" },
    ],
  },
  {
    id: "c9",
    name: "Jessica Adams",
    phone: "+1999888777",
    email: "jessica@foodchain.com",
    company: "FoodChain Restaurants",
    address: "250 Culinary Ave, Miami, FL",
    avatar: "JA",
    status: "completed",
    tab: "completed",
    totalItems: 4,
    totalPayment: 11200,
    lastContact: "2026-02-03",
    notes: "Fully onboarded. Happy customer, potential referral.",
    items: [
      { id: "i33", name: "Restaurant POS", quantity: 3, price: 4500, date: "2025-10-15", category: "Hardware" },
      { id: "i34", name: "Menu Manager", quantity: 1, price: 2200, date: "2025-11-01", category: "Software" },
      { id: "i35", name: "Order System", quantity: 1, price: 3000, date: "2025-11-20", category: "Software" },
      { id: "i36", name: "Staff Training", quantity: 1, price: 1500, date: "2025-12-10", category: "Service" },
    ],
  },
  {
    id: "c10",
    name: "Thomas Wright",
    phone: "+1222333444",
    email: "thomas@mediahub.tv",
    company: "MediaHub TV",
    address: "900 Broadcast Ln, Nashville, TN",
    avatar: "TW",
    status: "busy",
    tab: "active",
    totalItems: 3,
    totalPayment: 9500,
    lastContact: "2026-02-13",
    notes: "In production season. Will be available mid-March.",
    items: [
      { id: "i37", name: "Streaming Platform", quantity: 1, price: 4500, date: "2026-01-01", category: "Software" },
      { id: "i38", name: "Content CMS", quantity: 1, price: 3000, date: "2026-01-15", category: "Software" },
      { id: "i39", name: "CDN Package", quantity: 1, price: 2000, date: "2026-02-01", category: "Service" },
    ],
  },
  {
    id: "c11",
    name: "Olivia Martinez",
    phone: "+1888777666",
    email: "olivia@greenearth.org",
    company: "GreenEarth Foundation",
    address: "75 Eco Park, Portland, OR",
    avatar: "OM",
    status: "interested",
    tab: "follow_later",
    totalItems: 2,
    totalPayment: 5400,
    lastContact: "2026-02-12",
    notes: "Non-profit discount requested. Preparing custom quote.",
    items: [
      { id: "i40", name: "Donor Management", quantity: 1, price: 3200, date: "2026-01-20", category: "Software" },
      { id: "i41", name: "Campaign Tools", quantity: 1, price: 2200, date: "2026-02-05", category: "Software" },
    ],
  },
  {
    id: "c12",
    name: "Daniel Lee",
    phone: "+1555444333",
    email: "daniel@autoworks.com",
    company: "AutoWorks Garage",
    address: "400 Motor Way, Detroit, MI",
    avatar: "DL",
    status: "picked_call",
    tab: "active",
    totalItems: 3,
    totalPayment: 7100,
    lastContact: "2026-02-14",
    notes: "Enthusiastic about product. Scheduling demo for next week.",
    items: [
      { id: "i42", name: "Shop Management", quantity: 1, price: 3500, date: "2026-01-08", category: "Software" },
      { id: "i43", name: "Parts Inventory", quantity: 1, price: 2100, date: "2026-01-22", category: "Software" },
      { id: "i44", name: "Customer Portal", quantity: 1, price: 1500, date: "2026-02-10", category: "Software" },
    ],
  },
];

export default initialCustomers;
