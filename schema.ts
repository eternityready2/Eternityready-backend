import { type Lists, Session } from ".keystone/types";

import { Video } from "./schemas/video";
import { Ad } from "./schemas/ad";
import { Category } from "./schemas/category";
import { Instagram } from "./schemas/instagram";
import { list } from "@keystone-6/core";
import {
  relationship,
  text,
  password,
  timestamp,
  select,
  image,
} from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";

const isAdmin = ({ session }) => session?.data?.privilege === 'admin';
const isOwner = ({ session, item }) => session?.itemId === item?.id;
const isAdminOrOwner = ({ session, item }) => isAdmin({ session }) || isOwner({ session, item });

export const lists = {
  User: list({
    access: {
      operation: {
        query: ({ session }) => !!session,
        create: () => true,
        update: ({ session }) => !!session,
        delete: ({ session }) => !!session,
      },
      item: {
        update: ({ session, item, resolvedData }) => {
          console.log(session ,item, resolvedData);
          if (!session || !item) return false;
          if (resolvedData && 'privilege' in resolvedData && !isAdmin({ session })) return false;
          const isOwner = session.itemId === item.id;
          const isAdminUser = isAdmin({ session });
          if (!isOwner && !isAdminUser) return false;
          return true;
        },
        delete: ({ session, item }) => {
          if (!session || !item) return false;
          return isOwner({ session, item }) || isAdmin({ session });
        },
      },
      filter: {
        query: ({ session }) => {
          if (!session) return false;
          if (isAdmin({ session })) return true;
          return { id: { equals: session.itemId } };
        },
      },
    },
    fields: {
      answer: relationship({ ref: 'SecurityAnswer', many: true }),
      firstName: text({ validation: { isRequired: true } }),
      lastName: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
      password: password({
        validation: { isRequired: true },
        access: {
          read: () => false,  // Never allow password to be read
        },
      }),
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
      privilege: select({
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Donator', value: 'donator' },
          { label: 'Normal', value: 'normal' },
        ],
        defaultValue: 'normal',
        access: {
          read: isAdmin,
          update: isAdmin,
          create: isAdmin,
        },
      }),
      profileImage: image({ storage: 'profile_images' }),
    },
  }),

  SecurityQuestion: list({
    access: {
      operation: {
        query: () => true,
        create: isAdmin,
        update: isAdmin,
        delete: isAdmin,
      },
    },
    fields: {
      question: text({ validation: { isRequired: true } }),
      answer: relationship({ ref: 'SecurityAnswer', many: true }),
      createdAt: timestamp({ defaultValue: { kind: 'now' }, ui: { itemView: { fieldMode: 'read' } } }),
      updatedAt: timestamp({ db: { updatedAt: true }, ui: { itemView: { fieldMode: 'read' } } }),
    },
  }),

  SecurityAnswer: list({
    access: {
      operation: {
        query: ({ session }) => {
          return !!session
        },
        create: ({ session }) => !!session,
        update: ({ session }) => !!session,
        delete: ({ session }) => !!session,
      },
      filter: {
        query: ({ session }) => {
          if (!session) return false;
          if (isAdmin(session)) return true; 
          return { user: { id: { equals: session.itemId } } };
        },
      },
    },
    fields: {
      answer: text({ validation: { isRequired: true } }),
      question: relationship({ ref: 'SecurityQuestion', many: false }),
      user: relationship({ ref: 'User', many: false }),
      createdAt: timestamp({ defaultValue: { kind: 'now' }, ui: { itemView: { fieldMode: 'read' } } }),
      updatedAt: timestamp({ db: { updatedAt: true }, ui: { itemView: { fieldMode: 'read' } } }),
    },
  }),
  Video,
  Ad,
  Category,
  Instagram,
} satisfies Lists;
