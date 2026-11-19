const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

async function inicializarBD() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invitados (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      contacto TEXT NOT NULL,
      confirmado INTEGER NOT NULL DEFAULT 1,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Servidor conectado a PostgreSQL y tabla invitados verificada');
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// READ (todos): Página principal
app.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, contacto, confirmado,
             TO_CHAR(fecha_registro AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City', 'DD/MM/YYYY HH24:MI') AS fecha_registro
      FROM invitados
      ORDER BY id DESC
    `);
    res.render('index', { invitados: result.rows });
  } catch (err) {
    console.error('Error al consultar invitados:', err);
    res.status(500).send('Error al consultar invitados');
  }
});

// READ (todos con tabla de consulta, filtros y conteo)
app.get('/consultar', async (req, res) => {
  const filtro = req.query.filtro || 'todos'; // 'todos', 'si', 'no'
  let sql = `
    SELECT id, nombre, contacto, confirmado,
           TO_CHAR(fecha_registro AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City', 'DD/MM/YYYY HH24:MI') AS fecha_registro
    FROM invitados
  `;

  if (filtro === 'si') {
    sql += ' WHERE confirmado = 1';
  } else if (filtro === 'no') {
    sql += ' WHERE confirmado = 0';
  }
  sql += ' ORDER BY id DESC';

  try {
    const [listaRes, countRes] = await Promise.all([
      pool.query(sql),
      pool.query('SELECT COUNT(*)::int AS "totalConfirmados" FROM invitados WHERE confirmado = 1')
    ]);

    res.render('consultar', {
      invitados: listaRes.rows,
      filtro,
      totalConfirmados: countRes.rows[0].totalConfirmados
    });
  } catch (err) {
    console.error('Error al consultar invitados:', err);
    res.status(500).send('Error al consultar invitados');
  }
});

// CREATE: Registrar un nuevo invitado
app.post('/invitados', async (req, res) => {
  const { nombre, contacto, confirmado } = req.body;
  const estadoConfirmado = confirmado === '0' ? 0 : 1;

  if (!nombre || !contacto) {
    return res.status(400).send('Nombre y contacto son obligatorios');
  }

  const sql = 'INSERT INTO invitados (nombre, contacto, confirmado) VALUES ($1, $2, $3)';
  try {
    await pool.query(sql, [nombre.trim(), contacto.trim(), estadoConfirmado]);
    res.redirect('/');
  } catch (err) {
    console.error('Error al guardar el invitado:', err);
    res.status(500).send('Error al guardar el invitado');
  }
});

// READ (uno): Consultar un invitado por ID (para el modal)
app.get('/invitados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT id, nombre, contacto, confirmado,
             TO_CHAR(fecha_registro AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City', 'DD/MM/YYYY HH24:MI') AS fecha_registro
      FROM invitados
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitado no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al consultar el invitado:', err);
    res.status(500).json({ error: 'Error al consultar el invitado' });
  }
});

// DELETE: Eliminar un invitado y regresar a la vista de origen
async function eliminarInvitado(req, res) {
  const { id } = req.params;
  const origen = req.body.origen || '/';

  try {
    const result = await pool.query('DELETE FROM invitados WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send('Invitado no encontrado');
    }
    if (req.method === 'DELETE') {
      return res.json({ mensaje: 'Invitado eliminado', id: Number(id) });
    }
    res.redirect(origen);
  } catch (err) {
    console.error('Error al eliminar el invitado:', err);
    res.status(500).send('Error al eliminar el invitado');
  }
}

app.post('/invitados/:id/eliminar', eliminarInvitado);
app.delete('/invitados/:id', eliminarInvitado);

inicializarBD()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al iniciar la base de datos:', err);
    process.exit(1);
  });