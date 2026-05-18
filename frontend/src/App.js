import React, { useEffect, useState } from "react";

import { metricDefinitions, serviceStatusLabels } from "./constants";
import {
  buildFocusItems,
  countClients,
  countServers,
  formatDateTime,
  getEnvironment,
  getEventLabel,
  getRiskStatus,
  isServerName,
  truncateText,
} from "./utils";
import { fetchSocData } from "./api";

function App() {
  const [payload, setPayload] = useState(null);
  const [fatalError, setFatalError] = useState("");
  const [notice, setNotice] = useState("");
  const [dataSource, setDataSource] = useState("Laster...");

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const { data, source, live } = await fetchSocData();

        if (cancelled) {
          return;
        }

        // Her oppdateres selve dashboardet med det nyeste datasettet vi klarer å hente.
        setPayload(data);
        setFatalError("");

        if (source.kind === "backend" && live) {
          setDataSource("Live-data fra Windows-laben");
          setNotice("");
        } else if (source.kind === "backend") {
          setDataSource("Backend uten live-data");
          setNotice(
            "Dashboardet har kontakt med backend, men venter fortsatt på ekte eksport fra Windows Server."
          );
        } else {
          setDataSource("Lokal eksempelfil");
          setNotice(
            "Backend er ikke startet ennå. Derfor vises en tom eksempelside i stedet for ekte SOC-data."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setPayload(null);
          setFatalError(err.message);
        }
      }
    }

    loadSummary();
    // Siden henter nye data jevnlig, slik at den kan brukes som et enkelt overvåkingspanel.
    const intervalId = window.setInterval(loadSummary, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (fatalError) {
    return (
      <main className="page-shell">
        <section className="panel panel-full">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Feil</p>
              <h2>Dashboardet fikk ikke hentet data</h2>
            </div>
          </div>
          <p className="empty-state">{fatalError}</p>
        </section>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="page-shell">
        <section className="panel panel-full">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Starter</p>
              <h2>Laster SOC-dashboardet</h2>
            </div>
          </div>
          <p className="empty-state">Venter på data fra backend eller en lokal eksempelfil.</p>
        </section>
      </main>
    );
  }

  const environment = getEnvironment(payload);
  const liveData = environment.dataMode === "live";
  const risk = getRiskStatus(payload.alerts);
  const monitoredComputers = environment.monitoredComputers || [];
  const serverCount = countServers(monitoredComputers);
  const clientCount = countClients(monitoredComputers);
  const focusItems = buildFocusItems(payload, liveData);
  const events = (payload.recentEvents || []).slice(0, 8);
  const services = (payload.serverStatus || []).slice(0, 6);
  const displayDomain = liveData ? environment.domain : "Windows Server-lab";

  // Hele frontend vises her som en React-komponent.
  return (
    <div className="page-shell">
      <header className="hero">
        <section className="hero-copy">
          <p className="eyebrow">Individuell oppgave i 2IT</p>
          <h1>SOC-dashboard for {displayDomain}</h1>
          <p className="hero-text">
            React- og Python-delen er allerede laget. Oppgaven din er å sette opp Windows Server,
            domene, klient-PC-er og loggsamling slik at denne siden viser ekte data fra laben.
          </p>
        </section>

        <aside className="hero-side">
          <div className={`state-card ${liveData ? "state-live" : "state-waiting"}`}>
            <span className="state-label">
              {liveData ? "Live-data aktiv" : "Venter på live-data"}
            </span>
            <strong>{dataSource}</strong>
          </div>
          <div className="meta-stack">
            <article className="meta-card">
              <span className="meta-label">Domene</span>
              <strong>{environment.domain}</strong>
            </article>
            <article className="meta-card">
              <span className="meta-label">Collector</span>
              <strong>{environment.collectorServer}</strong>
            </article>
            <article className="meta-card">
              <span className="meta-label">Sist oppdatert</span>
              <strong>{formatDateTime(payload.generatedAt)}</strong>
            </article>
          </div>
        </aside>
      </header>

      {notice ? (
        <section className="notice-banner">
          <strong>Merk:</strong> {notice}
        </section>
      ) : null}

      <section className="summary-grid">
        <article className="summary-card">
          <span className="summary-label">Servere</span>
          <strong className="summary-value">{liveData ? serverCount : "—"}</strong>
          <p>Maskiner med serverrolle i oversikten.</p>
        </article>
        <article className="summary-card">
          <span className="summary-label">Klient-PC-er</span>
          <strong className="summary-value">{liveData ? clientCount : "—"}</strong>
          <p>Klienter som er med i datagrunnlaget.</p>
        </article>
        <article className="summary-card">
          <span className="summary-label">Tjenester</span>
          <strong className="summary-value">{liveData ? services.length : "—"}</strong>
          <p>Servertjenester som rapporteres inn nå.</p>
        </article>
        <article className="summary-card">
          <span className="summary-label">Hendelser</span>
          <strong className="summary-value">{liveData ? events.length : "—"}</strong>
          <p>Siste hendelser som vises i tabellen.</p>
        </article>
      </section>

      <main className="dashboard-grid">
        <section className="panel panel-wide">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Oversikt</p>
              <h2>{liveData ? "Hva skjer i laben nå?" : "Her kommer live-dataene deres"}</h2>
            </div>
            <span className={`status-pill ${risk.tone}`}>
              {liveData ? risk.label : "Ikke klar ennå"}
            </span>
          </div>
          <div className="metric-grid">
            {metricDefinitions.map(([key, label, description]) => (
              <article className="metric-card" key={key}>
                <span className="metric-label">{label}</span>
                <strong className="metric-value">
                  {liveData ? payload.metrics?.[key] ?? 0 : "—"}
                </strong>
                <p className="metric-subtext">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">{liveData ? "Fokus" : "Oppsett"}</p>
              <h2>{liveData ? "Hva bør du sjekke nå?" : "Hva må være på plass?"}</h2>
            </div>
          </div>
          <div className="focus-list">
            {focusItems.map((item) => (
              <article className="focus-item" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Miljø</p>
              <h2>Maskiner i oversikten</h2>
            </div>
          </div>
          {liveData && monitoredComputers.length ? (
            <div className="machine-list">
              {monitoredComputers.map((name) => (
                <span
                  key={name}
                  className={`machine-pill ${
                    isServerName(name) ? "machine-server" : "machine-client"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Når Windows-laben sender ekte data, vil servere og klient-PC-er vises her.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Tjenester</p>
              <h2>Status på servertjenester</h2>
            </div>
          </div>
          {liveData && services.length ? (
            <div className="service-list">
              {services.map((service) => (
                <article
                  className="service-card"
                  key={`${service.computer}-${service.service}`}
                >
                  <div>
                    <h3 className="service-role">{service.service}</h3>
                    <p className="service-meta">{service.computer}</p>
                  </div>
                  <span
                    className={`service-status ${
                      service.status === "Running" ? "status-running" : "status-stopped"
                    }`}
                  >
                    {serviceStatusLabels[service.status] || service.status}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Ingen tjenestedata vises ennå. Start med collector-server og sørg for at eksporten
              faktisk kjører.
            </p>
          )}
        </section>

        <section className="panel panel-full">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Hendelser</p>
              <h2>Siste hendelser fra domenet</h2>
            </div>
          </div>
          {liveData && events.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tid</th>
                    <th>Maskin</th>
                    <th>Event ID</th>
                    <th>Type</th>
                    <th>Melding</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={`${event.machine}-${event.id}-${event.timeCreated}`}>
                      <td>{formatDateTime(event.timeCreated)}</td>
                      <td>{event.machine}</td>
                      <td>{event.id}</td>
                      <td>{getEventLabel(event.id)}</td>
                      <td className="event-message">{truncateText(event.message)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">
              Ingen live-hendelser vises ennå. Når klientene er koblet til domenet og loggene
              sendes inn, vil denne tabellen fylles automatisk.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
