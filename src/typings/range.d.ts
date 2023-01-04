// https://github.com/Microsoft/TypeScript/issues/15480#issuecomment-1245429783
// Increment / Decrement from:
// https://stackoverflow.com/questions/54243431/typescript-increment-number-type

// We intersect with `number` because various use-cases want `number` subtypes,
// including this own source code!

type ArrayOfLength<
  N extends number,
  A extends any[] = []
> = A["length"] extends N ? A : ArrayOfLength<N, [...A, any]>;
type Inc<N extends number> = number & [...ArrayOfLength<N>, any]["length"];
type Dec<N extends number> = number &
  (ArrayOfLength<N> extends [...infer A, any] ? A["length"] : -1);

type RangeOf<Start extends number, End extends number> = number &
  (Start extends End ? never : Start | Range<Inc<Start>, End>);
