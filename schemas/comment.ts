import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";

import {
  text,
  relationship,
  timestamp,
  checkbox,
  file,
  image,
  select,
  integer,
} from "@keystone-6/core/fields";

export const Comment = list({
  access: {
    operation: {
      query: allowAll,
      create: allowAll,
      update: allowAll,
      delete: allowAll
    },
  },

  fields: {
    user: relationship({
      ref: 'User.comments',
      many: false,
    }),

    text: text({ validation: { isRequired: true } }),

    timestamp: timestamp({
      db: { updatedAt: false },
      defaultValue: { kind: 'now' },
    }),

    parent: relationship({
      ref: 'Comment.replies',
      many: false,
    }),

    replies: relationship({
      ref: 'Comment.parent',
      many: true,
    }),

    video: relationship({
      ref: 'Video.comments',
      many: false,
    }),

    reactions: relationship({
      ref: 'UserReaction.comment',
      many: true,
    }),
  },
});
