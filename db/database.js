const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, 'users.db'));

// Initialize database with tables
function initializeDatabase() {
    // Create users table
    db.exec(`
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            expire_date INTEGER NOT NULL,
            access_duration INTEGER NOT NULL,
            used_date INTEGER DEFAULT -1,
            used_by TEXT,
            start_temas TEXT DEFAULT '[]',
            FOREIGN KEY(used_by) REFERENCES users(auth_key)
        );
    `);

    // Import existing users if database is empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        const usersJson = path.join(__dirname, '..', 'users.json');
        if (fs.existsSync(usersJson)) {
            const users = JSON.parse(fs.readFileSync(usersJson, 'utf8'));
            const insertUser = db.prepare(`
                INSERT INTO users (login, password, name, surname, group_type, auth_key, coursesOwned)
                VALUES (@login, @password, @name, @surname, @group, @auth_key, @coursesOwned)
            `);
            
            const insertCourse = db.prepare(`
                INSERT INTO user_courses (auth_key, user_data, course_id, hidden, join_date, expire_date, restricted, allowed_tests, completed_tests)
                VALUES (@auth_key, @user_data, @course_id, @hidden, @join_date, @expire_date, @restricted, @allowed_tests, @completed_tests)
            `);

            const importUsers = db.transaction((users) => {
                for (const user of users) {
                    insertUser.run({
                        login: user.login,
                        password: user.password,
                        name: user.name || '',
                        surname: user.surname || '',
                        group: user.group,
                        auth_key: user.auth_key,
                        coursesOwned: JSON.stringify(user.coursesOwned)
                    });

                    if (user.courses) {
                        for (const course of user.courses) {
                            insertCourse.run({
                                auth_key: user.auth_key,
                                user_data: JSON.stringify({
                                    login: user.login,
                                    name: user.name || '',
                                    surname: user.surname || ''
                                }),
                                course_id: course.id,
                                hidden: course.hidden ? 1 : 0,
                                join_date: course.data.join_date,
                                expire_date: course.data.expire_date,
                                restricted: course.data.restricted ? 1 : 0,
                                allowed_tests: JSON.stringify(course.data.allowed_tests),
                                completed_tests: JSON.stringify(course.data.completed_tests)
                            });
                        }
                    }
                }
            });

            importUsers(users);
        }
    }
}

// Initialize database
initializeDatabase();

// Helper functions for common database operations
const dbHelpers = {
    getUserByAuthKey: db.prepare(`
        SELECT users.*, GROUP_CONCAT(user_courses.course_id) as course_ids 
        FROM users 
        LEFT JOIN user_courses ON users.auth_key = user_courses.auth_key 
        WHERE users.auth_key = ? 
        GROUP BY users.id
    `),

    getUserByLogin: db.prepare(`
        SELECT * FROM users WHERE login = ?
    `),

    getUserCourses: db.prepare(`
        SELECT uc.*,
            json_extract(uc.user_data, '$.login') as user_login,
            json_extract(uc.user_data, '$.name') as user_name,
            json_extract(uc.user_data, '$.surname') as user_surname
        FROM user_courses uc 
        WHERE uc.auth_key = ?
    `),

    insertUser: db.prepare(`
        INSERT INTO users (login, password, name, surname, group_type, auth_key, coursesOwned)
        VALUES (@login, @password, @name, @surname, @group, @auth_key, @coursesOwned)
    `),

    updateUser: db.prepare(`
        UPDATE users 
        SET login = @login, name = @name, surname = @surname 
        WHERE auth_key = @auth_key
    `),

    insertCourse: db.prepare(`
        INSERT INTO user_courses (auth_key, user_data, course_id, hidden, join_date, expire_date, restricted, allowed_tests, completed_tests)
        VALUES (@auth_key, @user_data, @course_id, @hidden, @join_date, @expire_date, @restricted, @allowed_tests, @completed_tests)
    `),

    updateCourseAccess: db.prepare(`
        UPDATE user_courses 
        SET restricted = ? 
        WHERE auth_key = ? AND course_id = ?
    `),

    updateAllowedTests: db.prepare(`
        UPDATE user_courses 
        SET allowed_tests = ? 
        WHERE auth_key = ? AND course_id = ?
    `),

    addCompletedTest: db.prepare(`
        UPDATE user_courses 
        SET completed_tests = ? 
        WHERE auth_key = ? AND course_id = ?
    `),

    getUsersWithCourse: db.prepare(`
        SELECT DISTINCT u.*, 
            json_extract(uc.user_data, '$.login') as user_login,
            json_extract(uc.user_data, '$.name') as user_name,
            json_extract(uc.user_data, '$.surname') as user_surname
        FROM users u
        JOIN user_courses uc ON u.auth_key = uc.auth_key
        WHERE uc.course_id = ? 
        AND uc.hidden = 0
    `),

    getCourseByUserAndId: db.prepare(`
        SELECT uc.*
        FROM user_courses uc
        WHERE uc.auth_key = ? AND uc.course_id = ?
    `),

    updateCourseRestriction: db.prepare(`
        UPDATE user_courses
        SET restricted = ?
        WHERE auth_key = (SELECT auth_key FROM users WHERE login = ?)
        AND course_id = ?
    `),

    findCourse: db.prepare(`
        SELECT uc.* FROM user_courses uc
        JOIN users u ON uc.auth_key = u.auth_key
        WHERE u.auth_key = ? AND uc.course_id = ?
    `),

    getPromocode: db.prepare(`
        SELECT * FROM promocodes 
        WHERE code = ? 
        AND used_date = -1 
        AND (expire_date > ? OR expire_date = -1)
    `),

    insertPromocode: db.prepare(`
        INSERT INTO promocodes (course_id, code, expire_date, access_duration, start_temas)
        VALUES (@course_id, @code, @expire_date, @access_duration, @start_temas)
    `),

    updatePromocode: db.prepare(`
        UPDATE promocodes 
        SET used_date = ?, used_by = ? 
        WHERE code = ?
    `),

    getPromocodesByCourse: db.prepare(`
        SELECT p.*, 
            json_extract(uc.user_data, '$.login') as login,
            json_extract(uc.user_data, '$.name') as name,
            json_extract(uc.user_data, '$.surname') as surname
        FROM promocodes p 
        LEFT JOIN user_courses uc ON p.used_by = uc.auth_key 
        WHERE p.course_id = ?
        GROUP BY p.id
    `),

    deletePromocode: db.prepare(`
        DELETE FROM promocodes WHERE code = ?
    `),

    updateUserAndCourses: db.transaction((auth_key, login, name, surname, oldLogin) => {
        // Update user table
        dbHelpers.updateUser.run({ 
            auth_key, 
            login, 
            name, 
            surname 
        });

        // Update user_data in user_courses table
        db.prepare(`
            UPDATE user_courses 
            SET user_data = ?
            WHERE auth_key = ?
        `).run(
            JSON.stringify({ 
                login, 
                name: name || '', 
                surname: surname || '' 
            }), 
            auth_key
        );
    }),

    updateAllowedTestsByUsername: db.prepare(`
        UPDATE user_courses 
        SET allowed_tests = ?
        WHERE json_extract(user_data, '$.login') = ? 
        AND course_id = ?
    `),

    updateCourseRestrictionByUsername: db.prepare(`
        UPDATE user_courses
        SET restricted = ?
        WHERE json_extract(user_data, '$.login') = ?
        AND course_id = ?
    `),
};

module.exports = {
    db,
    dbHelpers
}; 