// Central pricing / package config
// Change pricing, expiry, credits from here only

export const REVIEW_PACKAGES = {
  free: {
    id: "free",
    title: "Free Plan",
    priceLabel: "₹0",
    amount: 0,
    currency: "INR",
    reviewCredits: 5,
    expiryDays: null,
    isFree: true,
    active: true,
    description: "Get your first 5 resume reviews for free.",
    features: [
      "5 resume reviews",
      "Basic ATS analysis",
    ],
    buttonLabel: "Current Plan",
    badge: "Free",
  },

  review_1: {
    id: "review_1",
    title: "1 Resume Review",
    priceLabel: "₹79",
    amount: 7900,
    currency: "INR",
    reviewCredits: 1,
    expiryDays: 36135,
    isFree: false,
    active: true,
    description: "Perfect for a quick single review.",
    features: [
      "1 resume review",
      "Full ATS analysis",
    ],
    buttonLabel: "Buy 1 Review",
    badge: "",
  },

  review_5: {
    id: "review_5",
    title: "5 Resume Reviews",
    priceLabel: "₹399",
    amount: 39900,
    currency: "INR",
    reviewCredits: 5,
    expiryDays: 36135,
    isFree: false,
    active: true,
    description: "Best for short burst usage.",
    features: [
      "5 resume reviews",
      "Full ATS analysis",
    ],
    buttonLabel: "Buy 5 Reviews",
    badge: "Popular",
  },

  review_10: {
    id: "review_10",
    title: "10 Resume Reviews",
    priceLabel: "₹799",
    amount: 79900,
    currency: "INR",
    reviewCredits: 10,
    expiryDays: 36135,
    isFree: false,
    active: true,
    description: "Best value for serious job seekers.",
    features: [
      "10 resume reviews",
      "Full ATS analysis",
    ],
    buttonLabel: "Buy 10 Reviews",
    badge: "Best Value",
  },
} as const;


export type PackageId = keyof typeof REVIEW_PACKAGES;
export type ReviewPackage = (typeof REVIEW_PACKAGES)[PackageId];

export function getPackage(packageId: string): ReviewPackage | null {
  return REVIEW_PACKAGES[packageId as PackageId] ?? null;
}

export function getAllPackages(): ReviewPackage[] {
  return Object.values(REVIEW_PACKAGES);
}

export function getPaidPackages(): ReviewPackage[] {
  return Object.values(REVIEW_PACKAGES).filter(
    (pkg) => pkg.active && !pkg.isFree
  );
}