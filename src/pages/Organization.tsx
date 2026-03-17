import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils/cn";
import type { AppLayoutContext } from "../components/layout/AppLayout";
import type { Employee } from "../components/organization/types";
import {
  getDepartments,
  getOrgChart,
  transformApiOrgChart,
  transformApiDepartments,
  getDepartmentNameById,
} from "../services/organizationService";
import { chatService } from "../services/chatService";
import OrgChartView from "../components/organization/OrgChartView";
import StaffDirectoryView from "../components/organization/StaffDirectoryView";
import ViewProfileModal from "../components/organization/ViewProfileModal";
import SOPModal from "../components/organization/SOPModal";
import AddStaffModal from "../components/organization/AddStaffModal";
import RemoveStaffModal from "../components/organization/RemoveStaffModal";
import DiscardChangesModal from "../components/organization/DiscardChangesModal";
import StaffRemovedModal from "../components/organization/StaffRemovedModal";
import OrgChartUpdatedModal from "../components/organization/OrgChartUpdatedModal";
import ChangesDiscardedModal from "../components/organization/ChangesDiscardedModal";
import StaffAddedModal from "../components/organization/StaffAddedModal";
import CustomToast from "../components/common/CustomToast";
import { useMessengerContext } from "../contexts/MessengerContext";
import type { EmployeeStatus, OrgChartNode } from "../components/organization/types";

type ViewType = "org-chart" | "directory";

const Organization: React.FC = () => {
  const { setPageTitle } = useOutletContext<AppLayoutContext>();
  const navigate = useNavigate();
  const { hubConnection } = useMessengerContext();
  const [activeView, setActiveView] = useState<ViewType>("org-chart");
  // Separate state for each view's department filter
  const [orgChartSelectedDepartment, setOrgChartSelectedDepartment] =
    useState<string>("all");
  const [directorySelectedDepartment, setDirectorySelectedDepartment] =
    useState<string>("dept-westford");
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // API data states
  const [departments, setDepartments] = useState<any[]>([]);
  const [orgChart, setOrgChart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orgChartLoading, setOrgChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = React.useRef(false);

  // Modal states
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [sopModalOpen, setSopModalOpen] = useState(false);
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [removeStaffModalOpen, setRemoveStaffModalOpen] = useState(false);
  const [discardChangesModalOpen, setDiscardChangesModalOpen] = useState(false);
  const [staffRemovedModalOpen, setStaffRemovedModalOpen] = useState(false);
  const [orgChartUpdatedModalOpen, setOrgChartUpdatedModalOpen] =
    useState(false);
  const [changesDiscardedModalOpen, setChangesDiscardedModalOpen] =
    useState(false);
  const [staffAddedModalOpen, setStaffAddedModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);
  const [isStartingDirectMessage, setIsStartingDirectMessage] = useState(false);
  const [toastState, setToastState] = useState<{
    show: boolean;
    title?: string;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    title: undefined,
    message: "",
    type: "error",
  });
  const [registeredUsersByEmail, setRegisteredUsersByEmail] = useState<Record<string, { userId: number }>>({});
  const [presenceByUserId, setPresenceByUserId] = useState<Record<number, { availabilityStatus?: number | null; isOnline?: boolean | null }>>({});

  const normalizeEmail = React.useCallback((value?: string | null) => (value || "").trim().toLowerCase(), []);

  const mapPresenceToEmployeeStatus = React.useCallback((
    availabilityStatus?: number | null,
    isOnline?: boolean | null
  ): EmployeeStatus => {
    if (!isOnline) return "away";
    if (availabilityStatus === 1) return "offline"; // Do Not Disturb
    if (availabilityStatus === 3) return "away";
    return "at-work";
  }, []);

  const resolveEmployeeStatusByEmail = React.useCallback((email?: string | null): EmployeeStatus => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return "away";

    const registeredUser = registeredUsersByEmail[normalizedEmail];
    if (!registeredUser) {
      return "away";
    }

    const presence = presenceByUserId[registeredUser.userId];
    return mapPresenceToEmployeeStatus(presence?.availabilityStatus, presence?.isOnline);
  }, [mapPresenceToEmployeeStatus, normalizeEmail, presenceByUserId, registeredUsersByEmail]);

  const applyPresenceToOrgChart = React.useCallback((node: OrgChartNode | null): OrgChartNode | null => {
    if (!node) return null;

    const mapNode = (input: OrgChartNode): OrgChartNode => ({
      ...input,
      employee: {
        ...input.employee,
        status: resolveEmployeeStatusByEmail(input.employee.email),
      },
      children: input.children?.map(mapNode),
    });

    return mapNode(node);
  }, [resolveEmployeeStatusByEmail]);

  React.useEffect(() => {
    setPageTitle("Organization");
  }, [setPageTitle]);

  // Fetch data on mount
  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [apiDepts, chatBootstrap] = await Promise.all([
          getDepartments(),
          chatService.bootstrap(),
        ]);

        const users = Array.isArray(chatBootstrap?.result?.users) ? chatBootstrap.result.users : [];
        const usersByEmail: Record<string, { userId: number }> = {};
        const initialPresenceByUserId: Record<number, { availabilityStatus?: number | null; isOnline?: boolean | null }> = {};

        users.forEach((u) => {
          const normalizedEmail = normalizeEmail(u.email);
          if (normalizedEmail && Number.isFinite(Number(u.id))) {
            usersByEmail[normalizedEmail] = { userId: Number(u.id) };
            initialPresenceByUserId[Number(u.id)] = {
              availabilityStatus: typeof u.availabilityStatus === "number" ? u.availabilityStatus : undefined,
              isOnline: typeof u.isOnline === "boolean" ? u.isOnline : undefined,
            };
          }
        });

        setRegisteredUsersByEmail(usersByEmail);
        setPresenceByUserId(initialPresenceByUserId);

        const transformedDepts = transformApiDepartments(apiDepts);
        setDepartments(transformedDepts);

        // Load org chart for first department on initial load
        const firstDepartment = transformedDepts.find(d => d.id !== "dept-westford");
        if (firstDepartment && orgChartSelectedDepartment === "all") {
          setOrgChartSelectedDepartment(firstDepartment.id);
          // Load org chart for the first department
          const departmentId = firstDepartment.id.replace('dept-', '');
          try {
            const apiOrgChart = await getOrgChart(departmentId);
            const transformedOrgChart = transformApiOrgChart(apiOrgChart);
            setOrgChart(applyPresenceToOrgChart(transformedOrgChart));
          } catch (err) {
            console.error("Initial org chart load error:", err);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error("API Error:", err);
        setError(err.message || "Failed to load data");
        setLoading(false);
      }
    };
    fetchData();
  }, [applyPresenceToOrgChart, normalizeEmail]);



  const departmentColors: Record<string, { bg: string }> = {
    Operation: { bg: "bg-[#E0F2F2]" },
    Admin: { bg: "bg-[#BEDCFE]" },
    Academics: { bg: "bg-[#DCF763]" },
    Sales: { bg: "bg-[#D4F1F4]" },
    Marketing: { bg: "bg-[#EDB458]" },
    Accounts: { bg: "bg-[#D4E4BC]" },
    Support: { bg: "bg-[#E7E5DF]" },
  };

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee({
      ...employee,
      status: resolveEmployeeStatusByEmail(employee.email),
    });
    setViewProfileOpen(true);
  };

  const handleViewSOP = () => {
    setSopModalOpen(true);
  };

  const handleSendEmail = (_employee: Employee) => {
    // Handle send email
  };

  const handleCall = (_employee: Employee) => {
    // Handle call
  };

  const handleSendMessage = async (employee: Employee) => {
    if (isStartingDirectMessage) {
      return;
    }

    const targetEmail = (employee.email || "").trim();
    if (!targetEmail) {
      setToastState({
        show: true,
        title: "Unable to Send Message",
        message: "User email is not available for direct message.",
        type: "error",
      });
      return;
    }

    setIsStartingDirectMessage(true);
    try {
      const response = await chatService.startPrivateChatByEmail({ targetEmail });

      if (!response.success || !response.result?.targetUserId) {
        setToastState({
          show: true,
          title: "Unable to Send Message",
          message: response.message || "Unable to start direct message.",
          type: "error",
        });
        return;
      }

      navigate(`/messenger?user=${response.result.targetUserId}`);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const fallbackMessage = error instanceof Error ? error.message : "";
      setToastState({
        show: true,
        title: "Unable to Send Message",
        message: apiMessage || fallbackMessage || "Unable to start direct message.",
        type: "error",
      });
    } finally {
      setIsStartingDirectMessage(false);
    }
  };

  const handleAddEmployee = () => {
    // For now, use first manager as default
    // const manager = mockEmployees.find((e) => e.subordinates && e.subordinates.length > 0) || mockEmployees[0];
    // setSelectedManager(manager);
    // setAddStaffModalOpen(true);
  };

  const handleAddStaff = () => {
    // Handle adding staff
    setAddStaffModalOpen(false);
    setStaffAddedModalOpen(true);
    setHasUnsavedChanges(true);
  };

  const handleDeleteEmployee = () => {
    setRemoveStaffModalOpen(true);
  };

  const handleConfirmRemove = () => {
    // Handle remove
    setRemoveStaffModalOpen(false);
    setStaffRemovedModalOpen(true);
    setHasUnsavedChanges(true);
  };

  const handleAddSubordinate = (employee: Employee) => {
    setSelectedManager(employee);
    setAddStaffModalOpen(true);
  };

  const handleSave = () => {
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setOrgChartUpdatedModalOpen(true);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setDiscardChangesModalOpen(true);
    } else {
      setIsEditMode(false);
    }
  };

  const handleDiscard = () => {
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setDiscardChangesModalOpen(false);
    setChangesDiscardedModalOpen(true);
  };

  const handleOrgChartDepartmentFilter = async (deptId: string) => {
    try {
      setOrgChartLoading(true);
      setOrgChartSelectedDepartment(deptId);

      // Extract the numeric ID from the department ID (e.g., "dept-2" -> 2)
      const departmentId = deptId.startsWith('dept-') ? deptId.replace('dept-', '') : deptId;

      // Call API with DepartmentId parameter
      const apiOrgChart = await getOrgChart(departmentId);
      const transformedOrgChart = transformApiOrgChart(apiOrgChart);
      setOrgChart(applyPresenceToOrgChart(transformedOrgChart));
    } catch (err: any) {
      console.error("Org Chart API Error:", err);
      setError(err.message || "Failed to load org chart");
    } finally {
      setOrgChartLoading(false);
    }
  };

  React.useEffect(() => {
    setOrgChart((prev: OrgChartNode | null) => applyPresenceToOrgChart(prev));
  }, [applyPresenceToOrgChart, presenceByUserId, registeredUsersByEmail]);

  React.useEffect(() => {
    if (!hubConnection) return;

    const onUserPresenceChanged = (evt: any) => {
      const userId = Number(evt?.userId ?? evt?.UserId);
      if (!Number.isFinite(userId)) return;

      const statusCodeRaw = evt?.status ?? evt?.Status;
      const isOnlineRaw = evt?.isOnline ?? evt?.IsOnline;
      const availabilityStatus = Number.isFinite(Number(statusCodeRaw)) ? Number(statusCodeRaw) : undefined;
      const isOnline = typeof isOnlineRaw === "boolean" ? isOnlineRaw : undefined;

      setPresenceByUserId((prev) => ({
        ...prev,
        [userId]: {
          availabilityStatus,
          isOnline,
        },
      }));
    };

    hubConnection.on("UserPresenceChanged", onUserPresenceChanged);
    return () => {
      hubConnection.off("UserPresenceChanged", onUserPresenceChanged);
    };
  }, [hubConnection]);

  React.useEffect(() => {
    setSelectedEmployee((prev) => {
      if (!prev) return prev;
      const nextStatus = resolveEmployeeStatusByEmail(prev.email);
      if (prev.status === nextStatus) return prev;
      return {
        ...prev,
        status: nextStatus,
      };
    });
  }, [presenceByUserId, registeredUsersByEmail, resolveEmployeeStatusByEmail]);

  const handleDirectoryDepartmentFilter = (deptId: string) => {
    setDirectorySelectedDepartment(deptId);
  };

  const departmentButtons = departments.filter(
    (d) => d.parentId === "dept-westford",
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tabs and Actions */}
      <div className="pt-[15px] px-2.5 mb-[25px]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveView("org-chart")}
              className={cn(
                "px-[15px] py-[5px] rounded-[25px] text-sm font-semibold transition cursor-pointer flex items-center gap-2",
                activeView === "org-chart"
                  ? "bg-[#1E88E5] text-white"
                  : "bg-[#232725] text-white hover:opacity-90",
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M7.08334 4.85677C7.08345 4.31614 7.24012 3.78664 7.53515 3.32976C7.83018 2.87288 8.25146 2.50737 8.75007 2.27568C9.24868 2.044 9.80415 1.95564 10.352 2.02088C10.8998 2.08612 11.4175 2.30228 11.8449 2.64424C12.2723 2.98621 12.5919 3.43995 12.7666 3.95277C12.9414 4.46559 12.964 5.01645 12.8319 5.54136C12.6998 6.06627 12.4184 6.54369 12.0203 6.91818C11.6223 7.29266 11.124 7.54885 10.5833 7.65697V8.85706H13.073C13.9527 8.85706 14.6667 9.55654 14.6667 10.4195V12.343C15.3749 12.4846 16.0041 12.8788 16.4325 13.4492C16.8609 14.0195 17.0579 14.7253 16.9852 15.4298C16.9126 16.1343 16.5755 16.7873 16.0393 17.2622C15.5032 17.7371 14.8061 18 14.0833 18C13.3605 18 12.6635 17.7371 12.1273 17.2622C11.5912 16.7873 11.2541 16.1343 11.1814 15.4298C11.1088 14.7253 11.3057 14.0195 11.7341 13.4492C12.1625 12.8788 12.7918 12.4846 13.5 12.343V10.4195C13.5 10.3084 13.455 10.2019 13.375 10.1233C13.295 10.0446 13.1864 10.0003 13.073 10H6.92817C6.87194 10 6.81627 10.0109 6.76432 10.0319C6.71237 10.053 6.66517 10.0839 6.62541 10.1229C6.58565 10.1618 6.55411 10.208 6.5326 10.2589C6.51108 10.3098 6.5 10.3644 6.5 10.4195V12.343C7.20819 12.4846 7.83748 12.8788 8.26587 13.4492C8.69425 14.0195 8.89121 14.7253 8.81857 15.4298C8.74592 16.1343 8.40884 16.7873 7.87268 17.2622C7.33651 17.7371 6.63947 18 5.91667 18C5.19388 18 4.49683 17.7371 3.96067 17.2622C3.4245 16.7873 3.08742 16.1343 3.01478 15.4298C2.94213 14.7253 3.13909 14.0195 3.56747 13.4492C3.99586 12.8788 4.62515 12.4846 5.33334 12.343V10.4195C5.33334 9.55654 6.04734 8.85706 6.92817 8.85706H9.41667V7.65697C8.75787 7.52523 8.16577 7.17455 7.74057 6.66427C7.31538 6.154 7.0832 5.51548 7.08334 4.85677Z"
                  fill="white"
                />
              </svg>
              Org Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveView("directory")}
              className={cn(
                "px-[15px] py-[5px] rounded-[25px] text-sm font-semibold transition cursor-pointer flex items-center gap-2",
                activeView === "directory"
                  ? "bg-[#1E88E5] text-white"
                  : "bg-[#232725] text-white hover:opacity-90",
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M17 2V18H4V16.0156H3V15.0156H4V13.0078H3V12.0078H4V8.00781H3V7.00781H4V5.00781H3V4.00781H4V2H17ZM16 3H5V17H16V3ZM15 6H10V5H15V6ZM15 8H10V7H15V8ZM7.5 14.9688C7.29688 14.9688 7.10677 14.9323 6.92969 14.8594C6.7526 14.7865 6.59635 14.6823 6.46094 14.5469C6.32552 14.4115 6.22135 14.2552 6.14844 14.0781C6.07552 13.901 6.03646 13.7083 6.03125 13.5C6.03125 13.2969 6.06771 13.1068 6.14062 12.9297C6.21354 12.7526 6.31771 12.599 6.45312 12.4688C6.58854 12.3385 6.74479 12.2318 6.92188 12.1484C7.09896 12.0651 7.29167 12.026 7.5 12.0312C7.70312 12.0312 7.89323 12.0703 8.07031 12.1484C8.2474 12.2266 8.40104 12.3307 8.53125 12.4609C8.66146 12.5911 8.76823 12.7474 8.85156 12.9297C8.9349 13.112 8.97396 13.3021 8.96875 13.5C8.96875 13.7031 8.92969 13.8932 8.85156 14.0703C8.77344 14.2474 8.66927 14.4036 8.53906 14.5391C8.40885 14.6745 8.2526 14.7786 8.07031 14.8516C7.88802 14.9245 7.69792 14.9635 7.5 14.9688ZM7.5 12.9688C7.34896 12.9688 7.22396 13.0182 7.125 13.1172C7.02604 13.2161 6.97396 13.3438 6.96875 13.5C6.96875 13.651 7.01823 13.776 7.11719 13.875C7.21615 13.974 7.34375 14.026 7.5 14.0312C7.65104 14.0312 7.77604 13.9818 7.875 13.8828C7.97396 13.7839 8.02604 13.6562 8.03125 13.5C8.03125 13.349 7.98177 13.224 7.88281 13.125C7.78385 13.026 7.65625 12.974 7.5 12.9688ZM7.5 7.96875C7.29688 7.96875 7.10677 7.93229 6.92969 7.85938C6.7526 7.78646 6.59635 7.68229 6.46094 7.54688C6.32552 7.41146 6.22135 7.25521 6.14844 7.07812C6.07552 6.90104 6.03646 6.70833 6.03125 6.5C6.03125 6.29688 6.06771 6.10677 6.14062 5.92969C6.21354 5.7526 6.31771 5.59896 6.45312 5.46875C6.58854 5.33854 6.74479 5.23177 6.92188 5.14844C7.09896 5.0651 7.29167 5.02604 7.5 5.03125C7.70312 5.03125 7.89323 5.07031 8.07031 5.14844C8.2474 5.22656 8.40104 5.33073 8.53125 5.46094C8.66146 5.59115 8.76823 5.7474 8.85156 5.92969C8.9349 6.11198 8.97396 6.30208 8.96875 6.5C8.96875 6.70312 8.92969 6.89323 8.85156 7.07031C8.77344 7.2474 8.66927 7.40365 8.53906 7.53906C8.40885 7.67448 8.2526 7.77865 8.07031 7.85156C7.88802 7.92448 7.69792 7.96354 7.5 7.96875ZM7.5 5.96875C7.34896 5.96875 7.22396 6.01823 7.125 6.11719C7.02604 6.21615 6.97396 6.34375 6.96875 6.5C6.96875 6.65104 7.01823 6.77604 7.11719 6.875C7.21615 6.97396 7.34375 7.02604 7.5 7.03125C7.65104 7.03125 7.77604 6.98177 7.875 6.88281C7.97396 6.78385 8.02604 6.65625 8.03125 6.5C8.03125 6.34896 7.98177 6.22396 7.88281 6.125C7.78385 6.02604 7.65625 5.97396 7.5 5.96875ZM15 13H10V12H15V13ZM15 15H10V14H15V15Z"
                  fill="white"
                />
              </svg>
              Staff Directory
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={handleAddEmployee}
              className="px-[15px] py-[5px] bg-[#008080] text-white rounded-[25px] text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M17 11H11V17H9V11H3V9H9V3H11V9H17V11Z" fill="white" />
              </svg>
              Add Employee
            </button>
            <button
              type="button"
              className="px-[15px] py-[5px] bg-[#535352] text-white rounded-[25px] text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M17 11H11V17H9V11H3V9H9V3H11V9H17V11Z" fill="white" />
              </svg>
              Transfer Employee
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === "org-chart" ? (
          error ? (
            <div className="flex items-center justify-center h-96 text-red-500">
              Error loading data: {error}
            </div>
          ) : (
            <div className="h-full">
              <OrgChartView
                orgChart={orgChart}
                loading={loading || orgChartLoading}
                selectedDepartment={getDepartmentNameById(
                  orgChartSelectedDepartment,
                  departments
                )}
                selectedDepartmentId={orgChartSelectedDepartment}
                isEditMode={isEditMode}
                departmentButtons={departmentButtons}
                departmentColors={departmentColors}
                onViewProfile={handleViewProfile}
                onSendEmail={handleSendEmail}
                onCall={handleCall}
                onSendMessage={handleSendMessage}
                onViewSOP={handleViewSOP}
                onAdd={handleAddSubordinate}
                onDelete={handleDeleteEmployee}
                onDepartmentFilter={handleOrgChartDepartmentFilter}
                onEditModeChange={setIsEditMode}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )
        ) : (
          <StaffDirectoryView
            selectedDepartment={directorySelectedDepartment}
            onSelectDepartment={handleDirectoryDepartmentFilter}
            onViewProfile={handleViewProfile}
            onSendEmail={handleSendEmail}
            onCall={handleCall}
            onSendMessage={handleSendMessage}
            onViewSOP={handleViewSOP}
            departments={departments}
            resolveEmployeeStatus={resolveEmployeeStatusByEmail}
          />
        )}
      </div>

      {/* Modals */}
      <ViewProfileModal
        isOpen={viewProfileOpen}
        employee={selectedEmployee}
        onClose={() => {
          setViewProfileOpen(false);
          setSelectedEmployee(null);
        }}
        onViewSOP={handleViewSOP}
        onSendEmail={handleSendEmail}
        onShare={handleSendMessage}
      />

      <SOPModal isOpen={sopModalOpen} onClose={() => setSopModalOpen(false)} />

      <AddStaffModal
        isOpen={addStaffModalOpen}
        manager={selectedManager}
        onClose={() => {
          setAddStaffModalOpen(false);
          setSelectedManager(null);
        }}
        onAdd={handleAddStaff}
      />

      <RemoveStaffModal
        isOpen={removeStaffModalOpen}
        onClose={() => {
          setRemoveStaffModalOpen(false);
        }}
        onConfirm={handleConfirmRemove}
        employeeName={""}
      />

      <DiscardChangesModal
        isOpen={discardChangesModalOpen}
        onClose={() => setDiscardChangesModalOpen(false)}
        onDiscard={handleDiscard}
      />

      <StaffRemovedModal
        isOpen={staffRemovedModalOpen}
        onClose={() => setStaffRemovedModalOpen(false)}
      />

      <OrgChartUpdatedModal
        isOpen={orgChartUpdatedModalOpen}
        onClose={() => setOrgChartUpdatedModalOpen(false)}
      />

      <ChangesDiscardedModal
        isOpen={changesDiscardedModalOpen}
        onClose={() => setChangesDiscardedModalOpen(false)}
      />

      <StaffAddedModal
        isOpen={staffAddedModalOpen}
        manager={selectedManager}
        onClose={() => {
          setStaffAddedModalOpen(false);
          setSelectedManager(null);
        }}
        onViewManager={handleViewProfile}
      />

      <CustomToast
        show={toastState.show}
        title={toastState.title}
        message={toastState.message}
        type={toastState.type}
        iconType={toastState.type === "error" ? "error" : "check"}
        onClose={() => setToastState((prev) => ({ ...prev, show: false }))}
        duration={3000}
      />
    </div>
  );
};

export default Organization;
