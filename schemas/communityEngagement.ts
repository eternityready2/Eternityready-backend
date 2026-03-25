import { list } from "@keystone-6/core";
import { text, integer, select, timestamp } from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";

export const CommunityEngagement = list({
  access: {
    operation: {
      query: allowAll,
      create: allowAll,
      update: allowAll,
      delete: allowAll,
    },
  },
  fields: {
    title: text({
      validation: { isRequired: true },
      isIndexed: "unique",
    }),
    origin: select({
      options: [
        { label: "Channels", value: "channels" },
        { label: "Movies", value: "movies" },
        { label: "Music", value: "music" },
        { label: "Radio", value: "radio" },
        { label: "On-demand", value: "on-demand" },
        { label: "Podcasts", value: "podcasts" },
      ],
      validation: { isRequired: true },
    }),
    plays: integer({ defaultValue: 0, validation: { min: 0 } }),
    likes: integer({ defaultValue: 0, validation: { min: 0 } }),
    communityScore: integer({ defaultValue: 0, validation: { min: 0 } }),
    lastEngagedAt: timestamp({ defaultValue: { kind: "now" } }),
  },
});
