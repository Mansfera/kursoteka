import express, { Request, Response, Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { dbHelpers } from "../app";
import type { DbHelpers } from "../types";

const router: Router = express.Router();
const PROJECT_ROOT = path.join(__dirname, "..");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

interface UploadImgQuery {
  auth_key: string;
  course: string;
  img_name: string;
  blockId: string;
  testId: string;
}

// Cast to remove null possibility
const dbh = dbHelpers as DbHelpers;

router.post("/uploadImg", upload.single("image"), async (req: Request, res: Response) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const imgName = req.query.img_name as string;
  const blockId = req.query.blockId as string;
  const testId = req.query.testId as string;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
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
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/images/`
    );

    const filePath = path.join(dirPath, newFileName);

    // Check if the directory exists
    if (!fs.existsSync(dirPath)) {
      console.error("Directory does not exist:", dirPath);
      fs.mkdirSync(dirPath, { recursive: true });
      console.info("Directory created:", dirPath);
    }

    // Convert the uploaded image to PNG and save it
    sharp(req.file.buffer)
      .png()
      .toFile(filePath, (err, info) => {
        if (err) {
          console.error(err);
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

router.post("/deleteImg", async (req: Request, res: Response) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const imgName = req.query.img_name as string;
  const blockId = req.query.blockId as string;
  const testId = req.query.testId as string;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const coursesOwned = JSON.parse(user.coursesOwned);
    if (!coursesOwned.includes(courseName)) {
      return res.status(403).send("No access");
    }

    const filePath = path.join(
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/images/`,
      `${imgName}.png`
    );

    // Use promisified fs operations
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      await fs.promises.unlink(filePath);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      if ((err as any).code === "ENOENT") {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Error deleting file" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/saveTest", async (req, res) => {
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
    const user = await dbh.getUserByAuthKey(auth_key);
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

    // Use Promise.all to write all files concurrently
    await Promise.all([
      fs.promises.writeFile(questionPath, JSON.stringify(questions)),
      fs.promises.writeFile(
        vidpovidnistPath,
        JSON.stringify(vidpovidnist_questions)
      ),
      fs.promises.writeFile(hronologyPath, JSON.stringify(hronology_questions)),
      fs.promises.writeFile(mulAnsPath, JSON.stringify(mul_ans_questions)),
    ]);

    res.status(200).json({});
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/saveConspect", async (req, res) => {
  const { auth_key, course, blockId, testId, conspectId, name, blocks } =
    req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (
      !user ||
      (user.group_type !== "admin" && user.group_type !== "teacher")
    ) {
      return res.status(403).send("Unauthorized");
    }

    const dirPath = path.join(
      PROJECT_ROOT,
      `courseData/${course}/block${blockId}/test${testId}`
    );
    const filePath = path.join(dirPath, `conspect_${conspectId}.json`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Save the conspect data
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          id: conspectId,
          name: name,
          blocks: blocks,
        },
        null,
        2
      )
    );

    // Update the course's test data to include this conspect
    try {
      const courseData = await dbh.getCourseById(course);
      if (courseData) {
        const courseBlocks = courseData.blocks ? JSON.parse(courseData.blocks) : [];
        const targetBlock = courseBlocks.find((b: { id: string }) => b.id === blockId);
        if (targetBlock) {
          const targetTest = targetBlock.tests.find((t: { id: string }) => t.id === testId);
          if (targetTest) {
            if (!targetTest.conspects) {
              targetTest.conspects = [];
            }
            // Update or add conspect reference
            const conspectIndex = targetTest.conspects.findIndex(
              (c: { id: string }) => c.id === conspectId
            );
            if (conspectIndex >= 0) {
              targetTest.conspects[conspectIndex].name = name;
            } else {
              targetTest.conspects.push({ id: conspectId, name: name });
            }

            // Update the course blocks in the database
            await dbh.updateCourseBlocks(
              course,
              JSON.stringify(courseBlocks)
            );
          }
        }
      }

      res.status(200).json({ message: "Conspect saved successfully" });
    } catch (error) {
      console.error("Error updating course blocks:", error);
      // Still return success since the conspect file was saved
      res.status(200).json({
        message: "Conspect saved but course update failed",
        warning: "Course update failed",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/deleteConspect", async (req, res) => {
  const { auth_key, course, blockId, testId, conspectId } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (
      !user ||
      (user.group_type !== "admin" && user.group_type !== "teacher")
    ) {
      return res.status(403).send("Unauthorized");
    }

    // Delete the conspect file
    const filePath = path.join(
      PROJECT_ROOT,
      `courseData/${course}/block${blockId}/test${testId}/conspect_${conspectId}.json`
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update the course data to remove the conspect reference
    const courseData = await dbh.getCourseById(course);
    if (courseData) {
      const blocks = courseData.blocks ? JSON.parse(courseData.blocks) : [];
      const targetBlock = blocks.find((b: { id: string }) => b.id === blockId);
      if (targetBlock) {
        const targetTest = targetBlock.tests.find((t: { id: string }) => t.id === testId);
        if (targetTest && targetTest.conspects) {
          targetTest.conspects = targetTest.conspects.filter(
            (c: { id: string }) => c.id !== conspectId
          );
          await dbh.updateCourseBlocks(course, JSON.stringify(blocks));
        }
      }
    }

    res.status(200).json({ message: "Conspect deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/uploadCardImage", upload.single("image"), async (req, res) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const blockId = req.query.blockId as string;
  const testId = req.query.testId as string;
  const imageId = +(req.query.imageId as string);

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (
      !user ||
      (user.group_type !== "admin" && user.group_type !== "teacher")
    ) {
      return res.status(403).send("Unauthorized");
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const dirPath = path.join(
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/cardImages/`
    );
    const filePath = path.join(dirPath, `${imageId}.png`);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    await sharp(req.file.buffer).png().toFile(filePath);

    res.status(200).json({ message: "Image updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/updateCardText", async (req, res) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const blockId = req.query.blockId as string;
  const testId = req.query.testId as string;
  const imageId = +(req.query.imageId as string);
  const { text, type } = req.body;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (
      !user ||
      (user.group_type !== "admin" && user.group_type !== "teacher")
    ) {
      return res.status(403).send("Unauthorized");
    }

    const cardsPath = path.join(
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/cards.json`
    );

    const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
    const cardIndex = cards.findIndex((card: { id: number }) => card.id === imageId);

    if (cardIndex === -1) {
      return res.status(404).send("Card not found");
    }

    cards[cardIndex].infoText = text;
    if (type) {
      cards[cardIndex].type = type;
    }

    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

    res.status(200).json({ message: "Card updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/createCard", upload.single("image"), async (req, res) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const blockId = req.query.blockId as string;
  const testId = req.query.testId as string;
  const text = req.body.text as string;
  const type = req.body.type as string;

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (
      !user ||
      (user.group_type !== "admin" && user.group_type !== "teacher")
    ) {
      return res.status(403).send("Unauthorized");
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const cardsPath = path.join(
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/cards.json`
    );

    let cards = [];
    try {
      cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
    } catch (err) {
      // If file doesn't exist or is empty, start with empty array
    }

    // Generate new card ID
    const newId =
      cards.length > 0
        ? Math.max(...cards.map((card: { id: string }) => parseInt(card.id))) + 1
        : 1;

    // Save image
    const dirPath = path.join(
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/cardImages/`
    );
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `${newId}.png`);
    await sharp(req.file.buffer).png().toFile(filePath);

    // Add new card to array
    cards.push({
      id: newId,
      frontContentType: "img",
      infoText: text,
      type: type || "Інше",
    });

    // Save updated cards array
    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

    res.status(200).json({ message: "Card created successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/deleteCard", async (req, res) => {
  const auth_key = req.query.auth_key as string;
  const courseName = req.query.course as string;
  const blockId = req.query.blockId as string;
  const testId = req.query.testId as string;
  const imageId = +(req.query.imageId as string);

  try {
    const user = await dbh.getUserByAuthKey(auth_key);
    if (
      !user ||
      (user.group_type !== "admin" && user.group_type !== "teacher")
    ) {
      return res.status(403).send("Unauthorized");
    }

    const cardsPath = path.join(
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/cards.json`
    );

    // Read and filter out the card to delete
    const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
    const filteredCards = cards.filter((card: { id: number }) => card.id !== imageId);

    if (cards.length === filteredCards.length) {
      return res.status(404).send("Card not found");
    }

    // Delete the image file
    const imagePath = path.join(
      PROJECT_ROOT,
      `courseData/${courseName}/block${blockId}/test${testId}/cardImages/${imageId}.png`
    );
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error("Error deleting image file:", err);
    }

    // Save updated cards array
    fs.writeFileSync(cardsPath, JSON.stringify(filteredCards, null, 2));

    res.status(200).json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
