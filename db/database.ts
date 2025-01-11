import { Database } from '@sqlitecloud/drivers';
import { DbHelpers, DatabaseExports, User, UserCourse, Course, TestDetails, Promocode } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL;
const SQLITE_CLOUD_API_KEY = process.env.SQLITE_CLOUD_API_KEY;

async function initializeConnection(): Promise<DatabaseExports> {
    try {
        if (!SQLITE_CLOUD_URL || !SQLITE_CLOUD_API_KEY) {
            console.error('Missing environment variables:', {
                hasUrl: !!SQLITE_CLOUD_URL,
                hasApiKey: !!SQLITE_CLOUD_API_KEY
            });
            throw new Error('Missing required environment variables');
        }

        const connectionString = `sqlitecloud://${SQLITE_CLOUD_URL}?apikey=${SQLITE_CLOUD_API_KEY}`;
        const db = new Database(connectionString);
        
        // Initialize database tables
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                login TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT,
                surname TEXT,
                group_type TEXT NOT NULL,
                auth_key TEXT UNIQUE NOT NULL,
                coursesOwned TEXT DEFAULT '[]'
            );

            CREATE TABLE IF NOT EXISTS user_courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                auth_key TEXT NOT NULL,
                user_data TEXT NOT NULL,
                course_id TEXT NOT NULL,
                hidden BOOLEAN DEFAULT FALSE,
                join_date INTEGER,
                expire_date INTEGER,
                restricted BOOLEAN DEFAULT FALSE,
                allowed_tests TEXT DEFAULT '[]',
                completed_tests TEXT DEFAULT '[]',
                uncompleted_tests TEXT DEFAULT '[]',
                last_updated INTEGER,
                FOREIGN KEY(auth_key) REFERENCES users(auth_key)
            );

            CREATE TABLE IF NOT EXISTS promocodes (
                code TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                expire_date INTEGER,
                access_duration INTEGER,
                used_date INTEGER DEFAULT -1,
                used_by TEXT,
                start_temas TEXT,
                FOREIGN KEY(used_by) REFERENCES users(auth_key)
            );

            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                tags TEXT NOT NULL,
                author TEXT,
                marketplace_info TEXT,
                blocks TEXT
            );

            CREATE TABLE IF NOT EXISTS test_details (
                uuid TEXT PRIMARY KEY,
                auth_key TEXT NOT NULL,
                course_id TEXT NOT NULL,
                date INTEGER NOT NULL,
                time TEXT NOT NULL,
                test_type TEXT NOT NULL,
                block TEXT NOT NULL,
                test TEXT NOT NULL,
                score INTEGER NOT NULL,
                abcd_questions_accuracy TEXT,
                hronology_questions_accuracy TEXT,
                vidpovidnist_questions_accuracy TEXT,
                mul_ans_questions_accuracy TEXT,
                questions_data TEXT NOT NULL,
                FOREIGN KEY (auth_key) REFERENCES users (auth_key)
            );
        `);

        const dbHelpers: DbHelpers = {
            getUserByAuthKey: async (authKey: string): Promise<User | null> => {
                return new Promise((resolve, reject) => {
                    db.all<User>(`
                        SELECT users.*, GROUP_CONCAT(user_courses.course_id) as course_ids 
                        FROM users 
                        LEFT JOIN user_courses ON users.auth_key = user_courses.auth_key 
                        WHERE users.auth_key = ? 
                        GROUP BY users.id
                    `, [authKey], (err: Error | null, rows?: User[]) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            getUserByLogin: async (login: string): Promise<User | null> => {
                return new Promise((resolve, reject) => {
                    db.all<User>('SELECT * FROM users WHERE login = ?', [login], 
                        (err: Error | null, rows?: User[]) => {
                            if (err) reject(err);
                            resolve(rows && rows.length ? rows[0] : null);
                        });
                });
            },

            getUserCourses: async (authKey: string): Promise<UserCourse[]> => {
                return new Promise((resolve, reject) => {
                    db.all<UserCourse>(`
                        SELECT uc.*,
                            json_extract(uc.user_data, '$.login') as user_login,
                            json_extract(uc.user_data, '$.name') as user_name,
                            json_extract(uc.user_data, '$.surname') as user_surname
                        FROM user_courses uc 
                        WHERE uc.auth_key = ?
                    `, [authKey], (err: Error | null, rows?: UserCourse[]) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    });
                });
            },

            insertUser: async (userData: Partial<User>): Promise<void> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO users (login, password, name, surname, group_type, auth_key, coursesOwned)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        userData.login,
                        userData.password,
                        userData.name,
                        userData.surname,
                        userData.group_type,
                        userData.auth_key,
                        userData.coursesOwned
                    ], (err: Error | null) => {
                        if (err) reject(err);
                        resolve();
                    });
                });
            },

            updateUserAndCourses: async (
                auth_key: string,
                login: string,
                name: string | null,
                surname: string | null
            ): Promise<void> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE users 
                        SET login = ?, name = ?, surname = ? 
                        WHERE auth_key = ?
                    `, [login, name, surname, auth_key], async (err: Error | null) => {
                        if (err) reject(err);
                        try {
                            await db.run(`
                                UPDATE user_courses 
                                SET user_data = ?
                                WHERE auth_key = ?
                            `, [
                                JSON.stringify({ 
                                    login, 
                                    name: name || '', 
                                    surname: surname || '' 
                                }), 
                                auth_key
                            ]);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    });
                });
            },

            getCourseByUserAndId: async (authKey: string, courseId: string): Promise<UserCourse | null> => {
                return new Promise((resolve, reject) => {
                    db.all<UserCourse>(`
                        SELECT uc.*
                        FROM user_courses uc
                        WHERE uc.auth_key = ? AND uc.course_id = ?
                    `, [authKey, courseId], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            findCourse: async (authKey: string, courseId: string): Promise<UserCourse | null> => {
                return new Promise((resolve, reject) => {
                    db.all<UserCourse>(`
                        SELECT uc.* FROM user_courses uc
                        JOIN users u ON uc.auth_key = u.auth_key
                        WHERE u.auth_key = ? AND uc.course_id = ?
                    `, [authKey, courseId], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            updateAllowedTestsByUsername: async (
                allowed_tests: string[],
                username: string,
                courseId: string
            ): Promise<{ changes: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses 
                        SET allowed_tests = ?
                        WHERE json_extract(user_data, '$.login') = ? 
                        AND course_id = ?
                    `, [
                        JSON.stringify(allowed_tests),
                        username,
                        courseId
                    ], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            addCompletedTest: async (
                completedTests: string,
                authKey: string,
                courseId: string
            ): Promise<{ changes: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses 
                        SET completed_tests = ? 
                        WHERE auth_key = ? AND course_id = ?
                    `, [completedTests, authKey, courseId], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            updateAllowedTests: async (
                allowedTests: string,
                authKey: string,
                courseId: string
            ): Promise<{ changes: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses 
                        SET allowed_tests = ? 
                        WHERE auth_key = ? AND course_id = ?
                    `, [allowedTests, authKey, courseId], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            getUsersWithCourse: async (courseId: string): Promise<User[]> => {
                return new Promise((resolve, reject) => {
                    db.all<User>(`
                        SELECT DISTINCT u.*, 
                            json_extract(uc.user_data, '$.login') as user_login,
                            json_extract(uc.user_data, '$.name') as user_name,
                            json_extract(uc.user_data, '$.surname') as user_surname
                        FROM users u
                        JOIN user_courses uc ON u.auth_key = uc.auth_key
                        WHERE uc.course_id = ? 
                        AND uc.hidden = 0
                    `, [courseId], (err: Error | null, rows?: User[]) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    });
                });
            },

            updateCourseRestrictionByUsername: async (
                restricted: boolean,
                username: string,
                courseId: string
            ): Promise<{ changes: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses
                        SET restricted = ?
                        WHERE json_extract(user_data, '$.login') = ?
                        AND course_id = ?
                    `, [restricted, username, courseId], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            getUnusedPromocode: async (code, currentTime) => {
                try {
                    return new Promise((resolve, reject) => {
                        db.all(`
                            SELECT p.*, u.login, u.name, u.surname 
                            FROM promocodes p
                            LEFT JOIN users u ON p.used_by = u.auth_key
                            WHERE p.code = ? 
                            AND (p.expire_date > ? OR p.expire_date = -1)
                            AND (p.used_date IS NULL OR p.used_date = -1)
                        `, [code, currentTime], (err: Error | null, rows?: Promocode[]) => {
                            if (err) reject(err);
                            resolve(rows && rows.length ? rows[0] : null);
                        });
                    });
                } catch (error) {
                    console.error('Error in getUnusedPromocode:', error);
                    throw error;
                }
            },

            getPromocode: async (code) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT * FROM promocodes 
                        WHERE code = ?
                    `, [code], (err: Error | null, rows?: Promocode[]) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            insertPromocode: async (promocodeData) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO promocodes (course_id, code, expire_date, access_duration, start_temas)
                        VALUES (?, ?, ?, ?, ?)
                    `, [
                        promocodeData.course_id,
                        promocodeData.code,
                        promocodeData.expire_date,
                        promocodeData.access_duration,
                        promocodeData.start_temas
                    ], (function(this: { lastID: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ id: this.lastID });
                    }));
                });
            },

            updatePromocode: async (usedDate, usedBy, code) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE promocodes 
                        SET used_date = ?, used_by = ? 
                        WHERE code = ?
                    `, [usedDate, usedBy, code], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            getPromocodesByCourse: async (courseId) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT p.*, 
                            json_extract(uc.user_data, '$.login') as login,
                            json_extract(uc.user_data, '$.name') as name,
                            json_extract(uc.user_data, '$.surname') as surname
                        FROM promocodes p 
                        LEFT JOIN user_courses uc ON p.used_by = uc.auth_key 
                        WHERE p.course_id = ?
                        GROUP BY p.id
                    `, [courseId], (err: Error | null, rows?: Promocode[]) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    });
                });
            },

            deletePromocode: async (code) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        DELETE FROM promocodes WHERE code = ?
                    `, [code], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            checkPromocodeExists: async (code: string): Promise<Promocode | null> => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT * FROM promocodes 
                        WHERE code = ?
                    `, [code], (err: Error | null, rows?: Promocode[]) => {
                        if (err) {
                            console.error('Error checking promocode:', err);
                            reject(err);
                        }
                        console.log('Raw promocode data:', rows);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            insertUserCourse: async (courseData: Partial<UserCourse>): Promise<{ id: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO user_courses (
                            auth_key,
                            user_data,
                            course_id,
                            hidden,
                            join_date,
                            expire_date,
                            restricted,
                            allowed_tests,
                            completed_tests
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        courseData.auth_key,
                        courseData.user_data,
                        courseData.course_id,
                        courseData.hidden,
                        courseData.join_date,
                        courseData.expire_date,
                        courseData.restricted,
                        courseData.allowed_tests,
                        courseData.completed_tests
                    ], (function(this: { lastID: number }, err: Error | null) {
                        if (err) {
                            console.error('Error inserting course:', err);
                            reject(err);
                        }
                        resolve({ id: this.lastID });
                    }));
                });
            },

            getCourseById: async (courseId: string): Promise<Course | null> => {
                return new Promise((resolve, reject) => {
                    db.all<Course>('SELECT * FROM courses WHERE id = ?', [courseId], 
                        (err: Error | null, rows?: Course[]) => {
                            if (err) reject(err);
                            resolve(rows && rows.length ? rows[0] : null);
                        });
                });
            },

            getAllCourses: async (): Promise<Course[]> => {
                return new Promise((resolve, reject) => {
                    db.all<Course>('SELECT * FROM courses', [], 
                        (err: Error | null, rows?: Course[]) => {
                            if (err) reject(err);
                            resolve(rows || []);
                        });
                });
            },

            insertNewCourse: async (courseData: Partial<Course>): Promise<{ id: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO courses (id, name, type, tags, author, marketplace_info, blocks)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        courseData.id,
                        courseData.name,
                        courseData.type,
                        JSON.stringify(courseData.tags),
                        courseData.author || '',
                        JSON.stringify(courseData.marketplace_info || {}),
                        JSON.stringify(courseData.blocks || [])
                    ], (function(this: { lastID: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ id: this.lastID });
                    }));
                });
            },

            updateCourse: async (courseId: string, courseData: Partial<Course>): Promise<{ changes: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE courses 
                        SET name = ?, type = ?, tags = ?, author = ?, marketplace_info = ?, blocks = ?
                        WHERE id = ?
                    `, [
                        courseData.name,
                        courseData.type,
                        JSON.stringify(courseData.tags),
                        courseData.author || '',
                        JSON.stringify(courseData.marketplace_info || {}),
                        JSON.stringify(courseData.blocks || []),
                        courseId
                    ], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            async getUncompletedTests(auth_key, courseId) {
                return new Promise((resolve, reject) => {
                    db.get(`
                        SELECT uncompleted_tests, last_updated 
                        FROM user_courses 
                        WHERE auth_key = ? AND course_id = ?
                    `, [auth_key, courseId], (err: Error | null, row?: UserCourse) => {
                        if (err) reject(err);
                        resolve({
                            tests: row?.uncompleted_tests ? JSON.parse(row.uncompleted_tests) : [],
                            last_updated: row?.last_updated || 0
                        });
                    });
                });
            },

            async updateUncompletedTests(auth_key, courseId, tests) {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses 
                        SET uncompleted_tests = ?, 
                            last_updated = ?
                        WHERE auth_key = ? AND course_id = ?
                    `, [tests, Date.now(), auth_key, courseId], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            async saveTestDetails(testData) {
                const query = `
                    INSERT INTO test_details (
                        uuid, auth_key, course_id, date, time, test_type, block, test,
                        score, abcd_questions_accuracy, hronology_questions_accuracy,
                        vidpovidnist_questions_accuracy, mul_ans_questions_accuracy,
                        questions_data
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                return new Promise((resolve, reject) => {
                    db.run(query, [
                        testData.uuid,
                        testData.auth_key,
                        testData.course_id,
                        testData.date,
                        testData.time,
                        testData.test_type,
                        testData.block,
                        testData.test,
                        testData.score,
                        testData.abcd_questions_accuracy,
                        testData.hronology_questions_accuracy,
                        testData.vidpovidnist_questions_accuracy,
                        testData.mul_ans_questions_accuracy,
                        JSON.stringify(testData.questions_data)
                    ], (function(this: { changes: number }, err: Error | null) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    }));
                });
            },

            async cleanupOldTests() {
                const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
                return new Promise((resolve, reject) => {
                    db.run('DELETE FROM test_details WHERE date < ?', [twoWeeksAgo], 
                        (function(this: { changes: number }, err: Error | null) {
                            if (err) reject(err);
                            resolve({ changes: this.changes });
                        })
                    );
                });
            },

            async getTestDetails(uuid) {
                return new Promise((resolve, reject) => {
                    db.get('SELECT * FROM test_details WHERE uuid = ?', [uuid],
                        (err: Error | null, row?: TestDetails) => {
                            if (err) reject(err);
                            resolve(row || null);
                        }
                    );
                });
            },

            async getUserTestsByTeacher(auth_key, course_id) {
                const user = await this.getUserByAuthKey(auth_key);
                if (!user) return null;
                
                const coursesOwned = JSON.parse(user.coursesOwned);
                if (!coursesOwned.includes(course_id)) return null;

                return new Promise((resolve, reject) => {
                    db.all(
                        `SELECT td.*, u.name, u.surname, u.login 
                         FROM test_details td
                         JOIN users u ON td.auth_key = u.auth_key
                         WHERE td.course_id = ?
                         ORDER BY td.date DESC`,
                        [course_id],
                        (err: Error | null, rows?: TestDetails[]) => {
                            if (err) reject(err);
                            resolve(rows || []);
                        }
                    );
                });
            },

            updateCourseBlocks: async (courseId: string, blocksJson: string): Promise<{ changes: number }> => {
                return new Promise((resolve, reject) => {
                    db.run(
                        "UPDATE courses SET blocks = ? WHERE id = ?",
                        [blocksJson, courseId],
                        (function(this: { changes: number }, err: Error | null) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ changes: this.changes });
                            }
                        })
                    );
                });
            }
        };

        return { db, dbHelpers };
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

let db: Database | null = null;
let dbHelpers: DbHelpers | null = null;

async function initialize() {
    try {
        const database = await initializeConnection();
        // Set the module-level variables
        db = database.db;
        dbHelpers = database.dbHelpers;
        return { db, dbHelpers };
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Export the initialize function and the database objects
export default { 
    db,  // This will be updated when initialize() is called
    dbHelpers,  // This will be updated when initialize() is called
    initialize 
}; 