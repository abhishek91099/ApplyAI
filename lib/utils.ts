/** Turn fetch/network errors into a user-friendly message for prep (and similar) flows. */
export function normalizePrepError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Something went wrong.";
  if (/failed to fetch|network|connection|load failed|err_connection/i.test(msg)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return msg;
}
