export function validationErrorsToMap(
  errors: Array<{ path: string; msg: string }> = [],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of errors) {
    if (e.path && !(e.path in map)) map[e.path] = e.msg;
  }
  return map;
}
