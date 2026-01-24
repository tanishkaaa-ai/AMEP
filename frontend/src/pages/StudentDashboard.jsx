import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GamificationBadge from '../components/GamificationBadge';
import ProgressBar from '../components/ProgressBar';
import StudentSoftSkillsProfile from '../components/StudentSoftSkillsProfile';
import { Clock, Calendar, Flame, ClipboardList, GraduationCap, AlertCircle, Loader2, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { masteryAPI, classroomAPI, engagementAPI, projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard = () => {
    const { user, getUserId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        name: user?.profile?.first_name || 'Student',
        level: 1,
        xp: 0,
        nextLevelXp: 1000,
        streak: 0,
        masteryScore: 0,
        pendingAssignments: 0,
        activeProject: null,
        nextClass: {
            subject: 'No Upcoming Classes',
            time: '--:--',
            topic: 'Enjoy your break!'
        },
        recentActivity: [],
        badges: []
    });

    const STUDENT_ID = getUserId();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Parallel data fetching
                const [engagementRes, masteryRes, assignmentsRes, classesRes, gamificationRes, projectsRes] = await Promise.allSettled([
                    engagementAPI.getStudentEngagementHistory(STUDENT_ID, 30),
                    masteryAPI.getStudentMastery(STUDENT_ID),
                    classroomAPI.getStudentAssignments(STUDENT_ID, 'assigned'),
                    classroomAPI.getStudentClasses(STUDENT_ID),
                    engagementAPI.getGamificationProfile(STUDENT_ID),
                    projectsAPI.getStudentProjects(STUDENT_ID)
                ]);

                // Process Engagement/Gamification Data
                let engagementData = { level: 1, xp: 0, streak: 0, nextLevelXp: 1000, badges: [] };
                if (gamificationRes.status === 'fulfilled') {
                    engagementData = { ...engagementData, ...gamificationRes.value.data };
                }

                // Process Mastery Data
                let masteryScore = 0;
                let recentMasteryActivity = [];
                if (masteryRes.status === 'fulfilled') {
                    masteryScore = masteryRes.value.data.overall_mastery || 0;
                    // Extract recent mastered concepts for activity feed
                    recentMasteryActivity = (masteryRes.value.data.concepts || [])
                        .sort((a, b) => new Date(b.last_assessed) - new Date(a.last_assessed))
                        .slice(0, 2)
                        .map(c => ({
                            type: 'mastery',
                            title: `Mastered "${c.concept_name}"`,
                            date: new Date(c.last_assessed).toLocaleDateString(),
                            icon: 'medal',
                            color: 'purple'
                        }));
                }

                // Process Assignments (Pending count & activity)
                let pendingCount = 0;
                let recentAssignmentActivity = [];
                if (assignmentsRes.status === 'fulfilled') {
                    const assignments = assignmentsRes.value.data || [];
                    pendingCount = assignments.length;

                    recentAssignmentActivity = assignments.slice(0, 1).map(a => ({
                        type: 'assignment',
                        title: `New Assignment: ${a.title}`,
                        date: new Date(a.created_at).toLocaleDateString(),
                        icon: 'scroll',
                        color: 'blue'
                    }));
                }

                // Process Next Class (Real Schedule)
                let nextClass = { subject: 'No Upcoming Classes', time: '--:--', topic: 'Relax!' };
                if (classesRes.status === 'fulfilled' && classesRes.value.data.length > 0) {
                    // Simple logic: Find the first class with a schedule for "Today" -> In a real app, this would check weekday
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

                    const upcomingClasses = classesRes.value.data.filter(c => {
                        // Check if schedule exists and today is in days list
                        return c.schedule && c.schedule.days && c.schedule.days.includes(today);
                    });

                    if (upcomingClasses.length > 0) {
                        // Sort by time (simplified)
                        const firstClass = upcomingClasses[0];
                        nextClass = {
                            subject: firstClass.class_name,
                            time: firstClass.schedule.time || 'TBD',
                            topic: firstClass.subject
                        };
                    } else if (classesRes.value.data.length > 0) {
                        // Fallback to just showing the first class if no schedule match
                        const firstClass = classesRes.value.data[0];
                        nextClass = {
                            subject: firstClass.class_name,
                            time: (firstClass.schedule && firstClass.schedule.time) || '--:--',
                            topic: firstClass.subject
                        };
                    }
                }

                setData(prev => ({
                    ...prev,
                    name: user?.profile?.first_name || prev.name,
                    level: engagementData.level,
                    xp: engagementData.xp,
                    nextLevelXp: engagementData.nextLevelXp || 1000,
                    streak: engagementData.streak,
                    badges: engagementData.badges || [],
                    masteryScore: Math.round(masteryScore),
                    pendingAssignments: pendingCount,
                    nextClass: nextClass,
                    recentActivity: [...recentMasteryActivity, ...recentAssignmentActivity]
                }));

            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(`Error: ${err.message || String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        if (STUDENT_ID) {
            fetchDashboardData();
        } else {
            setLoading(false);
            setError("Please log in to view your dashboard.");
        }
    }, [STUDENT_ID, user]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading your adventure...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Connection Error</h3>
                    <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        return hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                                    {getGreeting()}, {data.name}!
                                </h1>
                                <p className="text-purple-100 text-lg flex items-center gap-2">
                                    <Zap className="w-5 h-5" fill="currentColor" />
                                    <span className="font-bold">{data.streak} day streak</span>
                                    <span className="opacity-80">— Keep crushing it!</span>
                                </p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30">
                                <div className="text-xs text-purple-100 font-semibold">Level</div>
                                <div className="text-3xl font-black">{data.level}</div>
                            </div>
                        </div>

                        <div className="bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/20">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-sm">Experience Progress</span>
                                <span className="text-sm font-mono bg-white/20 px-3 py-1 rounded-lg">{data.xp} / {data.nextLevelXp} XP</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(data.xp / data.nextLevelXp) * 100}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 h-full rounded-full shadow-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="absolute -top-6 -right-6 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200/50 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                <Flame className="w-6 h-6 text-orange-500" />
                            </div>
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">Active</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Current Project</h3>
                        {data.activeProject ? (
                            <>
                                <p className="text-xl font-black text-gray-800 mb-2 truncate">{data.activeProject.title}</p>
                                <div className="flex items-center gap-1 text-xs text-orange-600 font-semibold mb-3">
                                    <Clock className="w-3 h-3" />
                                    {data.activeProject.stage} Phase
                                </div>
                                <Link to="/student/projects" className="block w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-md transition-all text-center text-sm">
                                    Continue
                                </Link>
                            </>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-gray-400 text-sm mb-2">No active project</p>
                                <Link to="/student/classes" className="text-orange-600 font-bold text-xs hover:underline">Browse Classes</Link>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200/50 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                <GraduationCap className="w-6 h-6 text-emerald-600" />
                            </div>
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Mastery Score</h3>
                        <p className="text-4xl font-black text-gray-800 mb-3">{data.masteryScore}%</p>
                        <div className="bg-emerald-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${data.masteryScore}%` }}
                                transition={{ duration: 1 }}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full"
                            />
                        </div>
                        <p className="text-xs text-emerald-700 font-semibold mt-2">Top 15% in class</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200/50 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                <ClipboardList className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Pending Tasks</h3>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-4xl font-black text-gray-800">{data.pendingAssignments}</span>
                            <span className="text-sm text-gray-500 font-medium">this week</span>
                        </div>
                        <Link to="/student/classes" className="block w-full py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-center text-sm">
                            View All
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200/50 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-1">Next Class</h3>
                        <p className="text-lg font-black text-gray-800 truncate">{data.nextClass.subject}</p>
                        <p className="text-purple-600 font-bold text-sm mb-1">{data.nextClass.time}</p>
                        <p className="text-xs text-gray-500 mb-3 truncate">{data.nextClass.topic}</p>
                        <Link to="/student/classes" className="block w-full py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all text-center text-sm">
                            Join Now
                        </Link>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <StudentSoftSkillsProfile studentId={STUDENT_ID} />
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-gray-50">
                            <h3 className="font-black text-lg text-gray-800">Recent Activity</h3>
                            <Link to="/student/practice" className="text-purple-600 font-bold text-sm hover:text-purple-700 transition-colors">View All →</Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {data.recentActivity.length > 0 ? (
                                data.recentActivity.map((activity, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-4 hover:bg-purple-50/50 transition-all flex items-center gap-4 cursor-pointer group"
                                    >
                                        <GamificationBadge icon={activity.icon} color={activity.color} label="" />
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{activity.title}</p>
                                            <p className="text-xs text-gray-500">{activity.date}</p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-purple-500 transition-colors"></div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="font-medium">No recent activity</p>
                                    <p className="text-sm mt-1">Start exploring to see updates here!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl shadow-sm border border-amber-200/50 p-6">
                        <h3 className="font-black text-lg text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-xl">🏆</span> Your Badges
                        </h3>
                        {data.badges && data.badges.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {data.badges.slice(0, 4).map((badge, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <GamificationBadge
                                            icon={badge.icon}
                                            color={badge.color || 'amber'}
                                            label={badge.name}
                                            subtext={badge.description}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-4 opacity-60">
                                <GamificationBadge icon="star" color="gray" label="Locked" subtext="Keep going!" />
                                <GamificationBadge icon="shield" color="gray" label="Locked" subtext="Almost there!" />
                            </div>
                        )}
                        <div className="bg-white/60 backdrop-blur-sm border-2 border-dashed border-amber-300 rounded-xl p-4 mb-4 text-center">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Next Unlock</p>
                            <p className="font-black text-gray-800">Speedster Badge</p>
                            <p className="text-xs text-gray-600 mt-1">Complete 5 tasks quickly</p>
                        </div>
                        <Link to="/student/achievements" className="block w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all text-center">
                            Trophy Case →
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
