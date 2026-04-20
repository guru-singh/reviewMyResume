export const REVIEW_PACKAGES = {
  free: {
    id: "free",
    title: "Free",
    priceLabel: "₹0",
    amount: 0,
    currency: "INR",
    reviewCredits: 5,
    expiryDays: null,
    isFree: true,
    active: true,
    description: "First 5 resume reviews free. No expiry.",
    buttonLabel: "Current Free Plan",
    badge: "Free",
  },

  review_1_day_1: {
    id: "review_1_day_1",
    title: "1 Resume Review",
    priceLabel: "₹79",
    amount: 7900,
    currency: "INR",
    reviewCredits: 1,
    expiryDays: 1,
    isFree: false,
    active: true,
    description: "1 resume review. Expires in 1 day.",
    buttonLabel: "Buy 1 Review",
    badge: "",
  },

  review_5_day_1: {
    id: "review_5_day_1",
    title: "5 Resume Reviews",
    priceLabel: "₹399",
    amount: 39900,
    currency: "INR",
    reviewCredits: 5,
    expiryDays: 1,
    isFree: false,
    active: true,
    description: "5 resume reviews. Expires in 1 day.",
    buttonLabel: "Buy 5 Reviews",
    badge: "Popular",
  },

  review_10_day_7: {
    id: "review_10_day_7",
    title: "10 Resume Reviews",
    priceLabel: "₹799",
    amount: 79900,
    currency: "INR",
    reviewCredits: 10,
    expiryDays: 7,
    isFree: false,
    active: true,
    description: "10 resume reviews. Expires in 7 days.",
    buttonLabel: "Buy 10 Reviews",
    badge: "Best Value",
  },
} as const;

export type PackageId = keyof typeof REVIEW_PACKAGES;
export type ReviewPackage = (typeof REVIEW_PACKAGES)[PackageId];

export function getPackage(packageId: string) {
  return REVIEW_PACKAGES[packageId as PackageId] ?? null;
}

export function getPaidPackages() {
  return Object.values(REVIEW_PACKAGES).filter(
    (pkg) => pkg.active && !pkg.isFree
  );
}