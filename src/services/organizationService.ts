import { axiosClient } from "./apiClient";
import type {
    Employee,
    Department,
    DepartmentInfo,
    OrgChartNode,
    EmployeeType,
} from "../components/organization/types";

export interface ApiDepartment {
    id: number;
    code: string | null;
    name: string;
    staffCount: number;
    status: string;
}

export interface ApiOrgNode {
    id: number;
    profileId?: number;
    name: string;
    code?: string;
    email?: string;
    phone?: string;
    department?: string | null;
    designation?: string;
    joinDate?: string;
    subordinateCount?: number;
    profileImage?: string | null;
    subordinates: ApiOrgNode[];
}

export interface ApiProfileSummary {
    personalInfo: {
        fullName: string;
        dateOfBirth: string;
        designation: string;
        gender: "Male" | "Female" | "Other";
        maritalStatus: string;
        personalNumber: string;
        nationality: string;
        bloodGroup: string;
        personalEmail: string;
        religion: string;
        residentialStatus: string;
        presentAddress: string;
        profileImageUrl: string;
    };
    officialInformation: {
        employeeID: string;
        designation: string;
        businessUnit: string;
        reportingManager: string;
        employmentType: EmployeeType;
        officialEmail: string;
        division: string;
        dateOfJoining: string;
        officialNumber: string;
        location: string;
    };
    emergencyContact: {
        contactName: string;
        contactNumber: string;
    };
}

export interface ApiStaff {
    id: number;
    profileId: number;
    name: string;
    designation: string;
    profileImageUrl: string;
    departmentName: string;
    departmentId: string;
    email: string;
    phone: string;
    status: string;
}

export interface ApiStaffDirectoryResponse {
    staffs: ApiStaff[];
    totalCount: number;
    atWorkCount: number;
    awayCount: number;
}

// Department mapping from API strings to type Department
const departmentMapping: Record<string, Department> = {
    Sales: "Sales",
    Academics: "Academics",
    Accounts: "Accounts",
    Admin: "Admin",
    Operation: "Operation",
    Marketing: "Marketing",
    Support: "Support",
    Management: "Management",
};

/**
 * Fetch all departments
 */
export async function getDepartments(): Promise<ApiDepartment[]> {
    try {
        const response = await axiosClient.get<any>("/api/Common/GetDepartmentsAsync");
        if (response.data?.success) {
            return response.data.result?.departments ?? [];
        }
        throw new Error(response.data?.message ?? "Failed to load departments");
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
}

/**
 * Fetch employee profile summary
 */
export async function getProfileSummary(
    profileId: number,
): Promise<ApiProfileSummary> {
    try {
        const response = await axiosClient.get<any>(
            `/api/Organization/Profile/Get?profileId=${profileId}`
        );
        if (response.data?.success) {
            return response.data.result;
        }
        throw new Error(response.data?.message ?? "Failed to load profile summary");
    } catch (error) {
        console.error("Error fetching profile summary:", error);
        throw error;
    }
}

/**
 * Fetch organization chart
 */
export async function getOrgChart(departmentId?: string): Promise<ApiOrgNode[]> {
    try {
        let params = '';
        if (departmentId) {
            params = `?DepartmentId=${encodeURIComponent(departmentId)}`;
        }
        // Updated to the URL provided by the user
        const response = await axiosClient.get<any>(`/api/Organization/Chart/Get${params}`);
        if (response.data?.success) {
            // The provided sample has "result" as top-level array
            const result = response.data.result ?? [];
            return result;
        }
        throw new Error(response.data?.message ?? "Failed to load organization chart");
    } catch (error) {
        console.error("Error fetching org chart:", error);
        throw error;
    }
}

/**
 * Fetch staff directory
 */
export async function getStaffDirectory(departmentId?: string, searchText?: string): Promise<ApiStaffDirectoryResponse> {
    try {
        const params = new URLSearchParams();
        if (departmentId) params.append('DepartmentId', departmentId);
        if (searchText) params.append('SearchText', searchText);
        const queryString = params.toString();
        const url = `/api/Organization/StaffDirectory/Get${queryString ? `?${queryString}` : ''}`;

        const response = await axiosClient.get<any>(url);
        if (response.data?.success) {
            return response.data.result ?? { staffs: [], totalCount: 0, atWorkCount: 0, awayCount: 0 };
        }
        throw new Error(response.data?.message ?? "Failed to load staff directory");
    } catch (error) {
        console.error("Error fetching staff directory:", error);
        throw error;
    }
}

/**
 * Transform API org chart data to OrgChartNode structure
 */
export function transformApiOrgChart(
    apiData: ApiOrgNode[],
    rootId?: number,
): OrgChartNode | null {
    const transformNode = (
        apiNode: ApiOrgNode,
    ): OrgChartNode => {
        // Use profileId for the employee ID string to avoid collisions with id: 0
        const profileId = apiNode.profileId || (apiNode as any).ProfileId || apiNode.id;

        const employee: Employee = {
            id: `emp-${profileId}`,
            profileId: profileId,
            name: apiNode.name,
            position: apiNode.designation || "Employee",
            email: apiNode.email || "",
            avatar: apiNode.profileImage || undefined,
            phone: apiNode.phone || "",
            officialNumber: apiNode.phone || "",
            department: departmentMapping[apiNode.department || ""] || "Operations",
            status: "at-work",
            employeeId: apiNode.code || String(apiNode.id),
            employeeType: "Permanent",
            dateOfJoining: apiNode.joinDate
                ? new Date(apiNode.joinDate).toLocaleDateString("en-GB")
                : "",
            businessUnit: "Westford",
            division: "Al Taawun",
            isFounder: false,
        };

        const children =
            apiNode.subordinates?.map((node) => transformNode(node)) || [];

        return {
            employee,
            children: children.length > 0 ? children : undefined,
        };
    };

    if (apiData.length === 0) return null;

    if (rootId !== undefined) {
        const findNodeById = (nodes: ApiOrgNode[], id: number): ApiOrgNode | null => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.subordinates && node.subordinates.length > 0) {
                    const found = findNodeById(node.subordinates, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const rootApiNode = findNodeById(apiData, rootId);
        if (rootApiNode) {
            return transformNode(rootApiNode);
        }
    }

    // If there is only one root node, use it directly
    if (apiData.length === 1) {
        return transformNode(apiData[0]);
    }

    // Wrap multiple top-level nodes in a virtual department root to connect them
    const departmentName = apiData[0]?.department || "Organization";

    // Create a special department root node
    const departmentRoot: OrgChartNode = {
        employee: {
            id: `dept-${departmentName.toLowerCase().replace(/\s+/g, '-')}`,
            profileId: 0,
            name: departmentName,
            position: "",
            department: departmentName as Department,
            status: "at-work",
            employeeId: "",
            employeeType: "Permanent",
            dateOfJoining: "",
            businessUnit: "",
            isFounder: false,
            email: "",
        },
        children: apiData.map(node => transformNode(node)),
    };

    // Mark as special type for custom rendering
    (departmentRoot.employee as any).isDepartment = true;

    return departmentRoot;
}

/**
 * Transform API staff data to Employee structure
 */
export function transformApiStaff(apiStaff: ApiStaff): Employee {
    return {
        id: `emp-${apiStaff.id || apiStaff.profileId}`,
        profileId: apiStaff.profileId,
        name: apiStaff.name,
        position: apiStaff.designation || "Employee",
        department: departmentMapping[apiStaff.departmentName] || "Operations",
        email: apiStaff.email,
        phone: apiStaff.phone,
        officialNumber: apiStaff.phone,
        avatar: apiStaff.profileImageUrl,
        status: (apiStaff.status?.toLowerCase() === "at work" ? "at-work" :
            apiStaff.status?.toLowerCase() === "away" ? "away" : "at-work") as any,
        employeeId: String(apiStaff.id),
        employeeType: "Permanent",
        dateOfJoining: "",
        businessUnit: "Westford",
        division: "Al Taawun",
    };
}

/**
 * Transform API departments to DepartmentInfo
 */
export function transformApiDepartments(
    apiDepts: ApiDepartment[],
): DepartmentInfo[] {
    const totalCount = apiDepts.reduce((sum, dept) => sum + dept.staffCount, 0);
    const westfordDept: DepartmentInfo = {
        id: "dept-westford",
        name: "WESTFORD",
        count: totalCount,
    };

    const subDepts: DepartmentInfo[] = apiDepts.map((dept) => ({
        id: `dept-${dept.id}`,
        name: (dept.name as Department),
        apiName: dept.name,
        count: dept.staffCount,
        parentId: "dept-westford",
    }));

    return [westfordDept, ...subDepts];
}

/**
 * Helper to get department name by ID
 */
export function getDepartmentNameById(
    departmentId: string,
    departments: DepartmentInfo[]
): Department | undefined {
    if (departmentId === "dept-westford") return undefined;
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.name as Department | undefined;
}
