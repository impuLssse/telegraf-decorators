import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('create extension if not exists "uuid-ossp"');

  await knex.schema.createTableIfNotExists("officers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("phone").notNullable().unique();
    table.string("name").notNullable().unique();
    table.boolean("isActive").defaultTo(true).notNullable();

    /** Эти поля обновятся тогда, как в бота EMERGENCY придет команда /iam <телефон> */
    table.string("telegramId").nullable();
    table.string("chatId").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("officers");
}
