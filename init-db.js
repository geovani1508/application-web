const db = require("./config/index");
const fs = require("fs");
const path = require("path");

const sqlFile = path.join(__dirname, "public", "crebas.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

// Split SQL into individual statements
const statements = sql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);

let index = 0;

function executeNext() {
  if (index >= statements.length) {
    console.log("Toutes les tables créées avec succès");
    db.end();
    return;
  }

  const statement = statements[index] + ';';
  console.log(`Exécution : ${statement.substring(0, 50)}...`);

  db.query(statement, (err, result) => {
    if (err) {
      console.error(`Erreur à l'instruction ${index + 1} :`, err.message);
      db.end();
      return;
    }
    index++;
    executeNext();
  });
}

executeNext();