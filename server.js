const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// BODY PARSER (IMPORTANT POUR LOGIN)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// STATIC FILES
app.use(express.static(path.join(__dirname, "public")));
app.use('/image', express.static(path.join(__dirname, 'public/image')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));



// Serve ALL views statically - fixe tous les liens/pages auto
app.use('/views', express.static(path.join(__dirname, 'views')));

// Alias /archive → views/employe pour archives.html
app.use('/archive', express.static(path.join(__dirname, 'views/employe')));

// Alias /employe → views/employe (scripts + pages)
app.use('/employe', express.static(path.join(__dirname, 'views/employe')));

// Alias autres subdirs
app.use('/departement', express.static(path.join(__dirname, 'views/departement')));
app.use('/poste', express.static(path.join(__dirname, 'views/poste')));








// ROUTES
const userRoutes = require("./routes/userRoutes");
const departementRoutes = require("./routes/departementRoutes");
const posteRoutes = require('./routes/posteRoutes');
const authRoutes = require('./routes/authRoutes');
const employesRoutes = require("./routes/employesRoutes");
const archiveRoutes = require("./routes/archiveRoutes");

app.use("/api/users", userRoutes);
app.use("/api/departements", departementRoutes);
app.use("/api/poste", posteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employes", employesRoutes);
app.use("/api/archives", archiveRoutes);

// PAGES HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/inscription", (req, res) => {
  res.sendFile(path.join(__dirname, "views/registre/inscription.html"));
});

app.get("/connexion", (req, res) => {
  res.sendFile(path.join(__dirname, "views/registre/connexion.html"));
});

app.get("/Dashboard/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/Dashboard/dashboard.html"));
});

app.get("/employe/gestion des employé.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/employe/gestion des employé.html"));
});

app.get("/employe/Ajouter un employé.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/employe/Ajouter un employé.html"));
});

app.get("/employe/archives.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/employe/archives.html"));
});

app.get("/employe/modifie_employe.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/employe/modifie_employe.html"));
});

app.get("/employe/détails.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/employe/détails.html"));
});

app.get("/departement/departement.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/departement/departement.html"));
});

app.get("/departement/ajouter département.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/departement/ajouter département.html"));
});

app.get("/poste/poste.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/poste/poste.html"));
});

app.get("/poste/ajouter poste.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/poste/ajouter poste.html"));
});

app.get("/poste/ajouter_poste_from_dept.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/poste/ajouter_poste_from_dept.html"));
});

app.get("/utilisateur/ajouter_utilisateur.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/utilisateur/ajouter_utilisateur.html"));
});

app.get("/Dashboard/Total employés IT.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/Dashboard/Total employés IT.html"));
});

app.get("/Dashboard/Total employé marketing.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/Dashboard/Total employé marketing.html"));
});

app.get("/Dashboard/Total Employés finances.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/Dashboard/Total Employés finances.html"));
});

app.get("/Dashboard/Total employés RH.html", (req, res) => {
  res.sendFile(path.join(__dirname, "views/Dashboard/Total employés RH.html"));
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

app.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});