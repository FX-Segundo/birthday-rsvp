const modal = document.getElementById('modal-invitado');
const contenidoModal = document.getElementById('contenido-modal');
const tituloModal = document.getElementById('titulo-modal');

function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function verInvitado(id) {
  if (!modal || !contenidoModal) return;

  if (tituloModal) tituloModal.textContent = 'Detalle del invitado';
  contenidoModal.innerHTML = '<p>Cargando datos...</p>';
  modal.showModal();

  try {
    const respuesta = await fetch(`/invitados/${id}`);
    if (!respuesta.ok) {
      throw new Error('No se pudo obtener la información');
    }
    const inv = await respuesta.json();

    contenidoModal.innerHTML = `
      <p><strong>Folio / ID:</strong> ${inv.id}</p>
      <p><strong>Nombre:</strong> ${escaparHTML(inv.nombre)}</p>
      <p><strong>Contacto:</strong> ${escaparHTML(inv.contacto)}</p>
      <p><strong>Asistencia:</strong> ${inv.confirmado === 1 ? 'Sí asistirá' : 'No asistirá'}</p>
      <p><strong>Fecha de registro:</strong> ${escaparHTML(inv.fecha_registro)}</p>
      <div class="modal-footer">
        <button type="button" class="btn-suave" onclick="cerrarModal()">Cerrar</button>
      </div>
    `;
  } catch (error) {
    contenidoModal.innerHTML = '<p>Error al cargar los datos del invitado.</p>';
  }
}

async function editarInvitado(id, origen = '/') {
  if (!modal || !contenidoModal) return;

  if (tituloModal) tituloModal.textContent = 'Editar invitado';
  contenidoModal.innerHTML = '<p>Cargando datos...</p>';
  modal.showModal();

  try {
    const respuesta = await fetch(`/invitados/${id}`);
    if (!respuesta.ok) {
      throw new Error('No se pudo obtener la información');
    }
    const inv = await respuesta.json();

    contenidoModal.innerHTML = `
      <form action="/invitados/${inv.id}/editar" method="POST">
        <input type="hidden" name="origen" value="${escaparHTML(origen)}" />
        <div class="campo">
          <label for="edit-nombre">Nombre</label>
          <input type="text" id="edit-nombre" name="nombre" value="${escaparHTML(inv.nombre)}" required />
        </div>
        <div class="campo">
          <label for="edit-contacto">Contacto</label>
          <input type="text" id="edit-contacto" name="contacto" value="${escaparHTML(inv.contacto)}" required />
        </div>
        <div class="campo">
          <label for="edit-confirmado">Asistencia</label>
          <select id="edit-confirmado" name="confirmado">
            <option value="1" ${inv.confirmado === 1 ? 'selected' : ''}>Sí asistirá</option>
            <option value="0" ${inv.confirmado === 0 ? 'selected' : ''}>No asistirá</option>
          </select>
        </div>
        <div class="modal-footer modal-footer--acciones">
          <button type="button" class="btn-suave" onclick="cerrarModal()">Cancelar</button>
          <button type="submit" class="btn-principal">Guardar cambios</button>
        </div>
      </form>
    `;
  } catch (error) {
    contenidoModal.innerHTML = '<p>Error al cargar los datos del invitado.</p>';
  }
}

function cerrarModal() {
  if (modal) {
    modal.close();
  }
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      cerrarModal();
    }
  });
}