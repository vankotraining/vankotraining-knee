export type AthleteIdentityRecord = {
  id: string;
  display_name: string;
  name_key: string | null;
};

export type AthleteIdentityDbError = {
  code?: string | null;
  message?: string | null;
};

type AthleteIdentityPayload = {
  display_name: string;
  name_key: string;
};

type PreparedAthleteIdentity = {
  payload: AthleteIdentityPayload | null;
  error: string | null;
};

type ReconciledAthleteIdentity<T extends AthleteIdentityRecord> = {
  athletes: readonly T[];
  updatedAthlete: T | null;
  errorMessage: string | null;
};

const DUPLICATE_KEY_CODE = "23505";
const GENERIC_UPDATE_ERROR =
  "Klienta se nepodařilo upravit. Původní jméno zůstalo beze změny.";

export function athleteNameKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function prepareAthleteIdentity(displayName: string): PreparedAthleteIdentity {
  const trimmedDisplayName = displayName.trim();

  if (!trimmedDisplayName) {
    return {
      payload: null,
      error: "Jméno klienta nesmí být prázdné.",
    };
  }

  const normalizedNameKey = athleteNameKey(trimmedDisplayName);
  if (!normalizedNameKey) {
    return {
      payload: null,
      error: "Jméno klienta musí obsahovat alespoň písmeno nebo číslo.",
    };
  }

  return {
    payload: {
      display_name: trimmedDisplayName,
      name_key: normalizedNameKey,
    },
    error: null,
  };
}

export function getAthleteIdentityUpdateError(error?: AthleteIdentityDbError | null) {
  if (error?.code === DUPLICATE_KEY_CODE) {
    return "Klient se stejným jménem už existuje. Zvol jiné jméno.";
  }

  return GENERIC_UPDATE_ERROR;
}

export function reconcileAthleteIdentityUpdate<T extends AthleteIdentityRecord>(
  currentAthletes: readonly T[],
  expectedAthleteId: string,
  updatedAthlete: T | null,
  error?: AthleteIdentityDbError | null,
): ReconciledAthleteIdentity<T> {
  if (error || !updatedAthlete || updatedAthlete.id !== expectedAthleteId) {
    return {
      athletes: currentAthletes,
      updatedAthlete: null,
      errorMessage: getAthleteIdentityUpdateError(error),
    };
  }

  const athleteExists = currentAthletes.some(
    (athlete) => athlete.id === expectedAthleteId,
  );
  if (!athleteExists) {
    return {
      athletes: currentAthletes,
      updatedAthlete: null,
      errorMessage: GENERIC_UPDATE_ERROR,
    };
  }

  return {
    athletes: currentAthletes.map((athlete) =>
      athlete.id === expectedAthleteId ? updatedAthlete : athlete,
    ),
    updatedAthlete,
    errorMessage: null,
  };
}
