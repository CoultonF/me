export interface Race {
  id: number;
  name: string;
  date: string;
  location: string | null;
  distance: string;
  status: 'completed' | 'upcoming' | 'target';
  resultsUrl: string | null;
}

export interface RaceResult {
  id: number;
  raceId: number;
  bibNumber: string | null;
  chipTime: string | null;
  gunTime: string | null;
  pacePerKm: string | null;
  city: string | null;
  division: string | null;
  overallPlace: number | null;
  overallTotal: number | null;
  genderPlace: number | null;
  genderTotal: number | null;
  divisionPlace: number | null;
  divisionTotal: number | null;
  resultsUrl: string | null;
}

export interface RaceWithResult extends Race {
  result: RaceResult | null;
}

export interface VDOTPrediction {
  distance: string;
  predictedTime: string;
  predictedPace: string;
}

export interface TargetRaceInfo extends Race {
  daysUntil: number;
  predictions: VDOTPrediction[];
  recentAvgPace: string | null;
}

export interface RaceStats {
  totalRaces: number;
  personalBests: { distance: string; chipTime: string; raceName: string; date: string }[];
}

export interface RacesAPIResponse {
  completed: RaceWithResult[];
  upcoming: RaceWithResult[];
  target: TargetRaceInfo | null;
  stats: RaceStats;
}
