const db = require("../config/index.js");
const bcrypt = require("bcryptjs");

// ================= REGISTER =================
exports.register = (req, res) => {
    const { NOM, PRENOM, E_MAIL, MOTS_DE_PASSE, ROLE } = req.body;

    // Vérification champs
    if (!NOM || !PRENOM || !E_MAIL || !MOTS_DE_PASSE) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    try {
        const hashedPassword = bcrypt.hashSync(MOTS_DE_PASSE, 8);

        const sql = `
            INSERT INTO utilisateur (NOM, PRENOM, E_MAIL, MOTS_DE_PASSE, ROLE)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                NOM,
                PRENOM,
                E_MAIL,
                hashedPassword,
                ROLE && ROLE.trim() !== "" ? ROLE : "user"
            ],
            (err, result) => {
                if (err) {
                    console.log("ERREUR SQL REGISTER:", err);

                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({ message: "Email déjà utilisé" });
                    }

                    return res.status(500).json({ message: err.message });
                }

                return res.status(201).json({
                    message: "Utilisateur créé avec succès",
                    ID_EMPLOYE: result.insertId
                });
            }
        );

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ================= CREATE USER =================
exports.createUser = (req, res) => {
    const { NOM, PRENOM, E_MAIL, MOTS_DE_PASSE, ROLE } = req.body;

    if (!NOM || !PRENOM || !E_MAIL || !MOTS_DE_PASSE) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const hashedPassword = bcrypt.hashSync(MOTS_DE_PASSE, 8);

    const sql = `
        INSERT INTO utilisateur (NOM, PRENOM, E_MAIL, MOTS_DE_PASSE, ROLE)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            NOM,
            PRENOM,
            E_MAIL,
            hashedPassword,
            ROLE && ROLE.trim() !== "" ? ROLE : "user"
        ],
        (err, result) => {
            if (err) {
                console.log("ERREUR SQL CREATE:", err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({ message: "Email déjà utilisé" });
                }

                return res.status(500).json({ message: err.message });
            }

            return res.status(201).json({
                message: NOM + " " + PRENOM,
                ID_EMPLOYE: result.insertId
            });
        }
    );
};

// ================= GET USERS =================
exports.getUsers = (req, res) => {
    db.query(
        "SELECT ID_EMPLOYE, NOM, PRENOM, E_MAIL, ROLE, telephone FROM utilisateur",
        (err, results) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json(results);
        }
    );
};

// ================= UPDATE =================
exports.updateUser = (req, res) => {
    const { id } = req.params;
    const { NOM, PRENOM, E_MAIL, MOTS_DE_PASSE, ROLE } = req.body;

    if (!NOM || !PRENOM || !E_MAIL) {
        return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    db.query(
        "SELECT ID_EMPLOYE FROM utilisateur WHERE ID_EMPLOYE=?",
        [id],
        (err, results) => {
            if (err) return res.status(500).json({ message: err.message });

            if (results.length === 0) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            let sql = "UPDATE utilisateur SET NOM=?, PRENOM=?, E_MAIL=?, ROLE=?";
            let values = [NOM, PRENOM, E_MAIL, ROLE];

            if (MOTS_DE_PASSE) {
                const hashedPassword = bcrypt.hashSync(MOTS_DE_PASSE, 8);
                sql += ", MOTS_DE_PASSE=?";
                values.push(hashedPassword);
            }

            sql += " WHERE ID_EMPLOYE=?";
            values.push(id);

            db.query(sql, values, (err) => {
                if (err) return res.status(500).json({ message: err.message });

                res.json({ message: "Utilisateur mis à jour" });
            });
        }
    );
};

// ================= DELETE =================
exports.deleteUser = (req, res) => {
    const { id } = req.params;

    db.query(
        "SELECT ID_EMPLOYE FROM utilisateur WHERE ID_EMPLOYE=?",
        [id],
        (err, results) => {
            if (err) return res.status(500).json({ message: err.message });

            if (results.length === 0) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            db.query(
                "DELETE FROM utilisateur WHERE ID_EMPLOYE=?",
                [id],
                (err) => {
                    if (err) return res.status(500).json({ message: err.message });

                    res.json({ message: "Utilisateur supprimé" });
                }
            );
        }
    );
};

// = LOGIN =
exports.login = (req, res) => {
    const { E_MAIL, MOTS_DE_PASSE } = req.body;

    if (!E_MAIL || !MOTS_DE_PASSE) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const sql = "SELECT * FROM utilisateur WHERE E_MAIL = ?";

    db.query(sql, [E_MAIL], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });

        if (results.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        const user = results[0];

        const isMatch = bcrypt.compareSync(MOTS_DE_PASSE, user.MOTS_DE_PASSE);

        if (!isMatch) {
            return res.status(401).json({ message: "Mot de passe incorrect" });
        }

        res.json({
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
};

// ================= GET BY ID =================
exports.getUserById = (req, res) => {
    const { id } = req.params;

    const sql =
        "SELECT ID_EMPLOYE, NOM, PRENOM, E_MAIL, ROLE FROM utilisateur WHERE ID_EMPLOYE=?";

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });

        if (results.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json(results[0]);
    });
};