const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database(path.join(__dirname, 'invitados.db'), (err) => {
  if (err) {
    console.error('Error al abrir invitados.db:', err.message);
  } else {
    console.log('Servidor conectado a invitados.db');
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// READ (todos): Página principal
app.get('/', (req, res) => {
  db.all('SELECT * FROM invitados ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Error al consultar invitados');
    }
    res.render('index', { invitados: rows });
  });
});

// READ (todos con tabla de consulta, filtros y conteo)
app.get('/consultar', (req, res) => {
  const filtro = req.query.filtro || 'todos'; // 'todos', 'si', 'no'
  let sql = 'SELECT * FROM invitados';
  const params = [];

  if (filtro === 'si') {
    sql += ' WHERE confirmado = 1';
  } else if (filtro === 'no') {
    sql += ' WHERE confirmado = 0';
  }
  sql += ' ORDER BY id DESC';

  // Consultamos tanto los registros filtrados como el total real de confirmados en la BD
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).send('Error al consultar invitados');
    }
    db.get('SELECT COUNT(*) AS totalConfirmados FROM invitados WHERE confirmado = 1', [], (err2, countRow) => {
      if (err2) {
        return res.status(500).send('Error al contar confirmados');
      }
      res.render('consultar', {
        invitados: rows,
        filtro,
        totalConfirmados: countRow.totalConfirmados
      });
    });
  });
});

// CREATE: Registrar un nuevo invitado
app.post('/invitados', (req, res) => {
  const { nombre, contacto, confirmado } = req.body;
  const estadoConfirmado = confirmado === '0' ? 0 : 1;

  if (!nombre || !contacto) {
    return res.status(400).send('Nombre y contacto son obligatorios');
  }

  const sql = 'INSERT INTO invitados (nombre, contacto, confirmado) VALUES (?, ?, ?)';
  db.run(sql, [nombre.trim(), contacto.trim(), estadoConfirmado], function (err) {
    if (err) {
      return res.status(500).send('Error al guardar el invitado');
    }
    res.redirect('/');
  });
});

// READ (uno): Consultar un invitado por ID (para el modal)
app.get('/invitados/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM invitados WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al consultar el invitado' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Invitado no encontrado' });
    }
    res.json(row);
  });
});

// DELETE: Eliminar un invitado y regresar a la vista de origen
function eliminarInvitado(req, res) {
  const { id } = req.params;
  const origen = req.body.origen || '/';

  db.run('DELETE FROM invitados WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).send('Error al eliminar el invitado');
    }
    if (this.changes === 0) {
      return res.status(404).send('Invitado no encontrado');
    }
    if (req.method === 'DELETE') {
      return res.json({ mensaje: 'Invitado eliminado', id: Number(id) });
    }
    res.redirect(origen);
  });
}

app.post('/invitados/:id/eliminar', eliminarInvitado);
app.delete('/invitados/:id', eliminarInvitado);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});