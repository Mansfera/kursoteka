import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";
import { DbHelpers as DbHelpersType } from "./types";
import database from "./db/database";
import { Database as DatabaseType } from "@sqlitecloud/drivers";

interface UpdateServerRequest extends Request {
  query: {
    auth_key: string;
  };
}

const app = express();
const port = 30000;

app.use((req: Request, res: Response, next: NextFunction) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Expires", "-1");
  res.set("Pragma", "no-cache");
  next();
});

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static("public"));

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Only log /api requests
  if (!req.url.startsWith("/api")) {
    return next();
  }

  const start = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Capture both res.send() and res.json() responses
  res.send = function (body) {
    logRequest(req, res, start, body);
    return originalSend.call(this, body);
  };

  res.json = function (body) {
    logRequest(req, res, start, body);
    return originalJson.call(this, body);
  };

  // Capture all responses including 404s
  res.on("finish", () => {
    // Only log if it hasn't been logged by send/json
    if (!res.locals.logged) {
      logRequest(req, res, start);
    }
  });

  next();
};

const logRequest = (
  req: Request,
  res: Response,
  start: number,
  body: any = null
) => {
  // Prevent double-logging
  if (res.locals.logged) return;
  res.locals.logged = true;

  const duration = Date.now() - start;
  const timestamp = new Date().toISOString();

  let logMessage = `[${timestamp}] ${req.method} ${req.url}`;
  logMessage += ` - Status: ${res.statusCode}`;
  logMessage += ` - Duration: ${duration}ms`;

  if (req.query.auth_key) {
    logMessage += ` - Auth: ${req.query.auth_key}`;
  }

  // Log request body if it exists and isn't empty
  if (req.body && Object.keys(req.body).length > 0) {
    logMessage += `\n  Request Body: ${JSON.stringify(req.body)}`;
  }

  // Log response body
  if (body) {
    logMessage += `\n  Response: ${JSON.stringify(body)}`;
  }

  console.log(logMessage);
};

app.use(requestLogger);

let dbHelpers: DbHelpersType | null = null;
let db: DatabaseType | null = null;

async function initializeApp(): Promise<void> {
  try {
    const { db: initializedDb, dbHelpers: initializedHelpers } =
      await database.initialize();

    if (!initializedDb || !initializedHelpers) {
      throw new Error(
        `Database not initialized correctly:\n` +
          `db: ${initializedDb ? "exists" : "missing"}\n` +
          `dbHelpers: ${initializedHelpers ? "exists" : "missing"}`
      );
    }

    db = initializedDb;
    dbHelpers = initializedHelpers;

    const checkDbHelpers = (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      if (!dbHelpers) {
        return res
          .status(500)
          .json({ error: "Database helpers not initialized" });
      }
      next();
    };

    const authRoutes = (await import("./routes/auth")).default;
    const courseRoutes = (await import("./routes/course")).default;
    const marketplaceRoutes = (await import("./routes/marketplace")).default;
    const courseEditorRoutes = (await import("./routes/courseEditor")).default;

    app.use("/api/auth", checkDbHelpers, authRoutes);
    app.use("/api/course", checkDbHelpers, courseRoutes);
    app.use("/api/marketplace", checkDbHelpers, marketplaceRoutes);
    app.use("/api/courseEditor", checkDbHelpers, courseEditorRoutes);

    app.get(
      "/api/updateserver",
      checkDbHelpers,
      async (req: UpdateServerRequest, res: Response) => {
        const auth_key = req.query.auth_key;

        console.log("api/updateserver");

        try {
          const user = await dbHelpers!.getUserByAuthKey(auth_key);

          if (
            !user ||
            (user.group_type !== "admin" && user.login !== "mansfera")
          ) {
            return res.status(403).json({ error: "Unauthorized" });
          }

          exec("./update.sh", (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing update.sh: ${error}`);
              console.error(`stderr: ${stderr}`);
              return res
                .status(500)
                .json({ error: "Update failed", details: stderr });
            }

            if (stderr) {
              console.warn(`Warning from update.sh: ${stderr}`);
            }

            console.log(`update.sh output: ${stdout}`);
            res.status(200).json({ message: "Update successful" });
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Server error" });
        }
      }
    );

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

initializeApp();

export { dbHelpers, db };
