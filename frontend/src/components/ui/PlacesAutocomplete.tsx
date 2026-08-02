import { useEffect, useRef, useState, useId } from "react";

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;

type ScriptState = "idle" | "loading" | "ready" | "error";
let scriptState: ScriptState = "idle";
const scriptListeners: Array<(state: ScriptState) => void> = [];

function notifyListeners(state: ScriptState) {
  scriptState = state;
  scriptListeners.forEach((fn) => fn(state));
}

function loadGooglePlacesScript() {
  if (typeof window === "undefined") return;
  if (scriptState !== "idle") return;
  if (!API_KEY) {
    notifyListeners("error");
    return;
  }
  if (document.querySelector(`script[data-gp-autocomplete]`)) {
    notifyListeners("ready");
    return;
  }
  notifyListeners("loading");
  const script = document.createElement("script");
  // Synchronous places library load without loading=async flag so window.google.maps.places is immediately available on load
  script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.dataset.gpAutocomplete = "1";
  script.onload = () => notifyListeners("ready");
  script.onerror = () => notifyListeners("error");
  document.head.appendChild(script);
}

function useGooglePlacesReady(): boolean {
  const [ready, setReady] = useState<boolean>(
    typeof window !== "undefined" &&
      !!(window as any).google?.maps?.places?.Autocomplete
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if google.maps.places is already loaded globally
    if ((window as any).google?.maps?.places?.Autocomplete) {
      setReady(true);
      return;
    }

    const handler = (state: ScriptState) => {
      if (state === "ready") {
        setReady(true);
      }
    };

    scriptListeners.push(handler);
    loadGooglePlacesScript();

    // Fallback polling check in case script was injected elsewhere or delay in namespace init
    const interval = setInterval(() => {
      if ((window as any).google?.maps?.places?.Autocomplete) {
        setReady(true);
        clearInterval(interval);
      }
    }, 200);

    return () => {
      clearInterval(interval);
      const idx = scriptListeners.indexOf(handler);
      if (idx !== -1) scriptListeners.splice(idx, 1);
    };
  }, []);

  return ready;
}

export interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter location…",
  className,
  inputClassName,
  id: externalId,
  "aria-label": ariaLabel,
  disabled,
}: PlacesAutocompleteProps) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const ready = useGooglePlacesReady();

  useEffect(() => {
    if (!ready) return;
    if (!inputRef.current) return;
    if (autocompleteRef.current) return;

    try {
      const g = (window as any).google;
      if (!g?.maps?.places?.Autocomplete) return;

      const ac = new g.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode", "establishment"],
        fields: ["formatted_address", "name", "geometry"],
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const label = place.formatted_address || place.name || inputRef.current?.value || "";
        if (label) onChangeRef.current(label);
      });

      autocompleteRef.current = ac;
    } catch (e) {
      console.warn("Google Places Autocomplete init warning:", e);
    }
  }, [ready]);

  // Handle mousedown/touchstart on .pac-item to ensure selection works inside modals/dialogs
  useEffect(() => {
    const handlePacClick = (e: MouseEvent | TouchEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(".pac-item");
      if (target) {
        e.stopPropagation();
        setTimeout(() => {
          if (inputRef.current?.value) {
            onChangeRef.current(inputRef.current.value);
          }
        }, 50);
      }
    };

    document.addEventListener("mousedown", handlePacClick, true);
    document.addEventListener("touchstart", handlePacClick, true);
    return () => {
      document.removeEventListener("mousedown", handlePacClick, true);
      document.removeEventListener("touchstart", handlePacClick, true);
    };
  }, []);

  const cls = className ?? inputClassName ?? "";

  return (
    <input
      ref={inputRef}
      id={inputId}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      autoComplete="off"
      disabled={disabled}
      className={cls}
    />
  );
}
