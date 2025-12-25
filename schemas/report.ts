import { list } from '@keystone-6/core';
import { allowAll } from '@keystone-6/core/access';
import {
  text,
  relationship,
  timestamp,
  checkbox,
  file,
  image,
  select,
  integer,
} from '@keystone-6/core/fields';

export const Report = list({
  access: {
    operation: {
      query: allowAll,
      create: allowAll,
      update: allowAll,
      delete: allowAll,
    },
  },

  fields: {
    video: relationship({
      ref: 'Video.reports',
      many: false,
    }),

    user: relationship({
      ref: 'User.reports',
      many: false,
    }),

    reason: relationship({
      ref: 'ReportReason.reports',
      many: false,
    }),

    details: text({
      validation: { isRequired: true },
    }),

    createdAt: timestamp({
      db: { updatedAt: false },
      defaultValue: { kind: 'now' },
    }),
  },
});

export const ReportReason = list({
  access: {
    operation: {
      query: allowAll,
      create: allowAll,
      update: allowAll,
      delete: allowAll,
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
    }),
    reports: relationship({
      ref: 'Report.reason',
      many: true,
    }),
  },
});
