import { Database } from "@sqlitecloud/drivers";

export type { Database };

export interface ChangeAccessRequest {
  auth_key: string;
  courseName: string;
  login: string;
  access: boolean;
}

export interface ChangeAllowedRequest {
  auth_key: string;
  courseName: string;
  username: string;
  allowed_tests: string[];
}

export interface AuthKeyRequest {
  auth_key: string;
}

export interface TestResultRequest {
  auth_key: string;
  date: number;
  time: string;
  courseName: string;
  test_type: string;
  block: string;
  test: string;
  score: number;
  abcd_questions_accuracy: string;
  hronology_questions_accuracy: string;
  vidpovidnist_questions_accuracy: string;
  mul_ans_questions_accuracy: string;
  uuid: string;
  questions_data: string;
}

export interface User {
  id: number;
  login: string;
  password: string;
  name?: string;
  surname?: string;
  group_type: string;
  auth_key: string;
  coursesOwned: string;
  course_ids?: string;
}

export interface UserCourse {
  id: number;
  auth_key: string;
  user_data: string;
  course_id: string;
  hidden: boolean;
  join_date?: number;
  expire_date: number;
  restricted: boolean;
  allowed_tests: string;
  completed_tests: string;
  uncompleted_tests: string;
  last_updated?: number;
  user_login?: string;
  user_name?: string;
  user_surname?: string;
}

export interface Course {
  id: string;
  name: string;
  type: string;
  tags: string;
  author?: string;
  marketplace_info?: string;
  blocks?: string;
}

export interface CourseTransformed
  extends Omit<Course, "tags" | "marketplace_info" | "blocks"> {
  tags: string[];
  marketplace_info?: Record<string, any>;
  blocks?: any[];
}

export interface TestDetails {
  uuid: string;
  auth_key: string;
  course_id: string;
  date: number;
  time: string;
  test_type: string;
  block: string;
  test: string;
  score: number;
  abcd_questions_accuracy: string;
  hronology_questions_accuracy: string;
  vidpovidnist_questions_accuracy: string;
  mul_ans_questions_accuracy: string;
  questions_data: string;
}

export interface Promocode {
  code: string;
  course_id: string;
  expire_date: number;
  access_duration: number;
  used_date?: number;
  used_by?: string;
  used_by_name?: string;
  used_by_surname?: string;
  start_temas: string;
}

export interface DbHelpers {
  getUserByAuthKey: (authKey: string) => Promise<any>;
  getUserByLogin: (login: string) => Promise<any>;
  getUserCourses: (authKey: string) => Promise<any>;
  insertUser: (userData: Partial<User>) => Promise<void>;
  updateUserAndCourses: (
    auth_key: string,
    login: string,
    name: string | null,
    surname: string | null
  ) => Promise<void>;
  getCourseByUserAndId: (
    authKey: string,
    courseId: string
  ) => Promise<UserCourse | null>;
  findCourse: (authKey: string, courseId: string) => Promise<UserCourse | null>;
  updateAllowedTestsByUsername: (
    allowed_tests: string[],
    username: string,
    courseId: string
  ) => Promise<{ changes: number }>;
  addCompletedTest: (
    completedTests: string,
    authKey: string,
    courseId: string
  ) => Promise<{ changes: number }>;
  updateAllowedTests: (
    allowedTests: string,
    authKey: string,
    courseId: string
  ) => Promise<{ changes: number }>;
  getUsersWithCourse: (courseId: string) => Promise<User[]>;
  updateCourseRestrictionByUsername: (
    restricted: boolean,
    username: string,
    courseId: string
  ) => Promise<{ changes: number }>;
  getUnusedPromocode: (
    code: string,
    currentTime: number
  ) => Promise<Promocode | null>;
  getPromocode: (code: string) => Promise<Promocode | null>;
  insertPromocode: (
    promocodeData: Partial<Promocode>
  ) => Promise<{ id: number }>;
  updatePromocode: (
    usedDate: number,
    usedBy: string,
    code: string
  ) => Promise<{ changes: number }>;
  getPromocodesByCourse: (courseId: string) => Promise<Promocode[]>;
  deletePromocode: (code: string) => Promise<{ changes: number }>;
  insertUserCourse: (
    courseData: Partial<UserCourse>
  ) => Promise<{ id: number }>;
  getCourseById: (courseId: string) => Promise<Course | null>;
  getAllCourses: () => Promise<any>;
  insertNewCourse: (courseData: Partial<Course>) => Promise<{ id: number }>;
  updateCourse: (
    courseId: string,
    courseData: Partial<Course>
  ) => Promise<{ changes: number }>;
  getUncompletedTests: (
    auth_key: string,
    courseId: string
  ) => Promise<{ tests: any[]; last_updated: number }>;
  updateUncompletedTests: (
    auth_key: string,
    courseId: string,
    tests: string
  ) => Promise<{ changes: number }>;
  saveTestDetails: (
    testData: Partial<TestDetails>
  ) => Promise<{ changes: number }>;
  cleanupOldTests: () => Promise<{ changes: number }>;
  getTestDetails: (uuid: string) => Promise<TestDetails | null>;
  getUserTestsByTeacher: (
    auth_key: string,
    course_id: string
  ) => Promise<TestDetails[] | null>;
  updateCourseBlocks: (
    courseId: string,
    blocksJson: string
  ) => Promise<{ changes: number }>;
  checkPromocodeExists: (code: string) => Promise<Promocode | null>;
}

export interface DatabaseExports {
  db: Database;
  dbHelpers: DbHelpers;
}

export interface GetCourseInfoRequest {
  specific_course: string;
}

export interface GetCourseImageQuery {
  course: string;
  image_name: string;
}

export interface ChangeCredentialsRequest {
  auth_key: string;
  login?: string;
  name?: string;
  surname?: string;
}
export interface RegisterRequest {
  login: string;
  password: string;
  name?: string;
  surname?: string;
}
export interface LoginRequest {
  login: string;
  password: string;
}
export interface UserDetailsRequest {
  auth_key: string;
}

export interface DatabaseModule {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}
