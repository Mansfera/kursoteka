import express, { Request, Response, Router } from "express";
import { Course } from "../types";
import { dbHelpers } from "../app";
import path from "path";
import fs from "fs";
import type { DbHelpers } from "../types";

const router: Router = express.Router();

const PROJECT_ROOT = path.join(__dirname, "..");

interface GetCoursesRequest {
  auth_key?: string;
  search_tags?: string[];
  authors?: string[];
  only_show_non_owned?: boolean;
  search_index: number;
  search_amount: number;
}

// Cast to remove null possibility
const dbh = dbHelpers as DbHelpers;

router.post(
  "/getCourses",
  async (req: Request<{}, {}, GetCoursesRequest>, res: Response) => {
    const {
      auth_key,
      search_tags,
      authors,
      only_show_non_owned,
      search_index,
      search_amount,
    } = req.body;

    try {
      const courses = await dbh.getAllCourses();
      // Transform courses data from DB format
      const transformedCourses = courses.map((course: Course) => ({
        ...course,
        tags: JSON.parse(course.tags),
        marketplace_info: course.marketplace_info
          ? JSON.parse(course.marketplace_info)
          : {},
        blocks: course.blocks ? JSON.parse(course.blocks) : [],
      }));

      const searchForTags = search_tags != null && search_tags.length > 0;
      const searchForAuthors = authors != null && authors.length > 0;
      const searchForUserCourses =
        auth_key != null && auth_key != "" && only_show_non_owned;

      let tag_courses = [];
      let author_courses = [];
      let owned_courses = [];

      for (const course of transformedCourses) {
        if (searchForTags) {
          const courseTags = course.tags;
          if (courseTags.some((tag: string) => search_tags.includes(tag))) {
            tag_courses.push(course);
          }
        }

        if (searchForAuthors && authors.includes(course.author as string)) {
          author_courses.push(course);
        }

        if (searchForUserCourses) {
          const userCourse = await dbh.getCourseByUserAndId(
            auth_key,
            course.id
          );
          if (userCourse) {
            owned_courses.push(course);
          }
        }
      }

      let similar_courses: any[] = [];
      function intersectArrays(arr1: any[], arr2: any[]) {
        return arr1.filter((item: any) => arr2.includes(item));
      }

      if (searchForTags) {
        similar_courses =
          similar_courses.length === 0
            ? tag_courses
            : intersectArrays(similar_courses, tag_courses);
      }

      if (searchForAuthors) {
        similar_courses =
          similar_courses.length === 0
            ? author_courses
            : intersectArrays(similar_courses, author_courses);
      }

      if (searchForUserCourses) {
        similar_courses =
          similar_courses.length === 0
            ? owned_courses
            : intersectArrays(similar_courses, owned_courses);
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
  }
);

interface GetCourseInfoRequest {
  specific_course: string;
}

router.post("/getCourseInfo", async (req: Request, res: Response) => {
  const { specific_course } = req.body as GetCourseInfoRequest;

  try {
    const course = await dbh.getCourseById(specific_course);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    const blocks = course.blocks ? JSON.parse(course.blocks) : [];
    const marketplaceInfo = course.marketplace_info
      ? JSON.parse(course.marketplace_info)
      : {};
    const testCount = blocks.reduce(
      (count: number, block: { tests: { length: number }[] }) =>
        count + block.tests.length,
      0
    );

    res.status(200).json({
      courseName: course.name,
      masterFeature:
        testCount > 4
          ? marketplaceInfo.master_feature
          : marketplaceInfo.master_feature,
      courseDetails: marketplaceInfo.course_details,
      authorName: marketplaceInfo.author_name,
      authorAbout: marketplaceInfo.author_about,
      keyFeatures: marketplaceInfo.key_features,
      blocks: blocks,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

interface GetCourseImageQuery {
  course: string;
  image_name: string;
}

router.get(
  "/getCourseImage",
  (req: Request<{}, {}, {}, GetCourseImageQuery>, res: Response) => {
    const courseName = req.query.course;
    const imageName = req.query.image_name;

    const filePathImg = path.join(
      PROJECT_ROOT,
      "courseData",
      courseName as string,
      "marketplace",
      `${imageName}.jpeg`
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
);

export default router;
