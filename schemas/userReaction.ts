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

export const UserReaction = list({
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
      ref: 'User.reactions',
      many: false,
    }),
    reaction: select({
      options: [
        { label: 'Like', value: 'like' },
        { label: 'Dislike', value: 'dislike' },
      ],
      ui: { displayMode: 'segmented-control' },
      validation: { isRequired: true },
    }),
    comment: relationship({
      ref: 'Comment.reactions',
      many: false,
    }),
    video: relationship({
      ref: 'Video.reactions',
      many: false,
    }),
  },
});
