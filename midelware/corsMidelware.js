import cors from "cors";

const ACCEPTED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "https://price-shoes-r7gq.vercel.app",
];

export const corsMiddleware = (origins = ACCEPTED_ORIGINS) =>
  cors({
    origin: (origin, callback) => {
      if (origins.includes(origin)) {
        return callback(null, true);
      }
      if (!origin) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  });
