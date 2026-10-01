import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { emptyProfile, profileStorageKey, type CareerProfile } from "../lib/career-data";

type CareerContextValue = {
  profile: CareerProfile;
  updateProfile: (patch: Partial<CareerProfile>) => void;
  replaceProfile: (profile: CareerProfile) => void;
  resetProfile: () => void;
};

const CareerContext = createContext<CareerContextValue | null>(null);

function loadProfile(): CareerProfile {
  try {
    const saved = window.localStorage.getItem(profileStorageKey());
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<CareerProfile>;
      if (parsed.resumeUpdatedAt) return { ...emptyProfile, ...parsed };
    }
  } catch {
    // Storage can be disabled in private browsing; the in-memory profile still works.
  }
  return emptyProfile;
}

export function CareerProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CareerProfile>(() => loadProfile());

  useEffect(() => {
    try {
      window.localStorage.setItem(profileStorageKey(), JSON.stringify(profile));
    } catch {
      // Keep the session usable when localStorage is unavailable.
    }
  }, [profile]);

  const value = useMemo(() => ({
    profile,
    updateProfile: (patch: Partial<CareerProfile>) => setProfile((current) => ({ ...current, ...patch })),
    replaceProfile: (next: CareerProfile) => setProfile(next),
    resetProfile: () => setProfile(emptyProfile),
  }), [profile]);

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
}

export function useCareer() {
  const value = useContext(CareerContext);
  if (!value) throw new Error("useCareer must be used inside CareerProvider");
  return value;
}
