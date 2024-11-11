const { Database } = require('@sqlitecloud/drivers');
require('dotenv').config();

const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL;
const SQLITE_CLOUD_API_KEY = process.env.SQLITE_CLOUD_API_KEY;

async function initializeConnection() {
    try {
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
        `);

        // Helper functions with proper promise handling
        const dbHelpers = {
            getUserByAuthKey: async (authKey) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT users.*, GROUP_CONCAT(user_courses.course_id) as course_ids 
                        FROM users 
                        LEFT JOIN user_courses ON users.auth_key = user_courses.auth_key 
                        WHERE users.auth_key = ? 
                        GROUP BY users.id
                    `, [authKey], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            getUserByLogin: async (login) => {
                return new Promise((resolve, reject) => {
                    db.all('SELECT * FROM users WHERE login = ?', [login], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            getUserCourses: async (authKey) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT uc.*,
                            json_extract(uc.user_data, '$.login') as user_login,
                            json_extract(uc.user_data, '$.name') as user_name,
                            json_extract(uc.user_data, '$.surname') as user_surname
                        FROM user_courses uc 
                        WHERE uc.auth_key = ?
                    `, [authKey], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    });
                });
            },

            insertUser: async (userData) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO users (login, password, name, surname, group_type, auth_key, coursesOwned)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        userData.login,
                        userData.password,
                        userData.name,
                        userData.surname,
                        userData.group,
                        userData.auth_key,
                        userData.coursesOwned
                    ], (err) => {
                        if (err) reject(err);
                        resolve();
                    });
                });
            },

            updateUserAndCourses: async (auth_key, login, name, surname) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE users 
                        SET login = ?, name = ?, surname = ? 
                        WHERE auth_key = ?
                    `, [login, name, surname, auth_key], async (err) => {
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

            getCourseByUserAndId: async (authKey, courseId) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT uc.*
                        FROM user_courses uc
                        WHERE uc.auth_key = ? AND uc.course_id = ?
                    `, [authKey, courseId], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            findCourse: async (authKey, courseId) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT uc.* FROM user_courses uc
                        JOIN users u ON uc.auth_key = u.auth_key
                        WHERE u.auth_key = ? AND uc.course_id = ?
                    `, [authKey, courseId], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            updateAllowedTestsByUsername: async (allowed_tests, username, courseId) => {
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
                    ], function(err) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    });
                });
            },

            addCompletedTest: async (completedTests, authKey, courseId) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses 
                        SET completed_tests = ? 
                        WHERE auth_key = ? AND course_id = ?
                    `, [completedTests, authKey, courseId], function(err) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    });
                });
            },

            updateAllowedTests: async (allowedTests, authKey, courseId) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses 
                        SET allowed_tests = ? 
                        WHERE auth_key = ? AND course_id = ?
                    `, [allowedTests, authKey, courseId], function(err) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    });
                });
            },

            getUsersWithCourse: async (courseId) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT DISTINCT u.*, 
                            json_extract(uc.user_data, '$.login') as user_login,
                            json_extract(uc.user_data, '$.name') as user_name,
                            json_extract(uc.user_data, '$.surname') as user_surname
                        FROM users u
                        JOIN user_courses uc ON u.auth_key = uc.auth_key
                        WHERE uc.course_id = ? 
                        AND uc.hidden = 0
                    `, [courseId], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    });
                });
            },

            updateCourseRestrictionByUsername: async (restricted, username, courseId) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE user_courses
                        SET restricted = ?
                        WHERE json_extract(user_data, '$.login') = ?
                        AND course_id = ?
                    `, [restricted, username, courseId], function(err) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    });
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
                        `, [code, currentTime], (err, rows) => {
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
                    `, [code], (err, rows) => {
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
                    ], function(err) {
                        if (err) reject(err);
                        resolve({ id: this.lastID });
                    });
                });
            },

            updatePromocode: async (usedDate, usedBy, code) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE promocodes 
                        SET used_date = ?, used_by = ? 
                        WHERE code = ?
                    `, [usedDate, usedBy, code], function(err) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    });
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
                    `, [courseId], (err, rows) => {
                        if (err) reject(err);
                        resolve(rows || []);
                    });
                });
            },

            deletePromocode: async (code) => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        DELETE FROM promocodes WHERE code = ?
                    `, [code], function(err) {
                        if (err) reject(err);
                        resolve({ changes: this.changes });
                    });
                });
            },

            checkPromocodeExists: async (code) => {
                return new Promise((resolve, reject) => {
                    db.all(`
                        SELECT * FROM promocodes 
                        WHERE code = ?
                    `, [code], (err, rows) => {
                        if (err) {
                            console.error('Error checking promocode:', err);
                            reject(err);
                        }
                        console.log('Raw promocode data:', rows);
                        resolve(rows && rows.length ? rows[0] : null);
                    });
                });
            },

            insertCourse: async (courseData) => {
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
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    ], function(err) {
                        if (err) {
                            console.error('Error inserting course:', err);
                            reject(err);
                        }
                        resolve({ id: this.lastID });
                    });
                });
            }
        };

        return { db, dbHelpers };
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

module.exports = initializeConnection();