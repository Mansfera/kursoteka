import express, { Request, Response, Router } from "express";
import { ChangeCredentialsRequest, UserDetailsRequest, LoginRequest, RegisterRequest } from "../types";
import { dbHelpers } from "../app";
import type { DbHelpers } from "../types";

const router: Router = express.Router();

// Cast dbHelpers to remove null possibility
const db = dbHelpers as DbHelpers;

function createRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.post("/register", async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  const { login, password, name, surname } = req.body;

  try {
    if (
      login.length > 2 &&
      !login.includes('"') &&
      !login.includes("'") &&
      password.length > 6 &&
      !password.includes('"') &&
      !password.includes("'")
    ) {
      const existingUser = await db.getUserByLogin(login);

      if (!existingUser) {
        const auth_key = createRandomString(128);
        await db.insertUser({
          login,
          password,
          name,
          surname,
          group_type: "student",
          auth_key,
          coursesOwned: "[]",
        });

        res.status(200).json({
          group: "student",
          auth_key,
          coursesOwned: [],
          name,
          surname,
        });
      } else {
        res.status(403).json({});
      }
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/login", async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { login, password } = req.body;

  try {
    const user = await db.getUserByLogin(login);

    if (user) {
      if (user.password === password) {
        await db.getUserCourses(user.auth_key);

        res.status(200).json({
          group: user.group_type,
          auth_key: user.auth_key,
          coursesOwned: JSON.parse(user.coursesOwned),
          name: user.name,
          surname: user.surname,
        });
      } else {
        res.status(403).json({});
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/getUserDetails", async (req: Request<{}, {}, UserDetailsRequest>, res: Response) => {
  const { auth_key } = req.body;

  try {
    const user = await db.getUserByAuthKey(auth_key);
    if (user) {
      res.status(200).send({
        username: user.login,
        name: user.name,
        surname: user.surname,
      });
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/changeUserCredentials", async (req: Request<{}, {}, ChangeCredentialsRequest>, res: Response) => {
  const { auth_key, login, name, surname } = req.body;

  try {
    const user = await db.getUserByAuthKey(auth_key);
    if (user) {
      await db.updateUserAndCourses(
        auth_key,
        login || user.login,
        name || user.name || null,
        surname || user.surname || null
      );
      res.status(200).send({ message: "✅" });
    } else {
      res.status(404).send("Користувача не знайдено");
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
