"use client";

import { useEffect, useMemo, useState } from "react";

type CustomerResult = {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  city?: string | null;
};

type JobResult = {
  job_id: string;
  service_type: string;
  scheduled_date?: string | null;
  address?: string | null;
  city?: string | null;
};

type LeadResult = {
  lead_id: string;
  first_name: string;
  last_name: string;
  estimated_job_value?: number | null;
  city?: string | null;
};

type SearchResults = {
  customers: CustomerResult[];
  jobs: JobResult[];
  leads: LeadResult[];
};

type SearchStatus = "idle" | "loading" | "error";

const emptyResults: SearchResults = { customers: [], jobs: [], leads: [] };

function formatDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-CA");
}

function formatName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || "-";
}

function formatLeadValue(value?: number | null) {
  if (!value) return "";
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value);
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [status, setStatus] = useState<SearchStatus>("idle");

  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!shouldSearch) {
      setResults(emptyResults);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          setStatus("error");
          return;
        }
        setResults((json?.data as SearchResults) ?? emptyResults);
        setStatus("idle");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setStatus("error");
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery, shouldSearch]);

  const hasResults = useMemo(
    () => results.customers.length + results.jobs.length + results.leads.length > 0,
    [results]
  );

  return (
    <div className="global-search">
      <input
        className="input global-search-input"
        placeholder="Rechercher clients, jobs, prospects"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {shouldSearch ? (
        <div className="card global-search-results">
          {status === "loading" ? (
            <div className="card-meta">Recherche en cours...</div>
          ) : null}
          {status === "error" ? (
            <div className="card-meta">Recherche indisponible.</div>
          ) : null}
          {status === "idle" && !hasResults ? (
            <div className="card-meta">Aucun resultat.</div>
          ) : null}
          {status === "idle" && hasResults ? (
            <div className="stack">
              <div>
                <div className="card-label">Clients</div>
                {results.customers.length ? (
                  <div className="list">
                    {results.customers.map((customer) => (
                      <div className="list-item" key={customer.customer_id} style={{ cursor: "default" }}>
                        <div>
                          <strong>{formatName(customer.first_name, customer.last_name)}</strong>
                          <div className="card-meta">
                            {customer.phone ?? customer.city ?? ""}
                          </div>
                        </div>
                        <span className="tag">Client</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-meta">Aucun resultat.</div>
                )}
              </div>
              <div>
                <div className="card-label">Jobs</div>
                {results.jobs.length ? (
                  <div className="list">
                    {results.jobs.map((job) => (
                      <div className="list-item" key={job.job_id} style={{ cursor: "default" }}>
                        <div>
                          <strong>Job #{job.job_id}</strong>
                          <div className="card-meta">
                            {job.service_type} {job.scheduled_date ? `· ${formatDate(job.scheduled_date)}` : ""}
                          </div>
                          {job.address || job.city ? (
                            <div className="card-meta">{[job.address, job.city].filter(Boolean).join(", ")}</div>
                          ) : null}
                        </div>
                        <span className="tag">Job</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-meta">Aucun resultat.</div>
                )}
              </div>
              <div>
                <div className="card-label">Prospects</div>
                {results.leads.length ? (
                  <div className="list">
                    {results.leads.map((lead) => (
                      <div className="list-item" key={lead.lead_id} style={{ cursor: "default" }}>
                        <div>
                          <strong>{formatName(lead.first_name, lead.last_name)}</strong>
                          <div className="card-meta">
                            {lead.city ?? ""}
                            {lead.estimated_job_value ? ` · ${formatLeadValue(lead.estimated_job_value)}` : ""}
                          </div>
                        </div>
                        <span className="tag">Prospect</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card-meta">Aucun resultat.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
