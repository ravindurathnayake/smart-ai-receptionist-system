import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminSearch } from '../../context/AdminSearchContext';
import Logo from '../../components/common/Logo';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useAdminSearch();

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { name: 'Appointments', icon: 'calendar_today', path: '/admin/appointments' },
    { name: 'Doctor Management', icon: 'medical_services', path: '/admin/doctors' },
    { name: 'Queue Control', icon: 'queue', path: '/admin/queue' },
    { name: 'Patient Records', icon: 'person_search', path: '/admin/patients' },
    { name: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
    { name: 'Reviews & Complaints', icon: 'rate_review', path: '/admin/reviews' },
    { name: 'System Health', icon: 'monitor_heart', path: '/admin/system-health' },
  ];

  return (
    <div className="admin-layout-container text-on-surface">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="flex flex-col h-full">
          <div className="admin-logo-section mb-10 px-2">
            <Logo size="sm" className="mb-2" />
            <div className="pl-8 inline-block">
              <span className="text-[10px] uppercase tracking-widest text-outline font-black opacity-60">Admin Console</span>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="material-symbols-rounded">
                  {item.icon}
                </span>
                <span className="nav-label">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="admin-sidebar-support space-y-4">
            <div className="support-card">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-rounded text-primary text-xl">help_outline</span>
                <span className="font-bold text-sm text-primary">Support</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                Need assistance with the system? Our tech team is online.
              </p>
              <button className="w-full py-2.5 px-4 bg-white border border-outline-variant/30 hover:border-primary/30 rounded-xl text-[13px] font-bold text-primary transition-all shadow-sm">
                Contact Tech Support
              </button>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-error hover:bg-error-container/20 transition-all duration-300 group"
            >
              <span className="material-symbols-rounded text-[22px]">logout</span>
              <span className="font-semibold text-[15px]">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[288px] flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-search-wrapper group">
            <span className="material-symbols-rounded absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search patients, doctors, or reports..." 
              className="admin-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6 ml-10">
            <button className="relative w-12 h-12 rounded-xl border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-all">
              <span className="material-symbols-rounded text-on-surface-variant">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-4 ring-surface"></span>
            </button>
            
            <div className="h-10 w-[1px] bg-outline-variant/50"></div>

            <div className="admin-profile-pill">
              <div className="text-right">
                <p className="text-[13px] font-bold text-on-surface">Dr. Aruni Perera</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Chief Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/10">
                AP
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-10 bg-surface admin-page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
