import fs from 'fs';
import path from 'path';
import { dbHelpers } from '../app';

export function createRandomString(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function readJsonFile<T>(filePath: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, "..", filePath), "utf8", (err, data) => {
            if (err) {
                resolve(null);
            } else {
                try {
                    const jsonData = JSON.parse(data) as T;
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            }
        });
    });
}

export async function checkAndUpdateExpiredCourses(auth_key: string): Promise<void> {
    if (!dbHelpers) {
        console.error("Database helpers not initialized");
        return;
    }

    try {
        const userCourses = await dbHelpers.getUserCourses(auth_key);
        const currentTime = Date.now();

        const user = await dbHelpers.getUserByAuthKey(auth_key);
        if (!user) {
            console.error("User not found for auth_key:", auth_key);
            return;
        }

        for (const course of userCourses) {
            if (
                course.expire_date !== undefined && 
                course.expire_date !== -1 &&
                course.expire_date < currentTime &&
                !course.restricted
            ) {
                console.log(
                    "Course expired:",
                    course.course_id,
                    "for user",
                    user.login
                );
                await dbHelpers.updateCourseRestrictionByUsername(
                    true,
                    user.login,
                    course.course_id
                );
            }
        }
    } catch (error) {
        console.error("Error checking expired courses:", error);
    }
} 