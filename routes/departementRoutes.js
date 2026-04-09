const express = require("express");
const router = express.Router();
const departementController = require("../controllers/departementController");

// CRUD Départements
router.post("/", departementController.createDepartement);       // Créer
router.get("/", departementController.getDepartements);          // Lister
router.put("/:id", departementController.updateDepartement);     // Mettre à jour
router.delete("/:id", departementController.deleteDepartement);  // Supprimer

module.exports = router;