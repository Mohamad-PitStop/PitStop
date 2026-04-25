/**
 * Modèles proposés dans les listes (diagnostic / vente).
 * Liste **étendue** (VP, SUV, utilitaires légers, générations passées et actuelles) :
 * la finition / carrosserie détaillée reste dans « Variante / finition » ou « Mon modèle n'apparaît pas ? ».
 */
export const carModels: Record<string, string[]> = {
  // Françaises
  Renault: [
    "Arkana", "Austral", "Avantime", "Captur", "Clio", "Espace", "Fluence",
    "Kadjar", "Kangoo", "Koleos", "Laguna", "Latitude", "Master", "Megane",
    "Modus", "R4", "R5", "Rafale", "Safrane", "Scenic", "Symbol", "Talisman",
    "Trafic", "Twingo", "Vel Satis", "Wind", "Zoe",
  ],
  Peugeot: [
    "107", "108", "1007", "205", "206", "207", "208", "e-208", "305", "306",
    "307", "308", "e-308", "309", "405", "406", "407", "408", "505", "508",
    "605", "607", "806", "807", "2008", "e-2008", "3008", "4007", "4008",
    "5008", "Bipper", "Boxer", "Expert", "iOn", "J5", "J9", "Partner", "RCZ",
    "Rifter", "Traveller",
  ],
  Citroën: [
    "2CV", "AX", "Ami", "Berlingo", "BX", "C1", "C2", "C3", "C3 Aircross",
    "C3 Picasso", "C4", "C4 Aircross", "C4 Cactus", "C4 Picasso", "C4 X",
    "C5", "C5 Aircross", "C5 X", "C6", "C8", "C-Crosser", "C-Elysée",
    "C-Zero", "CX", "DS", "Dyane", "GS", "Jumper", "Jumpy", "Méhari", "Nemo",
    "Saxo", "SpaceTourer", "Visa", "Xantia", "Xsara", "XM", "ZX", "Évasion",
  ],
  DS: [
    "DS 3", "DS 3 Crossback", "DS 4", "DS 4 Crossback", "DS 5", "DS 7",
    "DS 7 Crossback", "DS 9",
  ],
  Alpine: ["A110", "A110 GT", "A110 R", "A110 S", "A310", "A610"],
  Bugatti: ["Centodieci", "Chiron", "Divo", "EB110", "Tourbillon", "Veyron"],

  // Allemandes
  Volkswagen: [
    "Amarok", "Arteon", "Beetle", "Bora", "Caddy", "California", "Corrado",
    "Crafter", "Eos", "Fox", "Golf", "ID. Buzz", "ID.3", "ID.4", "ID.5",
    "ID.7", "Jetta", "Lupo", "Multivan", "New Beetle", "Passat", "Phaeton",
    "Polo", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Taigo", "Tiguan",
    "Touareg", "Touran", "Transporter", "Up", "Vento",
  ],
  BMW: [
    "Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 6",
    "Série 7", "Série 8", "M2", "M3", "M4", "M5", "M8", "X1", "X2", "X3",
    "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z3", "Z4",
    "Z8", "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX2", "iX3",
  ],
  "Mercedes-Benz": [
    "Citan", "CL", "CLA", "CLK", "CLS", "Classe A", "Classe B", "Classe C",
    "Classe E", "Classe G", "Classe R", "Classe S", "Classe T", "Classe V",
    "Classe X", "EQA", "EQB", "EQC", "EQE", "EQS", "EQT", "EQV", "GL", "GLA",
    "GLB", "GLC", "GLE", "GLK", "GLS", "Maybach S", "ML", "SL", "SLC", "SLK",
    "Sprinter", "Vaneo", "Vito", "AMG GT", "AMG ONE",
  ],
  Audi: [
    "80", "100", "200", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
    "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron",
    "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "RSQ3", "RSQ8", "S1", "S3",
    "S4", "S5", "S6", "S7", "S8", "SQ2", "SQ5", "SQ7", "SQ8", "TT", "V8",
    "e-tron", "e-tron GT",
  ],
  Porsche: [
    "718 Boxster", "718 Cayman", "718 Spyder", "911", "912", "914",
    "918 Spyder", "924", "928", "944", "959", "968", "Carrera GT", "Cayenne",
    "Macan", "Panamera", "Taycan",
  ],
  Opel: [
    "Adam", "Agila", "Antara", "Ascona", "Astra", "Calibra", "Cascada",
    "Combo", "Corsa", "Crossland", "Frontera", "Grandland", "GT", "Insignia",
    "Kadett", "Karl", "Manta", "Meriva", "Mokka", "Movano", "Omega",
    "Rekord", "Senator", "Signum", "Tigra", "Vectra", "Vivaro", "Zafira",
  ],
  Smart: ["#1", "#3", "#5", "Crossblade", "Forfour", "Fortwo", "Roadster"],
  Mini: [
    "Mini 3 portes", "Mini 5 portes", "Mini Aceman", "Mini Cabrio",
    "Mini Classic", "Mini Clubman", "Mini Cooper", "Mini Cooper E",
    "Mini Cooper S", "Mini Cooper SD", "Mini Cooper SE", "Mini Countryman",
    "Mini Coupé", "Mini Electric", "Mini Hatch", "Mini JCW",
    "Mini John Cooper Works", "Mini Moke", "Mini One", "Mini Paceman",
    "Mini Pickup", "Mini Roadster",
  ],

  // Italiennes
  Fiat: [
    "124 Spider", "500", "500e", "500L", "500X", "600", "600e", "Albea",
    "Barchetta", "Brava", "Bravo", "Cinquecento", "Croma", "Doblo", "Ducato",
    "Fiorino", "Freemont", "Idea", "Linea", "Marea", "Multipla", "Panda",
    "Punto", "Qubo", "Scudo", "Sedici", "Seicento", "Stilo", "Strada",
    "Talento", "Tempra", "Tipo", "Topolino", "Ulysse", "Uno",
  ],
  "Alfa Romeo": [
    "33", "75", "90", "145", "146", "147", "155", "156", "159", "164", "166",
    "4C", "8C", "Brera", "Crosswagon", "GT", "GTV", "Giulia", "Giulietta",
    "Junior", "MiTo", "RZ", "SZ", "Spider", "Stelvio", "Tonale",
  ],
  Ferrari: [
    "12Cilindri", "296 GTB", "296 GTS", "488 GTB", "488 Pista", "488 Spider",
    "812 Competizione", "812 GTS", "812 Superfast", "California", "F12berlinetta",
    "F8 Spider", "F8 Tributo", "FF", "GTC4Lusso", "LaFerrari", "Portofino",
    "Portofino M", "Purosangue", "Roma", "Roma Spider", "SF90 Spider",
    "SF90 Stradale", "SF90 XX",
  ],
  Lamborghini: [
    "Aventador", "Diablo", "Gallardo", "Huracán", "Murciélago",
    "Reventón", "Revuelto", "Temerario", "Urus",
  ],
  Maserati: [
    "3200 GT", "Coupé", "GranCabrio", "GranTurismo", "Grecale", "Ghibli",
    "Levante", "MC20", "MC20 Cielo", "Quattroporte", "Spyder",
  ],
  Lancia: ["Beta", "Dedra", "Delta", "Kappa", "Lybra", "Musa", "Phedra", "Thema", "Thesis", "Voyager", "Y", "Ypsilon"],

  // Japonaises
  Toyota: [
    "4Runner", "Auris", "Avensis", "Aygo", "Aygo X", "bZ Compact", "bZ4X",
    "C-HR", "Camry", "Carina", "Celica", "Corolla", "Corona", "Crown",
    "FJ Cruiser", "GR86", "GR Corolla", "GR Yaris", "Hiace", "Highlander",
    "Hilux", "IQ", "Land Cruiser", "MR2", "Mirai", "Picnic", "Previa",
    "Prius", "Proace", "Proace City", "Proace Verso", "RAV4", "Sequoia",
    "Starlet", "Supra", "Tacoma", "Tercel", "Tundra", "Urban Cruiser",
    "Verso", "Verso-S", "Yaris", "Yaris Cross",
  ],
  Honda: [
    "Accord", "Beat", "City", "Civic", "Concerto", "CR-V", "CR-Z", "CRX",
    "Crosstour", "FR-V", "Fit", "HR-V", "Honda e", "Insight", "Integra",
    "Jazz", "Legend", "Logo", "NSX", "Odyssey", "Passport", "Pilot",
    "Prelude", "Ridgeline", "S2000", "S660", "Stream", "ZR-V", "e:N1", "e:Ny1",
  ],
  Nissan: [
    "240Z", "280Z", "300ZX", "350Z", "370Z", "Almera", "Ariya", "Bluebird",
    "Cabstar", "Cube", "e-NV200", "Frontier", "GT-R", "Interstar", "Juke",
    "Leaf", "Maxima", "Micra", "Murano", "NP300", "NV200", "NV300", "NV400",
    "Navara", "Note", "Patrol", "Pixo", "Primastar", "Primera", "Pulsar",
    "Qashqai", "Silvia", "Skyline", "Sunny", "Terrano", "Townstar", "Vanette",
    "X-Trail", "Z",
  ],
  Mazda: [
    "121", "323", "626", "929", "BT-50", "CX-3", "CX-30", "CX-5", "CX-50",
    "CX-60", "CX-7", "CX-80", "CX-9", "CX-90", "MPV", "MX-30", "MX-5", "MX-6",
    "Mazda2", "Mazda3", "Mazda5", "Mazda6", "Premacy", "RX-7", "RX-8",
    "Tribute", "Xedos 6", "Xedos 9",
  ],
  Suzuki: [
    "Across", "Alto", "Baleno", "Cappuccino", "Carry", "Grand Vitara", "Ignis",
    "Jimny", "Kizashi", "Liana", "Samurai", "S-Cross", "Splash", "SX4",
    "Swace", "Swift", "Vitara", "Wagon R", "X-90",
  ],
  Mitsubishi: [
    "3000GT", "ASX", "Carisma", "Colt", "Eclipse", "Eclipse Cross", "FTO",
    "Galant", "Grandis", "GTO", "i-MiEV", "L200", "Lancer", "Lancer Evolution",
    "Mirage", "Outlander", "Pajero", "Pajero Pinin", "Pajero Sport", "Sapporo",
    "Shogun", "Sigma", "Space Star", "Space Wagon", "Starion",
  ],
  Subaru: [
    "B9 Tribeca", "Baja", "BRZ", "Crosstrek", "Forester", "Impreza", "Justy",
    "Legacy", "Levorg", "Outback", "SVX", "Solterra", "Tribeca", "Trezia",
    "WRX", "WRX STI", "XV",
  ],
  Lexus: ["CT", "ES", "GS", "GX", "HS", "IS", "LBX", "LC", "LFA", "LM", "LS", "LX", "NX", "RC", "RX", "RZ", "SC", "UX"],
  Infiniti: ["EX", "FX", "G", "J30", "M", "Q30", "Q40", "Q45", "Q50", "Q60", "Q70", "QX30", "QX4", "QX50", "QX55", "QX56", "QX60", "QX70", "QX80"],
  Daihatsu: ["Charade", "Copen", "Cuore", "Hijet", "Materia", "Move", "Rocky", "Sirion", "Terios", "Trevis", "YRV"],

  // Coréennes
  Hyundai: [
    "Accent", "Atos", "Bayon", "Coupe", "Elantra", "Excel", "Galloper",
    "Genesis Coupe", "Getz", "Grandeur", "H1", "H350", "i10", "i20", "i30",
    "i40", "Inster", "Ioniq", "Ioniq 5", "Ioniq 6", "Ioniq 7", "Ioniq 9",
    "ix20", "ix35", "ix55", "Kona", "Lantra", "Matrix", "Nexo", "Pony",
    "Santa Fe", "Sonata", "Staria", "Terracan", "Tiburon", "Trajet", "Tucson",
    "Veloster",
  ],
  Kia: [
    "Carens", "Carnival", "Ceed", "Cerato", "EV3", "EV4", "EV5", "EV6", "EV9",
    "Forte", "K2500", "K2700", "K3", "K5", "K9", "Magentis", "Mohave", "Niro",
    "Niro EV", "Optima", "Picanto", "Pregio", "Pride", "ProCeed", "Rio",
    "Sedona", "Seltos", "Sephia", "Shuma", "Sorento", "Soul", "Spectra",
    "Sportage", "Stinger", "Stonic", "Telluride", "Venga", "XCeed", "e-Niro",
  ],
  Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80", "GV90"],
  SsangYong: ["Actyon", "Korando", "Kyron", "Musso", "Rexton", "Rodius", "Stavic", "Tivoli", "Torres", "XLV"],

  // Américaines
  Ford: [
    "Aerostar", "B-Max", "Bronco", "C-Max", "Capri", "Cortina", "Cougar",
    "Crown Victoria", "EcoSport", "Edge", "Escape", "Escort", "Expedition",
    "Explorer", "F-150", "Fairlane", "Fiesta", "Five Hundred", "Flex",
    "Focus", "Freestar", "Fusion", "Galaxy", "Granada", "Ka", "Ka+", "Kuga",
    "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Orion", "Probe",
    "Puma", "Ranger", "S-Max", "Scorpio", "Sierra", "Taurus", "Tourneo",
    "Tourneo Connect", "Tourneo Courier", "Tourneo Custom", "Transit",
    "Transit Connect", "Transit Courier", "Transit Custom", "Windstar",
  ],
  Chevrolet: [
    "Astro", "Aveo", "Beretta", "Blazer", "Bolt", "Camaro", "Caprice", "Captiva",
    "Cobalt", "Colorado", "Corvette", "Cruze", "El Camino", "Epica", "Equinox",
    "Express", "HHR", "Impala", "Kalos", "Lacetti", "Lumina", "Malibu", "Matiz",
    "Niva", "Nubira", "Orlando", "Silverado", "Spark", "Suburban", "Tacuma",
    "Tahoe", "Tracker", "Trailblazer", "Trans Sport", "Trax", "Volt",
  ],
  Dodge: [
    "Avenger", "Caliber", "Caravan", "Challenger", "Charger", "Dart", "Durango",
    "Grand Caravan", "Hornet", "Journey", "Magnum", "Neon", "Nitro", "Ram 1500",
    "Ram 2500", "Stratus", "Viper",
  ],
  Jeep: [
    "Avenger", "Cherokee", "Commander", "Commando", "Compass", "Gladiator",
    "Grand Cherokee", "Grand Wagoneer", "Liberty", "Patriot", "Renegade",
    "Wagoneer", "Wrangler",
  ],
  Cadillac: [
    "ATS", "BLS", "CT4", "CT5", "CT6", "CTS", "Celestiq", "DTS", "ELR",
    "Escalade", "Lyriq", "Optiq", "SRX", "STS", "XLR", "XT4", "XT5", "XT6", "XTS",
  ],
  Tesla: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster", "Semi"],
  Chrysler: ["200", "300", "300C", "Crossfire", "Grand Voyager", "LeBaron", "Neon", "PT Cruiser", "Pacifica", "Sebring", "Town & Country", "Voyager"],
  GMC: ["Acadia", "Canyon", "Envoy", "Hummer EV", "Hummer EV SUV", "Jimmy", "Savana", "Sierra", "Terrain", "Yukon"],
  Lincoln: ["Aviator", "Continental", "Corsair", "MKC", "MKS", "MKT", "MKX", "MKZ", "Mark LT", "Nautilus", "Navigator", "Town Car"],
  Buick: ["Cascada", "Century", "Enclave", "Encore", "Envision", "LaCrosse", "Lucerne", "Park Avenue", "Regal", "Riviera", "Skylark", "Verano"],

  // Britanniques
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Freelander", "LR2", "LR3", "LR4",
    "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar",
  ],
  Jaguar: [
    "E-Pace", "E-Type", "F-Pace", "F-Type", "I-Pace", "Mark 2", "S-Type",
    "X-Type", "XE", "XF", "XJ", "XJR", "XK", "XKR",
  ],
  Bentley: ["Arnage", "Azure", "Bentayga", "Brooklands", "Continental GT", "Continental Flying Spur", "Flying Spur", "Mulsanne", "Turbo R"],
  "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Silver Cloud", "Silver Shadow", "Silver Spur", "Silver Wraith", "Spectre", "Wraith"],
  "Aston Martin": ["DB9", "DB11", "DB12", "DBS", "DBX", "Rapide", "V8 Vantage", "V12 Vantage", "Valkyrie", "Vantage", "Vanquish", "Virage"],
  McLaren: ["540C", "570S", "600LT", "620R", "650S", "675LT", "720S", "750S", "765LT", "Artura", "GT", "MP4-12C", "P1", "Senna", "Speedtail"],
  Lotus: ["Eletre", "Elise", "Emeya", "Emira", "Esprit", "Europa", "Evija", "Evora", "Exige"],
  MG: ["3", "MG3", "MG4", "MG5", "MG6", "MG7", "Marvel R", "Cyberster", "ZS", "ZR", "ZT", "HS", "MGB", "MGF", "TF", "Maestro", "Montego"],

  // Suédoises
  Volvo: [
    "240", "440", "460", "480", "740", "850", "940", "960", "C30", "C40 Recharge",
    "C70", "EM90", "EX30", "EX40", "EX60", "EX90", "S40", "S60", "S70", "S80",
    "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90",
  ],
  Saab: ["9-2X", "9-3", "9-4X", "9-5", "9-7X", "99", "900", "9000"],

  // Espagnoles
  Seat: ["Alhambra", "Altea", "Arona", "Ateca", "Cordoba", "Exeo", "Ibiza", "Inca", "Leon", "Marbella", "Mii", "Tarraco", "Toledo"],
  Cupra: ["Ateca", "Born", "Formentor", "Leon", "Raval", "Tavascan", "Terramar"],

  // Tchèques
  Skoda: [
    "105", "120", "130", "Citigo", "Enyaq", "Fabia", "Favorit", "Felicia",
    "Forman", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Praktik", "Rapid",
    "Roomster", "Scala", "Superb", "Yeti",
  ],

  // Roumaines
  Dacia: ["1100", "1300", "1310", "Bigster", "Dokker", "Duster", "Jogger", "Lodgy", "Logan", "Pickup", "Sandero", "Solenza", "Spring"],

  // Chinoises
  BYD: ["Atto 2", "Atto 3", "Dolphin", "Dolphin Surf", "Han", "Han L", "Qin", "Seal", "Seal U", "Sealion 6", "Sealion 7", "Song", "Stealth", "Tang", "Yuan Plus"],
  "Lynk & Co": ["01", "02", "03", "05", "06", "07", "08", "09"],
  Polestar: ["1", "2", "3", "4", "5", "6", "7"],
  NIO: ["EC6", "EC7", "EL6", "EL7", "EL8", "ES6", "ES8", "ET5", "ET5 Touring", "ET7", "ET9", "Onvo L60"],
  Xpeng: ["G3", "G6", "G8", "G9", "P5", "P7", "P7+", "X9"],
  Aiways: ["U5", "U6"],
  Geely: ["Atlas", "Boyue", "Coolray", "Emgrand", "Galaxy E5", "Geometry C", "Tugella", "Vision"],
}

export const carBrands = Object.keys(carModels).sort()
