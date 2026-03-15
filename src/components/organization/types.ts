export type EmployeeStatus = "at-work" | "away" | "offline";

export type EmployeeType = "Permanent" | "Contract" | "Part-time" | "Temporary";

export type Department =
  | "Management"
  | "Operations"
  | "Student Services"
  | "Faculty"
  | "Admissions / BD"
  | "Marcom"
  | "Accounts"
  | "Student Experience"
  | "Sales"
  | "Academics"
  | "Admin"
  | "Operation"
  | "Marketing"
  | "Support";

export interface ContactInformation {
  email: string;
  officialNumber?: string;
  personalNumber?: string;
  address?: string;
}

export interface OfficialInformation {
  employeeId: string;
  employeeType: EmployeeType;
  dateOfJoining: string; // Format: DD-MM-YYYY
  businessUnit: string;
  division?: string;
  reportingManager?: {
    id: string;
    name: string;
    position: string;
  };
}

export interface PersonalInformation {
  dateOfBirth?: string; // Format: DD-MM-YYYY
  gender?: "Male" | "Female" | "Other";
  nationality?: string;
  religion?: string;
}

export interface Employee
  extends ContactInformation, OfficialInformation, PersonalInformation {
  id: string;
  profileId?: number; // Integer profileId for GetProfileSummary API
  name: string;
  position: string;
  avatar?: string;
  phone?: string;
  isFounder?: boolean;
  department: Department;
  status: EmployeeStatus;
  subordinates?: string[]; // Array of employee IDs
  reportsTo?: string; // Employee ID of reporting manager
}

export interface DepartmentInfo {
  id: string;
  name: Department | "WESTFORD";
  apiName?: string; // Original API department name
  count: number;
  parentId?: string; // For sub-departments under WESTFORD
}

export interface OrgChartNode {
  employee: Employee;
  children?: OrgChartNode[];
}

export interface EmployeeProfile extends Employee {
  // Extended profile information for the View Profile modal
  sopLink?: string; // Link to Standard Operating Procedure
}
