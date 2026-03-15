import React, { useMemo } from 'react';

import { cn } from '../../lib/utils/cn';
import SidebarNavItem from './SidebarNavItem';
import notesMenuIcon from '../../assets/icons/navigation/notes.svg';
import gmailMenuIcon from '../../assets/icons/navigation/gmail.svg';
import teamsMenuIcon from '../../assets/icons/navigation/teams.svg';
import logoutMenuIcon from '../../assets/icons/navigation/logout.svg';
import myWorkMenuIcon from '../../assets/icons/navigation/my-work.svg';
import calenderMenuIcon from '../../assets/icons/navigation/calender.svg';
import dashboardMenuIcon from '../../assets/icons/navigation/dashboard.svg';
import messengerMenuIcon from '../../assets/icons/navigation/messenger.svg';
import resourcesMenuIcon from '../../assets/icons/navigation/resources.svg';
import newsMenuIcon from '../../assets/icons/navigation/news-and-updates.svg';
import hamburgerMenuIcon from '../../assets/icons/navigation/hamburger-menu.svg';
import googleDriveMenuIcon from '../../assets/icons/navigation/google-drive.svg';
import organizationMenuIcon from '../../assets/icons/navigation/organization.svg';
import feeStructureMenuIcon from '../../assets/icons/navigation/fee-structure.svg';
import courseBrochureMenuIcon from '../../assets/icons/navigation/course-brochure.svg';
import { useMessengerContext } from '../../contexts/MessengerContext';

type SidebarProps = {
  isMobileOpen?: boolean;
  onNavigate?: () => void;
  onHamburgerClick?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onNavigate, onHamburgerClick }) => {
  const baseNavItemClasses = 'flex items-center justify-center w-[63px] h-[63px]';
  const handleNavItemClick = React.useCallback(() => {
    onNavigate?.();
  }, [onNavigate]);

  const { conversations } = useMessengerContext();

  // Calculate count of conversations with unread messages
  const unreadConversationsCount = useMemo(() => {
    return conversations.filter((conv) => conv.unreadCount > 0 && !conv.isMuted).length;
  }, [conversations]);

  return (
    <aside
      className={cn(
        'absolute left-0 top-0 z-40 flex h-full w-16 flex-col flex-shrink-0 bg-[#1C2745] transition-transform duration-300 ease-in-out lg:static lg:h-auto',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className={cn(baseNavItemClasses, 'border-b border-b-[#E6E6E6]')}>
        <button
          type="button"
          className="flex h-[63px] w-full cursor-pointer items-center justify-center"
          onClick={() => {
            onHamburgerClick?.();
            onNavigate?.();
          }}
          aria-label="Toggle navigation menu"
        >
          <img src={hamburgerMenuIcon} alt="menu" className="mx-auto h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col">
          <SidebarNavItem to="/dashboard" icon={dashboardMenuIcon} tooltip="Dashboard" onNavigate={handleNavItemClick} />
          <SidebarNavItem to="/messenger" icon={messengerMenuIcon} tooltip="Messenger" onNavigate={handleNavItemClick} badgeCount={unreadConversationsCount} />
          <SidebarNavItem to="/calendar" icon={calenderMenuIcon} tooltip="Calendar" onNavigate={handleNavItemClick} />
          <SidebarNavItem to="/my-work" icon={myWorkMenuIcon} tooltip="My Work" onNavigate={handleNavItemClick} />
          <SidebarNavItem to="/notes" icon={notesMenuIcon} tooltip="Notes" onNavigate={handleNavItemClick} />
          <SidebarNavItem to="/organization" icon={organizationMenuIcon} tooltip="Organization" onNavigate={handleNavItemClick} />
          <SidebarNavItem to="/news-and-updates" icon={newsMenuIcon} tooltip="News & Updates" onNavigate={handleNavItemClick} />
          <SidebarNavItem to="/resources" icon={resourcesMenuIcon} tooltip="Resources" onNavigate={handleNavItemClick} />
          <SidebarNavItem to="/fee-structure" icon={feeStructureMenuIcon} tooltip="Fee Structure" onNavigate={handleNavItemClick} />
          <SidebarNavItem
            to="/course-brochures"
            icon={courseBrochureMenuIcon}
            tooltip="Course Brochures"
            onNavigate={handleNavItemClick}
          />
        </div>

        <div className="flex flex-col gap-1">
          <SidebarNavItem to="https://gmail.com" icon={gmailMenuIcon} targetBlank tooltip="Gmail" onNavigate={handleNavItemClick} />
          <SidebarNavItem
            to="https://drive.google.com/drive/my-drive"
            icon={googleDriveMenuIcon}
            targetBlank
            tooltip="Google Drive"
            onNavigate={handleNavItemClick}
          />
          <SidebarNavItem
            to="https://teams.microsoft.com"
            icon={teamsMenuIcon}
            targetBlank
            tooltip="Microsoft Teams"
            onNavigate={handleNavItemClick}
          />
          <SidebarNavItem to="/logout" icon={logoutMenuIcon} tooltip="Log out" onNavigate={handleNavItemClick} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
