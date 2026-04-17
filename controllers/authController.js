const db = require("../config/index.js");
const bcrypt = require("bcryptjs");

exports.login = (req, res) => {
    try {
        const { E_MAIL, MOTS_DE_PASSE } = req.body || {};

        if (!E_MAIL || !MOTS_DE_PASSE) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const sql = "SELECT * FROM utilisateur WHERE E_MAIL = ?";

        db.query(sql, [E_MAIL], (err, results) => {
            if (err) {
                console.log("DB ERROR:", err);
                return res.status(500).json({ message: "Erreur serveur" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            const user = results[0];

            const isMatch = bcrypt.compareSync(MOTS_DE_PASSE, user.MOTS_DE_PASSE);

            if (!isMatch) {
                return res.status(401).json({ message: "Mot de passe incorrect" });
            }

            return res.json({
                message: "Connexion réussie",
                user: {
                    ID_EMPLOYE: user.ID_EMPLOYE,
                    NOM: user.NOM,
                    PRENOM: user.PRENOM,
                    E_MAIL: user.E_MAIL,
                    ROLE: user.ROLE
                }
            });
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};