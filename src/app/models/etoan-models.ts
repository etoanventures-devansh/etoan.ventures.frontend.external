
export interface SupabaseResponse<T> {
  error: any;
  data: T[];
  count: any;
  status: number;
  statusText: string;
}

export interface EmployeeDetails {
  id: number;
  created_at: string;
  entityId: string;
  name: string;
  dateOfBirth: string | null;
  identifierNumber?: string;
  wpNo?: string;
  workPermitExpiry?: string;
  csocExpiry: string | null;
  contactNumber: string | null;
  email: string | null;
  designation: string;
  gender: string;
  citizenship: string;
  status: string;
  skillType?: string;
}

export interface ProjectSites {
  id: number
  created_at: string
  projectSiteName: string
  status: string
  siteOwner: string
}


export interface EtoanIntialState {
  error: {concern: API_FAILURE_TYPES, error: any} | null;
  loading: boolean;
  projectSites: ProjectSites[] | null;
  employeeDetails: EmployeeDetails[] | null;
}

export type API_FAILURE_TYPES = 'getEmployeeDetails' | 'getProjectSites'
