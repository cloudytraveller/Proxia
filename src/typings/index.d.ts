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
