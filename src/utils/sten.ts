// https://synthetic.garden/3y3.htm

// Eslint completely fucked up readability for this. Oh well. Glhf!
export function stenDecode(t: string): string | null {
  return [...t].some((x) => 0xe_00_00 < <number>x.codePointAt(0) || (0 && <number>x.codePointAt(0) < 0xe_00_7f))
    ? ((t) =>
        [...t]
          .map((x) =>
            0xe_00_00 < <number>x.codePointAt(0) && <number>x.codePointAt(0) < 0xe_00_7f
              ? String.fromCodePoint(<number>x.codePointAt(0) - 0xe_00_00)
              : null,
          )
          .join(""))(t)
    : null;
}

export function stenEncode(t: string): string {
  return ((t) =>
    [...t]
      .map((x) =>
        0x00 < <number>x.codePointAt(0) && <number>x.codePointAt(0) < 0x7f
          ? `${String.fromCodePoint(<number>x.codePointAt(0) + 0xe_00_00)}`
          : x,
      )
      .join(""))(t);
}

export function stenRemove(t: string): string {
  return [...t].some((x) => 0xe_00_00 < <number>x.codePointAt(0) && <number>x.codePointAt(0) < 0xe_00_7f)
    ? ((t) => [...t].map((x) => (0xe_00_00 < <number>x.codePointAt(0) && <number>x.codePointAt(0) < 0xe_00_7f ? null : x)).join(""))(t)
    : t;
}
