export class UserNotExistError extends Error {
  constructor() {
    super("User does not exist");
  }
}

export class MessageNotExistError extends Error {
  constructor() {
    super("Message does not exist");
  }
}

export class MessageExistsError extends Error {
  constructor() {
    super("Message already exists");
  }
}

export class GuildNotExistError extends Error {
  constructor() {
    super("Guild does not exist");
  }
}

export class GuildExistsError extends Error {
  constructor() {
    super("Guild already exists");
  }
}

export class RoleNotExistError extends Error {
  constructor() {
    super("Role does not exist");
  }
}

export class RoleExistError extends Error {
  constructor() {
    super("Role already exists");
  }
}

export class UserNotInGuildError extends Error {
  constructor() {
    super("User does not exist in the guild");
  }
}

export class AttachmentExistsError extends Error {
  constructor() {
    super("An attachment with that ID already exists");
  }
}

