export interface ManagedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  status: string;
  scopeName: string;
  scopeLevel: string;
  roleName: string;
  roleTitle: string;
  provinceId: string | null;
  districtId: string | null;
  institutionId: string | null;
  employerId: string | null;
}

export interface UserManagementData {
  data: ManagedUser[];
  currentPage: number;
  lastPage: number;
  total: number;
  roles: { name: string; title: string }[];
  provinces: { id: string; name: string }[];
  districts: { id: string; province_id: string; name: string }[];
  institutions: { id: string; name: string }[];
  employers: { id: string; name: string }[];
}

export interface DashboardTargetManagementData {
  landingKpiTargets: {
    year: number;
    targets: {
      registeredJobSeekers: number | null;
      readyForPlacement: number | null;
      activeTrainingPrograms: number | null;
      activeVocationalInstitutions: number | null;
      nationalLpkCount: number | null;
      validatedDemandCount: number | null;
    };
  }[];
  landingCountries: { id: string; name: string }[];
  landingSectors: { id: string; name: string }[];
  landingCountryPerformance: {
    year: number;
    countryId: string;
    countryName: string;
    target: number;
    achieved: number;
    projected: number;
    percentage: number;
  }[];
  landingCountrySectorTargets: {
    year: number;
    targets: Record<string, Record<string, number | null>>;
  }[];
  landingCountrySectorPerformance: {
    year: number;
    countryId: string;
    countryName: string;
    sectorId: string;
    sectorName: string;
    target: number;
    achieved: number;
    projected: number;
    percentage: number;
  }[];
  landingPlacementOptions: {
    sectors: string[];
    occupations: { sectorName: string; occupationName: string }[];
  };
  landingPlacementTargets: {
    id: number;
    year: number;
    sectorName: string;
    occupationName: string;
    projectionPlacement: string;
    target: number;
  }[];
}
