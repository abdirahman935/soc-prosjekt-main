import { isLiveData } from "./utils";

// Først prøver vi Python-backend. Hvis den ikke svarer, bruker vi en enkel lokal eksempelfil.
const sources = [
  { url: "http://127.0.0.1:8001/api/summary", kind: "backend" },
  {
    url: `${process.env.PUBLIC_URL || ""}/data/sample-soc-summary.json`,
    kind: "sample",
  },
];

export async function fetchSocData() {
  let lastError = null;

  for (const source of sources) {
    try {
      const response = await fetch(source.url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data, source, live: isLiveData(data) };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("Kunne ikke hente data til dashboardet.");
}
