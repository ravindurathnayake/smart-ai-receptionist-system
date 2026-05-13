import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminSearch } from '../../context/AdminSearchContext';
import Logo from '../../components/common/Logo';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useAdminSearch();

  const menuGroups = [
    {
      title: 'Management',
      items: [
        { name: 'Dashboard', icon: 'dashboard', path: '/admin' },
        { name: 'Appointments', icon: 'calendar_today', path: '/admin/appointments' },
        { name: 'Doctor Management', icon: 'medical_services', path: '/admin/doctors' },
        { name: 'Patient Records', icon: 'person_search', path: '/admin/patients' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Queue Control', icon: 'queue', path: '/admin/queue' },
        { name: 'System Health', icon: 'monitor_heart', path: '/admin/system-health' },
      ]
    },
    {
      title: 'Insights',
      items: [
        { name: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
        { name: 'Reviews & Feedback', icon: 'rate_review', path: '/admin/reviews' },
      ]
    }
  ];

  return (
    <div className="admin-layout-container text-on-surface">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div className="admin-logo-section mb-6">
            <div className="flex items-center gap-3 px-4">
              <Logo size="sm" onClick={() => navigate('/admin')} className="cursor-pointer" />
            </div>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="mb-8">
                <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {group.title}
                </h3>
                <nav className="space-y-1">
                  {group.items.map((item) => (
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
                      <div className="active-indicator"></div>
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-error/80 hover:text-error hover:bg-error/5 transition-all group"
            >
              <span className="material-symbols-rounded text-[18px] transition-transform group-hover:-translate-x-1">logout</span>
              <span className="font-black text-[10px] uppercase tracking-[0.2em]">Sign Out</span>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-10 bg-surface">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
