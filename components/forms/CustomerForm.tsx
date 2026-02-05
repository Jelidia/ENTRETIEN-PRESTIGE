"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizePhoneE164 } from "@/lib/smsTemplates";

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

export default function CustomerForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    type: "residential",
    address: "",
    city: "",
    postalCode: "",
  });
  const [status, setStatus] = useState("");
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
    const trimmedPhone = form.phone.trim();
    const normalizedPhone = trimmedPhone ? normalizePhoneE164(trimmedPhone) : "";
    if (trimmedPhone && !normalizedPhone) {
      setStatus("Téléphone invalide. Utilisez le format (514) 555-0123.");
      return;
    }
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        phone: normalizedPhone ?? "",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Impossible de créer le client");
      return;
    }

    setStatus("Client enregistré.");
    window.location.reload();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="stack">
        <div className="form-row">
          <label className="label" htmlFor="firstName">Prénom</label>
          <input
            id="firstName"
            className="input"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label className="label" htmlFor="lastName">Nom</label>
          <input
            id="lastName"
            className="input"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="email">Courriel</label>
        <input
          id="email"
          className="input"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="phone">Téléphone</label>
          <input
            id="phone"
            className="input"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="(514) 555-0123"
          />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="type">Type</label>
        <select
          id="type"
          className="select"
          value={form.type}
          onChange={(event) => updateField("type", event.target.value)}
        >
          <option value="residential">Résidentiel</option>
          <option value="commercial">Commercial</option>
          <option value="industrial">Industriel</option>
        </select>
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
      <div className="stack">
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
      <button className="button-primary" type="submit">
        Enregistrer le client
      </button>
      {status ? <div className="hint">{status}</div> : null}
    </form>
  );
}
