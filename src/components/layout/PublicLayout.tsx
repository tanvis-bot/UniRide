import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { MenuIcon, XIcon } from 'lucide-react';
import { dashboardPath, useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Logo } from './Logo';
import { Footer } from './Footer';

const links = [
{ label: 'Home', to: '/' },
{ label: 'How It Works', to: '/how-it-works' },
{ label: 'Safety', to: '/safety' },
{ label: 'About', to: '/about' }];


export function PublicLayout() {
  const { status, user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((link) =>
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ease-out ${
              isActive ?
              'text-brand-700' :
              'text-ink-700 hover:bg-slate-100 hover:text-ink-900'}`

              }>
              
                {link.label}
              </NavLink>
            )}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {status === 'authenticated' && user ?
            <Link to={dashboardPath[user.role]}>
                <Button size="sm">Go to dashboard</Button>
              </Link> :

            <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            }
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink-800 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}>
            
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
        {open &&
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col" aria-label="Mobile">
              {links.map((link) =>
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-slate-100">
              
                  {link.label}
                </NavLink>
            )}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {status === 'authenticated' && user ?
            <Link to={dashboardPath[user.role]} className="col-span-2">
                  <Button block>Go to dashboard</Button>
                </Link> :

            <>
                  <Link to="/login">
                    <Button variant="secondary" block>
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button block>Sign Up</Button>
                  </Link>
                </>
            }
            </div>
          </div>
        }
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>);

}