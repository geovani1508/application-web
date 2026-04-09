const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "gestion_employé"
});

db.connect((err) => {
  if (err) {
    console.log("Erreur de connexion :", err);
  } else {
    console.log("Connexion à MySQL réussie");
  }
});

// Export db pour les controllers
module.exports = db;

