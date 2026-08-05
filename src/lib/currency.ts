/**
 * Currency conversion utilities.
 *
 * The YouTube Analytics API reports monetary values (estimatedRevenue,
 * estimatedAdRevenue, estimatedRedRevenue, CPM) in USD.  The GRA dashboard
 * displays everything in GHS, so we convert at the data-ingestion boundary
 * before the values reach the Convex backend or any UI component.
 *
 * The exchange rate defaults to 11.70 (Bank of Ghana interbank rate)
 * and can be overridden via the `USD_TO_GHS_RATE` environment variable.
 */

const DEFAULT_USD_TO_GHS_RATE = 11.7;

function getUsdToGhsRate(): number {
  const envRate = process.env.USD_TO_GHS_RATE;
  if (envRate) {
    const parsed = Number(envRate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_USD_TO_GHS_RATE;
}

/**
 * Convert a USD amount to GHS using the configured exchange rate.
 * Returns `undefined` when the input is `undefined` so optional
 * monetary fields pass through cleanly.
 */
export function usdToGhs(usd: number): number;
export function usdToGhs(usd: number | undefined): number | undefined;
export function usdToGhs(usd: number | undefined): number | undefined {
  if (usd === undefined) return undefined;
  return usd * getUsdToGhsRate();
}
