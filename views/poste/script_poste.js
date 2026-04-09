// Script pour gestion dynamique des postes
document.addEventListener('DOMContentLoaded', function() {
  loadPostes();
});

async function loadPostes() {
  try {
    const response = await fetch('/api/poste');

    const postes = await response.json();
    const container = document.querySelector('#postesTable');
    if (container) {
      container.innerHTML = '';
      postes.forEach(poste => {
        const item = document.createElement('div');
        item.style = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ccc; border-radius: 5px;';
        item.innerHTML = `
          <span>${poste.NOM_POSTE} (Code: ${poste.CODE})</span>
          <div>
            <button onclick="editPoste(${poste.ID_POSTE})" style="margin-right:5px;">Modifier</button>
            <button onclick="deletePoste(${poste.ID_POSTE})">Supprimer</button>
          </div>
        `;
        container.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Erreur chargement postes:', error);
  }
}

async function deletePoste(id) {
  if (confirm('Confirmer suppression ?')) {
    try {
      const response = await fetch(`/api/poste/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Poste supprimé !');
        loadPostes();
      } else {
        alert('Erreur suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }
}

function editPoste(id) {
  // TODO: Ouvrir form edit (simple alert for now)
  alert(`Modifier poste ID: ${id} (à implémenter form)`);
}
