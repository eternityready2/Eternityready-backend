import { list } from '@keystone-6/core';
import {
  text,
  select,
  image,
  json,
  timestamp,
  relationship
} from '@keystone-6/core/fields';

import { allowAll } from "@keystone-6/core/access";

export const AdStat = list({
  access: allowAll,
  fields: {
    eventType: select({
      options: [
        { label: "Impression", value: "impression" },
        { label: "Click", value: "click" }
      ],
      validation: { isRequired: true }
    }),
    timestamp: timestamp({
      defaultValue: { kind: 'now' },
      validation: { isRequired: true }
    }),
    ad: relationship({ ref: 'Ad.stats', many: false })
  }
});

export const Ad = list({
  access: allowAll,
  fields: {
    title: text({ validation: { isRequired: true } }),
    description: text({ validation: { isRequired: true } }),
    mode: select({
      options: [
        { label: "Image + Link", value: "imageLink" },
        { label: "HTML", value: "html" },
      ],
      defaultValue: "imageLink",
      ui: { displayMode: 'segmented-control' }
    }),

    image: image({ storage: "ads" }),
    link: text({ ui: { description: "Click ad link" } }),
    html: text({
      ui: {
        displayMode: 'textarea',
      },
      validation: {
        isRequired: false,
        length: { max: 100000 },
      },
      db: {
        nativeType: 'Text',
      },
    }),
    location: select({
      options: [
        { label: 'Header', value: 'header' },
        { label: 'Footer', value: 'footer' },
        { label: 'Nav', value: 'nav' },
        { label: 'Aside', value: 'aside' },
        { label: 'Center', value: 'center' },
        { label: 'Custom', value: 'custom' }
      ],
      defaultValue: "header",
      ui: { displayMode: 'segmented-control' }
    }),
    top: text(),
    bottom: text(),
    left: text(),
    right: text(),

    dimensions: select({
      options: [
        { label: 'Leaderboard', value: 'leaderboard' },
        { label: 'Skyscraper', value: 'skyscraper' },
        { label: 'Popup', value: 'popup' },
        { label: 'Custom', value: 'custom' }
      ],
      defaultValue: "leaderboard",
      ui: { displayMode: 'segmented-control' }
    }),
    width: text(),
    height: text(),

    status: select({
      options: [
        { label: "Disable", value: "disable" },
        { label: "Active", value: "active" },
        { label: "Now", value: "now" }
      ],
      defaultValue: "disable",
      ui: { displayMode: 'segmented-control' }
    }),
    stats: relationship({ ref: 'AdStat.ad', many: true }),
  },
  ui: {
    itemView: {
      fieldMode: ({ item, fieldKey }) => {
        console.log(item, fieldKey);
        if (fieldKey === "image" || fieldKey === "link") {
          return item?.mode === "imageLink" ? "edit" : "hidden";
        }
        if (fieldKey === "html") {
          console.log(item.mode, fieldKey);
          return item?.mode === "html" ? "edit" : "hidden";
        }

        if (['top', 'bottom', 'left', 'right'].includes(fieldKey)) {
          return item?.location === "custom" ? "edit" : "hidden";
        }

        if (['width', 'height'].includes(fieldKey)) {
          return item?.dimensions === "custom" ? "edit" : "hidden";
        }

        return "edit";
      }
    }
  },
  hooks: {
    resolveInput: async ({ inputData, resolvedData }) => {
      switch (resolvedData.location) {
        case "header":
          resolvedData.top = "4rem";
          resolvedData.left = "50%";
          resolvedData.bottom = "";
          resolvedData.right = "";
          break;

        case "footer":
          resolvedData.bottom = "0rem";
          resolvedData.left = "50%";
          resolvedData.top = "";
          resolvedData.right = "";
          break;

        case "nav":
          resolvedData.top = "4rem";
          resolvedData.left = "0rem";
          resolvedData.right = "";
          resolvedData.bottom = "";
          break;

        case "aside":
          resolvedData.top = "4rem";
          resolvedData.right = "0rem";
          resolvedData.left = "";
          resolvedData.bottom = "";
          break;

        case "center":
          resolvedData.top = "50%";
          resolvedData.right = "50%";
          resolvedData.left = "";
          resolvedData.bottom = "";
          break;
      }

      switch (resolvedData.dimensions) {
        case "leaderboard":
          resolvedData.width = "728px";
          resolvedData.height = "90px";
          break;

        case "skyscraper":
          resolvedData.width = "160px";
          resolvedData.height = "600px";
          break;

        case "popup":
          resolvedData.width = "250px";
          resolvedData.height = "250px";
          break;

        default:
          resolvedData.width = "128px";
          resolvedData.height = "128px";
      }
      return resolvedData;
    }
  }
});
