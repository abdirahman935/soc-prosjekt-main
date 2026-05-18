// Disse kortene viser nøkkeltall når dashboardet mottar ekte data fra laben.
export const metricDefinitions = [
  ["failedLogonsLastWindow", "Feil passord", "Mislykkede pålogginger i siste periode."],
  ["lockedAccountsLastWindow", "Låste kontoer", "Brukere som har blitt låst."],
  ["serviceFailuresLastWindow", "Tjenestefeil", "Servertjenester som har stoppet."],
  ["gpoIssuesLastWindow", "GPO-feil", "Klienter eller servere som ikke har fått riktig policy."],
  ["defenderAlertsLastWindow", "Defender-varsler", "Varsler fra Microsoft Defender."],
  ["sysmonEventsLastWindow", "Sysmon-hendelser", "Utvalgte prosess- og nettverkshendelser."],
];

// Disse stegene vises når dashboardet ennå ikke er koblet til ekte data fra Windows-laben.
export const setupSteps = [
  {
    title: "1. Sett opp domenet",
    description:
      "Opprett domenekontrolleren i Windows Server, og sørg for at domenet fungerer før dere går videre.",
  },
  {
    title: "2. Koble klient-PC-er",
    description:
      "Legg klientene inn i domenet og test at innlogging, DNS og grunnleggende tilgang virker som det skal.",
  },
  {
    title: "3. Slå på logging",
    description:
      "Aktiver relevante logger, bruk WEF og Sysmon, og sørg for at collector-serveren faktisk mottar hendelser.",
  },
  {
    title: "4. Oppdater dashboardet",
    description:
      "Når eksporten fra Windows Server kjører, skal denne siden vise ekte hendelser fra laben deres.",
  },
];

// Denne oversikten gjør Event ID-ene mer lesbare
export const eventDefinitions = {
  1: "Prosess startet",
  3: "Nettverkstilkobling",
  11: "Fil opprettet",
  13: "Register endret",
  22: "DNS-spørring",
  1030: "GPO-feil",
  1058: "GPO-feil",
  1116: "Defender-varsel",
  1117: "Defender-oppfølging",
  1118: "Defender-oppfølging",
  1119: "Defender-oppfølging",
  4625: "Mislykket pålogging",
  4740: "Konto låst",
  7031: "Tjeneste stoppet",
  7034: "Tjeneste stoppet",
};

export const severityLabels = {
  high: "Høy",
  medium: "Middels",
  low: "Lav",
};

export const serviceStatusLabels = {
  Running: "Kjører",
  Stopped: "Stoppet",
};
