import React from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { cn } from '../../../lib/utils/cn'
import AvatarImage from '../AvatarImage'

// Icons
import AdminBadgeIcon from '../../../assets/icons/admin-badge.svg'
import AttendanceIcon from '../../../assets/icons/navigation/profile/attendance.svg'
import LogoutIcon from '../../../assets/icons/navigation/profile/logout.svg'
import ProfileIcon from '../../../assets/icons/navigation/profile/profile.svg'
import SettingsIcon from '../../../assets/icons/navigation/profile/settings.svg'
import SwitchRoleIcon from '../../../assets/icons/navigation/profile/switch-role.svg'
import AvatarPlaceholder from '../../../assets/images/default-group-icon.png'

interface UserProfileProps {
  name?: string
  avatar?: string
  status?: 'online' | 'away' | 'busy' | 'offline'
  statusIcon?: React.ReactNode
  className?: string
  onClick?: () => void
}

type MenuOptionId = 'view-profile' | 'attendance' | 'switch-role' | 'settings' | 'log-out'

// ✅ Menu options
const menuOptions: Array<{
  id: MenuOptionId
  label: string
  icon: React.ReactNode
  path?: string
  isDestructive?: boolean
}> = [
    {
      id: 'view-profile',
      label: 'View Profile',
      icon: <img src={ProfileIcon} alt="Profile" className="w-5 h-5" />,
      path: '/my-profile'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <img src={AttendanceIcon} alt="Attendance" className="w-5 h-5" />,
      path: '/attendance'
    },
    {
      id: 'switch-role',
      label: 'Switch Role',
      icon: <img src={SwitchRoleIcon} alt="Switch Role" className="w-5 h-5" />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <img src={SettingsIcon} alt="Settings" className="w-5 h-5" />,
      path: '/settings'
    },
    {
      id: 'log-out',
      label: 'Log Out',
      icon: <img src={LogoutIcon} alt="Log Out" className="w-5 h-5" />,
      path: '/logout'
    }
  ]

const UserProfile: React.FC<UserProfileProps> = ({
  name = 'User',
  avatar,
  status = 'online',
  statusIcon,
  className = '',
  onClick
}) => {
  const roleOptions = [
    {
      id: 'staff-view',
      label: name,
      description: 'Staff View',
      avatar: avatar || AvatarPlaceholder
    },
    {
      id: 'admin-console',
      label: name,
      description: 'Admin Console',
      avatar: avatar || AvatarPlaceholder
    }
  ]

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeOption, setActiveOption] = React.useState<MenuOptionId | null>(null)
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; right: number } | null>(null)

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  }

  // 🧼 Close menu on outside click
  const updateMenuPosition = React.useCallback(() => {
    if (!triggerRef.current) {
      return
    }

    const rect = triggerRef.current.getBoundingClientRect()
    const OFFSET_PX = 4

    setMenuPosition({
      top: rect.bottom + OFFSET_PX,
      right: window.innerWidth - rect.right
    })
  }, [])

  React.useEffect(() => {
    if (!isOpen) {
      return
    }

    updateMenuPosition()

    const handleWindowChange = () => {
      updateMenuPosition()
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }

      setIsOpen(false)
      setActiveOption(null)
      setMenuPosition(null)
    }

    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', handleWindowChange, true)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, updateMenuPosition])

  const handleToggle = () => {
    onClick?.()
    setIsOpen((prev) => {
      const next = !prev

      if (next) {
        updateMenuPosition()
      } else {
        setMenuPosition(null)
        setActiveOption(null)
      }

      return next
    })
  }

  const handleClose = () => {
    setIsOpen(false)
    setActiveOption(null)
    setMenuPosition(null)
  }

  const renderMenuButton = (option: typeof menuOptions[number]) => {
    const buttonClasses = cn(
      'relative cursor-pointer flex items-center gap-2 rounded-[5px] p-2.5 text-sm transition-colors duration-150 text-left',
      activeOption === option.id ? 'bg-[#42484B]' : 'hover:bg-[#42484B]',
      option.isDestructive ? 'text-[#FF7E79]' : 'text-white'
    )

    const content = (
      <>
        <span
          className={cn(
            'flex items-center justify-center rounded-full bg-white/10',
            option.isDestructive && 'bg-[#3A2624]'
          )}
        >
          {option.icon}
        </span>
        <span>{option.label}</span>
      </>
    )

    // 🟢 Only Switch Role uses active state
    if (option.id === 'switch-role') {
      return (
        <button
          type="button"
          key={option.id}
          onClick={() =>
            setActiveOption((prev) => (prev === 'switch-role' ? null : 'switch-role'))
          }
          className={buttonClasses}
        >
          {content}
        </button>
      )
    }

    // 🔗 Other menu items navigate and reset activeOption
    if (option.path) {
      return (
        <Link to={option.path} key={option.id} onClick={handleClose} className="cursor-pointer">
          <div className={buttonClasses}>{content}</div>
        </Link>
      )
    }

    return (
      <button type="button" key={option.id} onClick={handleClose} className={buttonClasses}>
        {content}
      </button>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Avatar Trigger */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors outline-none cursor-pointer"
        aria-label={`User profile${name ? ` for ${name}` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        type="button"
      >
        <div className="relative">
          <AvatarImage
            src={avatar}
            alt={name}
            size={48}
            loading="eager"
            decoding="async"
            fallbackSrc={AvatarPlaceholder}
            className="w-12 h-12"
          />
          <div className="absolute -bottom-1 -right-1">
            {statusIcon ? (
              <div className="group profile-avatar rounded-full border-2 border-white overflow-hidden">
                {statusIcon}
              </div>
            ) : (
              <div
                className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 border-white',
                  statusColors[status]
                )}
              />
            )}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="z-50 min-w-[200px]"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              right: menuPosition.right
            }}
            role="menu"
            aria-label="Profile options"
          >
            <div className="relative bg-[#232725] text-white rounded-[10px] p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.25)] flex gap-4 min-w-[200px]">
              <div className="flex flex-col w-full">
                {menuOptions.map((option) => (
                  <React.Fragment key={option.id}>
                    {option.id === 'log-out' && <div className="h-px bg-[#E6E6E6] mt-[15px] mb-[10px]" />}
                    {renderMenuButton(option)}
                  </React.Fragment>
                ))}
              </div>

              {/* Switch Role Submenu */}
              {activeOption === 'switch-role' && (
                <div className="absolute right-[calc(100%+2px)] top-[7.25rem] flex-1 min-w-[218px] bg-[#232725] rounded-[10px] p-2.5">
                  <div className="flex flex-col gap-2">
                    {roleOptions.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white px-3 py-2 text-left text-sm transition-all cursor-pointer"
                        onClick={handleClose}
                      >
                        <div className="relative">
                          <img
                            src={role.avatar}
                            alt={role.label}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = AvatarPlaceholder
                            }}
                          />
                          {role.id === 'admin-console' && (
                            <img
                              src={AdminBadgeIcon}
                              alt="Admin Badge"
                              className="absolute -bottom-1 -right-1 w-5 h-5"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black mb-[5px]">{role.label}</p>
                          <p className="text-sm text-[#535352]">{role.description}</p>
                          <div className="h-1 mt-px bg-black rounded-full w-0 group-hover:w-[52px] transition-all duration-300"></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default UserProfile
