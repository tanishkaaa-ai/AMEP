import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    Shield,
    ChevronLeft,
    ChevronRight,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarItem = ({ icon: Icon, text, to, isCollapsed }) => {
    return (
        <NavLink
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
        ${isActive
                    ? 'bg-slate-800 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 font-medium'
                }`
            }
        >
            <div className="relative z-10">
                <Icon size={24} className="transition-transform group-hover:scale-105" />
            </div>

            {!isCollapsed && (
                <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
                    {text}
                </span>
            )}

            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                    {text}
                </div>
            )}
        </NavLink>
    );
};

const AdminLayout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const navItems = [
        { icon: LayoutDashboard, text: 'Consolidated View', to: '/admin' },
        { icon: Users, text: 'Teacher Management', to: '/admin/teachers' },
        { icon: Activity, text: 'System Health', to: '/admin/health' },
        // Note: '/admin/teachers' and '/admin/health' might just scroll to sections or be separate pages. 
        // For MVP, if we only have one page, we can just link to '/admin' for all.
        // Update: User asked for "Admin Dashboard" mainly. I will keep it simple.
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">

            {/* Mobile Header */}
            <div className="md:hidden bg-slate-900 p-4 shadow-sm flex items-center justify-between sticky top-0 z-50 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-white">
                    <div className="bg-slate-700 p-1.5 rounded text-white"><Shield size={20} /></div>
                    <span>Admin Console</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar - Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '5rem' : '17rem' }}
                className="hidden md:flex flex-col bg-slate-900 border-r border-slate-800 h-screen sticky top-0 z-40 shadow-xl"
            >
                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3 border-b border-slate-800 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Shield size={24} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-extrabold text-lg text-white tracking-tight">Admin Console</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">AMEP Platform</span>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item, index) => (
                        <SidebarItem key={index} {...item} isCollapsed={isCollapsed} />
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={24} className="group-hover:-translate-x-1 transition-transform" />
                        {!isCollapsed && <span className="font-bold">Sign Out</span>}
                    </button>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="mt-4 w-full flex items-center justify-center py-2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
