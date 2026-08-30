// Mock data powering the customer dashboard.

export const USER_NAME = "Amina Okafor";

export type UserOrder = {
  id: string;
  date: string;
  total: number;
  status: "Delivered" | "On the way" | "Cancelled";
  items: { name: string; qty: number }[];
};

export const userOrders: UserOrder[] = [
  {
    id: "#EB-4821",
    date: "Today, 19:40",
    total: 27.0,
    status: "On the way",
    items: [{ name: "Double Smash Ember", qty: 2 }],
  },
  {
    id: "#EB-4790",
    date: "Fri, 21:05",
    total: 15.0,
    status: "Delivered",
    items: [{ name: "Truffle Melt Deluxe", qty: 1 }],
  },
  {
    id: "#EB-4732",
    date: "Aug 17",
    total: 42.0,
    status: "Delivered",
    items: [
      { name: "Double Smash Ember", qty: 4 },
      { name: "Rosemary Skin Fries", qty: 2 },
      { name: "Smoked Cola 33cl", qty: 4 },
    ],
  },
  {
    id: "#EB-4688",
    date: "Aug 12",
    total: 12.0,
    status: "Delivered",
    items: [{ name: "Charcoal Chicken Bun", qty: 1 }],
  },
  {
    id: "#EB-4650",
    date: "Aug 8",
    total: 58.6,
    status: "Delivered",
    items: [
      { name: "Double Smash Ember", qty: 3 },
      { name: "Rosemary Skin Fries", qty: 2 },
      { name: "Molten Chocolate Bun", qty: 1 },
    ],
  },
  {
    id: "#EB-4611",
    date: "Aug 2",
    total: 96.3,
    status: "Delivered",
    items: [
      { name: "Double Smash Ember", qty: 4 },
      { name: "Truffle Melt Deluxe", qty: 2 },
      { name: "Rosemary Skin Fries", qty: 3 },
    ],
  },
  {
    id: "#EB-4577",
    date: "Jul 28",
    total: 13.5,
    status: "Cancelled",
    items: [{ name: "Double Smash Ember", qty: 1 }],
  },
  {
    id: "#EB-4540",
    date: "Jul 21",
    total: 44.4,
    status: "Delivered",
    items: [
      { name: "Charcoal Chicken Bun", qty: 2 },
      { name: "Rosemary Skin Fries", qty: 2 },
      { name: "Smoked Cola 33cl", qty: 2 },
    ],
  },
  {
    id: "#EB-4498",
    date: "Jul 14",
    total: 90.2,
    status: "Delivered",
    items: [
      { name: "Double Smash Ember", qty: 4 },
      { name: "Truffle Melt Deluxe", qty: 1 },
      { name: "Molten Chocolate Bun", qty: 2 },
    ],
  },
  {
    id: "#EB-4431",
    date: "Jul 5",
    total: 61.5,
    status: "Delivered",
    items: [
      { name: "Truffle Melt Deluxe", qty: 3 },
      { name: "Rosemary Skin Fries", qty: 2 },
      { name: "Smoked Cola 33cl", qty: 2 },
    ],
  },
  {
    id: "#EB-4380",
    date: "Jun 27",
    total: 52.0,
    status: "Delivered",
    items: [
      { name: "Double Smash Ember", qty: 2 },
      { name: "Charcoal Chicken Bun", qty: 2 },
    ],
  },
  {
    id: "#EB-4302",
    date: "Jun 15",
    total: 133.8,
    status: "Delivered",
    items: [
      { name: "Double Smash Ember", qty: 6 },
      { name: "Rosemary Skin Fries", qty: 4 },
      { name: "Smoked Cola 33cl", qty: 6 },
      { name: "Molten Chocolate Bun", qty: 2 },
    ],
  },
];

export type UserFeedback = {
  dish: string;
  rating: number;
  time: string;
  text: string;
};

export const userFeedbacks: UserFeedback[] = [
  {
    dish: "Double Smash Ember",
    rating: 5,
    time: "2h ago",
    text: "Flawless as always \u2014 juicy, smoky and still hot on arrival. Best burger in the district.",
  },
  {
    dish: "Rosemary Skin Fries",
    rating: 4,
    time: "Last week",
    text: "Crispy and fragrant, could use a touch more salt but I keep re-ordering them anyway.",
  },
  {
    dish: "Truffle Melt Deluxe",
    rating: 5,
    time: "Aug 12",
    text: "The truffle mayo is dangerously good. Worth every cent of the premium price.",
  },
  {
    dish: "Charcoal Chicken Bun",
    rating: 3,
    time: "Jul 30",
    text: "Tasty, but the bun was a little dry this time. Previous orders were better.",
  },
];

export type CouponTier = {
  min: number;
  code: string;
  discount: number;
  label: string;
};

/** Ordered from best to entry tier \u2014 the first tier the spend reaches wins. */
export const COUPON_TIERS: CouponTier[] = [
  { min: 1000, code: "EMBER-VIP25", discount: 25, label: "VIP Regular" },
  { min: 600, code: "EMBER-FIRE15", discount: 15, label: "Grill Lover" },
  { min: 300, code: "EMBER-WARM10", discount: 10, label: "Warming Up" },
];
