
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
  previousTimecards: PreviousTimecards[] | null
}

export interface TimecardEntry {
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  employeeName?: string | null;
  identifierNumber?: string | null;
  totalHours?: number | null;
  totalBreakHours?: number | null;
  lunchTimeWork?: boolean | null;
  projectSite?: string | null;
  date?: string | Date | null;
  refEntityId?: string | null;
  normalHours?: number | null;
  overTimeHours?: number | null;
}

export interface PreviousTimecards {
  id: number
  created_at: string
  startTime: string
  endTime: string
  employeeName: string
  identifierNumber: string
  totalHours: number
  totalBreakHours: any
  lunchTimeWork: boolean
  projectSite: string
  date: string
  refEntityId: string
  normalHours: number
  overTimeHours: number
}

export type API_FAILURE_TYPES = 'getEmployeeDetails' | 'getProjectSites' | 'getPreviousTimecards'
