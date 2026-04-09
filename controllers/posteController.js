const db = require("../config/index");

// ================== CREATE ==================

exports.createPoste = (req, res) => {
  const { ID_EMPLOYE, NOM_POSTE, CODE } = req.body;
  
  if (!NOM_POSTE?.trim() || !CODE?.trim()) {
    return res.status(400).json({ error: "NOM_POSTE et CODE obligatoires" });
  }
  
  // Parse ID_EMPLOYE safely
  let idEmp = ID_EMPLOYE ? parseInt(ID_EMPLOYE, 10) : null;
  if (ID_EMPLOYE && isNaN(idEmp)) {
    return res.status(400).json({ error: "ID_EMPLOYE doit être numérique ou vide" });
  }
  
  const sql = `INSERT INTO poste (ID_EMPLOYE, NOM_POSTE, CODE) VALUES (?, ?, ?)`;
  
  db.query(sql, [idEmp, NOM_POSTE.trim(), CODE.trim()], (err, result) => {
    if (err) {
      console.error("🚨 SQL POSTE ERROR:", {
        code: err.code,
        message: err.message,
        sqlState: err.sqlState,
        idEmp,
        data: {ID_EMPLOYE, NOM_POSTE, CODE}
      });
      
      // Error mapping précis
      const errorMap = {
        'ER_NO_SUCH_TABLE': "Table 'poste' manquante - Exécutez crebas-fixed.sql",
        'ER_NO_REFERENCED_ROW': `Employé ID ${idEmp} inexistant`,
        'ER_DUP_ENTRY': `CODE '${CODE}' déjà utilisé`,
        'ER_TRUNCATED_WRONG_VALUE': "Format invalide - ID numérique uniquement",
        'ECONNREFUSED': "MySQL non démarré",
        'PROTOCOL_CONNECTION_LOST': "Connexion MySQL perdue - redémarrez MySQL",
        'ER_ACCESS_DENIED_ERROR': "Mauvais credentials MySQL dans config/index.js"
      };
      
      const mappedError = errorMap[err.code] || `Erreur SQL (${err.code}): ${err.message}`;
      return res.status(400).json({ error: mappedError });
    }
    
    res.json({ message: "Poste créé avec succès !", id: result.insertId });
  });

};


// exports.createPoste = (req, res) => {
//   const { ID_EMPLOYE, NOM_POSTE, CODE } = req.body;
//   const params = [ID_EMPLOYE || null, NOM_POSTE, CODE];
//   const sql = `
//     INSERT INTO poste (ID_EMPLOYE, NOM_POSTE, CODE)
//     VALUES (?, ?, ?)
//   `;
//   db.query(sql, params, (err, result) => {
//     if (err) {
//       console.error("ERREUR SQL POSTE:", err.code, err.message);
//       let errorMsg = "Erreur lors de la création du poste";
//       if (err.code === 'ER_NO_REFERENCED_ROW') {
//         errorMsg += ": Employé ID non trouvé. Créez d'abord un employé.";
//       }
//       return res.status(500).json({ error: errorMsg });
//     }
//     res.json({ message: "Poste créé avec succès", id: result.insertId });
//   });
// };

// ================== READ ALL ==================
exports.getAllPostes = (req, res) => {
  const sql = `SELECT * FROM poste`;
  db.query(sql, (err, results) => {
if (err) return res.status(500).json({ error: "Erreur lors de la récupération" });
    res.json(results);
  });
};

// ================== READ ONE ==================
exports.getPosteById = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM poste WHERE ID_POSTE = ?`;
  db.query(sql, [id], (err, results) => {
if (err) return res.status(500).json({ error: "Impossible de récupérer le poste" });
    if (results.length === 0) return res.status(404).json({ message: "Poste non trouvé" });
    res.json(results[0]);
  });
};

// ================== UPDATE ==================
exports.updatePoste = (req, res) => {
  const { id } = req.params;
  const { ID_EMPLOYE, NOM_POSTE } = req.body;

  const sql = `
    UPDATE poste
    SET ID_EMPLOYE = ?, NOM_POSTE = ?
    WHERE ID_POSTE = ?
  `;

  db.query(sql, [ID_EMPLOYE, NOM_POSTE, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({
      message: "Poste mis à jour avec succès"
    });
  });
};

// ================== DELETE ==================
exports.deletePoste = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM poste WHERE ID_POSTE = ?`;
  db.query(sql, [id], (err, result) => {
if (err) return res.status(500).json({ error: "Impossible de supprimer" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Poste non trouvé" });
    res.json({ message: "Poste supprimé avec succès" });
  });
};