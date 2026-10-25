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
}
