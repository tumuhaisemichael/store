const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '72.60.120.80',
    port: 3306,
    user: 'storeuser',
    password: 'storeuserdata',
    database: 'storedata',
    connectTimeout: 10000 // 10 seconds timeout
});

console.log('Attempting to connect to database...');

connection.connect((err) => {
    if (err) {
        console.error('Connection failed! ❌');
        console.error('Error Details:', err.message);
        process.exit(1);
    }

    console.log('Connected successfully! ✅');

    connection.query('SHOW TABLES', (error, results) => {
        if (error) {
            console.error('Error fetching tables:', error);
        } else {
            console.log('Existing Tables:', results);
        }

        connection.end();
    });
});
