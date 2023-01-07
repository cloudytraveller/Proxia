<div align="center">

<img src="resources/proxia_rounded.png" alt="Logo pastel colors with a light pink in the bottom left to light purple in the top right smooth gradient, with purple stroked white text in the middle with a faint light blue glow. Created by Cloudy" width="256px">

<h1>Proxia</h1>

![GitHub Repo Stars](https://img.shields.io/github/stars/cloudytraveller/proxia?label=Stars)
[![License](https://img.shields.io/badge/license-Apache2.0-blue.svg?label=License)](/LICENSE)

A proxy message bot for your Discord.

</div>

# What is Proxia?

Proxia is a Discord bot that proxies your messages through Discord's webhook, while supporting attachments, threads, replies, emotes, and much more, with the bonus of saving user information via a recovery key, to restore later in the event of a server being deleted.

Think of it similar to [PluralKit](https://pluralkit.me/)

The main goal of this is to anonymize yourself and your server members in a Discord server. Proxia can't be turned off per user, only per guild.

Althrough Proxia supports multiple guilds, it's highly recommended you stick to having the bot in one guild.

## Official Instance

There is no official instance of Proxia. This is a self-hosted bot.

## Notes

- The locale system is not fully functional, as I do not have time to pay attention to that right now.

## Data Privacy

The following types of data will be stored **on-demand** when some **features are ran** in order for the bot to work correctly.

<!-- - **User ID(s)**: A Discord ID unique to your account (**user configs, etc.**)
- **Server ID(s)**: A Discord ID unique to your server (**server configs, etc.**)
- **Message ID(s)**: A message ID corresponding to a message (**reminders, etc.**)
- **Command Response(s)**: Text responses in slash-commands (**for mute reasons, etc**) -->
**User Info**: ID, username, discriminator, avatar, underlying user information per guild (such as nickname, preferred avatar, etc)
**Server Info**: Basic guild information, roles, users, channels and messages.
**Attachments**: Attachments may be stored on the server the bot is running on, at owners discretion

To view any data that corresponds with your Discord account, run the `/gdpr` command. (Unless the server owner has willfully removed the command)
This does not include raw attachment data, only data that coresponds to an attachment on disk.

# Installation

TODO
<!-- Instruct the user how to create a bot/link a guide to create a bot, then tell them to copy the config.example.json file and rename it to config.json -->
# License

This project uses code from [Hibiki](https://github.com/sysdotini/hibiki), which uses the [zlib license](/LICENSE), therefore this project is licensed under the zlib license.
