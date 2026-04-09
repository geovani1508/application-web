const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const multer = require('multer');
const fs = require('fs');


const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// const upload = multer({ storage });
 // Multer déplacé vers routes (évitant req.body undefined)


app.use(express.static(path.join(__dirname, 'public/uploads')));

// Routes API EN PREMIER

const db = require("./config/index");
const userRoutes = require("./routes/userRoutes");
const departementRoutes = require("./routes/departementRoutes");
const posteRoutes = require('./routes/posteRoutes');
const authRoutes = require('./routes/authRoutes');
const employesRoutes = require("./routes/employesRoutes");

app.use("/api/users", userRoutes);
app.use("/api/departements", departementRoutes);
app.use("/api/poste", posteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employes", employesRoutes);
const archiveRoutes = require("./routes/archiveRoutes");
app.use("/api/archives", archiveRoutes);

// Fichiers statiques 
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, "views")));


// CORS AVANT routes
const cors = require("cors");
app.use(cors({
  origin: ["http://localhost", "http://localhost:80", "http://127.0.0.1"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "component")));
// app.use(express.static(path.join(__dirname, "..")));

// Pages HTML
app.get("/poste/ajouter", (req, res) => {
  res.sendFile(path.join(__dirname, "views/poste/ajouter poste.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});
app.get("/inscription", (req, res) => {
  res.sendFile(path.join(__dirname, "views/registre/inscription.html"));
});
app.get("/connexion", (req, res) => {
  res.sendFile(path.join(__dirname, "views/registre/connexion.html"));
});
app.get("/departement", (req, res) => {
  res.sendFile(path.join(__dirname, "views/departement/departement.html"));
});
app.get("/gestion-employes", (req, res) => {
  res.sendFile(path.join(__dirname, "views/employe/gestion des employé.html"));
});
app.get("/sidebar", (req, res) => {
  res.sendFile(path.join(__dirname, "component/sidebar.html"));
});

app.get("/employe/détails.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/employe/détails.html"));
});

// Page 404
app.use((req, res) => {
  res.status(404).send("Page non trouvée");
});

app.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});












// const express = require("express");
// const path = require("path");
// const app = express();

// app.use(express.json());

// // Dossiers publics - CSS et images depuis la racine
// app.use(express.static(path.join(__dirname, "views")));
// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static(path.join(__dirname, ".."))); // Racine du projet pour images

// // Pages AVANT les routes API
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "views/index.html"));
// });

// app.get("/inscription", (req, res) => {
//   res.sendFile(path.join(__dirname, "views/inscription.html"));
 
// });

// app.get("/connexion", (req, res) => {
//   res.sendFile(path.join(__dirname, "views/connexion.html"));
// });

// app.get("/departement", (req, res) => {
//   res.sendFile(path.join(__dirname, "views/departement.html"));
// });

// app.get("/gestion-employes", (req, res) => {
//   res.sendFile(path.join(__dirname, "views/gestion-employes.html"));
// });

// app.get("/sidebar", (req, res) => {
//   res.sendFile(path.join(__dirname, "views/sidebar.html"));
// });

// // Routes API
// const db = require("./config/index"); // chemin vers ton config DB
// const userRoutes = require("./routes/userRoutes");
// const departementRoutes = require("./routes/departementRoutes");
// const posteRoutes = require('./routes/posteRoutes');

// app.use("/api/users", userRoutes);
// app.use("/api/departements", departementRoutes);
// app.use("/api/poste", posteRoutes);
// // Page 404
// app.use((req, res) => {
//   res.status(404).send("Page non trouvée");
// });

// // lancer le serveur
// app.listen(3000, () => {
//   console.log("Serveur lancé sur http://localhost:3000");
// });

