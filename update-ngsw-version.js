const fs = require("fs");
const path = require("path");

// Déterminer l'environnement
const env = process.env.NODE_ENV || "development";
console.log(`Mise à jour de la version pour l'environnement: ${env}`);

// Chemin vers le fichier d'environnement
const envPath = path.join(
  __dirname,
  "src",
  "environments",
  `environment${env === "production" ? "" : "." + env}.ts`
);

// Lire le fichier d'environnement
const envContent = fs.readFileSync(envPath, "utf8");

// Extraire la version
const versionMatch = envContent.match(/APP_VERSION:\s*['"]([^'"]+)['"]/);
if (!versionMatch) {
  console.error("Version non trouvée dans le fichier d'environnement");
  process.exit(1);
}

const version = versionMatch[1];
console.log(`Version trouvée: ${version}`);

// Lire et mettre à jour ngsw-config.json
const ngswPath = path.join(__dirname, "ngsw-config.json");
const ngswConfig = JSON.parse(fs.readFileSync(ngswPath, "utf8"));

// Mettre à jour la version
ngswConfig.appData = ngswConfig.appData || {};
ngswConfig.appData.version = version;

// Écrire le fichier mis à jour
fs.writeFileSync(ngswPath, JSON.stringify(ngswConfig, null, 2));
console.log(`Version mise à jour dans ngsw-config.json: ${version}`);
