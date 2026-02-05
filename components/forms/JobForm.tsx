"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CompanyService = {
  service_id: string;
  name: string;
  active: boolean;
};

type CustomerOption = {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  city?: string | null;
};

type JobFormValues = {
  customerId: string;
  serviceType: string;
  servicePackage: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  address: string;
  city: string;
  postalCode: string;
  estimatedRevenue: string;
  description: string;
};

type JobFormProps = {
  prefill?: Partial<JobFormValues> | null;
  prefillToken?: string | null;
};

type JobPriceRow = {
  job_id: string;
  customer_id?: string | null;
  scheduled_date?: string | null;
  actual_revenue?: number | null;
  estimated_revenue?: number | null;
};

type QuickDateOption = { label: string; value: string };

type AddressSelection = {
  address?: string;
  city?: string;
  postalCode?: string;
};

type PlaceComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type PlaceGeometry = {
  location?: {
    lat: () => number;
    lng: () => number;
  };
};

type PlaceResult = {
  formatted_address?: string;
  address_components?: PlaceComponent[];
  geometry?: PlaceGeometry;
};

type MapsEventListener = {
  remove: () => void;
};

type PlacesAutocomplete = {
  addListener: (event: string, handler: () => void) => MapsEventListener;
  getPlace: () => PlaceResult;
};

type GoogleMapsApi = {
  maps?: {
    places?: {
      Autocomplete: new (
        input: HTMLInputElement,
        options?: { types?: string[]; fields?: string[] }
      ) => PlacesAutocomplete;
    };
  };
};

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
let placesLoader: Promise<void> | null = null;

function getGoogle(): GoogleMapsApi | null {
  if (typeof window === "undefined") return null;
  return (window as { google?: GoogleMapsApi }).google ?? null;
}

function loadPlacesScript() {
  if (!mapsKey) return Promise.resolve();
  const googleApi = getGoogle();
  if (googleApi?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }
  if (placesLoader) return placesLoader;
  placesLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-places='true']");
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-places", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("places_load_failed"));
    document.head.appendChild(script);
  });
  return placesLoader;
}

function getComponent(components: PlaceComponent[], type: string) {
  return components.find((component) => component.types.includes(type));
}

function parsePlace(place: PlaceResult): AddressSelection {
  const components = place.address_components ?? [];
  const streetNumber = getComponent(components, "street_number")?.long_name ?? "";
  const route = getComponent(components, "route")?.long_name ?? "";
  const city =
    getComponent(components, "locality")?.long_name ??
    getComponent(components, "postal_town")?.long_name ??
    getComponent(components, "administrative_area_level_3")?.long_name ??
    getComponent(components, "administrative_area_level_2")?.long_name ??
    "";
  const postalCode = getComponent(components, "postal_code")?.long_name ?? "";
  const addressLine = [streetNumber, route].filter(Boolean).join(" ");
  const fallbackAddress = place.formatted_address ?? "";

  return {
    address: addressLine || fallbackAddress,
    city,
    postalCode,
  };
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function getFirstMonday(baseDate: Date) {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const offset = (8 - firstOfMonth.getDay()) % 7;
  let firstMonday = new Date(year, month, 1 + offset);
  if (firstMonday < base) {
    const nextMonth = new Date(year, month + 1, 1);
    const nextOffset = (8 - nextMonth.getDay()) % 7;
    firstMonday = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1 + nextOffset);
  }
  return firstMonday;
}

function getQuickDateOptions(baseDate = new Date()): QuickDateOption[] {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return [
    { label: "Demain", value: toDateInputValue(addDays(base, 1)) },
    { label: "Semaine prochaine", value: toDateInputValue(addDays(base, 7)) },
    { label: "Premier lundi du mois", value: toDateInputValue(getFirstMonday(base)) },
  ];
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const raw = value.length <= 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-CA");
}

const defaultForm: JobFormValues = {
  customerId: "",
  serviceType: "",
  servicePackage: "",
  scheduledDate: "",
  scheduledStartTime: "",
  scheduledEndTime: "",
  address: "",
  city: "",
  postalCode: "",
  estimatedRevenue: "",
  description: "",
};

export default function JobForm({ prefill = null, prefillToken = null }: JobFormProps) {
  const [form, setForm] = useState<JobFormValues>(() => ({ ...defaultForm, ...(prefill ?? {}) }));
  const [status, setStatus] = useState("");
  const [services, setServices] = useState<CompanyService[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerLimit, setCustomerLimit] = useState(25);
  const [jobPrices, setJobPrices] = useState<JobPriceRow[]>([]);
  const lastPrefillTokenRef = useRef<string | null>(null);
  const quickDates = getQuickDateOptions();
  const addressInputRef = useRef<HTMLInputElement>(null);

  const handleAddressSelect = useCallback((selection: AddressSelection) => {
    setForm((prev) => ({
      ...prev,
      address: selection.address ?? prev.address,
      city: selection.city ?? prev.city,
      postalCode: selection.postalCode ?? prev.postalCode,
    }));
  }, []);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/company/services")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        const data = Array.isArray(json?.data) ? json.data : [];
        setServices(data.filter((service: CompanyService) => service.active !== false));
      })
      .catch(() => {
        if (!mounted) return;
        setServices([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!prefill || !prefillToken) return;
    if (lastPrefillTokenRef.current === prefillToken) return;
    lastPrefillTokenRef.current = prefillToken;
    setForm({ ...defaultForm, ...prefill });
    setStatus("");
  }, [prefill, prefillToken]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        const data = Array.isArray(json?.data) ? json.data : [];
        setJobPrices(data);
      })
      .catch(() => {
        if (!mounted) return;
        setJobPrices([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/customers")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        const data = Array.isArray(json?.data) ? json.data : [];
        setCustomers(data);
      })
      .catch(() => {
        if (!mounted) return;
        setCustomers([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const visibleCustomers = customers.slice(0, customerLimit);

  const lastPriceInfo = useMemo<null | { amount: number; dateLabel: string }>(() => {
    const customerId = form.customerId.trim();
    if (!customerId) return null;
    const matches = jobPrices
      .filter((job) => job.customer_id === customerId)
      .map((job) => {
        const amount = job.actual_revenue ?? job.estimated_revenue;
        if (amount === null || amount === undefined) return null;
        const timestamp = job.scheduled_date ? new Date(job.scheduled_date).getTime() : 0;
        return {
          amount,
          timestamp,
          dateLabel: formatDate(job.scheduled_date ?? undefined),
        };
      })
      .filter(Boolean) as Array<{ amount: number; timestamp: number; dateLabel: string }>;

    if (!matches.length) return null;
    matches.sort((a, b) => b.timestamp - a.timestamp);
    return { amount: matches[0].amount, dateLabel: matches[0].dateLabel };
  }, [form.customerId, jobPrices]);

  useEffect(() => {
    const input = addressInputRef.current;
    if (!input || !mapsKey) return;
    let active = true;
    let listener: MapsEventListener | null = null;

    void loadPlacesScript()
      .then(() => {
        if (!active) return;
        const googleApi = getGoogle();
        const Autocomplete = googleApi?.maps?.places?.Autocomplete;
        if (!Autocomplete || !addressInputRef.current) return;

        const autocomplete = new Autocomplete(addressInputRef.current, {
          types: ["address"],
          fields: ["address_components", "formatted_address", "geometry"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          handleAddressSelect(parsePlace(autocomplete.getPlace()));
        });
      })
      .catch(() => null);

    return () => {
      active = false;
      if (listener) listener.remove();
    };
  }, [handleAddressSelect]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Impossible de créer le travail");
      return;
    }

    setStatus("Travail créé.");
    window.location.reload();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="label" htmlFor="customerId">ID client</label>
        <input
          id="customerId"
          className="input"
          list="job-form-customers"
          value={form.customerId}
          onChange={(event) => updateField("customerId", event.target.value)}
          required
        />
        <datalist id="job-form-customers">
          {visibleCustomers.map((customer) => {
            const name = `${customer.first_name} ${customer.last_name}`.trim();
            const meta = [customer.phone, customer.city].filter(Boolean).join(" · ");
            return (
              <option
                key={customer.customer_id}
                value={customer.customer_id}
                label={[name, meta].filter(Boolean).join(" — ")}
              />
            );
          })}
        </datalist>
        {customers.length > customerLimit ? (
          <button
            className="button-ghost"
            type="button"
            onClick={() => setCustomerLimit((prev) => prev + 25)}
          >
            Afficher plus de clients
          </button>
        ) : null}
      </div>
      <div className="form-row">
        <label className="label" htmlFor="serviceType">Type de service</label>
        <input
          id="serviceType"
          className="input"
          value={form.serviceType}
          onChange={(event) => updateField("serviceType", event.target.value)}
          placeholder="Ex. Type de service"
          required
          list="company-service-types"
        />
        <datalist id="company-service-types">
          {services.map((service) => (
            <option key={service.service_id} value={service.name} />
          ))}
        </datalist>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="servicePackage">Forfait</label>
        <input
          id="servicePackage"
          className="input"
          value={form.servicePackage}
          onChange={(event) => updateField("servicePackage", event.target.value)}
          placeholder="Ex. Standard"
          required
        />
      </div>
      <div className="grid-3">
        <div className="form-row">
          <label className="label" htmlFor="scheduledDate">Date</label>
          <input
            id="scheduledDate"
            className="input"
            type="date"
            value={form.scheduledDate}
            onChange={(event) => updateField("scheduledDate", event.target.value)}
            required
          />
          <div className="table-actions" style={{ marginTop: 6 }}>
            {quickDates.map((option) => (
              <button
                key={option.label}
                className="tag"
                type="button"
                onClick={() => updateField("scheduledDate", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label className="label" htmlFor="start">Début</label>
          <input
            id="start"
            className="input"
            type="time"
            value={form.scheduledStartTime}
            onChange={(event) => updateField("scheduledStartTime", event.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="end">Fin</label>
          <input
            id="end"
            className="input"
            type="time"
            value={form.scheduledEndTime}
            onChange={(event) => updateField("scheduledEndTime", event.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="address">Adresse</label>
        <input
          id="address"
          className="input"
          ref={addressInputRef}
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          autoComplete="street-address"
        />
      </div>
      <div className="grid-2">
        <div className="form-row">
          <label className="label" htmlFor="city">Ville</label>
          <input
            id="city"
            className="input"
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="postalCode">Code postal</label>
          <input
            id="postalCode"
            className="input"
            value={form.postalCode}
            onChange={(event) => updateField("postalCode", event.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="estimatedRevenue">Revenu estimé</label>
        <input
          id="estimatedRevenue"
          className="input"
          type="number"
          value={form.estimatedRevenue}
          onChange={(event) => updateField("estimatedRevenue", event.target.value)}
        />
        {lastPriceInfo ? (
          <div className="hint">
            Dernier prix payé : {formatMoney(lastPriceInfo.amount)}
            {lastPriceInfo.dateLabel ? ` · ${lastPriceInfo.dateLabel}` : ""}
          </div>
        ) : null}
      </div>
      <div className="form-row">
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="textarea"
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </div>
      <button className="button-primary" type="submit">
        Enregistrer le travail
      </button>
      {status ? <div className="hint">{status}</div> : null}
    </form>
  );
}
