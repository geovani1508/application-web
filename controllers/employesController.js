const db = require('../config/index'); // connexion MySQL

function sqlErrorPayload(err) {
  return {
    message: err.sqlMessage || err.message || 'Erreur SQL',
    code: err.code,
    errno: err.errno,
  };
}

/** Département stocké sous plusieurs noms de colonne selon les schémas. */
function deptFromEmployeRow(emp) {
  return (
    emp.CHOISIR_UN_DEPARTEMENT ??
    emp.CHOISIR_UN_DEPARTEMENT ??
    emp.choisir_UN_département ??
    null
  );
}

/**
 * Une ligne ARCHIVE qui référence encore EMPLOYE empêche DELETE employe (RESTRICT).
 * On supprime dynamiquement ces FK une fois pour toutes.
 */
function dropArchiveFkBlockingDelete(done) {
  db.query(
    `SELECT DISTINCT CONSTRAINT_NAME AS cname, TABLE_NAME AS tname
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = 'archive'
       AND REFERENCED_TABLE_NAME IS NOT NULL
       AND LOWER(REFERENCED_TABLE_NAME) = 'employe'`,
    (err, rows) => {
      if (err) return done(err);
      if (!rows.length) return done(null);
      let i = 0;
      function step(dropErr) {
        if (dropErr) return done(dropErr);
        if (i >= rows.length) return done(null);
        const { cname, tname } = rows[i++];
        db.query(`ALTER TABLE \`${tname}\` DROP FOREIGN KEY \`${cname}\``, step);
      }
      step(null);
    }
  );
}

/** Idem pour FK employe → archive (peu courant mais bloquant). */
function dropEmployeFkToArchive(done) {
  db.query(
    `SELECT DISTINCT CONSTRAINT_NAME AS cname, TABLE_NAME AS tname
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = 'employe'
       AND REFERENCED_TABLE_NAME IS NOT NULL
       AND LOWER(REFERENCED_TABLE_NAME) = 'archive'`,
    (err, rows) => {
      if (err) return done(err);
      if (!rows.length) return done(null);
      let i = 0;
      function step(dropErr) {
        if (dropErr) return done(dropErr);
        if (i >= rows.length) return done(null);
        const { cname, tname } = rows[i++];
        db.query(`ALTER TABLE \`${tname}\` DROP FOREIGN KEY \`${cname}\``, step);
      }
      step(null);
    }
  );
}

/**
 * poste, DEPARTEMENT, etc. référencent employe (ex. FK_OBTIENT).
 * KEY_COLUMN_USAGE seul est parfois incomplet selon versions / droits : on utilise REFERENTIAL_CONSTRAINTS.
 */
function dropForeignKeysReferencingEmploye(done) {
  db.query(
    `SELECT DISTINCT CONSTRAINT_NAME AS cname, TABLE_NAME AS tname
     FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND LOWER(REFERENCED_TABLE_NAME) = 'employe'
       AND LOWER(TABLE_NAME) != 'archive'`,
    (err, rows) => {
      if (err) return done(err);
      const list = rows && rows.length ? rows : [];
      const fallback = [
        ['poste', 'FK_OBTIENT'],
        ['POSTE', 'FK_OBTIENT'],
        ['DEPARTEMENT', 'FK_OCCUPE'],
        ['departement', 'FK_OCCUPE'],
        ['UTILISATEUR', 'FK_GERE'],
        ['utilisateur', 'FK_GERE'],
      ];
      const seen = new Set(list.map((r) => `${r.tname}\0${r.cname}`));
      fallback.forEach(([tname, cname]) => {
        const k = `${tname}\0${cname}`;
        if (!seen.has(k)) {
          list.push({ tname, cname });
          seen.add(k);
        }
      });

      let i = 0;
      function step(dropErr) {
        if (dropErr) return done(dropErr);
        if (i >= list.length) return done(null);
        const { cname, tname } = list[i++];
        db.query(`ALTER TABLE \`${tname}\` DROP FOREIGN KEY \`${cname}\``, (e) => {
          if (
            e &&
            e.errno !== 1091 &&
            e.code !== 'ER_CANT_DROP_FIELD_OR_KEY' &&
            e.code !== 'ER_NO_SUCH_TABLE'
          ) {
            return done(e);
          }
          step(null);
        });
      }
      step(null);
    }
  );
}

/**
 * Supprime les lignes des tables enfant qui pointent vers l'employé (poste, departement).
 * Utilise le nom réel de table (casse) depuis information_schema.
 */
function deleteLinkedRowsForEmploye(id, done) {
  const lowerTables = ['poste', 'departement'];
  let i = 0;
  function nextTable(err) {
    if (err) return done(err);
    if (i >= lowerTables.length) return done(null);
    const lt = lowerTables[i++];
    db.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = ? LIMIT 1`,
      [lt],
      (e, rows) => {
        if (e) return done(e);
        if (!rows.length) return nextTable(null);
        db.query(`DELETE FROM \`${rows[0].TABLE_NAME}\` WHERE ID_EMPLOYE = ?`, [id], (dErr) => {
          if (dErr) return done(dErr);
          nextTable(null);
        });
      }
    );
  }
  nextTable(null);
}

function restoreSessionForeignKeyChecksThen(cb) {
  db.query('SET SESSION foreign_key_checks = 1', () => cb());
}

/** Permet UPDATE … SET ID_EMPLOYE = NULL (anciens schémas NOT NULL). */
function relaxEmployeChildTables(done) {
  const alters = [
    'ALTER TABLE poste MODIFY COLUMN ID_EMPLOYE INT NULL',
    'ALTER TABLE POSTE MODIFY COLUMN ID_EMPLOYE INT NULL',
    'ALTER TABLE DEPARTEMENT MODIFY COLUMN ID_EMPLOYE INT NULL',
    'ALTER TABLE departement MODIFY COLUMN ID_EMPLOYE INT NULL',
    'ALTER TABLE UTILISATEUR MODIFY COLUMN ID_EMPLOYE INT NULL',
    'ALTER TABLE utilisateur MODIFY COLUMN ID_EMPLOYE INT NULL',
  ];
  let i = 0;
  function next() {
    if (i >= alters.length) return done(null);
    db.query(alters[i++], () => next());
  }
  next();
}

function getArchiveMeta(done) {
  db.query(
    `SELECT TABLE_NAME, COLUMN_NAME, EXTRA
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = 'archive'`,
    (err, rows) => {
      if (err) return done(err);
      if (!rows.length) return done(null, null, []);
      done(null, rows[0].TABLE_NAME, rows);
    }
  );
}

/** Schéma crebas.sql: ID_ARCHIVE obligatoire sans défaut → INSERT échoue sans AUTO_INCREMENT. */
function ensureArchiveIdAutoIncrement(tname, colRows, done) {
  const idCol = colRows.find((r) => String(r.COLUMN_NAME).toUpperCase() === 'ID_ARCHIVE');
  if (!idCol) return done(null);
  if (String(idCol.EXTRA || '').toLowerCase().includes('auto_increment')) return done(null);
  db.query(
    `ALTER TABLE \`${tname}\` MODIFY COLUMN \`${idCol.COLUMN_NAME}\` INT NOT NULL AUTO_INCREMENT`,
    () => done(null)
  );
}

/** INSERT selon les colonnes réelles (schéma complet ou minimal RAISON). */
function insertArchiveSnapshot(tname, colRows, emp, dept, done) {
  const byUpper = new Map(
    colRows.map((r) => [String(r.COLUMN_NAME).toUpperCase(), r.COLUMN_NAME])
  );
  const has = (u) => byUpper.has(u);

  const names = [];
  const placeholders = [];
  const params = [];

  function addPlain(upper, value) {
    if (!has(upper)) return;
    names.push(`\`${byUpper.get(upper)}\``);
    placeholders.push('?');
    params.push(value);
  }
  function addNow(upper) {
    if (!has(upper)) return;
    names.push(`\`${byUpper.get(upper)}\``);
    placeholders.push('NOW()');
  }

  addPlain('ID_EMPLOYE', emp.ID_EMPLOYE);
  addNow('DATE_D_ARCHIVE');
  addPlain('PHOTO', emp.PHOTO || null);
  addPlain('NOM', emp.NOM || '');
  addPlain('PRENOM', emp.PRENOM || '');
  addPlain('ADRESSE', emp.ADRESSE || null);
  addPlain('POSTE', emp.POSTE || null);
  addPlain('TELEPHONE', emp.TELEPHONE != null ? String(emp.TELEPHONE) : null);
  addPlain('DEPARTEMENT', dept);
  addPlain('E_MAIL', emp.E_MAIL || null);
  addPlain('DATE_D_EMBAUCHE', emp.DATE_D_EMBAUCHE || null);
  addPlain('STATUT', emp.STATUT || 'actif');
  if (has('RAISON')) {
    addPlain('RAISON', 'Archivé depuis la liste des employés');
  }

  if (!names.length) {
    return done(new Error('Table archive sans colonnes communes avec la copie employé'));
  }

  const sql = `INSERT INTO \`${tname}\` (${names.join(', ')}) VALUES (${placeholders.join(', ')})`;
  db.query(sql, params, done);
}

/** Détache l'employé des tables liées pour éviter RESTRICT sur DELETE employe. */
function clearEmployeChildRefs(id, done) {
  const stmts = [
    'UPDATE poste SET ID_EMPLOYE = NULL WHERE ID_EMPLOYE = ?',
    'UPDATE POSTE SET ID_EMPLOYE = NULL WHERE ID_EMPLOYE = ?',
    'UPDATE DEPARTEMENT SET ID_EMPLOYE = NULL WHERE ID_EMPLOYE = ?',
    'UPDATE departement SET ID_EMPLOYE = NULL WHERE ID_EMPLOYE = ?',
    'UPDATE UTILISATEUR SET ID_EMPLOYE = NULL WHERE ID_EMPLOYE = ?',
    'UPDATE utilisateur SET ID_EMPLOYE = NULL WHERE ID_EMPLOYE = ?',
  ];
  let idx = 0;
  function next(err) {
    if (err && err.code !== 'ER_NO_SUCH_TABLE') return done(err);
    if (idx >= stmts.length) return done(null);
    db.query(stmts[idx++], [id], next);
  }
  next(null);
}

//  Créer un employé - SAFE destructuring
exports.createEmploye = (req, res) => {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    
    const nom = req.body.nom || '';
    const prenom = req.body.prenom || '';
    const adresse = req.body.adresse || '';
    const poste = req.body.poste || '';
    const telephone = req.body.telephone || '';
    const choisir_un_département = req.body.choisir_un_département || 'Non assigné';
    const email = req.body.email || '';
    const date_d_embauche = req.body.date_d_embauche || null;

    const sql = `
        INSERT INTO employe ( PHOTO, NOM, PRENOM, ADRESSE, POSTE, TELEPHONE, CHOISIR_UN_DEPARTEMENT, E_MAIL, DATE_D_EMBAUCHE)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [photo, nom, prenom, adresse, poste, telephone, choisir_un_département, email, date_d_embauche], (err, result) => {
        if (err) {
            console.error('Erreur INSERT employé:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('Employé ajouté ID:', result.insertId);
        res.json({ success: true, id: result.insertId, dept: choisir_un_département });
    });
};





//  Lire tous les employés
exports.getAllEmployes = (req, res) => {
    db.query("SELECT * FROM employe", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

//  Lire tous les employés archivés
exports.getArchives = (req, res) => {
  getArchiveMeta((err, tname, colRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!tname) return res.json([]);

    const dateCol = colRows.find((r) => String(r.COLUMN_NAME).toUpperCase() === 'DATE_D_ARCHIVE');
    const idArch = colRows.find((r) => String(r.COLUMN_NAME).toUpperCase() === 'ID_ARCHIVE');
    const orderSql = dateCol
      ? `\`${dateCol.COLUMN_NAME}\` DESC`
      : idArch
        ? `\`${idArch.COLUMN_NAME}\` DESC`
        : '1';

    db.query(`SELECT * FROM \`${tname}\` ORDER BY ${orderSql}`, (e2, results) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json(results);
    });
  });
};

// Restaurer employé (ARCHIVE → employe)
exports.getEmployesByDept = (req, res) => {
  const { dept } = req.params;
  const sql = `SELECT COUNT(*) as total FROM employe WHERE CHOISIR_UN_DEPARTEMENT = ?`;
  const listSql = `SELECT * FROM employe WHERE CHOISIR_UN_DEPARTEMENT = ?`;
  
  db.query(sql, [dept], (err, stats) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.query(listSql, [dept], (err, employees) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: stats[0].total, employees });
    });
  });
};

// Dashboard stats
exports.getDashboardStats = (req, res) => {
  // Total employés
  db.query("SELECT COUNT(*) as total FROM employe", (err, totalEmp) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Total départements
    db.query("SELECT COUNT(*) as total FROM DEPARTEMENT", (err, totalDept) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Employés par département
      db.query(`
        SELECT CHOISIR_UN_DEPARTEMENT as dept, COUNT(*) as count 
        FROM employe 
        GROUP BY CHOISIR_UN_DEPARTEMENT
      `, (err, byDept) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const stats = {
          totalEmployes: totalEmp[0].total,
          totalDepartements: totalDept[0].total,
          byDept: {}
        };
        
        byDept.forEach(row => {
          stats.byDept[row.dept || 'Non assigné'] = row.count;
        });
        
        // Defaults pour cartes existantes
        stats.byDept['RH'] = stats.byDept['RH'] || 0;
        stats.byDept['Finances'] = stats.byDept['Finance'] || 0;
        stats.byDept['Marketing'] = stats.byDept['Marketing'] || 0;  
        stats.byDept['IT'] = stats.byDept['IT'] || 0;
        
        res.json(stats);
      });
    });
  });
};


exports.restoreEmploye = (req, res) => {
  const { id } = req.params;

  getArchiveMeta((e, tname, colRows) => {
    if (e) return res.status(500).json(sqlErrorPayload(e));
    if (!tname) return res.status(404).json({ message: "Archive non trouvée" });

    const idEmpCol = colRows.find((r) => String(r.COLUMN_NAME).toUpperCase() === 'ID_EMPLOYE');
    const whereId = idEmpCol ? `\`${idEmpCol.COLUMN_NAME}\`` : '`ID_EMPLOYE`';

    db.query(`SELECT * FROM \`${tname}\` WHERE ${whereId} = ?`, [id], (err, result) => {
      if (err) return res.status(500).json(sqlErrorPayload(err));
      if (result.length === 0) return res.status(404).json({ message: "Archive non trouvée" });

      const arch = result[0];

      // Insert back to employe
      const sql = `
      INSERT INTO employe (ID_EMPLOYE, PHOTO, NOM, PRENOM, ADRESSE, POSTE, TELEPHONE, CHOISIR_UN_DEPARTEMENT, E_MAIL, DATE_D_EMBAUCHE, STATUT)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      db.query(
        sql,
        [
          arch.ID_EMPLOYE,
          arch.PHOTO,
          arch.NOM,
          arch.PRENOM,
          arch.ADRESSE,
          arch.POSTE,
          arch.TELEPHONE,
          arch.CHOISIR_UN_DEPARTEMENT,
          arch.E_MAIL,
          arch.DATE_D_EMBAUCHE,
          arch.STATUT,
        ],
        (err2) => {
          if (err2) return res.status(500).json(sqlErrorPayload(err2));

          db.query(`DELETE FROM \`${tname}\` WHERE ${whereId} = ?`, [id], (err3) => {
            if (err3) return res.status(500).json(sqlErrorPayload(err3));
            // res.redirect('/employe/gestion des employé.html');
            
           res.json({ success: true, message: "Employé archivé" });  // Pas res.redirect()

            // res.json({ message: "Employé restauré" });
          });
        }
      );
    });
  });
};




//  Lire un employé
exports.getEmployeById = (req, res) => {
    const { id } = req.params;

    db.query("SELECT * FROM employe WHERE ID_EMPLOYE = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
};

// Récupérer un employé par ID
exports.getEmployeById = (req, res) => {
  const id = req.params.id;

  const sql = "SELECT * FROM employe WHERE ID_EMPLOYE = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    res.json(result[0]); // retourne un seul employé
  });
};

//  Modifier
exports.updateEmploye = (req, res) => {
    const { id } = req.params;
    const { photo, nom, prenom, adresse, poste, telephone, choisir_un_departement, email, date_d_embauche } = req.body;

    const sql = `
        UPDATE employe
        SET PHOTO = ?, NOM = ?, PRENOM = ?, ADRESSE = ?, POSTE = ?, TELEPHONE = ?, CHOISIR_UN_DEPARTEMENT = ?, E_MAIL = ?, DATE_D_EMBAUCHE = ?
        WHERE ID_EMPLOYE = ?
    `;

    db.query(sql, [photo, nom, prenom, adresse, poste, telephone, choisir_un_departement, email, date_d_embauche, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Employé modifié" });
    });
};

//  Archiver un employe 
exports.deleteEmploye = (req, res) => {
  const { id } = req.params;

  dropArchiveFkBlockingDelete((fkErr) => {
    if (fkErr) return res.status(500).json(sqlErrorPayload(fkErr));

    dropEmployeFkToArchive((fk2Err) => {
      if (fk2Err) return res.status(500).json(sqlErrorPayload(fk2Err));

      dropForeignKeysReferencingEmploye((fk3Err) => {
        if (fk3Err) return res.status(500).json(sqlErrorPayload(fk3Err));

        relaxEmployeChildTables(() => {
        getArchiveMeta((metaErr, tname, colRows) => {
          if (metaErr) return res.status(500).json(sqlErrorPayload(metaErr));
          if (!tname) {
            return res.status(500).json({ message: 'Table archive introuvable dans la base' });
          }

          ensureArchiveIdAutoIncrement(tname, colRows, (aiErr) => {
            if (aiErr) return res.status(500).json(sqlErrorPayload(aiErr));

            db.beginTransaction((err) => {
              if (err) return res.status(500).json(sqlErrorPayload(err));

              db.query('SET SESSION foreign_key_checks = 0', (fkOffErr) => {
                if (fkOffErr) {
                  return db.rollback(() => res.status(500).json(sqlErrorPayload(fkOffErr)));
                }

                db.query("SELECT * FROM employe WHERE ID_EMPLOYE = ?", [id], (selErr, result) => {
                  if (selErr) {
                    return restoreSessionForeignKeyChecksThen(() =>
                      db.rollback(() => res.status(500).json(sqlErrorPayload(selErr)))
                    );
                  }

                  if (result.length === 0) {
                    return restoreSessionForeignKeyChecksThen(() =>
                      db.rollback(() => res.status(404).json({ message: "Employé non trouvé" }))
                    );
                  }

                  const emp = result[0];
                  const dept = deptFromEmployeRow(emp);

                  insertArchiveSnapshot(tname, colRows, emp, dept, (insErr) => {
                    if (insErr) {
                      return restoreSessionForeignKeyChecksThen(() =>
                        db.rollback(() => res.status(500).json(sqlErrorPayload(insErr)))
                      );
                    }

                    deleteLinkedRowsForEmploye(id, (linkErr) => {
                      if (linkErr) {
                        return restoreSessionForeignKeyChecksThen(() =>
                          db.rollback(() => res.status(500).json(sqlErrorPayload(linkErr)))
                        );
                      }

                      db.query("DELETE FROM employe WHERE ID_EMPLOYE = ?", [id], (delErr) => {
                        if (delErr) {
                          return restoreSessionForeignKeyChecksThen(() =>
                            db.rollback(() => res.status(500).json(sqlErrorPayload(delErr)))
                          );
                        }

                        db.query('SET SESSION foreign_key_checks = 1', (fkOnErr) => {
                          if (fkOnErr) {
                            return db.rollback(() => res.status(500).json(sqlErrorPayload(fkOnErr)));
                          }

                          db.commit((commitErr) => {
                            if (commitErr) {
                              return db.rollback(() => res.status(500).json(sqlErrorPayload(commitErr)));
                            }
                               res.redirect('/employe/gestion des employé.html');
                            // res.json({ success: true, message: "Employé archivé" });
                          });

                        });
                      });
                    });
                  });
                });
              });
            });
         });
        });
        });
     });
   });
 });
};

