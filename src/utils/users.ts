export const userString = (username: string, uniqueId: string) => `${username} ${uniqueId}`;

export function getUserId(text: string): string | undefined {
  const result = /\(([^()]+)\)[^()]*?$/.exec(text);
  return result?.[1] ?? undefined;
}
