const db = require("../config/index"); // ou ../config/db
const bcrypt = require("bcryptjs");

// ================== CREER UTILISATEUR ==================
exports.register = (req, res) => {

  const { NOM, PRENOM, E_MAIL, MOTS_DE_PASSE, ROLE } = req.body;

  if (!NOM || !PRENOM || !E_MAIL || !MOTS_DE_PASSE) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  const hashedPassword = bcrypt.hashSync(MOTS_DE_PASSE, 8);

  const sql = `INSERT INTO UTILISATEUR (NOM, PRENOM, E_MAIL, MOTS_DE_PASSE, ROLE)
               VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [NOM, PRENOM, E_MAIL, hashedPassword, ROLE || "user"], (err, result) => {
      if (err) {
          if (err.code === "ER_DUP_ENTRY") {
              return res.status(400).json({ message: "Email déjà utilisé" });
          }
          return res.status(500).json({ message: err.message });
      }
      res.status(201).json({ message: "Utilisateur créé avec succès", ID_EMPLOYE: result.insertId });
  });
};


/*connexion */
exports.login = (req, res) => {

  const { E_MAIL, MOTS_DE_PASSE } = req.body;

  const sql = "SELECT * FROM UTILISATEUR WHERE E_MAIL = ?";

  db.query(sql, [E_MAIL], (err, result) => {

    if (err) {
      console.log(err);
      res.send("Erreur serveur");
    }

    if (result.length === 0) {
      res.json({ message: "Utilisateur introuvable" });
    } 
    else {

      const utilisateur = result[0];

      const isMatch = bcrypt.compareSync(MOTS_DE_PASSE, utilisateur.MOTS_DE_PASSE);

      if (!isMatch) {
        res.json({ message: "Mot de passe incorrect" });
      } else {
        res.json({
          message: "Connexion réussie",
          user: {
            ID_EMPLOYE: utilisateur.ID_EMPLOYE,
            NOM: utilisateur.NOM,
            PRENOM: utilisateur.PRENOM,
            E_MAIL: utilisateur.E_MAIL,
            ROLE: utilisateur.ROLE
          }
        });
      }

    }

  });

};