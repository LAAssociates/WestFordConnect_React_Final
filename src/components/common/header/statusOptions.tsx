import type { JSX } from 'react';
import ArrowLeft from '../../../assets/icons/arrow-left.svg';
import Line from '../../../assets/icons/line.svg';

export type StatusId = 'do-not-disturb' | 'active' | 'away';
export type AvailabilityStatusCode = 1 | 2 | 3;

export interface StatusOption {
    id: StatusId;
    code: AvailabilityStatusCode;
    label: string;
    icon: () => JSX.Element;
    color: string;
}

export const STATUS_STORAGE_KEY = 'headerStatus';
export const DEFAULT_STATUS_ID: StatusId = 'do-not-disturb';

const renderDoNotDisturbIcon = () => (
    <div className="flex items-center justify-center w-5 h-5 group-[.profile-avatar]:w-[13px] group-[.profile-avatar]:h-[13px] bg-[#D93025] rounded-full">
        <img src={Line} alt="Do not disturb" className="w-2.5" />
    </div>
);

const renderActiveIcon = () => <div className="w-5 h-5 group-[.profile-avatar]:w-[13px] group-[.profile-avatar]:h-[13px] bg-[#16A34A] rounded-full" />;

const renderAwayIcon = () => (
    <div className="flex items-center justify-center w-5 h-5 group-[.profile-avatar]:w-[13px] group-[.profile-avatar]:h-[13px] bg-[#FFB74D] rounded-full">
        <img src={ArrowLeft} alt="Away" className="w-2.5" />
    </div>
);

export const statusOptions: StatusOption[] = [
    {
        id: 'do-not-disturb',
        code: 1,
        label: 'Do not disturb',
        icon: renderDoNotDisturbIcon,
        color: 'text-green-600'
    },
    {
        id: 'active',
        code: 2,
        label: 'Active',
        icon: renderActiveIcon,
        color: 'text-green-600'
    },
    {
        id: 'away',
        code: 3,
        label: 'Away',
        icon: renderAwayIcon,
        color: 'text-orange-600'
    }
];

export const isValidStatusId = (value: string): value is StatusId =>
    statusOptions.some(option => option.id === value);

export const getStatusById = (statusId: StatusId | undefined): StatusOption =>
    statusOptions.find(option => option.id === statusId) ?? statusOptions[0];

export const getStatusByCode = (statusCode: number | undefined): StatusOption =>
    statusOptions.find(option => option.code === statusCode) ?? statusOptions[0];
