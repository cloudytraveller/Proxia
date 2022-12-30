// import "knex/types/tables";

declare module "knex/types/tables" {
  interface Tables {
    // This is same as specifying `knex<User>('users')`
    users: User;

    messages: Message;

    guilds: Guild;

    webhooks: Webhook;

    attachments: Attachment;
  }
}
