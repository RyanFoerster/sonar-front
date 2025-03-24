import { writeFileSync } from "fs";
import { resolve, join } from "path";
import dotenv from "dotenv";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

// Dossier cible pour les environnements
const targetPath = resolve(__dirname, "../src/environments/");
const envConfigFile = `environment.${process.env.NODE_ENV || "development"}.ts`;

// Structure des données d'environnement
const envConfigData = `
export const environment = {
  production: ${process.env.NODE_ENV === "production"},
  firebase: {
    apiKey: "${process.env.FIREBASE_API_KEY}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.FIREBASE_APP_ID}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID}",
    vapidKey: "${process.env.FIREBASE_VAPID_KEY}"
  }
};
`;

// Générer le fichier d'environnement
writeFileSync(join(targetPath, envConfigFile), envConfigData);
console.log(`Fichier d'environnement généré: ${envConfigFile}`);

// Copier en tant que fichier d'environnement par défaut si en production
if (process.env.NODE_ENV === "production") {
  writeFileSync(join(targetPath, "environment.ts"), envConfigData);
  console.log("Fichier environment.ts généré (production)");
}
