USE gestion_employé;

-- Fix POSTE table (ID_EMPLOYE NULL OK)
ALTER TABLE poste MODIFY COLUMN ID_EMPLOYE INT NULL;

-- Sample employee if empty
INSERT IGNORE INTO employe (NOM, PRENOM, E_MAIL) VALUES 
('Test User', 'Employé', 'test@company.com'),
('John', 'Doe', 'john@company.com');

-- Verify
SELECT 'Setup complete' as status;
DESCRIBE poste;
SELECT COUNT(*) as num_employees FROM employe;

