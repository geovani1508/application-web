const express = require("express");
const router = express.Router();
const employesController = require('../controllers/employesController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Créer un employé
router.post('/', upload.single('photo'), employesController.createEmploye);


//  Lire tous les employés
router.get('/', employesController.getAllEmployes);

//  Lister archives
router.get('/archives', employesController.getArchives);

// Restaurer employé depuis archive
router.put('/restore/:id', employesController.restoreEmploye);

// Dashboard : Employés par département (stats + liste)
router.get('/dept/:dept', employesController.getEmployesByDept);

// Dashboard stats globales
router.get('/stats', employesController.getDashboardStats);

//  Lire un seul employé
router.get('/:id', employesController.getEmployeById);

// Modifier un employé
router.put('/:id', employesController.updateEmploye);

//  Archiver 
router.delete('/:id', employesController.deleteEmploye);

module.exports = router;
