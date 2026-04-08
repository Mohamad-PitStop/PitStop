export const frGarage = {
  garage: {
    // ── Navigation ────────────────────────────────────────────────────────
    nav: {
      dashboard: "Tableau de bord",
      calendar: "Calendrier",
      reservations: "Réservations",
      employees: "Employés",
      settings: "Paramètres",
      payouts: "Paiements",
      export: "Exporter",
    },

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashboard: {
      title: "Tableau de bord",
      totalAppointments: "Rendez-vous",
      revenue: "Revenus (acomptes)",
      cancellationRate: "Taux d'annulation",
      pendingPayouts: "Paiements en attente",
      thisWeek: "Cette semaine",
      thisMonth: "Ce mois",
      thisYear: "Cette année",
      noData: "Aucune donnée disponible.",
    },

    // ── Calendar ──────────────────────────────────────────────────────────
    calendar: {
      dayView: "Jour",
      weekView: "Semaine",
      monthView: "Mois",
      blockSlot: "Bloquer ce créneau",
      unblockSlot: "Débloquer",
      blocked: "Bloqué",
      booked: "Réservé",
      available: "Disponible",
      closed: "Fermé",
      today: "Aujourd'hui",
    },

    // ── Reservations ──────────────────────────────────────────────────────
    reservations: {
      title: "Réservations",
      contactClient: "Envoyer un e-mail",
      callClient: "Appeler le client",
      cancelReservation: "Annuler la réservation",
      cancelConfirm: "Êtes-vous sûr de vouloir annuler cette réservation ? L'acompte sera remboursé au client.",
      dispute: "Signaler un litige",
      disputeSent: "Votre signalement a été envoyé à PitStop.",
      emailPlaceholder: "Écrivez votre message au client…",
      emailSent: "E-mail envoyé au client.",
      noReservations: "Aucune réservation.",
      status: {
        pending: "En attente",
        paid: "Payé",
        confirmed: "Confirmé",
        cancelled: "Annulé",
      },
      filter: {
        all: "Tous",
        upcoming: "À venir",
        past: "Passés",
      },
      client: "Client",
      date: "Date",
      time: "Heure",
      vehicle: "Véhicule",
      deposit: "Acompte",
      actions: "Actions",
    },

    // ── Employees ─────────────────────────────────────────────────────────
    employees: {
      title: "Gestion des employés",
      invite: "Inviter un employé",
      inviteDescription: "Entrez l'adresse e-mail de l'employé. Il pourra ensuite s'inscrire avec le code de votre garage.",
      remove: "Retirer",
      removeConfirm: "Êtes-vous sûr de vouloir retirer cet employé ?",
      emailPlaceholder: "adresse@email.com",
      invited: "Invité",
      active: "Actif",
      removed: "Retiré",
      garageCode: "Code garage",
      garageCodeDescription: "Communiquez ce code à vos employés pour qu'ils puissent s'inscrire.",
      noEmployees: "Aucun employé invité.",
    },

    // ── Settings ──────────────────────────────────────────────────────────
    settings: {
      title: "Paramètres du garage",
      businessHours: "Horaires d'ouverture",
      businessHoursDescription: "Les horaires d'ouverture sont semi-définitifs. Toute modification fera l'objet d'une approbation par un administrateur PitStop avant d'être appliquée.",
      requestChange: "Demander une modification",
      changeRequested: "Votre demande de modification a été envoyée. Vous serez notifié lorsqu'elle sera traitée.",
      changePending: "Une demande de modification est en cours de traitement.",
      closures: "Fermetures exceptionnelles",
      addClosure: "Ajouter une fermeture",
      closureDate: "Date de fermeture",
      closureReason: "Motif (facultatif)",
      closureMinAdvance: "Les fermetures doivent être programmées au moins 12 heures à l'avance.",
      deleteClosure: "Supprimer",
      garageInfo: "Informations du garage",
      noClosure: "Aucune fermeture programmée.",
    },

    // ── Payouts ───────────────────────────────────────────────────────────
    payouts: {
      title: "Paiements",
      withdraw: "Retirer l'acompte",
      withdrawDisabledTooltip: "Le retrait sera disponible 30 minutes après l'heure du rendez-vous.",
      withdrawConfirm: "Confirmer le retrait de {{amount}} ? Le montant sera viré sur votre IBAN.",
      statusPending: "En attente",
      statusReady: "Disponible",
      statusRequested: "Demandé",
      statusTransferred: "Viré",
      statusCancelled: "Annulé",
      amount: "Montant",
      reservation: "Réservation",
      noPayouts: "Aucun paiement.",
      totalReady: "Total disponible",
      totalTransferred: "Total viré",
    },

    // ── Registration ──────────────────────────────────────────────────────
    registration: {
      title: "Inscription Garage Partenaire",
      subtitle: "Rejoignez le réseau PitStop et recevez des clients.",
      joinExisting: "Je souhaite rejoindre un garage partenaire",
      // Company fields
      companySection: "Informations de l'entreprise",
      companyName: "Nom de l'entreprise",
      bceTva: "Numéro BCE / TVA",
      bceTvaPlaceholder: "0XXX.XXX.XXX",
      address: "Adresse du garage",
      street: "Rue et numéro",
      postalCode: "Code postal",
      city: "Ville",
      iban: "IBAN",
      ibanPlaceholder: "BEXX XXXX XXXX XXXX",
      professionalPhone: "Téléphone professionnel",
      professionalEmail: "E-mail professionnel",
      managerName: "Nom du responsable",
      // Specialties
      specialtiesSection: "Spécialités",
      specialtiesPlaceholder: "Sélectionnez vos spécialités",
      // Business hours
      hoursSection: "Horaires d'ouverture",
      hoursDescription: "Définissez les horaires d'ouverture de votre garage. Ces horaires sont semi-définitifs : toute modification ultérieure nécessitera l'approbation d'un administrateur PitStop.",
      hoursClosed: "Fermé",
      hoursFrom: "De",
      hoursTo: "À",
      // Personal account
      accountSection: "Votre compte personnel",
      name: "Nom complet",
      email: "Adresse e-mail",
      password: "Mot de passe",
      // Employee fields
      employeeSection: "Rejoindre un garage",
      garageCode: "Code garage (8 caractères)",
      garageCodePlaceholder: "Ex. : A3K9M2X7",
      garageCodeHelp: "Demandez ce code à votre employeur.",
      // Submit
      submit: "S'inscrire",
      submitting: "Inscription en cours…",
      pendingApproval: "Votre inscription a été soumise. Après vérification de votre e-mail, votre compte sera examiné par notre équipe avant activation.",
      pendingVerification: "Un e-mail de vérification a été envoyé à votre adresse. Veuillez cliquer sur le lien qu'il contient.",
      // Errors
      errorInvalidIban: "L'IBAN renseigné n'est pas valide.",
      errorInvalidBce: "Le numéro BCE/TVA n'est pas valide.",
      errorInvalidPostalCode: "Indiquez un code postal belge valide (4 chiffres).",
      errorSelectSpecialty: "Sélectionnez au moins une spécialité.",
      errorEmailExists: "Un compte existe déjà avec cet e-mail.",
      errorInvalidGarageCode: "Code garage invalide. Vérifiez auprès de votre employeur.",
      errorEmailNotInvited: "Votre adresse e-mail n'a pas été enregistrée par ce garage. Contactez votre employeur.",
    },

    // ── Specialties ───────────────────────────────────────────────────────
    specialties: {
      carrosserie: "Carrosserie",
      mecanique_generale: "Mécanique générale",
      entretien_basique: "Entretien basique",
      entretien_complet: "Entretien complet",
      electronique_auto: "Électronique automobile",
      climatisation: "Climatisation",
      pneumatiques: "Pneumatiques",
      freinage: "Freinage",
      diagnostic_electronique: "Diagnostic électronique",
      geometrie_parallelisme: "Géométrie / Parallélisme",
      embrayage_transmission: "Embrayage / Transmission",
      echappement: "Échappement",
      vitrage: "Vitrage",
      peinture: "Peinture",
      suspension: "Suspension",
      direction: "Direction",
      electricite_auto: "Électricité automobile",
      revision_controle_technique: "Révision contrôle technique",
    },

    // ── Profile (public) ─────────────────────────────────────────────────
    profile: {
      title: "Profil du garage",
      address: "Adresse",
      specialties: "Spécialités",
      hours: "Horaires d'ouverture",
      bookAppointment: "Prendre rendez-vous",
      closed: "Fermé",
    },

    // ── Days ──────────────────────────────────────────────────────────────
    days: {
      mon: "Lundi",
      tue: "Mardi",
      wed: "Mercredi",
      thu: "Jeudi",
      fri: "Vendredi",
      sat: "Samedi",
      sun: "Dimanche",
    },

    // ── Client-side garage selection ──────────────────────────────────────
    selector: {
      title: "Choisissez un garage",
      subtitle: "Sélectionnez un garage partenaire pour prendre rendez-vous.",
      searchPlaceholder: "Entrez votre code postal",
      noResults: "Aucun garage trouvé à proximité.",
      distance: "{{km}} km",
      viewProfile: "Voir le profil",
      book: "Réserver",
    },

    /** Page liste /garages (parcours client) : lien vers l’espace pro. */
    listPage: {
      proLink: "Vous êtes garagiste partenaire ? Inscription ou espace pro",
    },

    // ── Export ─────────────────────────────────────────────────────────────
    export: {
      title: "Exporter les données",
      csv: "Exporter en CSV",
      pdf: "Exporter en PDF",
      dateRange: "Période",
      from: "Du",
      to: "Au",
    },

    // ── Admin ─────────────────────────────────────────────────────────────
    admin: {
      title: "Gestion des garages",
      approve: "Approuver",
      suspend: "Suspendre",
      pending: "En attente d'approbation",
      approved: "Approuvé",
      suspended: "Suspendu",
      members: "Membres",
      manager: "Responsable",
      hoursRequests: "Demandes de modification d'horaires",
      approveHours: "Approuver",
      rejectHours: "Rejeter",
      payoutRequests: "Demandes de retrait",
      confirmTransfer: "Confirmer le virement",
      transferReference: "Référence du virement",
    },
  },
} as const
