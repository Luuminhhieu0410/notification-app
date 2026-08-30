export function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
export const HOUR = 60 * 60 * 1000;
