// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config

import { config } from "@keystone-6/core";
import { lists } from "./schema";
import express, { Request, Response } from "express";
import cors from "cors";
import { config as dotenvConfig } from "dotenv";

import { withAuth, session } from "./auth";
import {
  featuredVideosHandler,
  searchHandler,
  videoHandler,
} from "./api/videos";
import { categoryHandler } from "./api/categories";
import { postSearchHandler } from "./api/instagram";
import { verifyVideosHandler } from "./api/sync";
import { passwordResetHandler } from "./api/passwordReset";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});

dotenvConfig();
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "https://eternityready.com"];

export default withAuth(
  config({
    db: {
      provider: "mysql",
      url: process.env.DATABASE_URL!,
      onConnect: async (context) => {
        try {
          if ((await context.sudo().db.User.count()) === 0) {
            console.log("No users found. Create the first one at Admin UI");
          }
        } catch (err) {
          console.error("Error connecting to database:", err);
        }
      },
    },
    ui: {
      isAccessAllowed: async (context) => {
        const users = await context.sudo().db.User.count();
        console.log(users);
        if (users === 0) {
          return true;
        } // Libera acesso à tela de criação do primeiro user
        return !!context.session?.data; // Depois disso, exige login
      },
    },
    lists,
    session,
    storage: {
      video_files: {
        kind: "local",
        type: "file",
        generateUrl: (path) => `/videos/${path}`,
        serverRoute: {
          path: "/videos",
        },
        storagePath: "public/videos",
      },
      video_previews: {
        kind: "local",
        type: "file",
        generateUrl: (path) => `/previews/${path}`,
        serverRoute: {
          path: "/previews",
        },
        storagePath: "public/previews",
      },
      thumbnails: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `/thumbnails/${path}`,
        serverRoute: {
          path: "/thumbnails",
        },
        storagePath: "public/thumbnails",
      },
      ads: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `/ads/${path}`,
        serverRoute: {
          path: "/ads",
        },
        storagePath: "public/ads",
      },
      profile_images: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `/profile_images/${path}`,
        serverRoute: {
          path: "/profile_images",
        },
        storagePath: "public/profile_images",
      }
    },

    server: {
      extendExpressApp: (app, context) => {
        app.use(
          cors({
            // origin: function (origin, callback) {
            //   if (!origin) return callback(null, true);
            //   if (allowedOrigins.includes(origin)) {
            //     return callback(null, true);
            //   } else {
            //     return callback(new Error("Not allowed by CORS"));
            //   }
            // },
            origin: "*", // Only for developing
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "x-apollo-operation-name"],
            credentials: true,
          })
        );

        app.use(
          (
            err: Error,
            req: Request,
            res: Response,
            next: (arg0: Error) => void
          ) => {
            if (err instanceof Error && err.message === "Not allowed by CORS") {
              res
                .status(403)
                .json({ error: "CORS Error: Not allowed by CORS" });
            } else {
              next(err);
            }
          }
        );

        app.use(
          cors({
            origin: true, // permite qualquer origem
            credentials: true,
          })
        );

        app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
          const sig = req.headers['stripe-signature'];
          let event;

          try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
          } catch (err) {
            return res.status(400).send(`Webhook Error`);
          }

          switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
              const subscription = event.data.object as Stripe.Subscription;
              const customerId = subscription.customer as string;
              const status = subscription.status;

              console.log(customerId);

              const user = await context.sudo().db.User.findOne({
                where: { stripeCustomerId: customerId },
              });

              if (!user) break;

              const privilege = (status === 'active' || status === 'trialing') ? 'donator' : 'normal';

              await context.sudo().db.User.updateOne({
                where: { id: user.id },
                data: {
                  privilege,
                  stripeSubscriptionId: subscription.id,
                  stripeStatus: status,
                },
              });

              break;
            }
            case 'customer.subscription.deleted':
            case 'customer.subscription.canceled': {
              const subscription = event.data.object as Stripe.Subscription;
              const customerId = subscription.customer as string;

              const user = await context.sudo().db.User.findOne({
                where: { stripeCustomerId: customerId },
              });

              if (!user) break;

              await context.sudo().db.User.updateOne({
                where: { id: user.id },
                data: {
                  privilege: 'normal',
                  stripeSubscriptionId: null,
                  stripeStatus: subscription.status,
                },
              });

              break;
            }
            default:
              break;
          }

          res.json({ received: true });
        });

        app.use(express.json());

        app.get("/api/search", async (req: Request, res: Response) => {
          await searchHandler(req, res, context);
        });

        app.get("/api/video/:id", async (req: Request, res: Response) => {
          await videoHandler(req, res, context);
        });

        app.get("/api/categories", async (req: Request, res: Response) => {
          await categoryHandler(req, res, context);
        });

        app.get("/api/instagram", async (req: Request, res: Response) => {
          await postSearchHandler(req, res, context);
        });

        app.post("/api/verifyVideo", async (req: Request, res: Response) => {
          await verifyVideosHandler(req, res, context);
        });

        app.get("/api/highlight", async (req: Request, res: Response) => {
          await featuredVideosHandler(req, res, context);
        });

        app.post("/api/password-reset", async (req: Request, res: Response) => {
          await passwordResetHandler(req, res, context);
        });

        app.post('/api/create-checkout-session', async (req, res) => {
          const requestContext = await context.withRequest(req, res);
          const session = requestContext.session;

          if (!session?.itemId) {
            return res.status(401).json({ error: 'Not authenticated' });
          }

          const userId = session.itemId;

          const user = await context.sudo().db.User.findOne({ where: { id: userId } });

          let stripeCustomerId = user.stripeCustomerId;
          if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
              email: user.email,
              metadata: { keystoneUserId: userId },
            });
            stripeCustomerId = customer.id;
            await context.sudo().db.User.updateOne({
              where: { id: userId },
              data: { stripeCustomerId },
            });
          }

          const sessionCheckout = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [
              {
                price: 'price_1SYXWhH41rsd1BFLnQlxmIdq',
                quantity: 1,
              },
            ],
            success_url: `${process.env.ETERNITY_BASE_URL}/login?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
              keystoneUserId: userId,
            },
          });

          res.json({ url: sessionCheckout.url });
        });

        
        app.use(async (err: any, req: Request, res: Response, next: any) => {
          console.error('Global error:', err.message || err);
          console.error('Stack:', err.stack);

          res.status(err.status || 500).json({
            error: true,
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
          });
        });
      },
    },
  })
);
