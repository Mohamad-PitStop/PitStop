/**
 * Génère transmissionByModelFuel pour TOUS les modèles du catalogue fuelTypes,
 * avec des règles cohérentes (uniquement les transmissions qui existent vraiment).
 * Usage: node scripts/build-transmission-by-model-fuel.mjs
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogPath = path.join(__dirname, "..", "data", "vehicle-compatibility-catalog.json")

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
const fuelTypes = catalog.fuelTypes

// Constantes de listes de transmissions
const MANUAL_AND_ROBO = ["Manuelle", "Semi-automatique (robotisée)"]
const MANUAL_AND_AUTO_AND_ROBO = ["Manuelle", "Automatique", "Semi-automatique (robotisée)"]
const AUTO_AND_ROBO = ["Automatique", "Semi-automatique (robotisée)"]
const ROBO_ONLY = ["Semi-automatique (robotisée)"]
const AUTO_ONLY = ["Automatique"]

// Overrides explicites (marque -> modèle -> carburant -> transmissions) pour modèles vérifiés
const EXPLICIT = {
  "Renault": {
    "Clio": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "GPL": MANUAL_AND_ROBO, "E85": ["Manuelle"] },
    "Zoe": { "Électrique": AUTO_ONLY },
    "Captur": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Megane": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Scenic": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Arkana": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Austral": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Kangoo": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "Trafic": { "Diesel": MANUAL_AND_ROBO, "Essence": MANUAL_AND_ROBO },
    "Master": { "Diesel": MANUAL_AND_ROBO },
  },
  "Peugeot": {
    "e-208": { "Électrique": AUTO_ONLY }, "e-308": { "Électrique": AUTO_ONLY }, "e-2008": { "Électrique": AUTO_ONLY },
    "208": { "Essence": MANUAL_AND_ROBO, "Diesel": ["Manuelle"], "Hybride": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "308": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "408": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "508": { "Essence": MANUAL_AND_ROBO, "Diesel": ["Manuelle", "Automatique"], "Hybride rechargeable": ROBO_ONLY },
    "2008": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "3008": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "5008": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Partner": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Rifter": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Expert": { "Diesel": MANUAL_AND_ROBO }, "Boxer": { "Diesel": MANUAL_AND_ROBO },
  },
  "Citroën": {
    "Ami": { "Électrique": AUTO_ONLY },
    "C1": { "Essence": MANUAL_AND_ROBO },
    "C3": { "Essence": ["Manuelle", "Automatique"], "Diesel": ["Manuelle"], "Hybride": ROBO_ONLY },
    "C3 Aircross": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "C4": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "C4 X": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "C5 X": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "C5 Aircross": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Berlingo": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "SpaceTourer": { "Diesel": MANUAL_AND_ROBO },
    "Jumpy": { "Diesel": MANUAL_AND_ROBO, "Essence": MANUAL_AND_ROBO },
    "Jumper": { "Diesel": MANUAL_AND_ROBO },
  },
  "Volkswagen": {
    "ID.3": { "Électrique": AUTO_ONLY }, "ID.4": { "Électrique": AUTO_ONLY }, "ID.5": { "Électrique": AUTO_ONLY },
    "ID.7": { "Électrique": AUTO_ONLY }, "ID. Buzz": { "Électrique": AUTO_ONLY },
    "Golf": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Polo": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Tiguan": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "T-Roc": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "T-Cross": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Passat": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Arteon": { "Essence": ROBO_ONLY, "Diesel": ROBO_ONLY },
    "Touareg": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Touran": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Caddy": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Transporter": { "Diesel": MANUAL_AND_ROBO, "Essence": MANUAL_AND_ROBO },
  },
  "BMW": {
    "iX": { "Électrique": AUTO_ONLY }, "iX3": { "Électrique": AUTO_ONLY }, "i4": { "Électrique": AUTO_ONLY },
    "i5": { "Électrique": AUTO_ONLY }, "i7": { "Électrique": AUTO_ONLY },
    "Série 1": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": MANUAL_AND_AUTO_AND_ROBO },
    "Série 2": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "Série 3": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Série 4": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Série 5": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Série 7": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Série 8": { "Essence": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "X1": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "X2": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "X3": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "X4": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "X5": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "X6": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "X7": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Z4": { "Essence": MANUAL_AND_ROBO },
  },
  "Mercedes-Benz": {
    "EQA": { "Électrique": AUTO_ONLY }, "EQB": { "Électrique": AUTO_ONLY }, "EQC": { "Électrique": AUTO_ONLY },
    "EQE": { "Électrique": AUTO_ONLY }, "EQS": { "Électrique": AUTO_ONLY },
    "Classe A": { "Essence": ROBO_ONLY, "Diesel": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Classe B": { "Essence": ROBO_ONLY, "Diesel": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Classe C": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": AUTO_AND_ROBO },
    "Classe E": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Classe S": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "CLA": { "Essence": ROBO_ONLY, "Diesel": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "CLS": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "GLA": { "Essence": ROBO_ONLY, "Diesel": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "GLB": { "Essence": ROBO_ONLY, "Diesel": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "GLC": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "GLE": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "GLS": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "AMG GT": { "Essence": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
  },
  "Audi": {
    "e-tron": { "Électrique": AUTO_ONLY }, "e-tron GT": { "Électrique": AUTO_ONLY }, "Q4 e-tron": { "Électrique": AUTO_ONLY },
    "A1": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "A3": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "A4": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "A5": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "A6": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "A7": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "A8": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Q2": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Q3": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Q5": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": MANUAL_AND_AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Q7": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Q8": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "TT": { "Essence": MANUAL_AND_ROBO },
    "R8": { "Essence": MANUAL_AND_ROBO },
  },
  "Porsche": {
    "Taycan": { "Électrique": AUTO_ONLY },
    "911": { "Essence": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "718 Cayman": { "Essence": MANUAL_AND_ROBO },
    "718 Boxster": { "Essence": MANUAL_AND_ROBO },
    "Cayenne": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Macan": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Électrique": AUTO_ONLY },
    "Panamera": { "Essence": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
  },
  "Alfa Romeo": {
    "Giulia": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "Stelvio": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "Tonale": { "Essence": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Giulietta": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "MiTo": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "4C": { "Essence": ["Manuelle"] },
  },
  "Toyota": {
    "bZ4X": { "Électrique": AUTO_ONLY },
    "Prius": { "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Yaris": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Yaris Cross": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Corolla": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "C-HR": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "RAV4": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Highlander": { "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Land Cruiser": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "Camry": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Supra": { "Essence": MANUAL_AND_ROBO },
    "GR86": { "Essence": ["Manuelle"] },
    "Aygo X": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "Proace": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
  },
  "Ford": {
    "Mustang Mach-E": { "Électrique": AUTO_ONLY },
    "Fiesta": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Focus": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Puma": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Kuga": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Mustang": { "Essence": MANUAL_AND_AUTO_AND_ROBO },
    "Explorer": { "Essence": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Ranger": { "Diesel": MANUAL_AND_ROBO },
    "Transit": { "Diesel": MANUAL_AND_ROBO, "Essence": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "Tourneo": { "Diesel": MANUAL_AND_ROBO, "Essence": MANUAL_AND_ROBO },
  },
  "Hyundai": {
    "Ioniq 5": { "Électrique": AUTO_ONLY }, "Ioniq 6": { "Électrique": AUTO_ONLY }, "Nexo": { "Hydrogène": AUTO_ONLY },
    "Kona": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "i10": { "Essence": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "i20": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "i30": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Tucson": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Santa Fe": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Bayon": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
  },
  "Kia": {
    "EV6": { "Électrique": AUTO_ONLY }, "EV9": { "Électrique": AUTO_ONLY },
    "Niro": { "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Picanto": { "Essence": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "Rio": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Ceed": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "GPL": MANUAL_AND_ROBO },
    "Proceed": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "XCeed": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Stonic": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "Sportage": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Sorento": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
  },
  "Dacia": {
    "Spring": { "Électrique": AUTO_ONLY },
    "Sandero": { "Essence": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "Duster": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Jogger": { "Essence": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Logan": { "Essence": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
  },
  "Skoda": {
    "Enyaq": { "Électrique": AUTO_ONLY },
    "Fabia": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Scala": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "Octavia": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Superb": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Kamiq": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Karoq": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Kodiaq": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
  },
  "Nissan": {
    "Leaf": { "Électrique": AUTO_ONLY }, "Ariya": { "Électrique": AUTO_ONLY },
    "Micra": { "Essence": ["Manuelle", "Automatique"], "Diesel": ["Manuelle", "Automatique"] },
    "Juke": { "Essence": ["Manuelle", "Automatique"], "Diesel": ["Manuelle", "Automatique"], "Hybride": ["Automatique"] },
    "Qashqai": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "X-Trail": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "GT-R": { "Essence": ROBO_ONLY },
    "370Z": { "Essence": MANUAL_AND_ROBO },
    "Navara": { "Diesel": MANUAL_AND_ROBO },
    "Townstar": { "Électrique": AUTO_ONLY, "Diesel": MANUAL_AND_ROBO },
  },
  "Honda": {
    "Honda e": { "Électrique": AUTO_ONLY }, "e:Ny1": { "Électrique": AUTO_ONLY },
    "Jazz": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Civic": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Accord": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "HR-V": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "CR-V": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "ZR-V": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
  },
  "Mazda": {
    "MX-30": { "Électrique": AUTO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Mazda2": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Mazda3": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Mazda6": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "CX-3": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "CX-30": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "CX-5": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "CX-60": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "MX-5": { "Essence": ["Manuelle"] },
  },
  "Opel": {
    "Corsa": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "Astra": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Mokka": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "Crossland": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Grandland": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Insignia": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Combo": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Vivaro": { "Diesel": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "Movano": { "Diesel": MANUAL_AND_ROBO },
    "Zafira": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
  },
  "Seat": {
    "Ibiza": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": ["Manuelle"] },
    "Leon": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Arona": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Ateca": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Tarraco": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Mii": { "Essence": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
  },
  "Cupra": {
    "Born": { "Électrique": AUTO_ONLY },
    "Tavascan": { "Électrique": AUTO_ONLY },
    "Formentor": { "Essence": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Leon": { "Essence": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Ateca": { "Essence": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
  },
  "Fiat": {
    "500e": { "Électrique": AUTO_ONLY },
    "500": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "500X": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "500L": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "Panda": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO, "GNV": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Tipo": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "Punto": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "GPL": MANUAL_AND_ROBO },
    "Ducato": { "Diesel": MANUAL_AND_ROBO },
    "Doblo": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Fiorino": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
  },
  "Subaru": {
    "Solterra": { "Électrique": AUTO_ONLY },
    "Outback": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "Forester": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "XV": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "Impreza": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "BRZ": { "Essence": ["Manuelle"] },
    "Levorg": { "Essence": MANUAL_AND_AUTO_AND_ROBO },
  },
  "Suzuki": {
    "Across": { "Hybride rechargeable": ROBO_ONLY },
  },
  "Mitsubishi": {
    "Outlander": { "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Eclipse Cross": { "Hybride rechargeable": ROBO_ONLY },
  },
  "Lexus": {
    "RZ": { "Électrique": AUTO_ONLY },
    "UX": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "NX": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "RX": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "ES": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "IS": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "LC": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "LS": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
    "LBX": { "Essence": AUTO_AND_ROBO, "Hybride": ROBO_ONLY },
  },
  "Volvo": {
    "C40 Recharge": { "Électrique": AUTO_ONLY },
    "EX30": { "Électrique": AUTO_ONLY },
    "EX90": { "Électrique": AUTO_ONLY },
    "XC40": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "XC60": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "XC90": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "S60": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "S90": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "V60": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "V90": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
  },
  "Land Rover": {
    "Defender": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Discovery": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Discovery Sport": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Range Rover": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Range Rover Sport": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Range Rover Velar": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "Range Rover Evoque": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
  },
  "Jaguar": {
    "I-Pace": { "Électrique": AUTO_ONLY },
    "XE": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": MANUAL_AND_AUTO_AND_ROBO },
    "XF": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": MANUAL_AND_AUTO_AND_ROBO },
    "F-Type": { "Essence": MANUAL_AND_ROBO },
    "E-Pace": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
    "F-Pace": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
  },
  "Jeep": {
    "Avenger": { "Électrique": AUTO_ONLY, "Essence": MANUAL_AND_ROBO },
    "Renegade": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "Compass": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
    "Cherokee": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": MANUAL_AND_AUTO_AND_ROBO },
    "Grand Cherokee": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Wrangler": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": MANUAL_AND_AUTO_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Gladiator": { "Essence": MANUAL_AND_AUTO_AND_ROBO, "Diesel": MANUAL_AND_AUTO_AND_ROBO },
  },
  "Smart": {
    "Fortwo": { "Essence": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "Forfour": { "Essence": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "#1": { "Électrique": AUTO_ONLY },
    "#3": { "Électrique": AUTO_ONLY },
  },
  "Mini": {
    "Mini Electric": { "Électrique": AUTO_ONLY },
    "Mini 3 portes": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Mini 5 portes": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Mini Clubman": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO },
    "Mini Countryman": { "Essence": MANUAL_AND_ROBO, "Diesel": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY, "Électrique": AUTO_ONLY },
    "Mini Cabrio": { "Essence": MANUAL_AND_ROBO },
  },
  "Genesis": {
    "GV60": { "Électrique": AUTO_ONLY },
    "GV70": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Électrique": AUTO_ONLY },
    "GV80": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "G70": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
    "G80": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO, "Électrique": AUTO_ONLY },
    "G90": { "Essence": AUTO_AND_ROBO, "Diesel": AUTO_AND_ROBO },
  },
  "MG": {
    "MG4": { "Électrique": AUTO_ONLY },
    "MG5": { "Électrique": AUTO_ONLY },
    "Marvel R": { "Électrique": AUTO_ONLY },
    "Cyberster": { "Électrique": AUTO_ONLY },
    "MG3": { "Essence": MANUAL_AND_ROBO, "Hybride": ROBO_ONLY },
    "ZS": { "Essence": MANUAL_AND_ROBO, "Électrique": AUTO_ONLY },
    "HS": { "Essence": MANUAL_AND_ROBO, "Hybride rechargeable": ROBO_ONLY },
  },
  "Ferrari": {
    "SF90 Stradale": { "Hybride rechargeable": ROBO_ONLY },
    "296 GTB": { "Hybride rechargeable": ROBO_ONLY },
    "Purosangue": { "Essence": ROBO_ONLY, "Hybride rechargeable": ROBO_ONLY },
  },
  "Lamborghini": { "Revuelto": { "Hybride rechargeable": ROBO_ONLY } },
  "Lancia": {},
  "Infiniti": {},
  "Daihatsu": {},
  "SsangYong": {},
  "Chevrolet": { "Volt": { "Hybride rechargeable": ROBO_ONLY } },
  "Cadillac": { "Lyriq": { "Électrique": AUTO_ONLY } },
  "Chrysler": {},
  "GMC": { "Hummer EV": { "Électrique": AUTO_ONLY } },
  "Lincoln": {},
  "Buick": {},
  "Bentley": {},
  "Rolls-Royce": { "Spectre": { "Électrique": AUTO_ONLY } },
  "Aston Martin": {},
  "McLaren": { "Artura": { "Hybride rechargeable": ROBO_ONLY } },
  "Lotus": { "Eletre": { "Électrique": AUTO_ONLY }, "Emira": { "Essence": MANUAL_AND_ROBO } },
  "Saab": {},
  "Lynk & Co": {},
  "Geely": {},
  "BYD": {},
  "Tesla": {},
  "Polestar": {},
  "NIO": {},
  "Xpeng": {},
  "Aiways": {},
  "DS": {},
  "Alpine": {},
  "Bugatti": {},
}

// Modèles sans boîte convertisseur (manuelle + robotisée uniquement) — utilisés si pas dans EXPLICIT
const MANUAL_ROBO_ONLY_MODELS = {
  "Alfa Romeo": ["Giulietta", "MiTo", "4C"],
  "Porsche": ["911", "718 Cayman", "718 Boxster"],
  "Audi": ["TT", "R8"],
  "Nissan": ["GT-R", "370Z"],
}

// Marques / modèles sans manuelle
const NO_MANUAL_MODELS = {
  "Mercedes-Benz": true,
  "Volvo": true,
  "Land Rover": true,
  "Jaguar": ["F-Pace", "E-Pace", "I-Pace"],
  "Porsche": ["Cayenne", "Macan", "Panamera", "Taycan"],
  "Toyota": ["RAV4", "Prius", "Highlander"],
  "Lexus": true,
  "Bentley": true,
  "Rolls-Royce": true,
  "Maserati": true,
  "Ferrari": true,
  "Lamborghini": true,
  "McLaren": true,
  "Aston Martin": true,
  "Bugatti": true,
}

function getTransmissions(brand, model, fuel) {
  const explicit = EXPLICIT[brand]?.[model]?.[fuel]
  if (explicit) return explicit

  if (fuel === "Électrique" || fuel === "Hydrogène") return AUTO_ONLY

  if (fuel === "Hybride" || fuel === "Hybride rechargeable") {
    if (NO_MANUAL_MODELS[brand] === true) return AUTO_AND_ROBO
    if (Array.isArray(NO_MANUAL_MODELS[brand]) && NO_MANUAL_MODELS[brand].includes(model)) return AUTO_AND_ROBO
    return ROBO_ONLY
  }

  const manualRoboBrand = MANUAL_ROBO_ONLY_MODELS[brand]
  if (Array.isArray(manualRoboBrand) && manualRoboBrand.includes(model)) return MANUAL_AND_ROBO

  if (NO_MANUAL_MODELS[brand] === true) return AUTO_AND_ROBO
  if (Array.isArray(NO_MANUAL_MODELS[brand]) && NO_MANUAL_MODELS[brand].includes(model)) return AUTO_AND_ROBO

  return MANUAL_AND_AUTO_AND_ROBO
}

const out = {}

for (const [brand, models] of Object.entries(fuelTypes)) {
  if (!models || typeof models !== "object" || brand === "_default") continue
  out[brand] = {}
  for (const [model, fuels] of Object.entries(models)) {
    if (!Array.isArray(fuels) || model === "_default") continue
    out[brand][model] = {}
    for (const fuel of fuels) {
      out[brand][model][fuel] = getTransmissions(brand, model, fuel)
    }
  }
  if (Object.keys(out[brand]).length === 0) delete out[brand]
}

catalog.transmissionByModelFuel = out
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8")
console.log("transmissionByModelFuel mis à jour pour tous les modèles.")
console.log("Marques traitées:", Object.keys(out).length)
