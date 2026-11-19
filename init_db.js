const sqlite3 = require('sqlite3').verbose();

// Crea o abre el archivo de base de datos local SQLite
const db = new sqlite3.Database('./invitados.db', (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
    return;
  }
  console.log('Conectado a la base de datos SQLite (invitados.db).');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS invitados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      contacto TEXT NOT NULL,
      confirmado INTEGER NOT NULL DEFAULT 1,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla invitados:', err.message);
      return;
    }
    console.log('Tabla "invitados" lista.');
  });
});

db.close((err) => {
  if (err) {
    console.error('Error al cerrar la base de datos:', err.message);
    return;
  }
  console.log('Conexión cerrada.');
});