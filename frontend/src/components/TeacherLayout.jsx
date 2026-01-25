import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BarChart2,
    Radio,
    Map as MapIcon,
    Library,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    BookOpen,
    ClipboardList,
    CheckCircle,
    Award,
    UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, text, to, isCollapsed }) => {
    return (
        <NavLink
            to={to}
            end={to === '/teacher'} // Only exact match for dashboard home
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
        ${isActive
                    ? 'bg-[#AED6CF] text-[#065F46] font-bold shadow-sm'
                    : 'text-white hover:bg-[#AED6CF]/20 hover:text-white font-bold'
                }`
            }
        >
            <div className="relative z-10">
                <Icon size={24} className="transition-transform group-hover:scale-105" />
            </div>

            {!isCollapsed && (
                <span className="whitespace-nowrap overflow-hidden transition-all duration-300 text-sm tracking-wide">
                    {text}
                </span>
            )}

            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#065F46] text-[#EAE0CF] text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-md">
                    {text}
                </div>
            )}
        </NavLink>
    );
};

const TeacherLayout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const navItems = [
        { icon: LayoutDashboard, text: 'Overview', to: '/teacher' },
        { icon: Users, text: 'Classes & Rosters', to: '/teacher/classes' },
        { icon: BarChart2, text: 'Analytics Hub', to: '/teacher/analytics' },
        { icon: ClipboardList, text: 'Interventions', to: '/teacher/interventions' },
        { icon: Radio, text: 'Live Sessions', to: '/teacher/polls' }, // Reusing/Aliasing Polling
        { icon: MapIcon, text: 'Projects (PBL)', to: '/teacher/projects' },
        { icon: Award, text: 'Grading & APPROVALS', to: '/teacher/grading' }, // Combined
        { icon: BookOpen, text: 'Practice Manager', to: '/teacher/practice-manager' },
        { icon: Users, text: 'Soft Skills', to: '/teacher/soft-skills' }, // Added
        { icon: UserCheck, text: 'Attendance', to: '/teacher/attendance' },
        { icon: Library, text: 'Templates', to: '/teacher/templates' },
    ];

    return (
        <div className="min-h-screen bg-[#EAE0CF] flex flex-col md:flex-row font-sans">

            {/* Mobile Header */}
            <div className="md:hidden bg-[#065F46] p-4 shadow-sm flex items-center justify-between sticky top-0 z-50 border-b border-[#AED6CF]/20">
                <div className="flex items-center gap-2 font-bold text-[#EAE0CF]">
                    <div className="bg-[#AED6CF] p-1.5 rounded text-[#065F46]"><BarChart2 size={20} /></div>
                    <span>AMEP Access</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[#EAE0CF]">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar - Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '5rem' : '17rem' }}
                className="hidden md:flex flex-col bg-[#065F46] border-r border-[#AED6CF]/20 h-screen sticky top-0 z-40 shadow-xl"
            >
                {/* Brand */}
                <div className="p-6 flex items-center gap-3 overflow-hidden border-b border-[#AED6CF]/10">
                    <div className="bg-[#AED6CF] p-2 rounded-lg shrink-0 text-[#065F46] shadow-md">
                        <BarChart2 size={24} />
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-lg text-white tracking-tight leading-tight"
                        >
                            AMEP <span className="text-[#AED6CF]">Teacher</span>
                            <div className="text-[10px] text-white/70 font-normal uppercase tracking-widest">Workspace</div>
                        </motion.div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 bg-[#065F46] border border-[#AED6CF] rounded-full p-1 shadow-md text-[#EAE0CF] hover:text-[#AED6CF] transition-colors z-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Navigation */}
                <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item, idx) => (
                        <SidebarItem key={idx} {...item} isCollapsed={isCollapsed} />
                    ))}
                </div>

                {/* User Footer */}
                <div className="p-3 border-t border-[#AED6CF]/10 bg-[#065F46]">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-300 hover:bg-[#AED6CF]/10 hover:text-red-200 font-medium ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-[#065F46] z-50 shadow-2xl md:hidden overflow-y-auto"
                        >
                            <div className="p-6 border-b border-[#AED6CF]/20 flex items-center gap-3">
                                <div className="bg-[#AED6CF] p-2 rounded text-[#065F46]"><BarChart2 size={24} /></div>
                                <span className="font-bold text-xl text-[#EAE0CF]">Menu</span>
                            </div>
                            <div className="p-4 space-y-2">
                                {navItems.map((item, idx) => (
                                    <NavLink
                                        key={idx}
                                        to={item.to}
                                        end={item.to === '/teacher'}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive
                                                ? 'bg-[#AED6CF] text-[#065F46] font-bold border-l-4 border-[#065F46]'
                                                : 'text-[#EAE0CF] hover:bg-[#AED6CF]/20'
                                            }`
                                        }
                                    >
                                        <item.icon size={20} />
                                        {item.text}
                                    </NavLink>
                                ))}
                                <div className="pt-4 mt-6 border-t border-[#AED6CF]/20">
                                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-300 w-full hover:bg-red-500/10 rounded-lg font-medium">
                                        <LogOut size={20} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;
