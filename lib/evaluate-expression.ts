export function evaluateExpression(
  expression: string,
  scope: Record<string, any>,
) {
  try {
    const fn = new Function(...Object.keys(scope), `return ${expression}`);
    return fn(...Object.values(scope));
  } catch (error) {
    console.warn(error);
    return undefined;
  }
}
