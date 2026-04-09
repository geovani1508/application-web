const express = require("express");
const router = express.Router();
const archiveController = require("../controllers/archiveController");

router.post("/", archiveController.createArchive);        // Créer une archive
router.get("/", archiveController.getAllArchives);        // Lire toutes les archives
router.get("/:id", archiveController.getArchiveById);     // Lire une archive par ID
router.put("/:id", archiveController.updateArchive);      // Mettre à jour une archive
router.delete("/:id", archiveController.deleteArchive);   // Supprimer une archive

module.exports = router;