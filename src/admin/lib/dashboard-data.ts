// Mock data powering the Ember & Bun dashboards.

export const revenueByDay = [
  { label: "Mon", orders: 128, revenue: 2140 },
  { label: "Tue", orders: 142, revenue: 2380 },
  { label: "Wed", orders: 119, revenue: 1985 },
  { label: "Thu", orders: 168, revenue: 2940 },
  { label: "Fri", orders: 231, revenue: 4120 },
  { label: "Sat", orders: 268, revenue: 4890 },
  { label: "Sun", orders: 205, revenue: 3675 },
];

export const revenueByMonth = [
  { label: "Jan", orders: 3120, revenue: 52400 },
  { label: "Feb", orders: 2980, revenue: 49850 },
  { label: "Mar", orders: 3420, revenue: 58120 },
  { label: "Apr", orders: 3610, revenue: 61340 },
  { label: "May", orders: 3890, revenue: 66980 },
  { label: "Jun", orders: 4210, revenue: 73450 },
  { label: "Jul", orders: 4580, revenue: 81200 },
  { label: "Aug", orders: 4390, revenue: 77630 },
  { label: "Sep", orders: 3980, revenue: 69420 },
  { label: "Oct", orders: 4120, revenue: 71880 },
  { label: "Nov", orders: 4460, revenue: 79240 },
  { label: "Dec", orders: 5120, revenue: 92310 },
];

export const revenueByYear = [
  { label: "2021", orders: 28400, revenue: 412000 },
  { label: "2022", orders: 34100, revenue: 528400 },
  { label: "2023", orders: 39800, revenue: 641900 },
  { label: "2024", orders: 44600, revenue: 738500 },
  { label: "2025", orders: 49880, revenue: 833620 },
];

export type RangeKey = "day" | "month" | "year";

export const rangeSeries: Record<RangeKey, typeof revenueByDay> = {
  day: revenueByDay,
  month: revenueByMonth,
  year: revenueByYear,
};

export const ageBuckets = [
  { label: "18-24", users: 1840, orders: 2410 },
  { label: "25-34", users: 3120, orders: 5230 },
  { label: "35-44", users: 2210, orders: 3180 },
  { label: "45-54", users: 980, orders: 1120 },
  { label: "55+", users: 410, orders: 390 },
];

export const genderSplit = [
  { label: "Male", value: 54 },
  { label: "Female", value: 41 },
  { label: "Other", value: 5 },
];

export const topFoods = [
  { name: "Double Smash Ember", orders: 1842, revenue: 24680, share: 100 },
  { name: "Flame Bacon Stack", orders: 1523, revenue: 20140, share: 83 },
  { name: "Charcoal Chicken Bun", orders: 1204, revenue: 15320, share: 65 },
  { name: "Truffle Melt Deluxe", orders: 986, revenue: 14790, share: 53 },
  { name: "Smoked Rib Slider", orders: 742, revenue: 9640, share: 40 },
];

export const feedbacks = [
  {
    name: "Amina Okafor",
    rating: 5,
    time: "2h ago",
    text: "The Double Smash Ember was flawless — juicy, smoky and still hot on arrival. Best burger in the district.",
  },
  {
    name: "Marcus Reilly",
    rating: 4,
    time: "5h ago",
    text: "Great flavour but the fries were slightly under-salted. Delivery guy was very polite though.",
  },
  {
    name: "Lea Fontaine",
    rating: 5,
    time: "Yesterday",
    text: "Ordered the family pack for 6 people, everything arrived warm and beautifully packed. Will repeat.",
  },
  {
    name: "Tobias Grant",
    rating: 3,
    time: "2 days ago",
    text: "Taste is solid, but waited 48 minutes at peak time. Maybe add more riders on Friday nights.",
  },
];

export type Ingredient = {
  name: string;
  available?: boolean;
};

export type AddOn = {
  name: string;
  price: number;
  available?: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  category: "Burgers" | "Sides" | "Drinks" | "Desserts";
  price: number;
  inStock: boolean;
  image?: string;
  principal: Ingredient[];
  addons: AddOn[];
};

export const menuItems: MenuItem[] = [
  {
    id: "m1",
    name: "Double Smash Ember",
    category: "Burgers",
    price: 13.5,
    inStock: true,
    principal: [
      { name: "Beef patty x2", available: true },
      { name: "Aged cheddar", available: true },
      { name: "Smoked bacon", available: true },
      { name: "Ember sauce", available: true },
    ],
    addons: [{ name: "Extra patty", price: 3.5, available: true }],
  },
  {
    id: "m2",
    name: "Truffle Melt Deluxe",
    category: "Burgers",
    price: 15.0,
    inStock: true,
    principal: [
      { name: "Beef patty", available: true },
      { name: "Truffle mayo", available: false },
      { name: "Swiss cheese", available: true },
      { name: "Caramelised onion", available: true },
    ],
    addons: [{ name: "Extra truffle mayo", price: 1.5, available: true }],
  },
  {
    id: "m3",
    name: "Charcoal Chicken Bun",
    category: "Burgers",
    price: 12.0,
    inStock: true,
    principal: [
      { name: "Chicken thigh", available: true },
      { name: "Charcoal bun", available: true },
      { name: "Sriracha slaw", available: true },
    ],
    addons: [],
  },
  {
    id: "m4",
    name: "Rosemary Skin Fries",
    category: "Sides",
    price: 4.5,
    inStock: true,
    principal: [
      { name: "Potatoes", available: true },
      { name: "Rosemary", available: true },
      { name: "Sea salt", available: true },
    ],
    addons: [{ name: "Extra dip", price: 0.8, available: true }],
  },
  {
    id: "m5",
    name: "Smoked Cola 33cl",
    category: "Drinks",
    price: 2.8,
    inStock: true,
    principal: [{ name: "Bottled cola", available: true }],
    addons: [],
  },
  {
    id: "m6",
    name: "Burnt Honey Milkshake",
    category: "Drinks",
    price: 5.4,
    inStock: false,
    principal: [
      { name: "Vanilla ice cream", available: false },
      { name: "Burnt honey", available: true },
      { name: "Whole milk", available: true },
    ],
    addons: [],
  },
  {
    id: "m7",
    name: "Molten Chocolate Bun",
    category: "Desserts",
    price: 6.2,
    inStock: true,
    principal: [
      { name: "Dark chocolate", available: true },
      { name: "Brioche", available: true },
    ],
    addons: [{ name: "Extra scoop", price: 1.2, available: true }],
  },
];

export const ingredientLibrary: AddOn[] = [
  { name: "Aged cheddar", price: 1.2 },
  { name: "Smoked bacon", price: 1.5 },
  { name: "Truffle mayo", price: 1.5 },
  { name: "Caramelised onion", price: 0.8 },
  { name: "Sriracha slaw", price: 0.9 },
  { name: "Rosemary", price: 0.3 },
  { name: "Sea salt", price: 0.2 },
  { name: "Burnt honey", price: 1.0 },
  { name: "Dark chocolate", price: 1.4 },
  { name: "Whole milk", price: 0.5 },
];

export type AppUser = {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  orders: number;
  spent: number;
  status: "Active" | "Banned";
  favourite: string;
  joined: string;
};

export const appUsers: AppUser[] = [
  {
    id: "u1",
    name: "Amina Okafor",
    email: "amina@ember.co",
    age: 29,
    gender: "Female",
    orders: 62,
    spent: 891,
    status: "Active",
    favourite: "Double Smash Ember",
    joined: "Mar 2024",
  },
  {
    id: "u2",
    name: "Marcus Reilly",
    email: "marcus@ember.co",
    age: 34,
    gender: "Male",
    orders: 48,
    spent: 702,
    status: "Active",
    favourite: "Flame Bacon Stack",
    joined: "Jul 2024",
  },
  {
    id: "u3",
    name: "Lea Fontaine",
    email: "lea@ember.co",
    age: 26,
    gender: "Female",
    orders: 91,
    spent: 1340,
    status: "Active",
    favourite: "Truffle Melt Deluxe",
    joined: "Jan 2023",
  },
  {
    id: "u4",
    name: "Tobias Grant",
    email: "tobias@ember.co",
    age: 41,
    gender: "Male",
    orders: 12,
    spent: 189,
    status: "Banned",
    favourite: "Charcoal Chicken Bun",
    joined: "Nov 2025",
  },
  {
    id: "u5",
    name: "Sora Nakamura",
    email: "sora@ember.co",
    age: 22,
    gender: "Other",
    orders: 37,
    spent: 512,
    status: "Active",
    favourite: "Smoked Rib Slider",
    joined: "Feb 2025",
  },
];

export type Offer = {
  id: string;
  title: string;
  type: "Pack" | "Discount" | "Happy Hour";
  price: number;
  discount: number;
  items: string[];
  active: boolean;
  window: string;
};

export const offers: Offer[] = [
  {
    id: "o1",
    title: "Ember Family Pack",
    type: "Pack",
    price: 42.0,
    discount: 20,
    items: ["4x Double Smash", "2x Fries", "4x Smoked Cola"],
    active: true,
    window: "All week",
  },
  {
    id: "o2",
    title: "Late Night Smash",
    type: "Happy Hour",
    price: 9.9,
    discount: 30,
    items: ["1x Any burger", "1x Fries"],
    active: true,
    window: "22:00 – 00:30",
  },
  {
    id: "o3",
    title: "Student Tuesday",
    type: "Discount",
    price: 0,
    discount: 15,
    items: ["Whole menu"],
    active: false,
    window: "Tuesdays",
  },
];

export const trendingFoods = [
  { name: "Truffle Melt Deluxe", tag: "+128% this week", price: 15.0 },
  { name: "Burnt Honey Milkshake", tag: "Trending in your area", price: 5.4 },
  { name: "Smoked Rib Slider", tag: "New on the grill", price: 11.2 },
];

export const myOrders = [
  { id: "#EB-4821", item: "Double Smash Ember x2", date: "Today, 19:40", total: 27.0, status: "On the way" },
  { id: "#EB-4790", item: "Truffle Melt Deluxe", date: "Fri, 21:05", total: 15.0, status: "Delivered" },
  { id: "#EB-4732", item: "Ember Family Pack", date: "Sun, 13:22", total: 42.0, status: "Delivered" },
  { id: "#EB-4688", item: "Charcoal Chicken Bun", date: "Last week", total: 12.0, status: "Delivered" },
];

export const deliveries = [
  {
    id: "#EB-4821",
    customer: "Amina Okafor",
    address: "14 Rue des Fleurs, Apt 3B",
    distance: "1.8 km",
    payout: 6.4,
    eta: "12 min",
    status: "Picked up" as const,
  },
  {
    id: "#EB-4822",
    customer: "Sora Nakamura",
    address: "88 Harbour Road",
    distance: "3.2 km",
    payout: 8.1,
    eta: "21 min",
    status: "Ready" as const,
  },
  {
    id: "#EB-4823",
    customer: "Marcus Reilly",
    address: "5 Old Mill Lane",
    distance: "2.4 km",
    payout: 7.0,
    eta: "18 min",
    status: "Ready" as const,
  },
];

export const riderWeek = [
  { label: "Mon", deliveries: 14, earnings: 88 },
  { label: "Tue", deliveries: 11, earnings: 71 },
  { label: "Wed", deliveries: 16, earnings: 102 },
  { label: "Thu", deliveries: 19, earnings: 124 },
  { label: "Fri", deliveries: 27, earnings: 181 },
  { label: "Sat", deliveries: 31, earnings: 209 },
  { label: "Sun", deliveries: 22, earnings: 148 },
];
