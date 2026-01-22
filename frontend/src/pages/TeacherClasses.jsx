import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI } from '../services/api';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    GraduationCap,
    Calendar,
    ArrowRight,
    Loader
} from 'lucide-react';
import { motion } from 'framer-motion';

const ClassCard = ({ cls }) => (
    <motion.div
        whileHover={{ y: -5, rotate: 1 }}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col h-full transition-shadow hover:shadow-lg"
    >
        <div className={`${cls.theme_color || 'bg-teal-600'} h-32 relative p-6 text-white`}>
            <div className="absolute top-4 right-4">
                <button className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
            <div className="absolute bottom-6 left-6">
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-1 rounded mb-2 inline-block">
                    {cls.section}
                </span>
                <h3 className="font-bold text-xl leading-tight">{cls.class_name}</h3>
            </div>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <GraduationCap size={16} className="text-gray-400" />
                    <span>{cls.student_count || 0} Students Enrolled</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{cls.schedule?.days?.join('/')} {cls.schedule?.time}</span>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex gap-2">
                <button className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    Gradebook
                </button>
                <NavLink
                    to={`/classroom/${cls.classroom_id}`}
                    className="flex-1 py-2 text-sm font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    Open <ArrowRight size={14} />
                </NavLink>
            </div>
        </div>
    </motion.div>
);

const TeacherClasses = () => {
    const { user, getUserId } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const userId = getUserId();
                if (userId) {
                    const response = await classroomAPI.getTeacherClasses(userId);
                    setClasses(response.data);
                }
            } catch (err) {
                console.error('Error fetching classes:', err);
                setError('Failed to load classes');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, [getUserId]);

    const filteredClasses = classes.filter(cls =>
        cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader className="animate-spin text-teal-600" size={40} />
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Classes</h1>
                        <p className="text-gray-500 mt-1">Manage your courses, students, and curriculum.</p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200">
                        <Plus size={18} /> Create New Class
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search classes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
                            <Filter size={16} /> Filter
                        </button>
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
                            Archived
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClasses.map(cls => (
                        <ClassCard key={cls.classroom_id} cls={cls} />
                    ))}

                    {/* Add New Placeholder */}
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "#f0fdf9", borderColor: "#2dd4bf" }}
                        whileTap={{ scale: 0.98 }}
                        className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 text-gray-400 transition-all duration-300 min-h-[300px] group"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-teal-100 flex items-center justify-center text-gray-400 group-hover:text-teal-600 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold group-hover:text-teal-700">Add Another Class</span>
                    </motion.button>
                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherClasses;
