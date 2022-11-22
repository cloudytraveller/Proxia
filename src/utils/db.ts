export function parseJson(jsonString: string): Record<string, any> {
  let result;
  try {
    result = JSON.parse(jsonString);
  } catch {
    try {
      result = eval(jsonString);
    } catch {
      throw new Error("Is not string.");
    }
  }
  return result;
}
