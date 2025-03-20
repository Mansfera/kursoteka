import express, { Request, Response, Router } from "express";
import { checkAndUpdateExpiredCourses } from "../utils/helpers";
import { dbHelpers, db } from "../app";
import path from "path";
import fs from "fs";
import { ChangeAccessRequest, User } from "../types";
import type { DbHelpers, Database } from "../types";

// Cast to remove null possibility
const dbh = dbHelpers as DbHelpers;
const database = db as Database;

const PROJECT_ROOT = path.join(__dirname, "..");

function readJsonFile(filePath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(PROJECT_ROOT, filePath), "utf8", (err, data) => {
      if (err) {
        console.log(err);
        resolve(null);
      } else {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

const router: Router = express.Router();

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  function randomString(length: number) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const part1 = randomString(5);
  const part2 = randomString(5);
  const part3 = randomString(5);

  return `${part1}-${part2}-${part3}`;
}

router.post(
  "/changeAccessCourseForUser",
  async (req: Request<{}, {}, ChangeAccessRequest>, res: Response) => {
    const { auth_key, courseName, login, access } = req.body;

    try {
      const user = await dbh.getUserByAuthKey(auth_key);
      if (!user) {
        return res.status(404).send("User not found");
      }

      const coursesOwned = JSON.parse(user.coursesOwned);
      if (!coursesOwned.includes(courseName)) {
        return res.status(403).send("Ви не володієте цим курсом!");
      }

      const result = await dbh.updateCourseRestrictionByUsername(
        !access,
        login,
        courseName
      );

      if (result.changes > 0) {
        res.status(200).send({ data: "success" });
      } else {
        res.status(404).send("Course or user not found");
      }
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
router.post("/changeUserAllowedCourse", async (req: Request, res: Response) => {
  const { auth_key, courseName, username, allowed_tests } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(403).send("Будь ласка увійдіть 🔐");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("Ві не володієте цим курсом!");
    }

    const result = await dbh.updateAllowedTestsByUsername(
      allowed_tests,
      username,
      courseName
    );

    if (result.changes > 0) {
      res.status(200).send("Дані оновлені успішно");
    } else {
      res.status(404).send("User or course not found");
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/getOwnedCourses", async (req: Request, res: Response) => {
  const { auth_key } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    const ownedCourses = [];

    // Fetch each owned course from database
    for (const courseId of coursesOwned) {
      const course = await dbh.getCourseById(courseId);
      if (course) {
        // Transform course data from DB format
        const transformedCourse = {
          ...course,
          tags: JSON.parse(course.tags),
          marketplace_info: course.marketplace_info
            ? JSON.parse(course.marketplace_info)
            : {},
          blocks: course.blocks ? JSON.parse(course.blocks) : [],
        };
        ownedCourses.push(transformedCourse);
      }
    }

    res.json({ courses: ownedCourses });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/getUsers", async (req, res) => {
  const { auth_key, courseName } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("Ви не володієте цим курсом!");
    }

    const students = await dbh.getUsersWithCourse(courseName);
    const safeStudents = await Promise.all(
      students.map(async (student) => {
        const courses = await dbh.getCourseByUserAndId(
          student.auth_key,
          courseName
        );
        return {
          login: student.login,
          name: student.name,
          surname: student.surname,
          group: student.group_type,
          courses: courses
            ? [
                {
                  id: courses.course_id,
                  hidden: Boolean(courses.hidden),
                  restricted: Boolean(courses.restricted),
                  data: {
                    join_date: courses.join_date,
                    expire_date: courses.expire_date,
                    allowed_tests: JSON.parse(courses.allowed_tests),
                    completed_tests: JSON.parse(courses.completed_tests),
                  },
                },
              ]
            : [],
        };
      })
    );

    res.json({ students: safeStudents });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/activateCode", async (req, res) => {
  const { auth_key, code } = req.body;

  try {
    // Validate input
    if (!auth_key || !code) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(403).json({ message: "Будь ласка увійдіть 🔐" });
    }

    // Get unused promocode
    const promocode = await dbh.getUnusedPromocode(code, Date.now());

    if (!promocode) {
      return res
        .status(400)
        .json({ message: "Неправильний або використаний код ❌" });
    }

    // Check if user already has the course
    const existingCourse = await dbh.getCourseByUserAndId(
      auth_key,
      promocode.course_id
    );
    if (existingCourse) {
      return res.status(403).json({ message: "Ви вже маєте цей курс 😉" });
    }

    // Get course details
    const course = await dbh.getCourseById(promocode.course_id);

    if (!course) {
      return res.status(404).json({ message: "Курс не знайдено 🤔" });
    }

    // Begin transaction
    try {
      await database.run("BEGIN TRANSACTION");

      // Update promocode first
      await dbh.updatePromocode(Date.now(), auth_key, code);

      // Create user course assignment
      const userData = {
        login: user.login,
        name: user.name || "",
        surname: user.surname || "",
      };

      // Use the existing insertUserCourse function
      await dbh.insertUserCourse({
        auth_key: auth_key,
        user_data: JSON.stringify(userData),
        course_id: promocode.course_id,
        hidden: false,
        join_date: Date.now(),
        expire_date: Date.now() + promocode.access_duration,
        restricted: false,
        allowed_tests: promocode.start_temas,
        completed_tests: "[]",
      });

      await database.run("COMMIT");
      res.status(200).json({ message: "Успіх! ✅" });
    } catch (error) {
      console.error("Transaction error:", error);
      try {
        await database.run("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error activating code:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.post("/generateCode", async (req, res) => {
  const { auth_key, course, expire_date, access_duration, start_temas } =
    req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(course)) {
      return res.status(403).json({ message: "User does not own this course" });
    }

    let code;
    do {
      code = generateCode();
    } while (await dbh.getPromocode(code));

    let _expire_date;
    if (expire_date == "") {
      _expire_date = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
    } else {
      _expire_date = +expire_date;
    }

    let _access_time;
    if (access_duration == "") {
      _access_time = 300 * 24 * 60 * 60 * 1000; // 300 days from now
    } else if (+access_duration == 0) {
      _access_time = -1; // Using -1 to represent "never" in database
    } else {
      _access_time = +access_duration * 24 * 60 * 60 * 1000;
    }

    let _start_temas = [];
    if (start_temas[0] === "") {
      _start_temas = ["all"];
    } else {
      _start_temas = start_temas;
    }

    const newPromocode = {
      course_id: course,
      code: code,
      expire_date: _expire_date,
      access_duration: _access_time,
      start_temas: JSON.stringify(_start_temas),
    };

    await dbh.insertPromocode(newPromocode);

    res.status(200).json({
      promocode: {
        id: course,
        code: code,
        expire_date: _expire_date,
        access_duration: _access_time,
        used_date: -1,
        used_by: "",
        start_temas: _start_temas,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/getPromoCodes", async (req, res) => {
  const { auth_key, course } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(course)) {
      return res.status(403).json({ message: "User does not own this course" });
    }

    const promocodes = await dbh.getPromocodesByCourse(course);
    const formattedPromocodes = await Promise.all(
      promocodes.map(async (promocode) => {
        const used_by_user = promocode.used_by
          ? await dbh.getUserByAuthKey(promocode.used_by)
          : null;
        const name = used_by_user
          ? `${used_by_user.name} ${used_by_user.surname}`
          : "";
        return {
          id: promocode.course_id,
          code: promocode.code,
          expire_date: promocode.expire_date,
          access_duration: promocode.access_duration,
          used_date: promocode.used_date,
          used_by: name,
          start_temas: JSON.parse(promocode.start_temas),
        };
      })
    );

    res.status(200).json({ promocodes: formattedPromocodes });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/deletePromoCode", async (req, res) => {
  const { auth_key, code } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(403).json({ message: "Будь ласка увійдіть 🔐" });
    }

    const promocode = await dbh.getPromocode(code);
    if (!promocode) {
      return res.status(404).json({ message: "Код не знайдено ❌" });
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(promocode.course_id)) {
      return res.status(403).json({ message: "Ви не володієте цим курсом ❌" });
    }

    const result = await dbh.deletePromocode(code);
    if (result.changes > 0) {
      res.status(200).json({ message: "Успіх! ✅" });
    } else {
      res.status(404).json({ message: "Код не знайдено" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/getUserStats", async (req, res) => {
  const { auth_key, courseName, start_date, end_date, login } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    let targetUser: User | null = user;
    if (user.coursesOwned.includes(courseName) && login) {
      targetUser = await dbh.getUserByLogin(login);
      if (!targetUser) {
        return res.status(404).send("Student not found");
      }
    }

    const userCourse = await dbh.getCourseByUserAndId(
      targetUser!.auth_key,
      courseName
    );
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (start_date && end_date) {
      const completedTests = JSON.parse(userCourse.completed_tests).filter(
        (test: { date: number }) =>
          test.date >= start_date && test.date <= end_date
      );
      res.status(200).json({ completed_tests: completedTests });
    } else {
      res.status(200).json({
        join_date: userCourse.join_date,
        expire_date: userCourse.expire_date,
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Error loading test data");
  }
});
router.post("/getUserCourses", async (req, res) => {
  const { auth_key, specific_course } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check for expired courses before proceeding
    await checkAndUpdateExpiredCourses(auth_key);

    if (specific_course) {
      const userCourse = await dbh.getCourseByUserAndId(
        auth_key,
        specific_course
      );
      if (!userCourse) {
        return res.status(404).json({ courses: [] });
      }

      if (!userCourse.restricted) {
        const course = await dbh.getCourseById(specific_course);
        if (course) {
          // Transform course data from DB format
          const transformedCourse = {
            ...course,
            tags: JSON.parse(course.tags),
            marketplace_info: course.marketplace_info
              ? JSON.parse(course.marketplace_info)
              : {},
            blocks: course.blocks ? JSON.parse(course.blocks) : [],
          };

          return res.status(200).json({
            courses: [transformedCourse],
            allowed_tests: JSON.parse(userCourse.allowed_tests),
          });
        }
      }
    } else {
      const userCourses = await dbh.getUserCourses(auth_key);
      const activeCourses = [];
      const restrictedCourses = [];

      // Process each user course
      for (const userCourse of userCourses) {
        const courseDetails = await dbh.getCourseById(userCourse.course_id);
        if (courseDetails) {
          // Transform course data from DB format
          const transformedCourse = {
            ...courseDetails,
            tags: JSON.parse(courseDetails.tags),
            marketplace_info: courseDetails.marketplace_info
              ? JSON.parse(courseDetails.marketplace_info)
              : {},
            blocks: courseDetails.blocks
              ? JSON.parse(courseDetails.blocks)
              : [],
          };

          if (userCourse.restricted) {
            restrictedCourses.push(transformedCourse);
          } else {
            activeCourses.push(transformedCourse);
          }
        }
      }

      return res.status(200).json({
        courses: activeCourses,
        restricted: restrictedCourses,
      });
    }

    res.status(404).json({ courses: [] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/getCoverImage", async (req: Request, res: Response) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  let image_name = req.query.image_name || "cover";
  const auth_key = req.query.auth_key as string;

  if (auth_key) {
    try {
      const userCourse = await dbh.findCourse(auth_key, courseName as string);
      if (!userCourse) {
        return res.status(404).send("Course not found");
      }

      let filePathImg;
      if (testId) {
        filePathImg = path.join(
          PROJECT_ROOT,
          "courseData",
          courseName as string,
          `block${blockId}/test${testId}/${image_name}.jpeg`
        );
      } else if (blockId) {
        filePathImg = path.join(
          PROJECT_ROOT,
          "courseData",
          courseName as string,
          `block${blockId}/${image_name}.jpeg`
        );
      } else {
        filePathImg = path.join(
          PROJECT_ROOT,
          "courseData",
          courseName as string,
          `${image_name}.jpeg`
        );
      }

      fs.readFile(filePathImg, (err, data) => {
        if (err) {
          console.log(err);
          res.status(404).send("Image not found");
        } else {
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(data);
        }
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    const filePathImg = path.join(
      PROJECT_ROOT,
      "courseData",
      courseName as string,
      `${image_name}.jpeg`
    );
    fs.readFile(filePathImg, (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        res.status(404).send("Image not found");
      } else {
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(data);
      }
    });
  }
});

router.get("/getPlaylist", async (req, res) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const blockId = req.query.block as string;
  const testId = req.query.tema as string;

  try {
    // Check for expired courses before proceeding
    await checkAndUpdateExpiredCourses(auth_key);

    const userCourse = await dbh.getCourseByUserAndId(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Course not found");
    }

    const playlistData = await readJsonFile(
      `courseData/${courseName}/block${blockId}/test${testId}/playlist.json`
    );

    if (playlistData) {
      res.json({ list: playlistData });
    } else {
      res.status(404).send("Playlist not found");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/getCardImage", async (req, res) => {
  const courseName = req.query.course as string;
  const blockId = req.query.blockId as string;
  const testId = req.query.testId as string;
  const imageId = req.query.imageId as string;
  const auth_key = req.query.auth_key as string;

  try {
    // Check for expired courses before proceeding
    await checkAndUpdateExpiredCourses(auth_key);

    const userCourse = await dbh.getCourseByUserAndId(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Access denied");
    }

    const filePathImg = path.join(
      PROJECT_ROOT,
      "courseData",
      courseName as string,
      `block${blockId}/test${testId}/cardImages/${imageId}.png`
    );

    fs.readFile(filePathImg, (err, data) => {
      if (err) {
        res.status(404).send("Image not found");
      } else {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(data);
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/loadCardsData", async (req, res) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const block = req.query.block as string;
  const tema = req.query.tema as string;

  try {
    // Check for expired courses before proceeding
    await checkAndUpdateExpiredCourses(auth_key);

    const userCourse = await dbh.getCourseByUserAndId(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Cards not found");
    }

    const allowedTests = JSON.parse(userCourse.allowed_tests);
    if (!allowedTests.includes("all") && !allowedTests.includes(tema)) {
      return res.status(403).send("Cards not found");
    }

    const cards = await readJsonFile(
      `courseData/${courseName}/block${block}/test${tema}/cards.json`
    );

    if (cards) {
      res.json(cards);
    } else {
      res.status(404).send("Cards not found");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/loadTestData", async (req, res) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const block = req.query.block as string;
  const firstTest = req.query.firstTest as string;
  const lastTest = req.query.lastTest as string;
  const testType = req.query.testType as string;

  try {
    // Check for expired courses before proceeding
    await checkAndUpdateExpiredCourses(auth_key);

    const userCourse = await dbh.getCourseByUserAndId(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Found non-allowed test");
    }

    const allowedTests = JSON.parse(userCourse.allowed_tests);
    if (!allowedTests.includes("all") && !allowedTests.includes(lastTest)) {
      return res.status(403).send("Found non-allowed test");
    }

    const course = await dbh.getCourseById(courseName);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    // Parse the blocks JSON string from the database
    const course_obj = {
      ...course,
      blocks: course.blocks ? JSON.parse(course.blocks) : [],
    };

    let temas_id_list: string[] = [];

    if (testType === "summary") {
      // For summary test, get all test IDs from all blocks
      course_obj.blocks.forEach(
        (block_obj: { id: string; tests: { id: string }[] }) => {
          block_obj.tests.forEach((test_obj: { id: string }) => {
            temas_id_list.push(test_obj.id);
          });
        }
      );
    } else {
      // Original logic for other test types
      let first_tema_found = false;
      let last_tema_found = false;

      course_obj.blocks.some((block_obj: { tests: { id: string }[] }) => {
        return block_obj.tests.some((test_obj: { id: string }) => {
          if (test_obj.id == firstTest) {
            first_tema_found = true;
          }
          if (first_tema_found && !last_tema_found) {
            temas_id_list.push(test_obj.id);
          }
          if (test_obj.id == lastTest) {
            last_tema_found = true;
          }
        });
      });
    }

    const questions = [];
    const vidpovidnistQuestions = [];
    const hronologyQuestions = [];
    const mulAnsQuestions = [];

    if (testType === "summary") {
      // Randomly select test IDs for each question type
      const selectedTestIds = new Set<string>();

      // Helper function to get random questions from a file
      const getRandomQuestions = async (
        testId: string,
        filePath: string,
        count: number
      ) => {
        const data = (await readJsonFile(filePath)) as any[];
        if (!data) return [];
        return data.sort(() => Math.random() - 0.5).slice(0, count);
      };

      // Helper function to find block ID for a test ID
      const findBlockForTest = (testId: string): string => {
        for (const block of course_obj.blocks) {
          if (block.tests.some((test: { id: string }) => test.id === testId)) {
            return block.id;
          }
        }
        return "";
      };
      const clearTestIds = true || temas_id_list.length < 30;
      // Get 20 random test questions
      while (questions.length < 20 && temas_id_list.length > 0) {
        const randomIndex = Math.floor(Math.random() * temas_id_list.length);
        const testId = temas_id_list[randomIndex];

        if (!selectedTestIds.has(testId)) {
          const blockId = findBlockForTest(testId);
          const testQuestions = await getRandomQuestions(
            testId,
            `courseData/${courseName}/block${blockId}/test${testId}/questions.json`,
            1
          );
          if (testQuestions.length > 0) {
            questions.push(...testQuestions);
            selectedTestIds.add(testId);
          }
        }

        if (selectedTestIds.size === temas_id_list.length) break;
      }
      // Get 4 random vidpovidnist questions
      clearTestIds && selectedTestIds.clear();
      while (vidpovidnistQuestions.length < 4 && temas_id_list.length > 0) {
        const randomIndex = Math.floor(Math.random() * temas_id_list.length);
        const testId = temas_id_list[randomIndex];

        if (!selectedTestIds.has(testId)) {
          const blockId = findBlockForTest(testId);
          const questions = await getRandomQuestions(
            testId,
            `courseData/${courseName}/block${blockId}/test${testId}/vidpovidnist_questions.json`,
            1
          );
          if (questions.length > 0) {
            vidpovidnistQuestions.push(...questions);
            selectedTestIds.add(testId);
          }
        }

        if (selectedTestIds.size === temas_id_list.length) break;
      }
      // Get 3 random hronology questions
      while (hronologyQuestions.length < 3 && temas_id_list.length > 0) {
        const randomIndex = Math.floor(Math.random() * temas_id_list.length);
        const testId = temas_id_list[randomIndex];

        if (!selectedTestIds.has(testId)) {
          const blockId = findBlockForTest(testId);
          const questions = await getRandomQuestions(
            testId,
            `courseData/${courseName}/block${blockId}/test${testId}/hronology_questions.json`,
            1
          );
          if (questions.length > 0) {
            hronologyQuestions.push(...questions);
            selectedTestIds.add(testId);
          }
        }

        if (selectedTestIds.size === temas_id_list.length) break;
      }
      // Get 3 random multiple answer questions
      while (mulAnsQuestions.length < 3 && temas_id_list.length > 0) {
        const randomIndex = Math.floor(Math.random() * temas_id_list.length);
        const testId = temas_id_list[randomIndex];

        if (!selectedTestIds.has(testId)) {
          const blockId = findBlockForTest(testId);
          const questions = await getRandomQuestions(
            testId,
            `courseData/${courseName}/block${blockId}/test${testId}/mul_ans_questions.json`,
            1
          );
          if (questions.length > 0) {
            mulAnsQuestions.push(...questions);
            selectedTestIds.add(testId);
          }
        }

        if (selectedTestIds.size === temas_id_list.length) break;
      }
    } else {
      // Original logic for other test types
      for (const id of temas_id_list) {
        let testQuestions: any[] = [];
        let testVidpovidnistQuestions: any[] = [];
        let testHronologyQuestions: any[] = [];
        let testMulAnsQuestions: any[] = [];

        await Promise.all([
          readJsonFile(
            `courseData/${courseName}/block${block}/test${id}/questions.json`
          ).then((data) => {
            if (data)
              testQuestions = (data as any[]).sort(
                (p1: { year: number }, p2: { year: number }) =>
                  p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
              );
          }),
          readJsonFile(
            `courseData/${courseName}/block${block}/test${id}/vidpovidnist_questions.json`
          ).then((data) => {
            if (data) testVidpovidnistQuestions = data as any[];
          }),
          readJsonFile(
            `courseData/${courseName}/block${block}/test${id}/hronology_questions.json`
          ).then((data) => {
            if (data) testHronologyQuestions = data as any[];
          }),
          readJsonFile(
            `courseData/${courseName}/block${block}/test${id}/mul_ans_questions.json`
          ).then((data) => {
            if (data)
              testMulAnsQuestions = (data as any[]).sort((p1, p2) =>
                p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
              );
          }),
        ]);

        questions.push(...testQuestions);
        vidpovidnistQuestions.push(...testVidpovidnistQuestions);
        hronologyQuestions.push(...testHronologyQuestions);
        mulAnsQuestions.push(...testMulAnsQuestions);
      }
    }

    let response = {
      questions,
      vidpovidnistQuestions,
      hronologyQuestions,
      mulAnsQuestions,
      final_tema_amount: 0,
    };
    if (temas_id_list.length > 1) {
      response.final_tema_amount =
        questions.length +
        vidpovidnistQuestions.length +
        hronologyQuestions.length +
        mulAnsQuestions.length;
    }

    res.json(response);
  } catch (error) {
    console.error("Error loading test data:", error);
    res.status(500).send("Error loading test data");
  }
});
router.get("/getImage", async (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  const imageId = req.query.imageId;
  const auth_key = req.query.auth_key;

  try {
    // Check for expired courses before proceeding
    await checkAndUpdateExpiredCourses(auth_key as string);

    const userCourse = await dbh.getCourseByUserAndId(
      auth_key as string,
      courseName as string
    );
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Access denied");
    }

    const filePathImg = path.join(
      PROJECT_ROOT,
      "courseData",
      courseName as string,
      `block${blockId}/test${testId}/images/${imageId}.png`
    );

    fs.readFile(filePathImg, (err, data) => {
      if (err) {
        res.status(404).send("Image not found");
      } else {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(data);
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/sendTestResult", async (req, res) => {
  const {
    auth_key,
    date,
    time,
    courseName,
    test_type,
    block,
    test,
    score,
    abcd_questions_accuracy,
    hronology_questions_accuracy,
    vidpovidnist_questions_accuracy,
    mul_ans_questions_accuracy,
    uuid,
    questions_data,
  } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).send("Ви не є користувачем курсотеки!");
    }

    const userCourse = await dbh.getCourseByUserAndId(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    const completedTests = JSON.parse(userCourse.completed_tests);
    const allowedTests = JSON.parse(userCourse.allowed_tests);

    let short_test_check = false;
    let full_test_check = false;

    const test_uuid_exists = completedTests.find(
      (test: { uuid: string }) => test.uuid === uuid
    );
    if (test_uuid_exists) {
      return res.status(403).send("Test already completed");
    }

    // For summary tests, we'll store a special block ID
    const blockToStore = test_type === "summary" ? "summary" : block;

    completedTests.push({
      date,
      time,
      test_type,
      block: blockToStore,
      test,
      score,
      abcd_questions_accuracy,
      hronology_questions_accuracy,
      vidpovidnist_questions_accuracy,
      mul_ans_questions_accuracy,
      uuid,
    });

    // Save test details with the special block ID for summary tests
    await dbh.saveTestDetails({
      uuid,
      auth_key,
      course_id: courseName,
      date,
      time,
      test_type,
      block: blockToStore,
      test,
      score,
      abcd_questions_accuracy,
      hronology_questions_accuracy,
      vidpovidnist_questions_accuracy,
      mul_ans_questions_accuracy,
      questions_data,
    });

    // Check if we need to update allowed tests
    if (!allowedTests.includes("all")) {
      const course = await dbh.getCourseById(courseName);
      if (!course) {
        return res.status(404).send("Course not found");
      }

      // Parse the blocks JSON string from the database
      const course_obj = {
        ...course,
        blocks: course.blocks ? JSON.parse(course.blocks) : [],
      };

      // Get list of all test IDs
      let temas_id_list: string[] = [];
      course_obj.blocks.some((block_obj: { tests: { id: string }[] }) => {
        return block_obj.tests.some((test_obj: { id: string }) => {
          temas_id_list.push(test_obj.id);
        });
      });

      // Find next tema ID
      const next_tema_id = temas_id_list[temas_id_list.indexOf(test) + 1];
      let next_tema_is_in_block = false;

      switch (test_type) {
        case "short":
        case "full": {
          if (allowedTests.includes(next_tema_id)) {
            break;
          }

          // Check short test requirements
          let filteredTests = completedTests.filter(
            (item: { test: string; test_type: string }) =>
              item.test === test && item.test_type === "short"
          );
          if (filteredTests.length >= 3) {
            let filteredAndSortedTests = filteredTests.sort(
              (a: { date: string }, b: { date: string }) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            let lastTests = filteredAndSortedTests.slice(0, 3);
            let averageScore =
              lastTests.reduce(
                (sum: number, item: { score: number }) => sum + item.score,
                0
              ) / lastTests.length;

            course_obj.blocks.some(
              (block_obj: { id: string; tests: { id: string }[] }) => {
                if (block_obj.id == block) {
                  next_tema_is_in_block = !!block_obj.tests.find(
                    (test_obj: { id: string }) => test_obj.id == next_tema_id
                  );
                }
              }
            );

            if (averageScore >= 85 && next_tema_is_in_block) {
              short_test_check = true;
            }
          }

          // Check full test requirements
          filteredTests = completedTests.filter(
            (item: { test: string; test_type: string }) =>
              item.test === test && item.test_type === "full"
          );
          if (filteredTests.length > 0) {
            let filteredAndSortedTests = filteredTests.sort(
              (a: { date: string }, b: { date: string }) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            let lastTest = filteredAndSortedTests[0];

            course_obj.blocks.some(
              (block_obj: { id: string; tests: { id: string }[] }) => {
                if (block_obj.id == block) {
                  next_tema_is_in_block = !!block_obj.tests.find(
                    (test_obj: { id: string }) => test_obj.id == next_tema_id
                  );
                }
              }
            );

            if (lastTest.score >= 85 && next_tema_is_in_block) {
              full_test_check = true;
            }
          }

          if (short_test_check && full_test_check) {
            allowedTests.push(next_tema_id);
          }
          break;
        }
        case "final": {
          if (allowedTests.includes(next_tema_id)) {
            break;
          }

          const filteredTests = completedTests.filter(
            (item: { test: string }) => item.test === test
          );
          if (filteredTests.length > 1) {
            const filteredAndSortedTests = filteredTests.sort(
              (a: { date: string }, b: { date: string }) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const lastTest = filteredAndSortedTests[0];
            const secondLastTest = filteredAndSortedTests[1];

            if (
              lastTest &&
              lastTest.score >= 85 &&
              secondLastTest &&
              secondLastTest.score >= 85
            ) {
              allowedTests.push(next_tema_id);
            }
          }
          break;
        }
        case "summary": {
          // Summary test doesn't affect allowed tests
          break;
        }
      }
    }

    await dbh.addCompletedTest(
      JSON.stringify(completedTests),
      auth_key,
      courseName
    );

    if (!allowedTests.includes("all")) {
      await dbh.updateAllowedTests(
        JSON.stringify(allowedTests),
        auth_key,
        courseName
      );
    }

    // Cleanup old tests
    await dbh.cleanupOldTests();

    res.status(200).send({
      answer: "Test result saved",
      last_allowed_test: allowedTests[allowedTests.length - 1],
      test_url: `/test_results/?uuid=${uuid}`,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/getUncompletedTests", async (req, res) => {
  const { auth_key, course } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userCourse = await dbh.getCourseByUserAndId(auth_key, course);
    if (!userCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    const result = await dbh.getUncompletedTests(auth_key, course);
    res.json({
      tests: result.tests,
      last_updated: result.last_updated,
    });
  } catch (error) {
    console.error("Error getting uncompleted tests:", error);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/updateUncompletedTests", async (req, res) => {
  const { auth_key, course, tests, last_updated } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userCourse = await dbh.getCourseByUserAndId(auth_key, course);
    if (!userCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Get current server data to compare timestamps
    const currentData = await dbh.getUncompletedTests(auth_key, course);

    // Only update if client data is newer
    if (
      !currentData.last_updated ||
      !last_updated ||
      last_updated >= currentData.last_updated
    ) {
      const result = await dbh.updateUncompletedTests(
        auth_key,
        course,
        JSON.stringify(tests || [])
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Failed to update tests" });
      }

      res.json({
        success: true,
        changes: result.changes,
        last_updated: Date.now(),
      });
    } else {
      // Client data is older, send back current server data
      res.json({
        success: false,
        message: "Server data is newer",
        tests: currentData.tests,
        last_updated: currentData.last_updated,
      });
    }
  } catch (error) {
    console.error("Error updating uncompleted tests:", error);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/test-details/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const { auth_key } = req.query;

  try {
    const user = await dbh.getUserByAuthKey(auth_key as string);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const testDetails = await dbh.getTestDetails(uuid);
    if (!testDetails) {
      return res.status(404).send("Test not found");
    }

    // Check if user owns this test or owns the course
    const coursesOwned = JSON.parse(user.coursesOwned);
    if (
      testDetails.auth_key !== auth_key &&
      !coursesOwned.includes(testDetails.course_id)
    ) {
      return res.status(403).send("Access denied");
    }

    // Return test details in format expected by test page
    res.json({
      test_type: testDetails.test_type,
      block: testDetails.block,
      test: testDetails.test,
      questions: JSON.parse(testDetails.questions_data),
      completed: true,
      score: testDetails.score,
      abcd_questions_accuracy: testDetails.abcd_questions_accuracy,
      hronology_questions_accuracy: testDetails.hronology_questions_accuracy,
      vidpovidnist_questions_accuracy:
        testDetails.vidpovidnist_questions_accuracy,
      mul_ans_questions_accuracy: testDetails.mul_ans_questions_accuracy,
      date: testDetails.date,
      time: testDetails.time,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/course-tests/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const { auth_key } = req.query;

  try {
    const tests = await dbh.getUserTestsByTeacher(auth_key as string, courseId);
    if (!tests) {
      return res.status(403).send("Access denied");
    }

    res.json(tests);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/getConspectData", async (req, res) => {
  const { course, blockId, testId, conspectId } = req.query as {
    course: string;
    blockId: string;
    testId: string;
    conspectId: string;
  };
  const auth_key = req.query.auth_key as string;

  try {
    // Check for expired courses before proceeding
    await checkAndUpdateExpiredCourses(auth_key as string);

    const userCourse = await dbh.getCourseByUserAndId(auth_key, course);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Access denied");
    }

    const dirPath = path.join(
      PROJECT_ROOT,
      "courseData",
      course,
      `block${blockId}`,
      `test${testId}`
    );

    let filePath = path.join(dirPath, `conspect_${conspectId}.json`);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(dirPath, "conspect.json");
    }

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.json({
            id: conspectId || "",
            name: "",
            blocks: [],
          });
        } else {
          res.status(500).send("Error reading conspect");
        }
      } else {
        try {
          const conspectData = JSON.parse(data);
          res.json(conspectData);
        } catch (parseError) {
          res.status(500).send("Error parsing conspect data");
        }
      }
    });
  } catch (error) {
    console.error("Error in getConspectData:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
