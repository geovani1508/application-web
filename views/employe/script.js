document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('employees-list');

  if (!list) return;

  fetch('/api/employes')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Erreur de récupération des employés');
      }
      return response.json();
    })
    .then((employees) => {
      if (!Array.isArray(employees) || employees.length === 0) {
        list.innerHTML = '<p>Aucun employé trouvé.</p>';
        return;
      }

      list.innerHTML = employees
        .map((employee) => {
          const fullName = `${employee.NOM || ''} ${employee.PRENOM || ''}`.trim();
          const role = employee.POSTE || employee.DEPARTEMENT || 'Poste non défini';
          const email = employee.E_MAIL || 'Aucun email';
          const telephone = employee.TELEPHONE ? `Tél: ${employee.TELEPHONE}` : '';

          return `
            <div class="card">
              <a href="/employe/détails.html?id=${employee.ID_EMPLOYE}" class="card-link"></a>
              <div class="left">
                <p><strong>${escapeHtml(fullName)}</strong></p>
                <p>${escapeHtml(role)}</p>
                <p class="email">${escapeHtml(email)}</p>
                <p>${escapeHtml(telephone)}</p>
              </div>
              <div class="right">                   
                <button type="button" class="btn-archive" onclick="archiveEmployee(${employee.ID_EMPLOYE})">
                  <img src="/image/1343124.png" alt="Archiver">
                </button>
                <a href="/employe/modifie_employe.html?id=${employee.ID_EMPLOYE}" class="btn-modifier">
                  <img src="/image/10174003.png" alt="Modifier">
                </a>
                <span class="details" onclick="showDetails(${employee.ID_EMPLOYE})" style="cursor:pointer;">Details</span>
              </div>
            </div>
          `;
        })
        .join('');

      // Recherche  par nom
      const searchInput = document.querySelector('.search input');
      if (searchInput) {
        searchInput.addEventListener('keyup', function() {
          const term = this.value.toLowerCase();
          const cards = document.querySelectorAll('.card');
          cards.forEach(card => {
            const nameElement = card.querySelector('.left p strong');
            const name = nameElement ? nameElement.textContent.toLowerCase() : '';
            card.style.display = name.includes(term) ? '' : 'none';
          });
        });
      }
    })
    .catch((error) => {
      console.error(error);
      list.innerHTML = '<p>Impossible de charger la liste des employés.</p>';
    });
});

// Fonctions utilitaires
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function archiveEmployee(id) {
  if (!confirm("Voulez-vous vraiment archiver cet employé ?")) return;

  fetch(`/api/employes/${id}`, { method: "DELETE" })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = body.message || body.error || body.sqlMessage || "Impossible d'archiver";
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
      return body;
    })
    .then(() => {
      window.location.href = '/archive/archive.html?archived=1';
    })
    .catch(error => {
      console.error(error);
      alert(error.message ? `Erreur archivage : ${error.message}` : 'Erreur archivage.');
    });
}

// Détails employé (page détails.html)
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
if (id) {
  fetch(`/api/employes/${id}`)
    .then(res => res.json())
    .then(data => {
      const nomEl = document.getElementById("nom-complet");
      if (nomEl) nomEl.textContent = `${data.NOM || ''} ${data.PRENOM || ''}`.trim() || 'Non défini';

      document.getElementById("poste-detail") && (document.getElementById("poste-detail").textContent = data.POSTE || 'Non défini');
      document.getElementById("adresse-detail") && (document.getElementById("adresse-detail").textContent = data.ADRESSE || 'Non défini');
      document.getElementById("telephone-detail") && (document.getElementById("telephone-detail").textContent = data.TELEPHONE || 'Non défini');
      document.getElementById("departement-detail") && (document.getElementById("departement-detail").textContent = data.CHOISIR_UN_DEPARTEMENT || 'Non défini');
      document.getElementById("email-detail") && (document.getElementById("email-detail").textContent = data.E_MAIL || 'Non défini');
      const dateEl = document.getElementById("date-embauche-detail");
      if (dateEl) dateEl.textContent = data.DATE_D_EMBAUCHE ? new Date(data.DATE_D_EMBAUCHE).toLocaleDateString('fr-FR') : 'Non défini';

      const photoEl = document.querySelector('.photo-employe');
      if (photoEl && !photoEl.querySelector('input')) {
        photoEl.innerHTML = '<div style="background:#eee;padding:20px;border-radius:50%;color:#666;">📷 Photo</div>';
      }
    })
    .catch(err => console.error('Erreur:', err));
}

