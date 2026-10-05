export function mask(secret: string, visible = 4): string {
  if (secret.length <= visible * 2) {
    return '****';
  }
  return '****' + secret.slice(-visible);
}
