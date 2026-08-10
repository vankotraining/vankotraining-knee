export type TindeqPresentationTone = "good" | "warning" | "problem" | "neutral";

export type TindeqRuleType = "protocol" | "contextual" | "descriptive";

export type TindeqPresentationStatus = {
  label: string;
  tone: TindeqPresentationTone;
};

export type TindeqMetricCopy = {
  explanation: string;
  detail?: string;
  ruleType: TindeqRuleType;
};

export const TINDEQ_RULE_TYPE_LABELS: Record<TindeqRuleType, string> = {
  protocol: "Pracovní pravidlo protokolu",
  contextual: "Individuální kontext",
  descriptive: "Popisná hodnota",
};

export const TINDEQ_METRIC_COPY = {
  previousMax: {
    ruleType: "contextual",
    explanation: "Referenční hodnota použitá pro výpočet cílové síly. Samotná hodnota neříká, zda je aktuální série dobrá nebo špatná.",
  },
  prescribedIntensity: {
    ruleType: "descriptive",
    explanation: "Určuje, na jaké části referenčního maxima má být série provedena.",
  },
  targetForce: {
    ruleType: "descriptive",
    explanation: "Síla, kterou se snažíš během pracovního intervalu držet.",
  },
  averageForce: {
    ruleType: "contextual",
    explanation: "Průměrná síla během stabilní části opakování. Pro interpretaci je důležitější její vztah k nastavenému cíli.",
  },
  targetAchievement: {
    ruleType: "protocol",
    explanation: "Ukazuje, jak blízko byla průměrná síla nastavenému cíli. Hodnotí provedení série, ne celkovou sílu kolene.",
    detail: "Pracovní cílové pásmo tohoto protokolu je 95–105 %. Hodnoty 90–<95 % a >105–110 % jsou označené ke sledování. Nejde o klinický diagnostický cut-off.",
  },
  timeInTarget: {
    ruleType: "protocol",
    explanation: "Podíl pracovního času, kdy byla síla blízko cíli. Vyšší hodnota znamená přesnější držení zadané síly.",
    detail: "Pracovní pravidlo reportu: ≥60 % v cíli, 40–59 % ke sledování a <40 % mimo pracovní cíl. Nejde o klinickou normu.",
  },
  successfulRepetitions: {
    ruleType: "descriptive",
    explanation: "Počet opakování, která splnila obě pracovní podmínky série.",
    detail: "Úspěšné opakování má průměrnou sílu 95–105 % cíle a alespoň 60 % pracovního času v pásmu ±5 %.",
  },
  successRate: {
    ruleType: "protocol",
    explanation: "Kolik hodnotitelných opakování splnilo nastavené podmínky. Pro progresi používá report ještě přísnější souhrnná kritéria.",
    detail: "Pracovní pravidlo reportu: ≥70 % v cíli, 50–69 % ke sledování a <50 % mimo pracovní cíl.",
  },
  withinRepCv: {
    ruleType: "protocol",
    explanation: "Popisuje, jak rovnoměrně byla síla během jednoho opakování držena. Hranice jsou pracovní pravidlo tohoto protokolu, ne klinická norma.",
    detail: "Pracovní pravidlo: ≤5 % stabilní, >5–8 % ke sledování a >8 % vysoká variabilita.",
  },
  betweenRepCv: {
    ruleType: "protocol",
    explanation: "Ukazuje, jak podobná byla jednotlivá opakování. Vyšší variabilita může souviset s únavou, kontrolou nebo změnou provedení.",
    detail: "Pracovní pravidlo: ≤8 % stabilní, >8–12 % ke sledování a >12 % vysoká variabilita.",
  },
  trend: {
    ruleType: "descriptive",
    explanation: "Ukazuje směr změny výkonu během série. Interpretuj jej společně s rozdílem první–poslední a časem v cílovém pásmu.",
  },
  firstToLast: {
    ruleType: "descriptive",
    explanation: "Porovnává začátek a konec série. Jedna hodnota sama o sobě nemusí spolehlivě odlišit únavu od variability provedení.",
  },
  timeInTargetChange: {
    ruleType: "descriptive",
    explanation: "Ukazuje, zda se schopnost držet cílovou sílu v průběhu série zhoršovala.",
  },
  seriesDevelopment: {
    ruleType: "protocol",
    explanation: "Výsledek kombinuje několik ukazatelů vývoje série. Nejde o přímé měření fyziologické únavy.",
    detail: "Souhrn používá trend série, rozdíl první–poslední, změnu času v cílovém pásmu a technickou konzistenci. Hranice jsou pracovní pravidla reportu.",
  },
  onsetTo95: {
    ruleType: "protocol",
    explanation: "Čas potřebný k dosažení pracovní síly. Výsledek je citlivý na instrukci a způsob provedení.",
    detail: "Technické pracovní pravidlo označí nedosažení 95 % cíle jako nesplnění a náběh delší než max(1,5 s; 40 % pracovního intervalu) jako pomalý. Nejde o klinický neuromuskulární cut-off.",
  },
  onsetDifference: {
    ruleType: "contextual",
    explanation: "Popisuje časový rozdíl mezi stranami. Bez specifického protokolu jej nelze spolehlivě označit za dobrý nebo špatný.",
  },
  technicalFlags: {
    ruleType: "protocol",
    explanation: "Technická upozornění snižují jistotu interpretace výsledku. Nejde o klinické hodnocení kolene.",
    detail: "Pracovní pravidlo reportu: ≤10 % technických flagů bez významného upozornění, >10–30 % ke sledování a >30 % výrazný technický problém.",
  },
  normalizedSideDifference: {
    ruleType: "contextual",
    explanation: "Porovnává, jak obě strany plnily svůj vlastní cíl. Není to LSI a neříká, zda jsou obě strany absolutně stejně silné.",
  },
  averageForceDifference: {
    ruleType: "contextual",
    explanation: "Absolutní rozdíl síly mezi stranami. Bez zohlednění referenční síly a vývoje v čase jej nelze označit jako dobrý nebo špatný.",
  },
  painReaction: {
    ruleType: "protocol",
    explanation: "Popisuje reakci kolene na konkrétní zatížení. Hodnota sama o sobě neurčuje diagnózu ani poškození.",
    detail: "Jde o pracovní toleranční pravidlo aplikace, nikoli univerzální hranici bezpečné nebo nebezpečné bolesti. Chybějící údaje znamenají Bez hodnocení.",
  },
} as const satisfies Record<string, TindeqMetricCopy>;

type NullableNumber = number | null | undefined;

function finite(value: NullableNumber): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const GOOD: TindeqPresentationStatus = { label: "V cíli", tone: "good" };
const WARNING: TindeqPresentationStatus = { label: "Sleduj", tone: "warning" };
const PROBLEM: TindeqPresentationStatus = { label: "Mimo cíl", tone: "problem" };
const NEUTRAL: TindeqPresentationStatus = { label: "Bez hodnocení", tone: "neutral" };

export function targetAchievementStatus(value: NullableNumber): TindeqPresentationStatus {
  const metric = finite(value);
  if (metric === null) return NEUTRAL;
  if (metric >= 95 && metric <= 105) return GOOD;
  if ((metric >= 90 && metric < 95) || (metric > 105 && metric <= 110)) return WARNING;
  return PROBLEM;
}

export function timeInTargetStatus(value: NullableNumber): TindeqPresentationStatus {
  const metric = finite(value);
  if (metric === null) return NEUTRAL;
  if (metric >= 60) return GOOD;
  if (metric >= 40) return WARNING;
  return PROBLEM;
}

export function successRateStatus(value: NullableNumber): TindeqPresentationStatus {
  const metric = finite(value);
  if (metric === null) return NEUTRAL;
  if (metric >= 70) return GOOD;
  if (metric >= 50) return WARNING;
  return PROBLEM;
}

export function withinRepCvStatus(value: NullableNumber): TindeqPresentationStatus {
  const metric = finite(value);
  if (metric === null) return NEUTRAL;
  if (metric <= 5) return { label: "Stabilní", tone: "good" };
  if (metric <= 8) return WARNING;
  return { label: "Vysoká variabilita", tone: "problem" };
}

export function betweenRepCvStatus(value: NullableNumber): TindeqPresentationStatus {
  const metric = finite(value);
  if (metric === null) return NEUTRAL;
  if (metric <= 8) return { label: "Stabilní", tone: "good" };
  if (metric <= 12) return WARNING;
  return { label: "Vysoká variabilita", tone: "problem" };
}

export function technicalFlagRateStatus(value: NullableNumber): TindeqPresentationStatus {
  const metric = finite(value);
  if (metric === null) return NEUTRAL;
  if (metric <= 10) return { label: "Technicky v pořádku", tone: "good" };
  if (metric <= 30) return WARNING;
  return { label: "Nízká důvěra", tone: "problem" };
}

export function onsetTo95Status(
  value: NullableNumber,
  workDurationSeconds: NullableNumber,
): TindeqPresentationStatus {
  const duration = finite(workDurationSeconds);
  const metric = finite(value);
  if (duration === null || duration <= 0) return NEUTRAL;
  if (metric === null) return { label: "Cíl nedosažen", tone: "problem" };
  if (metric > Math.max(1.5, 0.4 * duration)) return { label: "Pomalý náběh", tone: "warning" };
  return GOOD;
}

export function reportFindingStatus(status: string): TindeqPresentationStatus {
  if (status === "splněno") return GOOD;
  if (status === "hraniční") return WARNING;
  if (status === "nesplněno") return PROBLEM;
  if (status === "technicky nehodnotitelné") return NEUTRAL;
  return NEUTRAL;
}

export function recommendationStatus(action: string): TindeqPresentationStatus {
  if (action === "progrese") return { label: "Progrese", tone: "good" };
  if (action === "regrese") return { label: "Regrese", tone: "problem" };
  if (action === "zachování") return { label: "Zachování", tone: "warning" };
  if (action === "technická úprava provedení") return { label: "Uprav provedení", tone: "warning" };
  if (action === "opakování měření") return { label: "Opakuj měření", tone: "warning" };
  if (action === "doplnění údajů před rozhodnutím") return { label: "Doplň údaje", tone: "neutral" };
  return NEUTRAL;
}

export function domainStatus(domain: string): TindeqPresentationStatus {
  if (domain === "Dobrá" || domain === "Stabilní" || domain === "Bez poklesu") return GOOD;
  if (domain === "Ke kontrole" || domain === "Mírný pokles") return WARNING;
  if (domain === "Výrazná odchylka" || domain === "Nestabilní" || domain === "Výrazný pokles") return PROBLEM;
  return NEUTRAL;
}

export function seriesSummaryStatus(status: string): TindeqPresentationStatus & { title: string; explanation: string } {
  const presentation = reportFindingStatus(status);
  if (status === "splněno") {
    return {
      ...presentation,
      title: "Série splněna",
      explanation: "Hlavní výkonové a technické ukazatele splnily pracovní pravidla této série. Výsledek nehodnotí celkový stav kolene.",
    };
  }
  if (status === "hraniční") {
    return {
      ...presentation,
      title: "Série ke sledování",
      explanation: "Alespoň jedna rozhodovací oblast je na hranici pracovního cíle. Sleduj ji při dalším srovnatelném měření.",
    };
  }
  if (status === "nesplněno") {
    return {
      ...presentation,
      title: "Série mimo pracovní cíl",
      explanation: "Alespoň jedna rozhodovací oblast nesplnila pracovní pravidlo této série. Samo o sobě to neznamená patologický nález.",
    };
  }
  return {
    ...presentation,
    title: "Bez spolehlivého souhrnu",
    explanation: "Z dostupného záznamu nelze udělat spolehlivé souhrnné hodnocení. Zkontroluj technická upozornění a chybějící data.",
  };
}
