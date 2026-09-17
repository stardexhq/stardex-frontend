import { StardexApiError } from "@stardex/sdk";

/** "native" -> "XLM", "USDC:GA5Z..." -> "USDC". */
export function assetCode(asset: string): string {
  if (asset === "native") return "XLM";
  return asset.includes(":") ? asset.split(":")[0] : "tokens";
}

/**
 * Shorten an API amount like "5.0000000" for display: keep at least two
 * decimals, drop trailing zeros beyond that. Works on the string, so no
 * precision is lost.
 */
export function displayAmount(amount: string): string {
  const [whole, frac = ""] = amount.split(".");
  const trimmed = frac.replace(/0+$/, "").padEnd(2, "0");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${trimmed}`;
}

/** Share of `amount` received, 0 to 1, for progress bars only (not for money logic). */
export function receivedRatio(received: string, amount: string): number {
  const total = Number(amount);
  if (!(total > 0)) return 0;
  return Math.min(Number(received) / total, 1);
}

/** A readable message for a failed API call, with a hint for the common cases. */
export function errorText(err: unknown): string {
  if (err instanceof StardexApiError) {
    if (err.status === 401) return "The API key was rejected. Check it in Settings.";
    if (err.status === 503 && err.message.includes("STARDEX_ADMIN_KEY")) {
      return "This backend has no admin key configured, so business data is turned off.";
    }
    return err.message;
  }
  if (err instanceof TypeError) {
    return "Could not reach the backend. It may be offline or still waking up.";
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}
