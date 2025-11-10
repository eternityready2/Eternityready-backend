import { type Lists } from ".keystone/types";

import { User } from "./schemas/user";
import { Video } from "./schemas/video";
import { Ad } from "./schemas/ad";
import { Category } from "./schemas/category";
import { list } from "@keystone-6/core";
import { Instagram } from "./schemas/instagram";
import { relationship, text, password, timestamp, select } from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";

const isAdmin = ({ session }: { session?: Session }) => {
  console.log(session);
  return Boolean(session?.data.privilege == "admin");
}

const isDonator = ({ session }: { session?: Session }) => {
  console.log(session);
  return Boolean(session?.data.privilege == "donator");
}

export const lists = {
  User: list({
    access: {
      operation: {
        query: allowAll,
        create: allowAll,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      answer: relationship({ ref: 'SecurityAnswer', many: true, }),
      firstName: text({ validation: { isRequired: true } }),
      lastName: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      password: password({ validation: { isRequired: true } }),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
      }),
      privilege: select({
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Donator', value: 'donator' },
          { label: 'Normal', value: 'normal' },
        ],
        defaultValue: "normal",
        access: {
          create: ({ session, context, listKey, fieldKey, operation, inputData }) => {
            if (!isAdmin(session) && Boolean(inputData?.privilege != "normal")) {
              return false;
            }
            return true;
          },
        }
      }),
    },
  }),
  SecurityQuestion: list({
    access: {
      operation: {
        query: allowAll,
        create: allowAll,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      question: text({ validation: { isRequired: true } }),
      answer: relationship({ ref: 'SecurityAnswer', many: true, }),
      createdAt: timestamp({ defaultValue: { kind: 'now' }, ui: { itemView: { fieldMode: 'read' } } }),
      updatedAt: timestamp({ db: { updatedAt: true }, ui: { itemView: { fieldMode: 'read' } } }),
    },
  }),
  SecurityAnswer: list({
    access: {
      operation: {
        query: allowAll,
        create: allowAll,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      answer: text({ validation: { isRequired: true } }),
      question: relationship({ ref: 'SecurityQuestion', many: false, }),
      user: relationship({ ref: 'User', many: false, }),
      createdAt: timestamp({ defaultValue: { kind: 'now' }, ui: { itemView: { fieldMode: 'read' } } }),
      updatedAt: timestamp({ db: { updatedAt: true }, ui: { itemView: { fieldMode: 'read' } } }),
    },
  }),
  Video,
  Ad,
  Category,
  Instagram,
} satisfies Lists;
