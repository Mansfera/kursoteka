const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { error } = require("console");
const { db, dbHelpers } = require("./db/database");

const app = express();
const port = 30000;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/uploadImg", upload.single("image"), (req, res) => {
  const auth_key = req.query.auth_key;
  const courseName = req.query.course;
  const imgName = req.query.img_name;
  const blockId = req.query.blockId;
  const testId = req.query.testId;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("No access");
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Define the new filename
    const newFileName = `${imgName}.png`;
    const dirPath = path.join(
      __dirname,
      `courseData/${courseName}/block${blockId}/test${testId}/images/`
    );

    const filePath = path.join(dirPath, newFileName);

    // Check if the directory exists
    if (!fs.existsSync(dirPath)) {
      console.log("Directory does not exist:", dirPath);
      fs.mkdirSync(dirPath, { recursive: true });
      console.log("Directory created:", dirPath);
    }

    // Convert the uploaded image to PNG and save it
    sharp(req.file.buffer)
      .png()
      .toFile(filePath, (err, info) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Error processing image" });
        }
        res.status(200).json({
          message: "File uploaded and converted successfully",
          file: newFileName,
        });
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/deleteImg", (req, res) => {
  const auth_key = req.query.auth_key;
  const courseName = req.query.course;
  const imgName = req.query.img_name;
  const blockId = req.query.blockId;
  const testId = req.query.testId;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("No access");
    }

    const filePath = path.join(
      __dirname,
      `courseData/${courseName}/block${blockId}/test${testId}/images/`,
      `${imgName}.png`
    );

    // Check if file exists and delete it
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: "File not found" });
      }

      fs.unlink(filePath, (err) => {
        if (err) {
          return res.status(500).json({ error: "Error deleting file" });
        }
        res.status(200).json({ message: "File deleted successfully" });
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/saveTest", (req, res) => {
  const {
    auth_key,
    courseName,
    blockId,
    testId,
    questions,
    vidpovidnist_questions,
    hronology_questions,
    mul_ans_questions,
  } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("No access");
    }

    // Define paths for JSON files
    const questionPath = `courseData/${courseName}/block${blockId}/test${testId}/questions.json`;
    const vidpovidnistPath = `courseData/${courseName}/block${blockId}/test${testId}/vidpovidnist_questions.json`;
    const hronologyPath = `courseData/${courseName}/block${blockId}/test${testId}/hronology_questions.json`;
    const mulAnsPath = `courseData/${courseName}/block${blockId}/test${testId}/mul_ans_questions.json`;

    // Write data to JSON files
    fs.writeFile(questionPath, JSON.stringify(questions), (err) => {
      if (err) throw err;
    });

    fs.writeFile(
      vidpovidnistPath,
      JSON.stringify(vidpovidnist_questions),
      (err) => {
        if (err) throw err;
      }
    );

    fs.writeFile(
      hronologyPath,
      JSON.stringify(hronology_questions),
      (err) => {
        if (err) throw err;
      }
    );

    fs.writeFile(mulAnsPath, JSON.stringify(mul_ans_questions), (err) => {
      if (err) throw err;
    });

    res.status(200).json({});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

function findCourse(users, auth_key, courseId) {
  for (let user of users) {
    if (user.auth_key === auth_key) {
      for (let course of user.courses) {
        if (course.id === courseId) {
          return course;
        }
      }
    }
  }
  return null;
}
function createRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.get("/getPlaylist", async (req, res) => {
  const auth_key = req.query.auth_key;
  const courseName = req.query.course;
  const blockId = req.query.block;
  const testId = req.query.tema;

  try {
    const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, courseName);
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
app.get("/getConspect", (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  const conspectId = req.query.conspectId;
  const auth_key = req.query.auth_key;

  try {
    const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Access denied");
    }

    const filePathPdf = path.join(
      __dirname,
      `courseData/${courseName}/block${blockId}/test${testId}/${conspectId}.pdf`
    );

    fs.readFile(filePathPdf, (err, data) => {
      if (err) {
        res.status(404).send("PDF not found");
      } else {
        res.writeHead(200, { "Content-Type": "application/pdf" });
        res.end(data);
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/getImage", (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  const imageId = req.query.imageId;
  const auth_key = req.query.auth_key;

  try {
    const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Access denied");
    }

    const filePathImg = path.join(
      __dirname,
      `courseData/${courseName}/block${blockId}/test${testId}/images/${imageId}.png`
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
app.get("/getCardImage", (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  const imageId = req.query.imageId;
  const auth_key = req.query.auth_key;

  try {
    const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (userCourse.restricted) {
      return res.status(403).send("Access denied");
    }

    const filePathImg = path.join(
      __dirname,
      `courseData/${courseName}/block${blockId}/test${testId}/cardImages/${imageId}.png`
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
app.get("/loadCardsData", async (req, res) => {
  const auth_key = req.query.auth_key;
  const courseName = req.query.course;
  const block = req.query.block;
  const tema = req.query.tema;

  try {
    const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, courseName);
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
app.get("/loadTestData", async (req, res) => {
  const auth_key = req.query.auth_key;
  const courseName = req.query.course;
  const block = req.query.block;
  const firstTest = req.query.firstTest;
  const lastTest = req.query.lastTest;

  try {
    const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, courseName);
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

    const coursesFilePath = path.join(__dirname, "courses.json");
    const courseData = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
    const course_obj = courseData.find(crs => crs.id === courseName);

    let temas_id_list = [];
    let first_tema_found = false;
    let last_tema_found = false;

    course_obj.blocks.some(block_obj => {
      return block_obj.tests.some(test_obj => {
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

    const questions = [];
    const vidpovidnistQuestions = [];
    const hronologyQuestions = [];
    const mulAnsQuestions = [];

    for (const id of temas_id_list) {
      let testQuestions = [];
      let testVidpovidnistQuestions = [];
      let testHronologyQuestions = [];
      let testMulAnsQuestions = [];

      await Promise.all([
        readJsonFile(
          `courseData/${courseName}/block${block}/test${id}/questions.json`
        ).then((data) => {
          if (data) testQuestions = data.sort((p1, p2) =>
            p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
          );
        }),
        readJsonFile(
          `courseData/${courseName}/block${block}/test${id}/vidpovidnist_questions.json`
        ).then((data) => {
          if (data) testVidpovidnistQuestions = data;
        }),
        readJsonFile(
          `courseData/${courseName}/block${block}/test${id}/hronology_questions.json`
        ).then((data) => {
          if (data) testHronologyQuestions = data;
        }),
        readJsonFile(
          `courseData/${courseName}/block${block}/test${id}/mul_ans_questions.json`
        ).then((data) => {
          if (data) testMulAnsQuestions = data.sort((p1, p2) =>
            p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
          );
        }),
      ]);

      questions.push(...testQuestions);
      vidpovidnistQuestions.push(...testVidpovidnistQuestions);
      hronologyQuestions.push(...testHronologyQuestions);
      mulAnsQuestions.push(...testMulAnsQuestions);
    }

    res.json({
      questions,
      vidpovidnistQuestions,
      hronologyQuestions,
      mulAnsQuestions,
    });
  } catch (error) {
    console.error("Error loading test data:", error);
    res.status(500).send("Error loading test data");
  }
});
app.post("/sendTestResult", async (req, res) => {
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
  } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("Ви не є користувачем курсотеки!");
    }

    const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    const completedTests = JSON.parse(userCourse.completed_tests);
    const allowedTests = JSON.parse(userCourse.allowed_tests);

    let short_test_check = false;
    let full_test_check = false;

    completedTests.push({
      date,
      time,
      test_type,
      block,
      test,
      score,
      abcd_questions_accuracy,
      hronology_questions_accuracy,
      vidpovidnist_questions_accuracy,
      mul_ans_questions_accuracy,
    });

    // Check if we need to update allowed tests
    if (!allowedTests.includes("all")) {
      const coursesFilePath = path.join(__dirname, "courses.json");
      const courseData = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
      const course_obj = courseData.find(crs => crs.id === courseName);

      // Get list of all test IDs
      let temas_id_list = [];
      course_obj.blocks.some(block_obj => {
        return block_obj.tests.some(test_obj => {
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
            item => item.test === test && item.test_type === "short"
          );
          if (filteredTests.length >= 3) {
            let filteredAndSortedTests = filteredTests
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            let lastTests = filteredAndSortedTests.slice(0, 3);
            let averageScore = lastTests.reduce((sum, item) => sum + item.score, 0) / lastTests.length;

            course_obj.blocks.some(block_obj => {
              if (block_obj.id == block) {
                next_tema_is_in_block = block_obj.tests.find(
                  test_obj => test_obj.id == next_tema_id
                );
              }
            });

            if (averageScore >= 75 && next_tema_is_in_block) {
              short_test_check = true;
            }
          }

          // Check full test requirements
          filteredTests = completedTests.filter(
            item => item.test === test && item.test_type === "full"
          );
          if (filteredTests.length > 0) {
            let filteredAndSortedTests = filteredTests
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            let lastTest = filteredAndSortedTests[0];
            
            course_obj.blocks.some(block_obj => {
              if (block_obj.id == block) {
                next_tema_is_in_block = block_obj.tests.find(
                  test_obj => test_obj.id == next_tema_id
                );
              }
            });

            if (lastTest.score >= 80 && next_tema_is_in_block) {
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
            item => item.test === test
          );
          if (filteredTests.length > 1) {
            const filteredAndSortedTests = filteredTests
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastTest = filteredAndSortedTests[0];
            const secondLastTest = filteredAndSortedTests[1];

            if (lastTest && lastTest.score >= 85 && secondLastTest && secondLastTest.score >= 85) {
              allowedTests.push(next_tema_id);
            }
          }
          break;
        }
      }
    }

    // Update the database with new completed tests and allowed tests
    // dbHelpers.addCompletedTest.run(
    //   JSON.stringify(completedTests),
    //   auth_key,
    //   courseName
    // );
    console.log(dbHelpers.addCompletedTest.run(
      JSON.stringify(completedTests),
      auth_key,
      courseName
    ));

    if (!allowedTests.includes("all")) {
      dbHelpers.updateAllowedTests.run(
        JSON.stringify(allowedTests),
        auth_key,
        courseName
      );
    }

    res.status(200).send({answer: "Test result saved", last_allowed_test: allowedTests[allowedTests.length - 1], next_tema_id: next_tema_id, });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});

function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, filePath), "utf8", (err, data) => {
      if (err) {
        // If file not found or error reading file
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

app.post("/api/register", (req, res) => {
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
      const existingUser = dbHelpers.getUserByLogin.get(login);

      if (!existingUser) {
        const auth_key = createRandomString(128);
        const result = dbHelpers.insertUser.run({
          login,
          password,
          name,
          surname,
          group: "student",
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
app.post("/api/login", (req, res) => {
  const { login, password } = req.body;

  try {
    const user = dbHelpers.getUserByLogin.get(login);

    if (user) {
      if (user.password === password) {
        const courses = dbHelpers.getUserCourses.all(user.id);

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
app.post("/api/getUserDetails", (req, res) => {
  const { auth_key } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
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
app.post("/api/changeUserCredentials", (req, res) => {
  const { auth_key, login, name, surname } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (user) {
      dbHelpers.updateUserAndCourses(
        auth_key,
        login || user.login,
        name || user.name,
        surname || user.surname,
        user.login
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
app.post("/api/getUserStats", async (req, res) => {
  const { auth_key, courseName, start_date, end_date, login } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    let targetUser = user;
    if (user.coursesOwned.includes(courseName) && login) {
      targetUser = dbHelpers.getUserByLogin.get(login);
      if (!targetUser) {
        return res.status(404).send("Student not found");
      }
    }

    // Get the course directly using getCourseByUserAndId
    const userCourse = dbHelpers.getCourseByUserAndId.get(targetUser.auth_key, courseName);
    if (!userCourse) {
      return res.status(404).send("Course not found");
    }

    if (start_date && end_date) {
      const completedTests = JSON.parse(userCourse.completed_tests).filter(
        (test) => test.date >= start_date && test.date <= end_date
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

function getUsersWithSpecificCourse(users, courseName) {
  return users.filter(
    (user) =>
      user.courses &&
      user.courses.some((course) => course.id === courseName && !course.hidden)
  );
}
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  function randomString(length) {
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

app.post("/api/activateCode", (req, res) => {
  const { auth_key, code } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).json({ message: "Будь ласка увійдіть 🔐" });
    }
    const promocode = dbHelpers.getUnusedPromocode.get(code, Date.now());
    if (!promocode) {
      return res.status(400).json({ message: "Неправильний або використаний код ❌" });
    }

    const existingCourse = dbHelpers.getCourseByUserAndId.get(auth_key, promocode.course_id);
    if (existingCourse) {
      return res.status(403).json({ message: "Ви вже маєте цей курс 😉" });
    }

    const coursesFilePath = path.join(__dirname, "courses.json");
    const courses = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
    const course = courses.find(c => c.id === promocode.course_id);

    if (!course) {
      return res.status(404).json({ message: "Курс не знайдено 🤔" });
    }

    // Update promocode in database
    dbHelpers.updatePromocode.run(Date.now(), auth_key, code);
    
    // Update course total users in courses.json
    course.totalUsers++;
    fs.writeFileSync(coursesFilePath, JSON.stringify(courses, null, 2));

    // Insert new course for user
    dbHelpers.insertCourse.run({
      auth_key: auth_key,
      login: user.login,
      course_id: course.id,
      hidden: 0,
      join_date: Date.now(),
      expire_date: Date.now() + promocode.access_duration,
      restricted: 0,
      allowed_tests: promocode.start_temas,
      completed_tests: '[]'
    });

    res.status(200).json({ message: "Успіх! ✅" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/api/generateCode", (req, res) => {
  const { auth_key, course, expire_date, access_duration, start_temas } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
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
    } while (dbHelpers.getPromocode.get(code));

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
    if (start_temas == [""]) {
      _start_temas = ["all"];
    } else {
      _start_temas = start_temas;
    }

    const newPromocode = {
      course_id: course,
      code: code,
      expire_date: _expire_date,
      access_duration: _access_time,
      start_temas: JSON.stringify(_start_temas)
    };

    dbHelpers.insertPromocode.run(newPromocode);

    res.status(200).json({ 
      promocode: {
        id: course,
        code: code,
        expire_date: _expire_date,
        access_duration: _access_time,
        used_date: -1,
        used_by: "",
        start_temas: _start_temas
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/api/getPromoCodes", (req, res) => {
  const { auth_key, course } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(course)) {
      return res.status(403).json({ message: "User does not own this course" });
    }

    const promocodes = dbHelpers.getPromocodesByCourse.all(course);
    const formattedPromocodes = promocodes.map(promocode => ({
      id: promocode.course_id,
      code: promocode.code,
      expire_date: promocode.expire_date,
      access_duration: promocode.access_duration,
      used_date: promocode.used_date,
      used_by: promocode.login || "",
      used_by_name: promocode.name || "",
      used_by_surname: promocode.surname || "",
      start_temas: JSON.parse(promocode.start_temas)
    }));

    res.status(200).json({ promocodes: formattedPromocodes });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/api/deletePromoCode", (req, res) => {
  const { auth_key, code } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(403).json({ message: "Будь ласка увійдіть 🔐" });
    }

    const promocode = dbHelpers.getPromocode.get(code);
    if (!promocode) {
      return res.status(404).json({ message: "Код не знайдено ❌" });
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(promocode.course_id)) {
      return res.status(403).json({ message: "Ви не володієте цим курсом ❌" });
    }

    const result = dbHelpers.deletePromocode.run(code);
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

app.post("/api/getUsers", (req, res) => {
  const { auth_key, courseName } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("Ви не володієте цим курсом!");
    }

    const students = dbHelpers.getUsersWithCourse.all(courseName);
    const safeStudents = students.map((student) => {
      const courses = dbHelpers.getCourseByUserAndId.all(
        student.auth_key,
        courseName
      );
      return {
        login: student.user_login,
        name: student.user_name,
        surname: student.user_surname,
        group: student.group_type,
        courses: courses.map((course) => ({
          id: course.course_id,
          hidden: Boolean(course.hidden),
          restricted: Boolean(course.restricted),
          data: {
            join_date: course.join_date,
            expire_date: course.expire_date,
            allowed_tests: JSON.parse(course.allowed_tests),
            completed_tests: JSON.parse(course.completed_tests),
          },
        })),
      };
    });

    res.json({ students: safeStudents });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/api/changeAccessCourseForUser", (req, res) => {
  const { auth_key, courseName, login, access } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("Ви не володієте цим курсом!");
    }

    const result = dbHelpers.updateCourseRestrictionByUsername.run(
      !access ? 1 : 0,
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
});
app.post("/api/changeUserAllowedCourse", (req, res) => {
  const { auth_key, courseName, username, allowed_tests } = req.body;

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(403).send("Будь ласка увійдіть 🔐");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("Ви не володієте цим курсом!");
    }

    const result = dbHelpers.updateAllowedTestsByUsername.run(
      JSON.stringify(allowed_tests),
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
app.post("/api/getUserCourses", (req, res) => {
  const { auth_key, specific_course } = req.body;
  const coursesFilePath = path.join(__dirname, "courses.json");

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (specific_course) {
      const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, specific_course);
      if (!userCourse) {
        return res.status(404).json({ courses: [] });
      }

      if (!userCourse.restricted) {
        // Read course details from courses.json
        const courseData = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
        const course = courseData.find(c => c.id === specific_course);
        
        if (course) {
          return res.status(200).json({
            courses: [course],
            allowed_tests: JSON.parse(userCourse.allowed_tests)
          });
        }
      }
    } else {
      const userCourses = dbHelpers.getUserCourses.all(auth_key);
      // Read course details from courses.json
      const courseData = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
      
      const activeCourses = [];
      const restrictedCourses = [];

      userCourses.forEach(userCourse => {
        const courseDetails = courseData.find(c => c.id === userCourse.course_id);
        if (courseDetails) {
          if (userCourse.restricted) {
            restrictedCourses.push(courseDetails);
          } else {
            activeCourses.push(courseDetails);
          }
        }
      });

      return res.status(200).json({
        courses: activeCourses,
        restricted: restrictedCourses
      });
    }

    res.status(404).json({ courses: [] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/api/getOwnedCourses", (req, res) => {
  const { auth_key } = req.body;
  const coursesFilePath = path.join(__dirname, "courses.json");

  try {
    const user = dbHelpers.getUserByAuthKey.get(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    const courseData = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
    
    const userCourses = courseData.filter(course => 
      coursesOwned.includes(course.id)
    );

    res.json({ courses: userCourses });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/api/getCoverImage", (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  let image_name = req.query.image_name || "cover";
  const auth_key = req.query.auth_key;

  if (auth_key) {
    try {
      const userCourse = dbHelpers.findCourse.get(auth_key, courseName);
      if (!userCourse) {
        return res.status(404).send("Course not found");
      }

      let filePathImg;
      if (testId) {
        filePathImg = path.join(
          __dirname,
          `courseData/${courseName}/block${blockId}/test${testId}/${image_name}.jpeg`
        );
      } else if (blockId) {
        filePathImg = path.join(
          __dirname,
          `courseData/${courseName}/block${blockId}/${image_name}.jpeg`
        );
      } else {
        filePathImg = path.join(
          __dirname,
          `courseData/${courseName}/${image_name}.jpeg`
        );
      }

      fs.readFile(filePathImg, (err, data) => {
        if (err) {
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
      __dirname,
      `courseData/${courseName}/${image_name}.jpeg`
    );
    fs.readFile(filePathImg, (err, data) => {
      if (err) {
        res.status(404).send("Image not found");
      } else {
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(data);
      }
    });
  }
});

app.post("/api/marketplace/getCourses", (req, res) => {
  const {
    auth_key,
    search_tags,
    authors,
    only_show_non_owned,
    search_index,
    search_amount,
  } = req.body;
  const coursesFilePath = path.join(__dirname, "courses.json");

  try {
    const courseData = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
    const courses = courseData;
    const searchForTags = search_tags != null && search_tags != [];
    const searchForAuthors = authors != null && authors != [];
    const searchForUserCourses = auth_key != null && auth_key != "" && only_show_non_owned;
    
    let tag_courses = [];
    let author_courses = [];
    let owned_courses = [];

    Array.from(courses).forEach((course) => {
      if (searchForTags) {
        Array.from(course.tags).forEach((tag) => {
          if (search_tags.includes(tag)) {
            tag_courses.push(course);
          }
        });
      }

      if (searchForAuthors) {
        Array.from(authors).forEach((author) => {
          if (author == course.author) {
            author_courses.push(course);
          }
        });
      }

      if (searchForUserCourses) {
        const userCourse = dbHelpers.getCourseByUserAndId.get(auth_key, course.id);
        if (userCourse) {
          owned_courses.push(course);
        }
      }
    });

    let similar_courses = [];
    function intersectArrays(arr1, arr2) {
      return arr1.filter((item) => arr2.includes(item));
    }

    if (searchForTags) {
      similar_courses = similar_courses.length === 0 ? tag_courses : intersectArrays(similar_courses, tag_courses);
    }

    if (searchForAuthors) {
      similar_courses = similar_courses.length === 0 ? author_courses : intersectArrays(similar_courses, author_courses);
    }

    if (searchForUserCourses) {
      similar_courses = similar_courses.length === 0 ? owned_courses : intersectArrays(similar_courses, owned_courses);
    }

    const startIndex = search_index * search_amount;
    const endIndex = (search_index + 1) * search_amount;
    const maxIndex = Math.floor(similar_courses.length / search_amount);
    similar_courses = similar_courses.slice(startIndex, endIndex);
    
    res.status(200).send({ courses: similar_courses, maxIndex: maxIndex });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/api/marketplace/getCourseInfo", (req, res) => {
  const { specific_course } = req.body;
  const coursesFilePath = path.join(__dirname, "courses.json");

  fs.readFile(coursesFilePath, "utf8", (err, courseData) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const courses = JSON.parse(courseData);
      let blocks = [];
      let testCount = 0;
      let found_course;
      let courseName = "";
      let authorName = "";
      let authorAbout = "";
      let masterFeature = "";
      let keyFeatures = [];
      let courseDetails = [];
      Array.from(courses).forEach((course) => {
        if (course.id == specific_course) {
          found_course = course;
        }
      });
      Array.from(found_course.blocks).forEach((block) => {
        testCount += block.tests.length;
        blocks.push(block);
      });
      courseName = found_course.name;
      authorName = found_course.marketplace_info.author_name;
      authorAbout = found_course.marketplace_info.author_about;
      if (testCount > 4) {
        let tema_text;
        if (testCount % 10 === 1) {
          tema_text = `${testCount} тема, `;
        } else if (testCount % 10 > 1 && testCount % 10 < 5) {
          tema_text = `${testCount} теми, `;
        } else {
          tema_text = `${testCount} тем, `;
        }
        masterFeature =
          // tema_text +
          found_course.marketplace_info.master_feature;
      } else {
        masterFeature = found_course.marketplace_info.master_feature;
      }
      keyFeatures = found_course.marketplace_info.key_features;
      courseDetails = found_course.marketplace_info.course_details;
      res.status(200).json({
        courseName,
        masterFeature,
        courseDetails,
        authorName,
        authorAbout,
        keyFeatures,
        blocks,
      });
    } catch {}
  });
});
app.get("/api/marketplace/getCourseImage", (req, res) => {
  const courseName = req.query.course;
  const imageName = req.query.image_name;

  let filePathImg = path.join(
    __dirname,
    `courseData/${courseName}/marketplace/${imageName}.jpeg`
  );
  fs.readFile(filePathImg, (err, data) => {
    if (err) {
      res.status(404).send("Image not found");
    } else {
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(data);
    }
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${port}`);
});
