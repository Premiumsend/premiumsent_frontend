/** GET /api/app-config javobidan stars/premium sahifa yo'llari */
export function getStarsPurchasePath(config) {
  return config?.stars_purchase_path || "/stars";
}

export function getPremiumPurchasePath(config) {
  return config?.premium_purchase_path || "/premium";
}

export function isFragmentStarsMode(config) {
  return config?.stars_purchase_mode === "fragment";
}

export function isFragmentPremiumMode(config) {
  return config?.stars_purchase_mode === "fragment";
}
