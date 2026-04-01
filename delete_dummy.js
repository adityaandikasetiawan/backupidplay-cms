const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

// Get all articles
const articles = db.prepare('SELECT id, title FROM articles').all();
console.log('Current articles:');
articles.forEach(a => console.log(a.id, a.title));

// Delete articles with id < 17
const result = db.prepare('DELETE FROM articles WHERE id < 17').run();
console.log('\\nDeleted', result.changes, 'dummy articles');

// Verify
const remaining = db.prepare('SELECT id, title FROM articles').all();
console.log('\\nRemaining articles:');
remaining.forEach(a => console.log(a.id, a.title));

db.close();
