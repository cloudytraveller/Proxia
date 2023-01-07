/* eslint-disable @typescript-eslint/naming-convention */
// Privately imports dependencies
type PrivateIntentsString = import("discord.js").GatewayIntentBits;
type PrivateClientEvents = import("discord.js").ClientEvents;
type PrivateSnowflake = import("discord.js").Snowflake;

// Proxia event emitters
type ProxiaEventEmitter = keyof PrivateClientEvents;

// A Discord Snowflake ID
type DiscordSnowflake = PrivateSnowflake;

// A resolvable string of intents
type ResolvableIntentString = import("discord.js").GatewayIntentsString;

type Unpacked<T> = T extends (infer U)[] ? U : T;

// https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range/70307091#70307091
type Omit2<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Type alias
type Optional<T> = Partial<T>;

// Valid locale codes. This list will need to be updated manually.
type ProxiaLocaleCode = "en-GB" | string;
