import { type Lists, Session } from ".keystone/types";

import { Comment } from "./schemas/comment";
import { UserReaction } from "./schemas/userReaction";
import { Video } from "./schemas/video";
import { Ad, AdStat } from "./schemas/ad";
import { Category } from "./schemas/category";
import { Instagram } from "./schemas/instagram";
import { Report, ReportReason } from "./schemas/report";
import { list } from "@keystone-6/core";

import {
  relationship,
  text,
  password,
  timestamp,
  select,
  image,
  integer
} from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";

const isAdmin = ({ session }) => session?.data?.privilege === 'admin';
const isOwner = ({ session, item }) => session?.itemId === item?.id;
const isAdminOrOwner = ({ session, item }) => isAdmin({ session }) || isOwner({ session, item });

export const lists = {
  User: list({
    access: {
      operation: {
        query: allowAll,
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
          return true;
          /*
          if (!session) return false;
          if (isAdmin({ session })) return true;
          return { id: { equals: session.itemId } };
          */
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
      stripeCustomerId: text({
        isIndexed: 'unique',
        db: { isNullable: true },
      }),
      stripeSubscriptionId: text({
        db: { isNullable: true },
      }),
      stripeStatus: text({
        db: { isNullable: true },
      }),
      comments: relationship({ ref: 'Comment.user', many: true }),
      reactions: relationship({ ref: 'UserReaction.user', many: true }),
      subscriptions: relationship({
        ref: 'User.subscribers',
        many: true,
        ui: {
          description: 'Users this user subscribes to',
        },
      }),

      subscribers: relationship({
        ref: 'User.subscriptions',
        many: true,
        ui: {
          description: 'Users who subscribe to this user',
        },
      }),

      subscriberCount: integer({
        defaultValue: 0,
        db: {
          isNullable: false,
        },
        ui: {
          description: 'Subscribers (defaults to 0)',
        },
        validation: {
          min: 0,
        },
      }),
      reports: relationship({ ref: 'Report.user', many: true }),
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
  AdStat,
  Category,
  Instagram,
  Comment,
  UserReaction,
  Report,
  ReportReason,
} satisfies Lists;
