export function dataString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
