import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { hasCloudinaryConfig } from "./config/cloudinary.js";
import { hasRazorpayConfig, hasRazorpayWebhookConfig, isRazorpayLiveMode, isRazorpayModeAllowed, isRazorpayTestMode } from "./config/razorpay.js";
import { hasSupabaseAdminConfig, hasSupabaseAuthConfig } from "./config/supabaseClient.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      service: "quickdyne-backend",
      environment: process.env.NODE_ENV || "development",
      integrations: {
        supabaseAuth: hasSupabaseAuthConfig,
        supabaseAdmin: hasSupabaseAdminConfig,
        razorpay: hasRazorpayConfig,
        razorpayWebhook: hasRazorpayWebhookConfig,
        razorpayTestMode: isRazorpayTestMode,
        razorpayLiveMode: isRazorpayLiveMode,
        razorpayModeAllowed: isRazorpayModeAllowed,
        cloudinary: hasCloudinaryConfig
      }
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`QuickDyne backend listening on http://localhost:${port}`);
});
