
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
  previousTimecards: PreviousTimecards[] | null;
  employeeSalaryRate: EmployeeSalaryRate[] | null;
  employeeSalaryRecords: EmployeeSalaryRecords[] | null;

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


export interface EmployeeSalaryRate {
  id: string
  employee_entity_id: string
  daily_rate: number
  overtime_rate: number
  transport_rate: number
  effective_from: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeSalaryRecords {
  employee_entity_id?: string
  employee_name: string
  identifier_number?: string
  designation: string
  salary_year: number
  salary_month: number
  payslip_period_start: string
  payslip_period_end: string
  payment_date: string
  payment_mode: string
  basic_pay_rate?: number
  days_worked?: number
  total_basic_pay?: number
  overtime_hours: number
  overtime_rate?: number
  total_overtime_pay?: number
  medical_allowance: number
  transport_allowance: number
  other_payments: number
  gross_salary?: number
  deduction_cash_advance: number
  fines: number
  total_deduction?: number
  rounding_adjustment: number
  net_salary?: number
}


export type API_FAILURE_TYPES = 'getEmployeeDetails' | 'getProjectSites' | 'getPreviousTimecards' | 'getEmployeeSalaryRate' | 'getEmployeeSalaryRecords'
