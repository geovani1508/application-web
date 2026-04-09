const db = require("../config/index");

// ================== CREER DEPARTEMENT ==================
exports.createDepartement = (req, res) => {
  const { ID_EMPLOYE, NOM_DEPARTEMENT, CODE } = req.body;
  const params = [ID_EMPLOYE || null, NOM_DEPARTEMENT, CODE];
  const sql = `
    INSERT INTO DEPARTEMENT (ID_EMPLOYE, NOM_DEPARTEMENT, CODE)
    VALUES (?, ?, ?)
  `;
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("ERREUR SQL DEPARTEMENT:", err.code, err.message);
      let errorMsg = "Erreur lors de la création du département";
      if (err.code === 'ER_NO_REFERENCED_ROW') {
        errorMsg += ": Employé ID non trouvé. Créez d'abord un employé.";
      }
      return res.status(500).json({ error: errorMsg });
    }
    res.json({
      message: "Département créé avec succès",
      id: result.insertId
    });
  });
};

//  LISTER TOUS LES DEPARTEMENTS
exports.getDepartements = (req, res) => {
  const sql = `SELECT * FROM DEPARTEMENT`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Erreur lors de la récupération" });
    res.json(results);
  });
};

// METTRE A JOUR UN DEPARTEMENT 
exports.updateDepartement = (req, res) => {
  const { id } = req.params;
  const { ID_EMPLOYE, NOM_DEPARTEMENT, CODE } = req.body;

  const sql = `
    UPDATE DEPARTEMENT
    SET ID_EMPLOYE = ?, NOM_DEPARTEMENT = ?, CODE = ?
    WHERE ID_DEPARTEMENT = ?
  `;

  db.query(sql, [ID_EMPLOYE, NOM_DEPARTEMENT, CODE, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({
      message: "Département mis à jour avec succès"
    });
  });
};

// ================== SUPPRIMER UN DEPARTEMENT ==================
exports.deleteDepartement = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM DEPARTEMENT WHERE ID_DEPARTEMENT = ?`;

db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("ERREUR SQL :", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Département supprimé avec succès" });
  });
};