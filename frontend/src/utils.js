import { eventDefinitions, severityLabels, setupSteps } from "./constants";

export function formatDateTime(value) {
  // Her gjør vi tidspunktet mer leselig, slik at dere raskere ser når noe skjedde.
  if (!value) {
    return "Ikke oppdatert ennå";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getRiskStatus(alerts = []) {
  // Denne funksjonen lager en enkel status som oppsummerer alarmsituasjonen øverst på siden.
  if (alerts.some((alert) => alert.severity === "high")) {
    return { label: "Høy aktivitet", tone: "severity-high" };
  }

  if (alerts.some((alert) => alert.severity === "medium")) {
    return { label: "Noe må undersøkes", tone: "severity-medium" };
  }

  return { label: "Ingen alarmer nå", tone: "severity-low" };
}

export function getSeverityLabel(value) {
  return severityLabels[value] || value || "Ukjent";
}

export function getEventLabel(id) {
  return eventDefinitions[id] || "Annen hendelse";
}

export function truncateText(value, maxLength = 170) {
  // Lange meldinger kuttes ned slik at tabellen fortsatt er oversiktlig å lese.
  if (!value) {
    return "Ingen melding tilgjengelig.";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function buildDerivedMachines(payload) {
  // Hvis miljødata mangler, prøver vi å hente maskinnavn fra resten av datasettet.
  const set = new Set();

  for (const item of payload.serverStatus || []) {
    if (item.computer) {
      set.add(item.computer);
    }
  }

  for (const item of payload.recentEvents || []) {
    if (item.machine) {
      set.add(item.machine);
    }
  }

  return [...set];
}

export function getEnvironment(payload) {
  // Her samler vi den viktigste informasjonen om labmiljøet på ett sted.
  const environment = payload.environment || {};
  const monitoredComputers =
    environment.monitoredComputers && environment.monitoredComputers.length
      ? environment.monitoredComputers
      : buildDerivedMachines(payload);

  return {
    domain: environment.domain || "Ikke satt ennå",
    collectorServer: environment.collectorServer || "Ikke satt ennå",
    monitoredComputers,
    source: environment.source || "Ukjent kilde",
    dataMode: environment.dataMode || "sample",
  };
}

export function isLiveData(payload) {
  return getEnvironment(payload).dataMode === "live";
}

export function isServerName(name) {
  return /^SRV[-_]/i.test(name || "");
}

export function countServers(names) {
  return names.filter((name) => isServerName(name)).length;
}

export function countClients(names) {
  return names.filter((name) => !isServerName(name)).length;
}

export function buildFocusItems(payload, liveData) {
  // Her viser frontend ulike hjelpetekster avhengig av om vi har ekte data eller ikke.
  if (!liveData) {
    return setupSteps;
  }

  const metrics = payload.metrics || {};
  const items = [];

  if ((metrics.failedLogonsLastWindow || 0) > 0) {
    items.push({
      title: "Se på mislykkede pålogginger",
      description:
        "Finn brukere og maskiner som går igjen. Dette er ofte første spor i analysen.",
    });
  }

  if ((metrics.gpoIssuesLastWindow || 0) > 0) {
    items.push({
      title: "Sjekk GPO og DNS",
      description:
        "Hvis policy ikke treffer riktig, må dere sjekke OU, DNS og gpresult på den berørte klienten.",
    });
  }

  if ((metrics.serviceFailuresLastWindow || 0) > 0) {
    items.push({
      title: "Kontroller tjenester på serverne",
      description:
        "Se hvilken tjeneste som har stoppet, og vurder hvilken del av domenet som blir påvirket.",
    });
  }

  if ((metrics.defenderAlertsLastWindow || 0) > 0 || (metrics.sysmonEventsLastWindow || 0) > 0) {
    items.push({
      title: "Undersøk sikkerhetshendelser",
      description:
        "Bruk Event ID, maskinnavn og tidspunkt for å forklare om hendelsen virker normal eller mistenkelig.",
    });
  }

  if (!items.length) {
    items.push({
      title: "Bruk hendelsene som utgangspunkt",
      description:
        "Hvis det ikke er tydelige alarmer, kan dere starte med de nyeste hendelsene og forklare hva de betyr.",
    });
  }

  return items.slice(0, 4);
}
