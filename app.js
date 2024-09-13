const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { error } = require("console");

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
        if (user.coursesOwned.includes(courseName)) {
          // Define paths for JSON files
          const questionPath = `courseData/${courseName}/block${blockId}/test${testId}/questions.json`;
          const vidpovidnistPath = `courseData/${courseName}/block${blockId}/test${testId}/vidpovidnist_questions.json`;
          const hronologyPath = `courseData/${courseName}/block${blockId}/test${testId}/hronology_questions.json`;
          const mulAnsPath = `courseData/${courseName}/block${blockId}/test${testId}/mul_ans_questions.json`;

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
  const testId = req.query.tema;

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
        if (course != null && !course.restricted) {
          readJsonFile(
            `courseData/${course.id}/block${blockId}/test${testId}/playlist.json`
          ).then((data) => {
            if (data) {
              const list = data;
              res.json({ list });
            }
          });
        } else {
          res.status(403).send("Course not found");
        }
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      res.status(500).send("Error loading test data");
    }
  });
});
app.get("/getConspect", (req, res) => {
  const courseName = req.query.course;
  const blockId = req.query.blockId;
  const testId = req.query.testId;
  const conspectId = req.query.conspectId;
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

        if (course != null && !course.restricted) {
          const filePathImg = path.join(
            __dirname,
            `courseData/${course.id}/block${blockId}/test${testId}/${conspectId}.pdf`
          );

          fs.readFile(filePathImg, (err, data) => {
            if (err) {
              res.status(404).send("PDF not found");
            } else {
              res.writeHead(200, { "Content-Type": "application/pdf" });
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

        if (course != null && !course.restricted) {
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
          if (course.restricted) {
            return false;
          }
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
  const { auth_key, date, time, courseName, test_type, block, test, score } =
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
        const course = findCourse(users, user.auth_key, courseName);
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
        course.data.completed_tests.push(new_test);
        if (!course.data.allowed_tests.includes("all")) {
          switch (test_type) {
            case "short": {
              if (course.data.allowed_tests.includes(`${test + 1}`)) {
                break;
              }
              const filteredTests = course.data.completed_tests.filter(
                (item) => {
                  item.test === test && item.test_type == test_type;
                }
              );
              if (filteredTests.length < 3) {
                break;
              }
              const filteredAndSortedTests = filteredTests
                .filter(
                  (item) =>
                    Date.now() - new Date(item.date).getTime() <=
                    3 * 24 * 60 * 60 * 1000
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date));

              if (filteredAndSortedTests.length < 3) {
                break;
              }
              const lastTests = filteredAndSortedTests.slice(0, 5);
              const averageScore =
                lastTests.reduce((sum, item) => sum + item.score, 0) /
                lastTests.length;

              if (averageScore < 70) {
                break;
              }
              course.data.allowed_tests.push(`${test + 1}`);
              break;
            }
            case "full": {
              if (course.data.allowed_tests.includes(`${test + 1}`)) {
                break;
              }
              const filteredTests = course.data.completed_tests.filter(
                (item) => {
                  item.test === test && item.test_type == test_type;
                }
              );
              if (filteredTests.length == 0) {
                break;
              }
              const filteredAndSortedTests = filteredTests
                .filter(
                  (item) =>
                    Date.now() - new Date(item.date).getTime() <=
                    3 * 24 * 60 * 60 * 1000
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date));

              if (filteredAndSortedTests.length == 0) {
                break;
              }
              const lastTests = filteredAndSortedTests.slice(0, 2);
              const averageScore =
                lastTests.reduce((sum, item) => sum + item.score, 0) /
                lastTests.length;

              if (averageScore < 60) {
                break;
              }
              course.data.allowed_tests.push(`${test + 1}`);
              break;
            }
            case "final": {
              if (course.data.allowed_tests.includes(`${test + 1}`)) {
                break;
              }
              const filteredTests = course.data.completed_tests.filter(
                (item) => item.test === test
              );
              if (filteredTests.length == 0) {
                break;
              }
              const filteredAndSortedTests = filteredTests
                .filter(
                  (item) =>
                    Date.now() - new Date(item.date).getTime() <=
                    3 * 24 * 60 * 60 * 1000
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date));

              const lastTest =
                filteredAndSortedTests[filteredAndSortedTests.length - 1];

              if (lastTest.score < 70) {
                break;
              }
              course.data.allowed_tests.push(`${test + 1}`);
              break;
            }
          }
        }
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
            res.status(200).send("Sent successful");
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
  const { login, password, name, surname } = req.body;
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
            name: name,
            surname: surname,
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
            name: user.name,
            surname: user.surname,
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
        const coursesFilePath = path.join(__dirname, "courses.json");
        const promocodesFilePath = path.join(__dirname, "promocodes.json");

        fs.readFile(promocodesFilePath, "utf8", (err, promocodesData) => {
          if (err) {
            console.error("Error reading promocodes file:", err);
            res.status(500).send("Internal Server Error");
            return;
          }

          const promocodes = JSON.parse(promocodesData);
          const promocode = promocodes.find(
            (p) => p.code === code && p.used_date === -1
          );

          if (promocode) {
            if (!user.courses.some((c) => c.id === promocode.id)) {
              promocode.used_date = Date.now();
              promocode.used_by = auth_key;

              fs.readFile(coursesFilePath, "utf8", (err, coursesData) => {
                if (err) {
                  console.error("Error reading courses file:", err);
                  res.status(500).send("Internal Server Error");
                  return;
                }

                const courses = JSON.parse(coursesData);
                const course = courses.find((c) => c.id === promocode.id);

                if (course) {
                  course.totalUsers++;

                  user.courses.push({
                    id: course.id,
                    hidden: false,
                    data: {
                      join_date: Date.now(),
                      expire_date: Date.now() + promocode.access_duration,
                      restricted: false,
                      allowed_tests: promocode.start_temas,
                      completed_tests: [],
                    },
                  });

                  // Write updated data back to files
                  fs.writeFile(
                    promocodesFilePath,
                    JSON.stringify(promocodes, null, 2),
                    (err) => {
                      if (err) {
                        console.error("Error writing promocodes file:", err);
                        res.status(500).send("Internal Server Error");
                        return;
                      }

                      fs.writeFile(
                        coursesFilePath,
                        JSON.stringify(courses, null, 2),
                        (err) => {
                          if (err) {
                            console.error("Error writing courses file:", err);
                            res.status(500).send("Internal Server Error");
                            return;
                          }

                          fs.writeFile(
                            filePath,
                            JSON.stringify(users, null, 2),
                            (err) => {
                              if (err) {
                                console.error("Error writing users file:", err);
                                res.status(500).send("Internal Server Error");
                                return;
                              }

                              res.status(200).json({ message: "Успіх! ✅" });
                            }
                          );
                        }
                      );
                    }
                  );
                } else {
                  res.status(404).json({ message: "Курс не знайдено 🤔" });
                }
              });
            } else {
              res.status(403).json({ message: "Ви вже маєте цей курс 😉" });
            }
          } else {
            res
              .status(400)
              .json({ message: "Неправильний або використаний код ❌" });
          }
        });
      } else {
        res.status(404).json({ message: "Будь ласка увійдіть 🔐" });
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/generateCode", (req, res) => {
  const { auth_key, course, expire_date, access_duration, start_temas } =
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
        if (user.coursesOwned.includes(course)) {
          const promocodesFilePath = path.join(__dirname, "promocodes.json");

          fs.readFile(promocodesFilePath, "utf8", (err, promocodesData) => {
            if (err) {
              console.error("Error reading promocodes file:", err);
              res.status(500).send("Internal Server Error");
              return;
            }

            const promocodes = JSON.parse(promocodesData);
            let code;
            do {
              code = generateCode();
            } while (promocodes.some((p) => p.code === code));
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
              _access_time = "never";
            } else {
              _access_time = +access_duration * 24 * 60 * 60 * 1000;
            }
            let _start_temas = [];
            if (start_temas == [""]) {
              _start_temas.push("all");
            } else {
              _start_temas = start_temas;
            }

            const newPromocode = {
              id: course,
              code: code,
              expire_date: _expire_date,
              access_duration: _access_time,
              used_date: -1,
              used_by: "",
              start_temas: _start_temas,
            };

            promocodes.push(newPromocode);

            fs.writeFile(
              promocodesFilePath,
              JSON.stringify(promocodes, null, 2),
              (err) => {
                if (err) {
                  console.error("Error writing promocodes file:", err);
                  res.status(500).send("Internal Server Error");
                  return;
                }

                res.status(200).json({ promocode: newPromocode });
              }
            );
          });
        } else {
          res.status(403).json({ message: "User does not own this course" });
        }
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/getPromoCodes", (req, res) => {
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
          const promocodesFilePath = path.join(__dirname, "promocodes.json");

          fs.readFile(promocodesFilePath, "utf8", (err, promocodesData) => {
            if (err) {
              console.error("Error reading promocodes file:", err);
              res.status(500).send("Internal Server Error");
              return;
            }

            try {
              const promocodes = JSON.parse(promocodesData);

              const filteredPromocodes = promocodes.filter(
                (promocode) => promocode.id === course
              );

              filteredPromocodes.forEach((promocode) => {
                if (promocode.used_by) {
                  const student = users.find(
                    (student) => student.auth_key === promocode.used_by
                  );
                  if (student) {
                    promocode.used_by = student.login;
                    if (student.name != "") {
                      promocode.used_by_name = student.name;
                      promocode.used_by_surname = student.surname;
                    }
                  } else {
                    promocode.used_by = "";
                  }
                }
              });
              res.status(200).json({ promocodes: filteredPromocodes });
            } catch (parseErr) {
              console.error("Error parsing promocodes JSON:", parseErr);
              res.status(500).send("Internal Server Error");
            }
          });
        } else {
          res.status(403).json({ message: "User does not own this course" });
        }
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/deletePromoCode", (req, res) => {
  const { auth_key, code } = req.body;
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
        const promocodesFilePath = path.join(__dirname, "promocodes.json");

        fs.readFile(promocodesFilePath, "utf8", (err, promocodesData) => {
          if (err) {
            console.error("Error reading promocodes file:", err);
            res.status(500).send("Internal Server Error");
            return;
          }

          try {
            const promocodes = JSON.parse(promocodesData);

            const promocode = promocodes.find((p) => p.code === code);

            if (promocode) {
              if (user.coursesOwned.some((c) => c === promocode.id)) {
                const updatedPromocodes = promocodes.filter(
                  (p) => p.code !== code
                );
                fs.writeFile(
                  promocodesFilePath,
                  JSON.stringify(updatedPromocodes, null, 2),
                  (err) => {
                    if (err) {
                      console.error("Error writing promocodes file:", err);
                      res.status(500).send("Internal Server Error");
                      return;
                    }
                    res.status(200).json({ message: "Успіх! ✅" });
                  }
                );
              } else {
                res
                  .status(403)
                  .json({ message: "Ви не володієте цим курсом ❌" });
              }
            } else {
              res
                .status(400)
                .json({ message: "Неправильний або використаний код ❌" });
            }
          } catch (parseErr) {
            console.error("Error parsing promocodes JSON:", parseErr);
            res.status(500).send("Internal Server Error");
          }
        });
      } else {
        res.status(404).json({ message: "Будь ласка увійдіть 🔐" });
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});
app.post("/api/changeUserCredentials", (req, res) => {
  const { auth_key, login, name, surname } = req.body;
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
      let updatedUsers = users.filter((user) => user.auth_key !== auth_key);

      if (user) {
        if (login != null) {
          user.login = login;
        }
        if (name != null) {
          user.name = name;
        }
        if (surname != null) {
          user.surname = surname;
        }
        res.status(200).send({ message: "✅" });
        updatedUsers.push(user);
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
        res.status(404).send("Користувача не знайдено");
      }
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error");
    }
  });
});

app.post("/api/getUsers", (req, res) => {
  const { auth_key, courseName } = req.body;
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
          let students = getUsersWithSpecificCourse(users, courseName);
          Array.from(students).forEach((safeUser) => {
            safeUser.password = "";
            safeUser.auth_key = "";
            safeUser.courses = safeUser.courses.filter(
              (course) => course.id === courseName
            );
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
app.post("/api/changeAccessCourseForUser", (req, res) => {
  const { auth_key, courseName, login, access } = req.body;
  const filePath = path.join(__dirname, "users.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error #1");
      return;
    }

    try {
      const users = JSON.parse(data);
      const user = users.find((user) => user.auth_key === auth_key);

      if (user) {
        if (user.coursesOwned.includes(courseName)) {
          const student = users.find((student) => student.login === login);
          const course = findCourse(users, student.auth_key, courseName);
          const changedUser = users.find(
            (student) => student.auth_key === auth_key
          );
          let updatedUsers = users.filter(
            (student) => student.auth_key !== auth_key
          );
          course.restricted = !access;
          updatedUsers.push(changedUser);
          fs.writeFile(
            filePath,
            JSON.stringify(updatedUsers, null, 2),
            (writeErr) => {
              if (writeErr) {
                console.error("Error writing file:", writeErr);
                res.status(500).send("Internal Server Error #2");
                return;
              } else {
                res.status(200).send({ data: "success" });
              }
            }
          );
        } else {
          res.status(403).send("Ви не володієте цим курсом!");
        }
      }
      res.status(404);
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Internal Server Error #3");
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
  const { auth_key, specific_course } = req.body;
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
            if (specific_course == null) {
              let userCourses = [];
              let lostCourses = [];
              Array.from(user.courses).forEach((u_course) => {
                Array.from(courses).forEach((a_course) => {
                  if (a_course.id === u_course.id) {
                    if (!u_course.restricted) {
                      userCourses.push(a_course);
                    } else {
                      lostCourses.push(a_course);
                    }
                  }
                });
              });

              res.status(200).json({
                courses: userCourses,
                restricted: lostCourses,
              });
            } else {
              const course = courses.find(
                (course) => course.id === specific_course
              );
              let restricted = true;
              const user_course = user.courses.find(
                (course) => course.id === specific_course
              );
              Array.from(user.courses).forEach((u_course) => {
                if (u_course.id === course.id) {
                  restricted = u_course.restricted;
                }
              });
              if (!restricted) {
                res.status(200).json({
                  courses: [course],
                  allowed_tests: user_course.data.allowed_tests,
                });
              }
            }
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
app.post("/api/getOwnedCourses", (req, res) => {
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
  let image_name = req.query.image_name;

  if (image_name == null) {
    image_name = "cover";
  }

  const auth_key = req.query.auth_key;

  if (auth_key != null) {
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
                `courseData/${course.id}/block${blockId}/test${testId}/${image_name}.jpeg`
              );
            } else if (blockId != null) {
              filePathImg = path.join(
                __dirname,
                `courseData/${course.id}/block${blockId}/${image_name}.jpeg`
              );
            } else {
              filePathImg = path.join(
                __dirname,
                `courseData/${course.id}/${image_name}.jpeg`
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
          }
        }
      } catch (error) {
        console.error("Error loading test data:", error);
        res.status(500).send("Error loading test data");
      }
    });
  } else {
    let filePathImg = path.join(
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

  fs.readFile(coursesFilePath, "utf8", (err, courseData) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    try {
      const courses = JSON.parse(courseData);
      const searchForTags = search_tags != null && search_tags != [];
      const searchForAuthors = authors != null && authors != [];
      const searchForUserCourses =
        auth_key != null && auth_key != "" && only_show_non_owned;
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
          const usersFilePath = path.join(__dirname, "users.json");
          fs.readFile(usersFilePath, "utf8", (err, data) => {
            if (err) {
              console.error("Error reading file:", err);
              res.status(500).send("Internal Server Error");
              return;
            }

            try {
              const users = JSON.parse(data);
              const user = users.find((user) => user.auth_key === auth_key);
              if (user) {
                Array.from(user.courses).forEach((u_course) => {
                  if (u_course.id == course.id) {
                    owned_courses.push(course);
                  }
                });
              } else {
                res.status(404);
              }
            } catch (parseErr) {
              console.error("Error parsing JSON:", parseErr);
              res.status(500).send("Internal Server Error");
            }
          });
        }
      });
      let similar_courses = [];
      function intersectArrays(arr1, arr2) {
        return arr1.filter((item) => arr2.includes(item));
      }

      // Process similar_courses based on search_tags
      if (searchForTags) {
        if (similar_courses.length === 0) {
          similar_courses = tag_courses;
        } else {
          similar_courses = intersectArrays(similar_courses, tag_courses);
        }
      }

      // Process similar_courses based on authors
      if (searchForAuthors) {
        if (similar_courses.length === 0) {
          similar_courses = author_courses;
        } else {
          similar_courses = intersectArrays(similar_courses, author_courses);
        }
      }

      // Process similar_courses based on owned courses
      if (searchForUserCourses) {
        if (similar_courses.length === 0) {
          similar_courses = owned_courses;
        } else {
          similar_courses = intersectArrays(similar_courses, owned_courses);
        }
      }

      const startIndex = search_index * search_amount;
      const endIndex = (search_index + 1) * search_amount;
      const maxIndex = Math.floor(similar_courses.length / search_amount);
      similar_courses = similar_courses.slice(startIndex, endIndex);
      res.status(200).send({ courses: similar_courses, maxIndex: maxIndex });
    } catch {}
  });
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
