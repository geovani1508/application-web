const db = require("../config/index");

// ================== CREATE ==================
exports.createArchive = (req, res) => {
  const { ID_EMPLOYE, DATE_D_ARCHIVE, RAISON } = req.body;
  const sql = `
    INSERT INTO archive (ID_EMPLOYE, DATE_D_ARCHIVE, RAISON)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [ID_EMPLOYE, DATE_D_ARCHIVE, RAISON], (err, result) => {
    if (err) return res.status(500).json({ error: "Impossible de créer l'archive", details: err });
    res.json({ message: "Archive créée avec succès", id: result.insertId });
  });
};

// ================== READ ALL ==================
exports.getAllArchives = (req, res) => {
  const sql = `SELECT * FROM archive`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Impossible de récupérer les archives", details: err });
    res.json(results);
  });
};

// ================== READ ONE ==================
exports.getArchiveById = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM archive WHERE ID_ARCHIVE = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Impossible de récupérer l'archive", details: err });
    if (results.length === 0) return res.status(404).json({ message: "Archive non trouvée" });
    res.json(results[0]);
  });
};

// ================== UPDATE ==================
exports.updateArchive = (req, res) => {
  const { id } = req.params;
  const { ID_EMPLOYE, DATE_D_ARCHIVE, RAISON } = req.body;
  const sql = `
    UPDATE archive
    SET ID_EMPLOYE = ?, DATE_D_ARCHIVE = ?, RAISON = ?
    WHERE ID_ARCHIVE = ?
  `;
  db.query(sql, [ID_EMPLOYE, DATE_D_ARCHIVE, RAISON, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Impossible de mettre à jour l'archive", details: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Archive non trouvée" });
    res.json({ message: "Archive mise à jour avec succès" });
  });
};

// ================== DELETE ==================
exports.deleteArchive = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM archive WHERE ID_ARCHIVE = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Impossible de supprimer l'archive", details: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Archive non trouvée" });
    res.json({ message: "Archive supprimée avec succès" });
  });
};