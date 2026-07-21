/**
 * Format money without a hard-coded dollar sign.
 * Example: 49000, 'TZS', 'monthly' → "49,000 TZS/mo"
 */
export function formatMoney(amount, currency = 'TZS', options = {}) {
  const {
    withCycle = false,
    billingCycle = null,
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
  } = options

  const n = Number(amount)
  const safe = Number.isFinite(n) ? n : 0
  const cur = String(currency || 'TZS').toUpperCase()
  const formatted = safe.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  })

  if (!withCycle || !billingCycle) {
    return `${formatted} ${cur}`
  }

  const cycle =
    billingCycle === 'annual' || billingCycle === 'yearly'
      ? 'yr'
      : billingCycle === 'monthly'
        ? 'mo'
        : String(billingCycle)

  return `${formatted} ${cur}/${cycle}`
}

export function formatPlanPrice(plan) {
  if (!plan) return '—'
  return formatMoney(plan.price, plan.currency || 'TZS', {
    withCycle: true,
    billingCycle: plan.billing_cycle,
  })
}
