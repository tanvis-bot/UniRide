import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOutIcon, MenuIcon, XIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { navConfig } from './navConfig';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;
  const items = navConfig[user.role];

  const roleLabel =
  user.role === 'passenger' ?
  'Passenger account' :
  user.role === 'driver' ?
  'Driver account' :
  'Platform admin';

  const nav =
  <nav className="flex h-full flex-col" aria-label="Dashboard">
      <div className="px-5 py-5">
        <Logo to={`/${user.role}/dashboard`} tone="light" />
      </div>
      <ul className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((item) =>
      <li key={item.to}>
            <NavLink
          to={item.to}
          className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out ${
          isActive ?
          'bg-brand-600 text-white' :
          'text-slate-300 hover:bg-white/5 hover:text-white'}`

          }>
          
              {item.icon}
              <span className="truncate">{item.label}</span>
            </NavLink>
          </li>
      )}
      </ul>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-300 transition-colors duration-150 ease-out hover:bg-rose-500/10 hover:text-rose-200">
        
          <LogOutIcon className="h-[18px] w-[18px]" aria-hidden />
          Logout
        </button>
      </div>
    </nav>;


  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-ink-900 lg:block">
        {nav}
      </aside>

      <AnimatePresence>
        {mobileOpen &&
        <div className="fixed inset-0 z-[1100] lg:hidden">
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 bg-ink-950/60"
            onClick={() => setMobileOpen(false)} />
          
            <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-y-0 left-0 w-72 bg-ink-900">
            
              <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-5 rounded-lg p-1.5 text-slate-300 hover:bg-white/10">
              
                <XIcon className="h-5 w-5" />
              </button>
              {nav}
            </motion.aside>
          </div>
        }
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink-800 lg:hidden">
              
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo to={`/${user.role}/dashboard`} />
            </div>
            <p className="hidden text-sm font-medium text-slate-500 lg:block">
              {roleLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <Button
              variant="secondary"
              size="sm"
              icon={<LogOutIcon className="h-4 w-4" aria-hidden />}
              onClick={() => setConfirmLogout(true)}
              className="hidden sm:inline-flex">
              
              Logout
            </Button>
            <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out of UniRide?"
        description="Your session token will be cleared and live tracking will disconnect. You will need to sign in again to reach your dashboard."
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setConfirmLogout(false)}>
              Stay signed in
            </Button>
            <Button
            variant="danger"
            onClick={() => {
              setConfirmLogout(false);
              logout();
            }}>
            
              Log out
            </Button>
          </>
        } />
      
    </div>);

}