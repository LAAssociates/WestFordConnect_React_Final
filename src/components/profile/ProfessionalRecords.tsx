import React from 'react';
import { Plus, Edit, Download, MoreVertical, Trash2, X, Trash, Upload } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import AddIcon from '../../assets/icons/add.svg';
import Tooltip from '../ui/Tooltip';
import { profileService } from '../../services/profileService';
import { Skeleton } from '../common/Skeleton';

const RecordSectionSkeleton = () => (
    <section className="rounded-[15px] border-2 border-[#E6E6E6] bg-white shadow-[0_2px_4px_0_#0000001A] p-[15px] space-y-4">
        <div className="flex items-center gap-2.5">
            <Skeleton className="w-1 h-5 rounded-full" />
            <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
        </div>
    </section>
);

// Types
export type ReferenceType = 'professional' | 'personal';

export type ProfessionalReference = {
    id: string;
    name: string;
    contact: string;
    email: string;
    designation: string;
    company: string;
};

export type Qualification = {
    id: string;
    course: string;
    institution: string;
    university: string;
    yearOfPass: string;
    marks: string;
};

export type Experience = {
    id: string;
    organization: string;
    designation: string;
    workingFrom: string;
    workedTill: string;
    duration: string;
};

export type BankAccount = {
    id: string;
    bank: string;
    branch: string;
    accountNo: string;
    ibanNo: string;
    accountType: string;
    name: string;
    status: 'Active' | 'Inactive';
};

export type OtherDocument = {
    id: string;
    document: string;
    documentNo: string;
    nameAsInDocument: string;
    issuedDate: string;
    validTill: string;
    status: 'Active' | 'Inactive';
    file?: File | string;
    fileUrl?: string;
};

export type RecordSection = {
    id: string;
    title: string;
    isExpanded: boolean;
};

export type ProfessionalRecordsProps = {
    onAddRecord: (section: string, data: Record<string, unknown>) => void;
    onEditRecord: (section: string, id: string, data: Record<string, unknown>) => void;
    onDeleteRecord: (section: string, id: string) => void;
    onShowToast: (title: string, message: string) => void;
};

// Modal Components
type RecordModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    fields: { label: string; key: string; type?: 'text' | 'select' | 'file'; options?: string[] }[];
    initialData?: Record<string, string>;
    onSubmit: (data: Record<string, string | File>) => void;
    submitLabel?: string;
};

const RecordModal: React.FC<RecordModalProps> = ({
    isOpen,
    onClose,
    title,
    fields,
    initialData,
    onSubmit,
    submitLabel = 'Save',
}) => {
    const [formData, setFormData] = React.useState<Record<string, string>>(
        initialData || {}
    );
    const [fileData, setFileData] = React.useState<Record<string, File | null>>({});

    React.useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
            setFileData({});
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData: Record<string, string | File> = { ...formData };
        Object.keys(fileData).forEach((key) => {
            if (fileData[key]) {
                submitData[key] = fileData[key]!;
            }
        });
        onSubmit(submitData);
        onClose();
    };

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (key: string, file: File | null) => {
        setFileData((prev) => ({ ...prev, [key]: file }));
        if (file) {
            setFormData((prev) => ({ ...prev, [key]: file.name }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
            <div className="relative w-full max-w-[500px] rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#232725] text-white transition hover:bg-[#1F2937] cursor-pointer z-10"
                    aria-label="Close"
                >
                    <Plus className="h-3 w-3 stroke-3 rotate-45" />
                </button>

                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-2">
                        <img src={AddIcon} alt="Add" className="h-5 w-5" />
                        <h3 className="text-lg font-semibold text-[#1C2745]">{title}</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-[28px]">
                    {fields.map((field) => (
                        <div key={field.key} className="flex items-center gap-2 space-y-2">
                            <label className="block text-sm font-semibold text-[#1C2745] w-[125px]">
                                {field.label}
                            </label>
                            {field.type === 'file' ? (
                                <div className="w-full">
                                    <label htmlFor={`file-${field.key}`}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            id={`file-${field.key}`}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                handleFileChange(field.key, file);
                                            }}
                                        />
                                        <div className="cursor-pointer flex w-full items-center gap-2.5 rounded-[5px] border border-[#E6E6E6] p-2.5">
                                            <span className="text-[#535352] text-[15px]">
                                                {fileData[field.key]?.name || formData[field.key] || 'Upload'}
                                            </span>
                                            <Upload className="bg-[#1E88E5] rounded-full text-white p-1 w-6 h-6 shrink-0" />
                                        </div>
                                    </label>
                                </div>
                            ) : field.type === 'select' ? (
                                <select
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full rounded-[5px] border border-[#E6E6E6] p-2.5 text-[15px] text-[#535352] outline-none focus:border-[#1E88E5]"
                                >
                                    <option value="">Select {field.label}</option>
                                    {field.options?.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full rounded-[5px] border border-[#E6E6E6] p-2.5 text-[15px] text-[#535352] outline-none focus:border-[#1E88E5]"
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-full border border-[#CACACA] px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-[#F5F5F5]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="cursor-pointer rounded-full bg-[#DE4A2C] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B7321F]"
                        >
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type DeleteConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
            <div className="relative w-full max-w-[370px] rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#232725] text-white transition hover:bg-[#1F2937] cursor-pointer z-10"
                    aria-label="Close"
                >
                    <Plus className="h-3 w-3 stroke-3 rotate-45" />
                </button>

                <div className="flex items-center gap-2 px-6 pt-6 pb-4">
                    <Trash className="h-5 w-5 bg-[#D93025] rounded-full p-1 text-white" />
                    <h3 className="text-lg font-semibold text-black">Delete Record?</h3>
                </div>

                <div className="px-6 pb-6">
                    <p className="text-base font-normal tracking-normal leading-[130%] text-black mb-[15px]">
                        This record will be permanently deleted from your account. This action
                        cannot be undone.
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 cursor-pointer rounded-full border border-[#CACACA] text-[#D93025] px-6 py-2.5 text-sm font-semibold transition-colors"
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 cursor-pointer rounded-full border border-[#CACACA] px-6 py-2.5 text-sm font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Dropdown Component
type DropdownMenuProps = {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    position: { top: number; left: number };
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({
    isOpen,
    onClose,
    onEdit,
    onDelete,
    position,
}) => {
    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />
            <div
                className="fixed z-50 min-w-[200px] rounded-[10px] bg-[#232725] shadow-[0_2px_20px_0_#00000040] p-2.5"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
            >
                <button
                    type="button"
                    onClick={() => {
                        onEdit();
                        onClose();
                    }}
                    className="cursor-pointer flex w-full items-center gap-2 p-2.5 text-sm text-white transition-colors hover:bg-[#2F3432] first:rounded-t-lg"
                >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                    className="cursor-pointer flex w-full items-center gap-2 p-2.5 text-sm text-[#D93025] transition-colors hover:bg-[#2F3432] last:rounded-b-lg"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                </button>
            </div>
        </>
    );
};

// Section Component
type RecordSectionProps<T> = {
    title: string;
    badgeColor: string,
    records: T[];
    columns: { key: string; label: string }[];
    section: string;
    onAdd: () => void;
    onEdit: (record: T, section: string) => void;
    onDelete: (recordId: string, section: string) => void;
    renderCell?: (record: T, key: string) => React.ReactNode;
};

const rowPseudoClasses = "relative before:content-[''] before:h-[17px] before:border before:rounded-full before:border-[#CACACA] before:absolute before:left-3 before:top-1/2 before:-translate-y-1/2";

function RecordSection<T extends { id: string }>({
    title,
    badgeColor,
    records,
    columns,
    section,
    onAdd,
    onEdit,
    onDelete,
    renderCell,
}: RecordSectionProps<T>) {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [dropdownState, setDropdownState] = React.useState<{
        isOpen: boolean;
        recordId: string;
        position: { top: number; left: number };
    }>({
        isOpen: false,
        recordId: '',
        position: { top: 0, left: 0 },
    });

    const handleDropdownToggle = (
        e: React.MouseEvent<HTMLButtonElement>,
        recordId: string
    ) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setDropdownState({
            isOpen: true,
            recordId,
            position: {
                top: rect.bottom + 4,
                left: rect.right - 120,
            },
        });
    };

    const handleCloseDropdown = () => {
        setDropdownState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleEditModeToggle = () => {
        setIsEditMode(!isEditMode);
        if (isEditMode) {
            handleCloseDropdown();
        }
    };

    return (
        <section className="rounded-[15px] border-2 border-[#E6E6E6] bg-white shadow-[0_2px_4px_0_#0000001A]">
            <div className="flex items-center justify-between p-[15px]">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-1 h-5 rounded-full"
                        style={{ backgroundColor: badgeColor }}
                    ></div>
                    <h2 className="text-lg font-normal text-[#1C2745]">{title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={onAdd}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1E88E5] transition-colors hover:bg-[#1669BB]"
                            aria-label={`Add ${title}`}
                        >
                            <Plus className='mx-auto h-4 w-4 text-white' strokeWidth={2} />
                        </button>
                    )}
                    <Tooltip content="Edit Records" side="bottom" delay={300} disabled={isEditMode}>
                        <button
                            type="button"
                            onClick={handleEditModeToggle}
                            className={cn(
                                "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors",
                                isEditMode ? "bg-[#D93025] hover:bg-[#C62828]" : "bg-[#1E88E5] hover:bg-[#1669BB]"
                            )}
                            aria-label={isEditMode ? 'Close' : 'Edit'}
                        >
                            {isEditMode ? (
                                <X className='mx-auto h-4 w-4 text-white' strokeWidth={2} />
                            ) : (
                                <Edit className='mx-auto h-4 w-4 text-white' strokeWidth={2} />
                            )}
                        </button>
                    </Tooltip>
                </div>
            </div>

            <div className="px-4 pb-4 sm:px-6 sm:pb-6 overflow-x-auto">
                {records.length === 0 ? (
                    <p className="text-sm text-[#535352] py-4 text-center">
                        No records found. Click the + button to add one.
                    </p>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="rounded-full">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            "px-[25px] py-[15px] text-left text-sm font-semibold text-black bg-[#F2F7FA] first:rounded-l-[25px]",
                                            columns.indexOf(col) !== 0 && rowPseudoClasses
                                        )}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-[25px] py-[15px] w-[20px] bg-[#F2F7FA] rounded-r-[25px]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr
                                    key={record.id}
                                    className={cn(
                                        records.indexOf(record) !== records.length - 1 && "border-b border-[#E6E6E6]",
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={cn(
                                            "px-[25px] py-[15px] text-sm text-[#535352] font-medium",
                                            columns.indexOf(col) !== 0 && rowPseudoClasses
                                        )}>
                                            {renderCell
                                                ? (renderCell(record, col.key) || '-')
                                                : String((record as Record<string, unknown>)[col.key] || '-')}
                                        </td>
                                    ))}
                                    <td className="px-[25px] py-[15px] w-[20px]">
                                        <div
                                            className={cn(
                                                "flex items-center justify-end transition-opacity duration-300",
                                                isEditMode ? "opacity-100" : "opacity-0 pointer-events-none"
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => handleDropdownToggle(e, record.id)}
                                                className="cursor-pointer p-1.5 rounded hover:bg-[#E6E6E6] transition-colors relative"
                                                aria-label="More options"
                                            >
                                                <MoreVertical className="h-4 w-4 text-[#535352]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <DropdownMenu
                isOpen={dropdownState.isOpen}
                onClose={handleCloseDropdown}
                onEdit={() => {
                    const record = records.find((r) => r.id === dropdownState.recordId);
                    if (record) {
                        onEdit(record, section);
                    }
                }}
                onDelete={() => {
                    onDelete(dropdownState.recordId, section);
                }}
                position={dropdownState.position}
            />
        </section>
    );
}

// Main Component
const ProfessionalRecords: React.FC<ProfessionalRecordsProps> = ({
    onAddRecord,
    onEditRecord,
    onDeleteRecord,
    onShowToast,
}) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const hasFetchedData = React.useRef(false);

    // API data states
    const [professionalReferences, setProfessionalReferences] = React.useState<
        ProfessionalReference[]
    >([]);

    const [personalReferences, setPersonalReferences] = React.useState<
        ProfessionalReference[]
    >([]);

    const [qualifications, setQualifications] = React.useState<Qualification[]>([]);

    const [experience, setExperience] = React.useState<Experience[]>([]);

    const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);

    const [otherDocuments, setOtherDocuments] = React.useState<OtherDocument[]>([]);

    // Modal states
    const [modalState, setModalState] = React.useState<{
        isOpen: boolean;
        section: string;
        mode: 'add' | 'edit';
        recordId?: string;
        initialData?: Record<string, string>;
    }>({
        isOpen: false,
        section: '',
        mode: 'add',
    });

    const [deleteModalState, setDeleteModalState] = React.useState<{
        isOpen: boolean;
        section: string;
        recordId: string;
    }>({
        isOpen: false,
        section: '',
        recordId: '',
    });

    // Fetch professional records data
    React.useEffect(() => {
        if (hasFetchedData.current) return;

        const fetchProfessionalRecords = async () => {
            hasFetchedData.current = true;
            try {
                setIsLoading(true);
                const response = await profileService.getProfileProfessionalInfo();

                if (response.success && response.result) {
                    const data = response.result;

                    // Map API data to component format
                    setProfessionalReferences(
                        data.professionalReferences.map(ref => ({
                            id: ref.id.toString(),
                            name: ref.name,
                            contact: ref.contact,
                            email: ref.email,
                            designation: ref.designation,
                            company: ref.company,
                        }))
                    );

                    setPersonalReferences(
                        data.personalReferences.map(ref => ({
                            id: ref.id.toString(),
                            name: ref.name,
                            contact: ref.contact,
                            email: ref.email,
                            designation: ref.designation,
                            company: ref.company,
                        }))
                    );

                    setQualifications(
                        data.qualifications.map(qual => ({
                            id: qual.id.toString(),
                            course: qual.course,
                            institution: qual.institution,
                            university: qual.university,
                            yearOfPass: qual.yearOfPass,
                            marks: qual.marksPercentage,
                        }))
                    );

                    setExperience(
                        data.experience.map(exp => ({
                            id: exp.id.toString(),
                            organization: exp.organization,
                            designation: exp.designation,
                            workingFrom: exp.workingFrom,
                            workedTill: exp.workedTill,
                            duration: exp.duration,
                        }))
                    );

                    setBankAccounts(
                        data.bankAccounts.map(account => ({
                            id: account.id.toString(),
                            bank: account.bank,
                            branch: account.branch,
                            accountNo: account.accountNumber,
                            ibanNo: account.ibanNumber,
                            accountType: account.accountType,
                            name: account.nameOnAccount,
                            status: account.status as 'Active' | 'Inactive',
                        }))
                    );

                    setOtherDocuments(
                        data.otherDocuments.map(doc => ({
                            id: doc.id.toString(),
                            document: doc.documentName || '',
                            documentNo: doc.documentNumber,
                            nameAsInDocument: doc.nameAsInDocument,
                            issuedDate: doc.issuedDate || '',
                            validTill: doc.validTill || '',
                            status: doc.status as 'Active' | 'Inactive',
                            fileUrl: doc.downloadUrl,
                        }))
                    );
                }
            } catch (error) {
                console.error('Failed to fetch professional records:', error);
                onShowToast('Error', 'Failed to load professional records');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfessionalRecords();
    }, []);

    const getFieldsForSection = (section: string) => {
        const fieldMap: Record<
            string,
            { label: string; key: string; type?: 'text' | 'select' | 'file'; options?: string[] }[]
        > = {
            professionalReferences: [
                { label: 'Name', key: 'name' },
                { label: 'Contact', key: 'contact' },
                { label: 'Email', key: 'email' },
                { label: 'Designation', key: 'designation' },
                { label: 'Company', key: 'company' },
            ],
            personalReferences: [
                { label: 'Name', key: 'name' },
                { label: 'Contact', key: 'contact' },
                { label: 'Email', key: 'email' },
                { label: 'Designation', key: 'designation' },
                { label: 'Company', key: 'company' },
            ],
            qualifications: [
                { label: 'Course', key: 'course' },
                { label: 'Institution', key: 'institution' },
                { label: 'University', key: 'university' },
                { label: 'Year of Pass', key: 'yearOfPass' },
                { label: 'Marks %', key: 'marks' },
            ],
            experience: [
                { label: 'Organization', key: 'organization' },
                { label: 'Designation', key: 'designation' },
                { label: 'Working From', key: 'workingFrom' },
                { label: 'Worked Till', key: 'workedTill' },
                { label: 'Duration', key: 'duration' },
            ],
            bankAccounts: [
                { label: 'Bank', key: 'bank' },
                { label: 'Branch', key: 'branch' },
                { label: 'A/C No.', key: 'accountNo' },
                { label: 'IBAN No.', key: 'ibanNo' },
                {
                    label: 'A/C Type',
                    key: 'accountType',
                    type: 'select',
                    options: ['Current', 'Savings'],
                },
                { label: 'Name', key: 'name' },
                {
                    label: 'Status',
                    key: 'status',
                    type: 'select',
                    options: ['Active', 'Inactive'],
                },
            ],
            otherDocuments: [
                {
                    label: 'Document',
                    key: 'document',
                    type: 'select',
                    options: [
                        'CV / Resume',
                        'Driving License',
                        'Police Clearance',
                        'Other Personal Documents',
                    ],
                },
                { label: 'Document No. / ID', key: 'documentNo' },
                { label: 'Name as in Document', key: 'nameAsInDocument' },
                { label: 'Issued Date', key: 'issuedDate' },
                { label: 'Valid Till', key: 'validTill' },
                {
                    label: 'Status',
                    key: 'status',
                    type: 'select',
                    options: ['Active', 'Inactive'],
                },
                { label: 'Upload Document', key: 'file', type: 'file' },
            ],
        };
        return fieldMap[section] || [];
    };

    const handleAdd = (section: string) => {
        setModalState({
            isOpen: true,
            section,
            mode: 'add',
            initialData: {},
        });
    };

    const handleEdit = (record: Record<string, unknown>, section: string) => {
        setModalState({
            isOpen: true,
            section,
            mode: 'edit',
            recordId: (record as Record<string, unknown>).id as string,
            initialData: record as Record<string, string>,
        });
    };

    const handleDelete = (recordId: string, section: string) => {
        setDeleteModalState({
            isOpen: true,
            section,
            recordId,
        });
    };

    const handleModalSubmit = (data: Record<string, string | File>) => {
        const { section, mode, recordId } = modalState;

        // Handle file uploads - convert File to URL for storage
        const processedData: Record<string, string> = {};
        Object.keys(data).forEach((key) => {
            if (data[key] instanceof File) {
                const file = data[key] as File;
                processedData[key] = URL.createObjectURL(file);
                processedData[`${key}Name`] = file.name;
            } else {
                processedData[key] = data[key] as string;
            }
        });

        if (mode === 'add') {
            const newRecord = { ...processedData, id: Date.now().toString() };
            // Update local state
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const setters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
                professionalReferences: setProfessionalReferences,
                personalReferences: setPersonalReferences,
                qualifications: setQualifications,
                experience: setExperience,
                bankAccounts: setBankAccounts,
                otherDocuments: setOtherDocuments,
            };

            const setter = setters[section];
            if (setter) {
                setter((prev) => [...prev, newRecord]);
            }

            onAddRecord(section, newRecord);
            onShowToast('Record Added', 'Your record has been saved successfully.');
        } else {
            // Update local state
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const setters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
                professionalReferences: setProfessionalReferences,
                personalReferences: setPersonalReferences,
                qualifications: setQualifications,
                experience: setExperience,
                bankAccounts: setBankAccounts,
                otherDocuments: setOtherDocuments,
            };

            const setter = setters[section];
            if (setter) {
                setter((prev) =>
                    prev.map((r) => (r.id === recordId ? { ...r, ...processedData } : r))
                );
            }

            onEditRecord(section, recordId!, processedData);
            onShowToast('Record Updated', 'Your record has been updated successfully.');
        }
    };

    const handleDeleteConfirm = () => {
        const { section, recordId } = deleteModalState;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
            professionalReferences: setProfessionalReferences,
            personalReferences: setPersonalReferences,
            qualifications: setQualifications,
            experience: setExperience,
            bankAccounts: setBankAccounts,
            otherDocuments: setOtherDocuments,
        };

        const setter = setters[section];
        if (setter) {
            setter((prev) => prev.filter((r) => r.id !== recordId));
        }

        onDeleteRecord(section, recordId);
    };

    const renderStatusBadge = (status: string) => {
        const isActive = status === 'Active';
        return (
            <span
                className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
                    isActive
                        ? 'bg-[#16A34A]'
                        : 'bg-[#9A9A9A]'
                )}
            >
                {status}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-[10px] p-[15px] space-y-[15px]">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <RecordSectionSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[10px] p-[15px] space-y-[15px]">
            <RecordSection
                title="References - Professional"
                badgeColor="#DE4A2C"
                records={professionalReferences}
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'contact', label: 'Contact' },
                    { key: 'email', label: 'Email' },
                    { key: 'designation', label: 'Designation' },
                    { key: 'company', label: 'Company' },
                ]}
                section="professionalReferences"
                onAdd={() => handleAdd('professionalReferences')}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <RecordSection
                title="References - Personal"
                badgeColor="#1E88E5"
                records={personalReferences}
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'contact', label: 'Contact' },
                    { key: 'email', label: 'Email' },
                    { key: 'designation', label: 'Designation' },
                    { key: 'company', label: 'Company' },
                ]}
                section="personalReferences"
                onAdd={() => handleAdd('personalReferences')}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <RecordSection
                title="Qualifications"
                badgeColor="#16A34A"
                records={qualifications}
                columns={[
                    { key: 'course', label: 'Course' },
                    { key: 'institution', label: 'Institution' },
                    { key: 'university', label: 'University' },
                    { key: 'yearOfPass', label: 'Year of Pass' },
                    { key: 'marks', label: 'Marks %' },
                ]}
                section="qualifications"
                onAdd={() => handleAdd('qualifications')}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <RecordSection
                title="Experience"
                badgeColor="#16A34A"
                records={experience}
                columns={[
                    { key: 'organization', label: 'Organization' },
                    { key: 'designation', label: 'Designation' },
                    { key: 'workingFrom', label: 'Working From' },
                    { key: 'workedTill', label: 'Worked Till' },
                    { key: 'duration', label: 'Duration' },
                ]}
                section="experience"
                onAdd={() => handleAdd('experience')}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <RecordSection
                title="Bank Accounts"
                badgeColor="#232725"
                records={bankAccounts}
                columns={[
                    { key: 'bank', label: 'Bank' },
                    { key: 'branch', label: 'Branch' },
                    { key: 'accountNo', label: 'A/C No.' },
                    { key: 'ibanNo', label: 'IBAN No.' },
                    { key: 'accountType', label: 'A/C Type' },
                    { key: 'name', label: 'Name' },
                    { key: 'status', label: 'Status' },
                ]}
                section="bankAccounts"
                onAdd={() => handleAdd('bankAccounts')}
                onEdit={handleEdit}
                onDelete={handleDelete}
                renderCell={(record, key): React.ReactNode => {
                    if (key === 'status') {
                        return renderStatusBadge((record as BankAccount).status);
                    }
                    const value = (record as Record<string, unknown>)[key];
                    return value ? String(value) : '-';
                }}
            />

            <RecordSection
                title="Other Documents"
                badgeColor="#FFB74D"
                records={otherDocuments}
                columns={[
                    { key: 'document', label: 'Document' },
                    { key: 'documentNo', label: 'Document No. / ID' },
                    { key: 'nameAsInDocument', label: 'Name as in Document' },
                    { key: 'issuedDate', label: 'Issued Date' },
                    { key: 'validTill', label: 'Valid Till' },
                    { key: 'status', label: 'Status' },
                ]}
                section="otherDocuments"
                onAdd={() => handleAdd('otherDocuments')}
                onEdit={handleEdit}
                onDelete={handleDelete}
                renderCell={(record, key): React.ReactNode => {
                    if (key === 'document') {
                        const doc = record as OtherDocument;
                        const fileUrl = doc.fileUrl || doc.file || (record as Record<string, unknown>).file;
                        return (
                            <div className="flex items-center gap-2">
                                <span>{doc.document}</span>
                                <Download
                                    className="cursor-pointer h-5 w-5 bg-[#1E88E5] rounded-full p-[3px] stroke-3 text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (fileUrl && typeof fileUrl === 'string') {
                                            const link = document.createElement('a');
                                            link.href = fileUrl;
                                            link.download = doc.document;
                                            link.click();
                                        }
                                    }}
                                />
                            </div>
                        );
                    }
                    if (key === 'status') {
                        return renderStatusBadge((record as OtherDocument).status);
                    }
                    const value = (record as Record<string, unknown>)[key];
                    return value ? String(value) : '-';
                }}
            />

            {/* Add/Edit Modal */}
            <RecordModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                title={`${modalState.mode === 'add' ? 'Add New' : 'Edit'} ${modalState.section === 'professionalReferences'
                    ? 'Professional References'
                    : modalState.section === 'personalReferences'
                        ? 'Personal References'
                        : modalState.section === 'qualifications'
                            ? 'Qualification'
                            : modalState.section === 'experience'
                                ? 'Experience'
                                : modalState.section === 'bankAccounts'
                                    ? 'Bank Account'
                                    : 'Other Document'
                    }`}
                fields={getFieldsForSection(modalState.section)}
                initialData={modalState.initialData}
                onSubmit={handleModalSubmit}
                submitLabel={modalState.mode === 'add' ? 'Save' : 'Update'}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalState.isOpen}
                onClose={() =>
                    setDeleteModalState({ ...deleteModalState, isOpen: false })
                }
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
};

export default ProfessionalRecords;