import app from "./app.js";
import { seedAdminIfNeeded } from "./services/authService.js";
import { logConfig } from "./config/envConfig.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

seedAdminIfNeeded().catch((err) => {
  console.warn("Admin seed failed (may already exist):", err.message);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
  logConfig();
});
