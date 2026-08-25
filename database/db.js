const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'app.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

const addColumn = (table, column, definition) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error(`Error adding ${table}.${column}:`, err.message);
        }
    });
};

const createIndex = (name, table, columns, unique = false) => {
    db.run(
        `CREATE ${unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${name} ON ${table} (${columns})`,
        (err) => {
            if (err) {
                console.error(`Error creating index ${name}:`, err.message);
            }
        }
    );
};

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clerk_user_id TEXT UNIQUE,
        name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        email_verified INTEGER DEFAULT 0,
        image_url TEXT,
        phone TEXT,
        location TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER,
        service_name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        availability TEXT,
        FOREIGN KEY (provider_id) REFERENCES users (id)
    )`);

    // db.run(`DROP TABLE IF EXISTS serviceProvider`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        clerk_user_id TEXT,
        user_name TEXT CHECK(user_name GLOB '[A-Za-z ]*'),
        contact_number TEXT,
        email TEXT,
        service_address TEXT,
        date TEXT,
        time TEXT,
        work_details TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS serviceProviders(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        clerk_user_id TEXT,
        name TEXT CHECK(name GLOB '[A-Z a-z]*'),
        serviceCatagory TEXT,
        experience INTEGER,
        serviceArea TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        service_id INTEGER,
        rating INTEGER,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (service_id) REFERENCES services(id)
    )`);

    addColumn('users', 'clerk_user_id', 'TEXT');
    addColumn('users', 'password_hash', 'TEXT');
    addColumn('users', 'email_verified', 'INTEGER DEFAULT 0');
    addColumn('users', 'image_url', 'TEXT');
    addColumn('users', 'phone', 'TEXT');
    addColumn('users', 'location', 'TEXT');
    addColumn('users', 'role', "TEXT DEFAULT 'user'");
    addColumn('users', 'created_at', 'DATETIME');
    addColumn('users', 'updated_at', 'DATETIME');

    addColumn('bookings', 'user_id', 'INTEGER');
    addColumn('bookings', 'clerk_user_id', 'TEXT');

    addColumn('serviceProviders', 'user_id', 'INTEGER');
    addColumn('serviceProviders', 'clerk_user_id', 'TEXT');
    addColumn('serviceProviders', 'serviceArea', 'TEXT');
    addColumn('serviceProviders', 'created_at', 'DATETIME');

    createIndex('idx_users_clerk_user_id', 'users', 'clerk_user_id', true);
    createIndex('idx_bookings_clerk_user_id', 'bookings', 'clerk_user_id');
    createIndex('idx_service_providers_clerk_user_id', 'serviceProviders', 'clerk_user_id');
});

module.exports = db;
