export const enPagesA = {
  diagnosticPage: {
    title: "Your estimate in seconds",
    subtitle:
      "Get a reliable, transparent estimate for car repairs. Compare options and make the best decision.",
    badge: "Estimates validated by professionals",
    disclaimerTitle: "Disclaimer",
    disclaimerBody:
      "These estimates are designed to give you a sound diagnosis and pricing aligned with the Belgian market. Partner garages commit to honouring the amounts stated unless a major technical issue is found during the physical inspection.",
  },
  vente: {
    title: "Selling your vehicle",
    subtitle:
      "Enter your vehicle details and get an indicative ideal sale price. Partner garages will be notified and will contact you as soon as possible.",
    badge: "Fast, reliable resale value estimate",
    disclaimerTitle: "Disclaimer",
    disclaimerP1:
      "These estimates provide an indicative trade-in range and analysis aligned with the Belgian market. Partner garages aim to align offers with these ranges, subject to physical verification of the vehicle.",
    disclaimerP2:
      "Under- or overstating the real condition is counterproductive: the garage will inspect the vehicle anyway. Large discrepancies may change the trade-in offer and harm trust with the professional.",
    comingTitle: "Trade-in estimate",
    comingBody:
      "This feature is being rolled out. We are preparing a dedicated flow to estimate your vehicle’s trade-in value with our partner garages in Belgium. It will be available soon—thank you for your patience.",
    goDiagnostic: "Go to diagnostics",
  },
  cookies: {
    text: "We use audience metrics to improve PitStop. You can accept or decline these non-essential cookies.",
    reject: "Decline",
    accept: "Accept",
  },
  partner: {
    sendFail: "Could not send the request.",
    success: "Your partner request was sent. Our team will get back to you shortly.",
    toastOk: "Request sent!",
    toastOkDesc: "Our team will get back to you shortly.",
    toastErr: "Send error",
    labelGarage: "Garage name",
    phGarage: "e.g. Dupont Garage",
    labelContact: "Contact person",
    phContact: "e.g. John Smith",
    labelEmail: "Work email",
    phEmail: "contact@yourgarage.be",
    labelPhone: "Phone",
    labelCity: "City",
    phCity: "e.g. Waterloo",
    labelServices: "Main services",
    phServices: "e.g. mechanics, bodywork, tyres",
    labelMessage: "Message",
    phMessage:
      "Tell us about your garage, availability, and why you want to join the PitStop network.",
    submit: "Send partner request",
    submitting: "Sending...",
  },
  signupWelcome: {
    close: "Close",
    title: "Thanks for joining us!",
    p1:
      "Your account is confirmed. During this testing phase, your feedback helps us improve PitStop.",
    p2: "Thank you for testing the site with us.",
    gift: "As a thank-you, one free diagnostic credit has been added to your balance.",
    ctaDiagnostic: "Start a diagnostic",
    ctaHome: "Continue to home",
  },
  merci: {
    title: "Thank you for taking part!",
    p1:
      "Every visit to PitStop helps us refine the service—we truly appreciate it. During testing, your trust and time make a real difference in building a useful, clear tool for drivers.",
    creditsOutTitle: "Your diagnostic credits are temporarily used up",
    creditsOutP1:
      "You have used the credits on your account. You can buy additional credits anytime on the Credits page (secure payment), subject to accepting the general terms of sale.",
    creditsOutP2:
      "Warm thanks for trying PitStop—even informal feedback helps us see what works and what we can improve.",
    creditsOutAlt:
      "You have used all diagnostic credits planned for this testing phase. What you experienced on the platform matters a great deal for what comes next—thank you again.",
    boxTitle: "Testing phase: access temporarily limited",
    boxP1:
      "PitStop is still evolving: some features remain in testing, but diagnostic credits can be purchased online (Credits page, payment via Stripe).",
    boxP2:
      "Further improvements (Sale journey, partner network, etc.) will follow our roadmap. Thank you for your trust.",
    contactTitle: "Comments or feedback?",
    contactBody: "A note, suggestion, or idea—we read them carefully. Write us at",
    contactBodyEnd: ", we’ll be glad to reply.",
  },
  diagnosticLoader: {
    initial1: "Identifying engine…",
    initial2: "Analysing described symptoms…",
    initial3: "Looking up common faults for this model…",
    initial4: "Calculating price ranges…",
    initial5: "Finalising diagnostic…",
    follow1: "Analysing your answer…",
    follow2: "Refining diagnostic…",
    follow3: "Calculating final estimates…",
    follow4: "Almost ready…",
  },
  fuel: {
    essence: "Petrol",
    diesel: "Diesel",
    hybride: "Hybrid",
    hybrideRechargeable: "Plug-in hybrid",
    electrique: "Electric",
    gpl: "LPG",
    gnv: "CNG",
    ethanolE85: "Ethanol (E85)",
    hydrogene: "Hydrogen",
  },
  trans: {
    manual: "Manual",
    automatic: "Automatic",
    semiAutomatic: "Semi-automatic (automated manual)",
  },
  exceptionBrand: {
    title: "Official dealer required",
    message:
      "For this brand, a visit to an authorised dealer is required. Our partner garages do not have the equipment or approvals to work on this type of vehicle. We recommend contacting the brand’s official network.",
  },
  landingLinks: {
    venteSoonTitle: "Feature being rolled out",
  },
} as const
