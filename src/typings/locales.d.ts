import * as defaultLocaleFile from "../locales/en-GB.json";
const en = defaultLocaleFile.default;

type ProxiaLocaleStrings =
  | "NAME"
  | `general.${keyof typeof en.general}`
  | `global.${keyof typeof en.global}`;

// Type for getLocaleFunction()
type getString = {
  (string: ProxiaLocaleStrings, args?: Record<string, any>): string;
};
