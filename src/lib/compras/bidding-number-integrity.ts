export const BIDDING_NUMBER_DUPLICATE_ERROR = "J\u00e1 existe uma licita\u00e7\u00e3o com este n\u00famero.";

export function biddingNumberDuplicateError(error: unknown): { error: string } | null {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") return null;
  return { error: BIDDING_NUMBER_DUPLICATE_ERROR };
}
