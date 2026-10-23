/** Only application-relative destinations are allowed after authentication. */
export function safeAuthDestination(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value))
    return '/';
  try {
    const origin = 'https://polaris.invalid';
    const target = new URL(value, origin);
    return target.origin === origin ? target.pathname + target.search + target.hash : '/';
  } catch {
    return '/';
  }
}
