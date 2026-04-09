-- Correction manuelle (optionnelle): le serveur peut aussi retirer ces FK au premier archivage.
-- Cause: la FK ARCHIVE(ID_EMPLOYE) -> EMPLOYE(ID_EMPLOYE) avec ON DELETE RESTRICT
-- bloque la suppression de l'employe apres insertion en archive.

USE `gestion_employé`;

-- Verifier les contraintes de ARCHIVE
SELECT CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gestion_employé'
  AND TABLE_NAME = 'ARCHIVE'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Supprimer la contrainte qui bloque l'archivage.
-- D'apres ton schema, son nom est FK_ARCHIVAGE.
ALTER TABLE ARCHIVE DROP FOREIGN KEY FK_ARCHIVAGE;
