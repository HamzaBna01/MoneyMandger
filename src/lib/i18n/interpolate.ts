// Tiny placeholder interpolation: fmt("Hi {name}", { name: "Sara" }) -> "Hi Sara".
// Dictionary values are plain strings (so they survive the server -> client prop
// boundary as JSON); interpolation happens at the call site on either side.

export function fmt(
  template: string,
  vars: Record<string, string | number> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}
