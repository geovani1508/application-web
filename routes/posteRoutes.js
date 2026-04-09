const express = require("express");
const router = express.Router();
const posteController = require("../controllers/posteController");

router.post("/", posteController.createPoste);        // Créer un poste
router.get("/", posteController.getAllPostes);        // Lire tous les postes
router.get("/:id", posteController.getPosteById);    // Lire un poste par ID
router.put("/:id", posteController.updatePoste);     // Mettre à jour un poste
router.delete("/:id", posteController.deletePoste);  // Supprimer un poste

module.exports = router;