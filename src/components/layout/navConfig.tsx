import React from 'react';
import {
  AlertTriangleIcon,
  BellIcon,
  CarFrontIcon,
  ClipboardListIcon,
  FileBadgeIcon,
  GaugeIcon,
  GraduationCapIcon,
  HistoryIcon,
  IdCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MapIcon,
  MessageSquareIcon,
  NavigationIcon,
  PhoneCallIcon,
  PlusCircleIcon,
  SearchIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserIcon,
  UsersIcon } from
'lucide-react';
import type { Role } from '../../types';

export interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  end?: boolean;
}

const icon = (Component: React.ElementType) =>
<Component className="h-[18px] w-[18px]" aria-hidden />;


export const navConfig: Record<Role, NavItem[]> = {
  passenger: [
  { label: 'Dashboard', to: '/passenger/dashboard', icon: icon(LayoutDashboardIcon) },
  { label: 'Find Ride', to: '/passenger/find-ride', icon: icon(SearchIcon) },
  { label: 'My Bookings', to: '/passenger/bookings', icon: icon(TicketIcon) },
  { label: 'Active Ride', to: '/passenger/active-ride', icon: icon(NavigationIcon) },
  {
    label: 'Student Verification',
    to: '/passenger/student-verification',
    icon: icon(GraduationCapIcon)
  },
  {
    label: 'Emergency Contacts',
    to: '/passenger/emergency-contacts',
    icon: icon(PhoneCallIcon)
  },
  { label: 'Messages', to: '/passenger/messages', icon: icon(MessageSquareIcon) },
  { label: 'Notifications', to: '/passenger/notifications', icon: icon(BellIcon) },
  { label: 'Profile', to: '/passenger/profile', icon: icon(UserIcon) }],

  driver: [
  { label: 'Dashboard', to: '/driver/dashboard', icon: icon(GaugeIcon) },
  { label: 'My Profile', to: '/driver/profile', icon: icon(UserIcon) },
  { label: 'Driver Verification', to: '/driver/verification', icon: icon(IdCardIcon) },
  { label: 'Vehicle', to: '/driver/vehicles', icon: icon(CarFrontIcon) },
  { label: 'Offer Ride', to: '/driver/offer-ride', icon: icon(PlusCircleIcon) },
  { label: 'My Rides', to: '/driver/rides', icon: icon(MapIcon) },
  { label: 'Ride Requests', to: '/driver/requests', icon: icon(InboxIcon) },
  { label: 'Active Ride', to: '/driver/active-ride', icon: icon(NavigationIcon) },
  { label: 'Messages', to: '/driver/messages', icon: icon(MessageSquareIcon) },
  { label: 'Notifications', to: '/driver/notifications', icon: icon(BellIcon) },
  { label: 'Ride History', to: '/driver/history', icon: icon(HistoryIcon) }],

  admin: [
  { label: 'Dashboard', to: '/admin/dashboard', icon: icon(LayoutDashboardIcon) },
  { label: 'Users', to: '/admin/users', icon: icon(UsersIcon) },
  { label: 'Drivers', to: '/admin/drivers', icon: icon(CarFrontIcon) },
  {
    label: 'Student Verification',
    to: '/admin/student-verification',
    icon: icon(GraduationCapIcon)
  },
  {
    label: 'Driver Verification',
    to: '/admin/driver-verification',
    icon: icon(FileBadgeIcon)
  },
  { label: 'Rides', to: '/admin/rides', icon: icon(MapIcon) },
  { label: 'Bookings', to: '/admin/bookings', icon: icon(ClipboardListIcon) },
  { label: 'Reports', to: '/admin/reports', icon: icon(ShieldCheckIcon) },
  { label: 'Reported Issues', to: '/admin/issues', icon: icon(AlertTriangleIcon) }]

};