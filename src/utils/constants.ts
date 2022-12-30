// A regex for file types that can be ESM modules
export const moduleFiletypeRegex = /\.(cjs|mjs|js|mts|cts|ts)$/i;

// A regex for valid slash command names
export const slashCommandNameRegex = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;

// The version of Proxia currently running
export const proxiaVersion = process.env.npm_package_version ?? "develop";

export const proxiaProtectedString = "**[*Px*]**";

export const proxiaWebhookPrefix = "__PROXIA_";
