const modal = document.getElementById('modal-invitado');
const contenidoModal = document.getElementById('contenido-modal');

async function verInvitado(id) {
  if (!modal || !contenidoModal) return;

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
      <p><strong>Nombre:</strong> ${inv.nombre}</p>
      <p><strong>Contacto:</strong> ${inv.contacto}</p>
      <p><strong>Asistencia:</strong> ${inv.confirmado === 1 ? 'Sí asistirá' : 'No asistirá'}</p>
      <p><strong>Fecha de registro:</strong> ${inv.fecha_registro}</p>
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