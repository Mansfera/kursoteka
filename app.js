const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { error } = require("console");

const app = express();
const port = 3000;

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

  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        if (user.coursesOwned.includes(courseName)) {
          if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
          }

          // Define the new filename
          const newFileName = `${imgName}.png`;
          const filePath = path.join(
            __dirname,
            `courseData/${courseName}/block${blockId}/test${testId}/images/`,
            newFileName
          );

          // Convert the uploaded image to PNG and save it with the new filename
          sharp(req.file.buffer)
            .png()
            .toFile(filePath, (err, info) => {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Error processing image" });
              }
              res.status(200).json({
                message: "File uploaded and converted successfully",
                file: newFileName,
              });
            });
        } else {
          res.status(403).send("No access");
        }
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
});
app.post("/deleteImg", (req, res) => {
  const auth_key = req.query.auth_key;
  const courseName = req.query.course;
  const imgName = req.query.img_name;
  const blockId = req.query.blockId;
  const testId = req.query.testId;

  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        if (user.coursesOwned.includes(courseName)) {
          // Define the filename to delete
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
        } else {
          res.status(403).send("No access");
        }
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
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

  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        if (user.coursesOwned.includes(courseName)) {
          // Define paths for JSON files
          const questionPath = `courseData/${course.id}/block${blockId}/test${testId}/questions.json`;
          const vidpovidnistPath = `courseData/${course.id}/block${blockId}/test${testId}/vidpovidnist_questions.json`;
          const hronologyPath = `courseData/${course.id}/block${blockId}/test${testId}/hronology_questions.json`;
          const mulAnsPath = `courseData/${course.id}/block${blockId}/test${testId}/mul_ans_questions.json`;

          // Write data to JSON files
          fs.writeFile(questionPath, JSON.stringify(questions), (err) => {
            if (err) throw err;
            // console.log(`Questions data ${blockId}.${testId} has been saved!`);
          });

          fs.writeFile(
            vidpovidnistPath,
            JSON.stringify(vidpovidnist_questions),
            (err) => {
              if (err) throw err;
              console
                .log
                // `Vidpovidnist questions data ${blockId}.${testId} has been saved!`
                ();
            }
          );

          fs.writeFile(
            hronologyPath,
            JSON.stringify(hronology_questions),
            (err) => {
              if (err) throw err;
              console
                .log
                // `Hronology questions data ${blockId}.${testId} has been saved!`
                ();
            }
          );

          fs.writeFile(mulAnsPath, JSON.stringify(mul_ans_questions), (err) => {
            if (err) throw err;
            console
              .log
              // `Multiple answer questions ${blockId}.${testId} data has been saved!`
              ();
          });

          // Send response if needed
          res.status(200).json({});
        } else {
          res.status(403).send("No access");
        }
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
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
  const testId = req.query.test;

  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        const course = findCourse(users, user.auth_key, courseName);
        if (course != null) {
          readJsonFile(
            `courseData/${course.id}/block${blockId}/test${testId}/playlist.json`
          ).then((data) => {
            if (data) {
              const list = data;
              res.json({ list });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
});
app.get("/getImage", (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  const imageId = req.query.imageId;

  const auth_key = req.query.auth_key;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        const course = findCourse(users, user.auth_key, courseName);
        if (course != null) {
          const filePathImg = path.join(
            __dirname,
            `courseData/${course.id}/block${blockId}/test${testId}/images/${imageId}.png`
          );
          fs.readFile(filePathImg, (err, data) => {
            if (err) {
              res.status(404).send("Image not found");
            } else {
              res.writeHead(200, { "Content-Type": "image/png" });
              res.end(data);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
});
app.get("/loadTestData", async (req, res) => {
  const auth_key = req.query.auth_key;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        async function fetchData() {
          const courseName = req.query.course;
          const block = +req.query.block;
          const firstTest = +req.query.firstTest;
          const lastTest = +req.query.lastTest;

          const questions = [];
          const vidpovidnistQuestions = [];
          const hronologyQuestions = [];
          const mulAnsQuestions = [];
          const course = findCourse(users, user.auth_key, courseName);
          if (!course.data.allowed_tests.includes("all")) {
            let found_non_allowedTest = false;
            for (let j = firstTest; j <= lastTest; j++) {
              if (!course.data.allowed_tests.includes(j)) {
                found_non_allowedTest = true;
                break;
              }
            }
            if (found_non_allowedTest) {
              return false;
            }
          }

          for (let i = firstTest; i <= lastTest; i++) {
            let testQuestions = [];
            let testVidpovidnistQuestions = [];
            let testHronologyQuestions = [];
            let testMulAnsQuestions = [];

            await Promise.all([
              readJsonFile(
                `courseData/${course.id}/block${block}/test${i}/questions.json`
              ).then((data) => {
                if (data)
                  testQuestions = data.sort((p1, p2) =>
                    p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
                  );
              }),
              readJsonFile(
                `courseData/${course.id}/block${block}/test${i}/vidpovidnist_questions.json`
              ).then((data) => {
                if (data) testVidpovidnistQuestions = data;
              }),
              readJsonFile(
                `courseData/${course.id}/block${block}/test${i}/hronology_questions.json`
              ).then((data) => {
                if (data) testHronologyQuestions = data;
              }),
              readJsonFile(
                `courseData/${course.id}/block${block}/test${i}/mul_ans_questions.json`
              ).then((data) => {
                if (data)
                  testMulAnsQuestions = data.sort((p1, p2) =>
                    p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
                  );
              }),
            ]);

            questions.push(...testQuestions);
            vidpovidnistQuestions.push(...testVidpovidnistQuestions);
            hronologyQuestions.push(...testHronologyQuestions);
            mulAnsQuestions.push(...testMulAnsQuestions);
          }

          const testData = {
            questions,
            vidpovidnistQuestions,
            hronologyQuestions,
            mulAnsQuestions,
          };
          return testData;
        }

        try {
          const testData = await fetchData();
          if (testData != false) {
            res.json(testData);
          } else {
            res.status(403).send("Found non-allowed test");
          }
        } catch (error) {
          console.error("Error loading test data:", error);
          res.status(500).send("Error loading test data");
        }
      } else {
        res.status(404).send();
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
});
app.post("/sendTestResult", (req, res) => {
  const { auth_key, date, time, course, test_type, block, test, score } =
    req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);

      if (user) {
        const changedUser = users.find((user) => user.auth_key === auth_key);
        let updatedUsers = users.filter((user) => user.auth_key !== auth_key);
        let new_test = {
          date: date,
          time: time,
          test_type: test_type,
          block: block,
          test: test,
          score: score,
        };
        findCourse(users, user.auth_key, course).data.completed_tests.push(
          new_test
        );
        updatedUsers.push(changedUser);
        fs.writeFile(
          filePath,
          JSON.stringify(updatedUsers, null, 2),
          (writeErr) => {
            if (writeErr) {
              console.error("Error writing file:", writeErr);
              res.status(500).send("Internal Server Error");
              return;
            }
            res.status(200).send("Дані оновлені успішно");
          }
        );
      } else {
        res.status(404).send("Ви не є користувачем курсотеки!");
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
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
  const { login, password } = req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Internal Server Error");
    }

    try {
      if (
        login.length > 2 &&
        !login.includes('"') &&
        !login.includes("'") &&
        password.length > 6 &&
        !password.includes('"') &&
        !password.includes("'")
      ) {
        const users = JSON.parse(data);
        const user = users.find((user) => user.login === login);
        if (!user) {
          const newUser = {
            login: login,
            password: password,
            group: "student",
            auth_key: createRandomString(128),
            coursesOwned: [],
            courses: [],
          };
          users.push(newUser);
          fs.writeFile(filePath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
              console.error("Error writing file:", writeErr);
              res.status(500).send("Internal Server Error");
              return;
            }
          });
          res.status(200);
          res.json({
            group: newUser.group,
            auth_key: newUser.auth_key,
          });
        } else {
          res.status(403);
          res.json({});
        }
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      return res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/login", (req, res) => {
  const { login, password } = req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.login === login);
      if (user) {
        if (user.password === password) {
          res.status(200);
          res.json({
            group: user.group,
            auth_key: user.auth_key,
            coursesOwned: user.coursesOwned,
          });
        } else {
          res.status(403);
          res.json({});
        }
      } else {
        res.status(404);
        res.json({});
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});

function getUsersWithSpecificCourse(users, courseName) {
  return users.filter(
    (user) =>
      user.courses && user.courses.some((course) => course.id === courseName)
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
  const { auth_key, course, code } = req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        if (user) {
          if (!user.coursesOwned.some(c => c.id === course)) {
            const coursesFilePath = path.join(__dirname, "courses.json");
  
            fs.readFile(coursesFilePath, "utf8", (err, courseData) => {
              if (err) {
                console.error("Error reading courses file:", err);
                res.status(500).send("Internal Server Error");
                return;
              }
  
              try {
                const courses = JSON.parse(courseData);
                const courseToUpdate = courses.find(c => c.id === course);
  
                if (courseToUpdate && courseToUpdate.promoCodes.includes(code)) {
                  user.coursesOwned.push({
                    id: courseToUpdate.id,
                    data: {
                      join_date: Date.now(),
                      expire_date: "never",
                      allowed_tests: ["all"],
                      completed_tests: []
                    }
                  });
  
                  courseToUpdate.promoCodes = courseToUpdate.promoCodes.filter(promoCode => promoCode !== code);
  
                  fs.writeFile(filePath, JSON.stringify(users, null, 2), "utf8", (writeErr) => {
                    if (writeErr) {
                      console.error("Error writing users file:", writeErr);
                      res.status(500).send("Internal Server Error");
                      return;
                    }
  
                    fs.writeFile(coursesFilePath, JSON.stringify(courses, null, 2), "utf8", (writeErr) => {
                      if (writeErr) {
                        console.error("Error writing courses file:", writeErr);
                        res.status(500).send("Internal Server Error");
                        return;
                      }
  
                      res.status(200).send("Course activated successfully");
                    });
                  });
  
                } else {
                  res.status(404).send("Course not found or invalid promo code");
                }
  
              } catch (courseParseErr) {
                console.error("Error parsing courses JSON:", courseParseErr);
                res.status(500).send("Internal Server Error");
              }
            });
  
          } else {
            res.status(403).send("User already owns this course");
          }
        } else {
          res.status(404).send("User not found");
        }
      } else {
        res.status(404);
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/generateCode", (req, res) => {
  const { auth_key, course } = req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        if (user.coursesOwned.includes(course)) {
          const code = generateCode();
          const coursesFilePath = path.join(__dirname, "courses.json");
          fs.readFile(coursesFilePath, "utf8", (err, courseData) => {
            if (err) {
              console.error("Error reading courses file:", err);
              res.status(500).send("Internal Server Error");
              return;
            }

            try {
              const courses = JSON.parse(courseData);
              const courseToUpdate = courses.find((c) => c.id === course);

              if (courseToUpdate) {
                courseToUpdate.promoCodes = courseToUpdate.promoCodes || [];
                courseToUpdate.promoCodes.push(code);

                fs.writeFile(
                  coursesFilePath,
                  JSON.stringify(courses, null, 2),
                  "utf8",
                  (writeErr) => {
                    if (writeErr) {
                      console.error("Error writing courses file:", writeErr);
                      res.status(500).send("Internal Server Error");
                      return;
                    }

                    res.send({ code });
                  }
                );
              } else {
                res.status(404).send("Course not found");
              }
            } catch (courseParseErr) {
              console.error("Error parsing courses JSON:", courseParseErr);
              res.status(500).send("Internal Server Error");
            }
          });
        } else {
          res.status(403);
        }
      } else {
        res.status(404);
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/getUsers", (req, res) => {
  const { auth_key, course } = req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);

      if (user) {
        if (user.coursesOwned.includes(course)) {
          let students = getUsersWithSpecificCourse(users, course);
          Array.from(students).forEach((safeUser) => {
            safeUser.password = "";
            safeUser.auth_key = "";
          });
          res.json({
            students: students,
          });
        } else {
          res.status(403).send("Ви не володієте цим курсом!");
        }
      }
      res.status(404);
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/changeUserData", (req, res) => {
  const { auth_key, courseName, username, expire_date, allowed_tests } =
    req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);

      if (user) {
        if (user.coursesOwned.includes(courseName)) {
          const changedUser = users.find((user) => user.login === username);
          let updatedUsers = users.filter((user) => user.login !== username);
          const course = findCourse(users, changedUser.auth_key, courseName);
          course.data.expire_date = expire_date;
          course.data.allowed_tests = allowed_tests;
          updatedUsers.push(changedUser);
          fs.writeFile(
            filePath,
            JSON.stringify(updatedUsers, null, 2),
            (writeErr) => {
              if (writeErr) {
                console.error("Error writing file:", writeErr);
                res.status(500).send("Internal Server Error");
                return;
              }
              res.status(200).send("Дані оновлені успішно");
            }
          );
        } else {
          res.status(403).send("Ви не володієте цим курсом!");
        }
      } else {
        res.status(403).send("Ви не адміністратор");
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/getUserCourses", (req, res) => {
  const { auth_key } = req.body;
  const filePath = path.join(__dirname, "users.json");
  const coursesFilePath = path.join(__dirname, "courses.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);

      if (user) {
        fs.readFile(coursesFilePath, "utf8", (err, courseData) => {
          if (err) {
            console.error("Error reading file:", err);
            res.status(500).send("Internal Server Error");
            return;
          }

          try {
            const courses = JSON.parse(courseData);
            let userCourses = [];
            Array.from(user.coursesOwned).forEach((u_course) => {
              Array.from(courses).forEach((a_course) => {
                if (a_course.id === u_course) {
                  userCourses.push(a_course);
                }
              });
            });

            res.json({
              courses: userCourses,
            });
          } catch {}
        });
      } else {
        res.status(404);
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.get("/api/getCoverImage", (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;

  const auth_key = req.query.auth_key;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);
      if (user) {
        const course = findCourse(users, user.auth_key, courseName);
        if (course != null) {
          let filePathImg;
          if (testId != null) {
            filePathImg = path.join(
              __dirname,
              `courseData/${course.id}/block${blockId}/test${testId}/cover.png`
            );
          } else if (blockId != null) {
            filePathImg = path.join(
              __dirname,
              `courseData/${course.id}/block${blockId}/cover.png`
            );
          } else {
            filePathImg = path.join(
              __dirname,
              `courseData/${course.id}/cover.png`
            );
          }
          fs.readFile(filePathImg, (err, data) => {
            if (err) {
              res.status(404).send("Image not found");
            } else {
              res.writeHead(200, { "Content-Type": "image/png" });
              res.end(data);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
