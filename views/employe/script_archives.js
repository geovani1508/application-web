document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('archives-list');
  if (!list) return;

  fetch('/api/employes/archives')
    .then(response => {
      if (!response.ok) throw new Error('Erreur chargement archives');
      return response.json();
    })
    .then(archives => {
      if (!Array.isArray(archives) || archives.length === 0) {
        list.innerHTML = '<p>Aucune archive trouvée.</p>';
        return;
      }

      list.innerHTML = archives.map(arch => {
        const fullName = `${arch.NOM || ''} ${arch.PRENOM || ''}`.trim();
        const role = arch.POSTE || 'Poste non défini';
        const email = arch.E_MAIL || 'Aucun email';
        const dateArchive = arch.DATE_D_ARCHIVE ? new Date(arch.DATE_D_ARCHIVE).toLocaleDateString('fr-FR') : '';

        return `
          <div class="card">
            <div class="left">
              <p><strong>${escapeHtml(fullName)}</strong></p>
              <p>${escapeHtml(role)}</p>
              <p class="email">${escapeHtml(email)}</p>
              <p>Date archive: ${escapeHtml(dateArchive)}</p>
            </div>
            <div class="right">                   
              <button class="btn-restore" onclick="restoreEmployee(${arch.ID_EMPLOYE})">
                <img src="/image/restore-icon.png" alt="Restaurer" style="filter: invert(0.5);"> Restaurer
              </button>
            </div>
          </div>
        `;
      }).join('');
    })
    .catch(error => {
      console.error(error);
      list.innerHTML = '<p>Erreur chargement archives.</p>';
    });
});

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function restoreEmployee(id) {
  if (!confirm("Restaurer cet employé dans la liste active ?")) return;

  fetch(`/api/employes/restore/${id}`, { method: 'PUT' })
    .then(response => {
      if (!response.ok) throw new Error('Erreur restauration');
      return response.json();
    })
    .then(() => {
      const card = document.querySelector(`.btn-restore[onclick="restoreEmployee(${id})"]`).closest('.card');
      if (card) card.remove();
      else location.reload();
    })
    .catch(error => {
      console.error(error);
      alert('Erreur restauration');
    });
}

