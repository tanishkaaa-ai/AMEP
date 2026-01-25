import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, dashboardAPI, achievementsAPI } from '../services/api';
import {
  GraduationCap,
  LineChart,
  Clock,
  AlertTriangle,
  Plus,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  Megaphone,
  Loader,
  Trash2,
  CheckCircle,
  XCircle,
  Trophy,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import CreateInterventionModal from '../components/CreateInterventionModal';
import BulkReportModal from '../components/BulkReportModal';

const StatCard = ({ icon: Icon, label, value, trend, color, subtext }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-[#F4FFFD] p-6 rounded-2xl border-2 border-[#065F46]/20 shadow-sm"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-bold text-[#065F46] bg-[#AED6CF]/30 px-2 py-1 rounded-full">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-extrabold text-[#065F46] mb-1">{value}</h3>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
  </motion.div>
);

const TeacherAchievementsModal = ({ isOpen, onClose, teacherId }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && teacherId) {
      const fetchAchievements = async () => {
        try {
          const res = await achievementsAPI.getTeacherStudentsAchievements(teacherId);
          setAchievements(res.data);
        } catch (error) {
          console.error("Failed to load achievements", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAchievements();
    }
  }, [isOpen, teacherId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-[#065F46] flex items-center gap-2">
              <Trophy className="text-[#065F46]" /> Student Achievements
            </h3>
            <p className="text-gray-500 text-sm">External awards from all your classes</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader className="animate-spin text-[#065F46]" size={40} />
            </div>
          ) : achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement._id} className="bg-gray-50 p-5 rounded-xl border border-gray-100 relative group hover:border-[#AED6CF] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#065F46] shadow-sm shrink-0 border border-gray-100">
                      <Trophy size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-[#065F46] text-lg leading-tight">{achievement.title}</h4>
                        <span className="text-xs font-bold bg-[#AED6CF]/30 text-[#065F46] px-2 py-1 rounded ml-2 whitespace-nowrap">
                          {achievement.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="font-bold text-gray-700 text-sm">{achievement.student_name}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {achievement.classes && achievement.classes.length > 0 ? achievement.classes.join(', ') : 'No Class'}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{achievement.description || 'No description provided.'}</p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-white border border-gray-200 text-gray-500 rounded flex items-center gap-1">
                          <Calendar size={12} /> {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'No Date'}
                        </span>
                        {achievement.proof_link && (
                          <a href={achievement.proof_link} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-[#AED6CF]/30 text-[#065F46] rounded flex items-center gap-1 hover:underline">
                            <LinkIcon size={12} /> View Proof
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Trophy className="mx-auto text-gray-300 mb-4 opacity-50" size={48} />
              <p className="text-gray-500 font-bold text-lg">No achievements found</p>
              <p className="text-gray-400 text-sm">Your students haven't added any external achievements yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const TeacherDashboard = () => {
  const { user, getUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgEngagement: 0,
    activeProjects: 0, // Placeholder as projects API isn't primary focus yet
    masteryIndex: 0
  });
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [interventionStudent, setInterventionStudent] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userId = getUserId();
        console.log("TeacherDashboard: Fetching data for user:", userId);

        if (!userId) {
          console.warn("TeacherDashboard: No user ID found");
          return;
        }

        // 1. Fetch Teacher's Classes
        const classesRes = await classroomAPI.getTeacherClasses(userId);
        console.log("TeacherDashboard: Classes fetched:", classesRes.data);
        const classes = classesRes.data || [];

        // Filter for "Today's Classes"
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];
        const todayClasses = classes.filter(c =>
          c.schedule?.days?.some(d => d.toLowerCase().includes(todayName.toLowerCase().substring(0, 3)))
        );

        // Fallback: show all active classes if no specific match (or just first 3)
        // Check if classes array is empty first
        setTodaysClasses(todayClasses.length > 0 ? todayClasses : classes.slice(0, 3));

        // 2. Fetch Alerts
        try {
          const alertsRes = await dashboardAPI.getAlerts({
            teacher_id: userId
          });
          console.log("TeacherDashboard: Alerts fetched:", alertsRes.data);
          setAtRiskStudents(Array.isArray(alertsRes.data) ? alertsRes.data.slice(0, 5) : []);
        } catch (err) {
          console.error("TeacherDashboard: Error fetching alerts:", err);
          setAtRiskStudents([]);
        }

        // 3. Calculate Stats
        let totalStudents = 0;
        let totalEngagement = 0;
        let classCountWithEngagement = 0;

        const engagementPromises = classes.map(c => dashboardAPI.getClassEngagement(c.classroom_id));
        const engagementResults = await Promise.allSettled(engagementPromises);

        classes.forEach((cls, index) => {
          totalStudents += (cls.student_count || 0);

          const res = engagementResults[index];
          if (res.status === 'fulfilled' && res.value.data) {
            totalEngagement += res.value.data.class_engagement_index || 0;
            classCountWithEngagement++;
          }
        });

        const avgEngagement = classCountWithEngagement > 0 ? Math.round(totalEngagement / classCountWithEngagement) : 0;
        console.log("TeacherDashboard: Calculated stats:", { totalStudents, avgEngagement });

        setStats({
          totalStudents,
          avgEngagement,
          activeProjects: 8,
          masteryIndex: 8.4
        });

        // 4. Institutional Metrics (School-Wide)
        try {
          const instRes = await dashboardAPI.getInstitutionalMetrics();
          setInstitutionalStats(instRes.data?.institution_summary);
        } catch (e) {
          console.warn("Failed to load institutional metrics", e);
        }

        // AI Suggestion
        if (avgEngagement > 0 && avgEngagement < 60) {
          setAiSuggestion({
            title: "Low Engagement Detected",
            text: "Overall class engagement is below 60%. Consider introducing a live poll or interactive breakout session to boost participation."
          });
        } else {
          setAiSuggestion({
            title: "AI Teaching Assistant Suggestion",
            text: "Student participation tends to drop during mid-session lectures. Consider adding a quick interactive poll to re-engage the class."
          });
        }

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getUserId]);

  const [institutionalStats, setInstitutionalStats] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  const handleDismissAlert = async (studentId) => {
    try {
      await dashboardAPI.dismissStudentAlerts(studentId);
      toast.success("Alert dismissed");
      setAtRiskStudents(prev => prev.filter(a => a.student_id !== studentId));
    } catch (error) {
      console.error("Failed to dismiss alert", error);
      toast.error("Failed to dismiss");
    }
  };

  const handleResolveAlert = async (studentId) => {
    try {
      await dashboardAPI.dismissStudentAlerts(studentId);
      toast.success("Issue resolved & removed");
      setAtRiskStudents(prev => prev.filter(a => a.student_id !== studentId));
    } catch (error) {
      toast.error("Failed to resolve");
    }
  };

  const handleDeleteClick = (e, cls) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setClassToDelete(cls);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await classroomAPI.deleteClassroom(classToDelete.classroom_id);

      // Update state
      setTodaysClasses(prev => prev.filter(c => c.classroom_id !== classToDelete.classroom_id));

      // Close modal
      setDeleteModalOpen(false);
      setClassToDelete(null);

      // Show success (using simple alert for now if toast not imported, or just console)
      // If toast available use it, otherwise console
      console.log('Class deleted successfully');
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class");
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader className="animate-spin text-[#065F46]" size={40} />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#065F46]">Administrator Dashboard</h1>
            <p className="text-[#065F46]/70 mt-1">{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {user?.first_name || 'Professor'}. Here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#AED6CF] text-[#065F46] font-bold rounded-xl hover:bg-[#AED6CF]/20 transition-colors shadow-sm">
              <Plus size={18} /> New Assignment
            </button>
            <button
              onClick={() => setAchievementsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#065F46] text-[#EAE0CF] font-bold rounded-xl hover:bg-[#065F46]/90 transition-colors shadow-lg"
            >
              <Trophy size={18} /> Student Achievements
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#AED6CF] text-[#065F46] font-bold rounded-xl hover:bg-[#AED6CF]/80 transition-colors shadow-lg"
            >
              <Megaphone size={18} /> Weekly Reports
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={stats.totalStudents}
            trend="+5%"
            color="bg-[#AED6CF]/30 text-[#065F46]"
          />
          <StatCard
            icon={LineChart}
            label="Avg. Engagement"
            value={`${stats.avgEngagement}%`}
            trend="+12%"
            color="bg-[#AED6CF]/30 text-[#065F46]"
            subtext="Based on real-time analysis"
          />
          <StatCard
            icon={Lightbulb}
            label="Mastery Index"
            value={`${stats.masteryIndex}/10`}
            color="bg-[#AED6CF]/30 text-[#065F46]"
            subtext="Class average across modules"
          />
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#FFE4E6] p-6 rounded-2xl border-2 border-[#FECDD3] shadow-md transform rotate-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-[#FFF1F2] text-[#E11D48] shadow-sm">
                <Megaphone size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#881337] mb-1">{atRiskStudents.length}</h3>
            <p className="text-sm font-medium text-[#E11D48]">Attention Needed</p>
            <p className="text-xs text-[#E11D48] mt-2">Students flagged by AI</p>
          </motion.div>
        </div>

        {/* School-Wide Performance Section (New) */}
        {institutionalStats && (
          <div className="bg-[#065F46] rounded-2xl p-6 shadow-md text-[#EAE0CF] overflow-hidden relative border-2 border-[#AED6CF]/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#AED6CF] rounded-full blur-[80px] opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <GraduationCap className="text-[#AED6CF]" /> School-Wide Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-[#AED6CF]/10 p-4 rounded-xl backdrop-blur-sm border border-[#AED6CF]/10">
                  <p className="text-xs text-[#AED6CF] uppercase font-bold">Total Students</p>
                  <p className="text-2xl font-bold mt-1 text-white">{institutionalStats.total_students}</p>
                </div>
                <div className="bg-[#AED6CF]/10 p-4 rounded-xl backdrop-blur-sm border border-[#AED6CF]/10">
                  <p className="text-xs text-[#AED6CF] uppercase font-bold">Avg Mastery</p>
                  <p className="text-2xl font-bold mt-1 text-white">{institutionalStats.average_mastery?.toFixed(1)}%</p>
                </div>
                <div className="bg-[#AED6CF]/10 p-4 rounded-xl backdrop-blur-sm border border-[#AED6CF]/10">
                  <p className="text-xs text-[#AED6CF] uppercase font-bold">Avg Engagement</p>
                  <p className="text-2xl font-bold mt-1 text-white">{institutionalStats.average_engagement?.toFixed(1)}%</p>
                </div>
                <div className="bg-[#AED6CF]/10 p-4 rounded-xl backdrop-blur-sm border border-[#AED6CF]/10">
                  <p className="text-xs text-[#AED6CF] uppercase font-bold">Total Classrooms</p>
                  <p className="text-2xl font-bold mt-1 text-white">{institutionalStats.total_classrooms}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content: Class Schedule / Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* ... (Existing Today's Classes code) ... */}
            <div className="bg-[#F4FFFD] rounded-2xl shadow-sm border-2 border-[#065F46]/20 overflow-hidden">
              <div className="p-6 border-b border-[#065F46]/10 flex justify-between items-center">
                <h2 className="font-bold text-lg text-[#065F46]">Today's Classes</h2>
                <NavLink to="/teacher/classes" className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  View All <ChevronRight size={16} />
                </NavLink>
              </div>
              <div className="divide-y divide-gray-50">
                {todaysClasses.length > 0 ? (
                  todaysClasses.map((cls) => (
                    <div key={cls.classroom_id} className="p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                            {cls.class_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 group-hover:text-teal-600 transition-colors">{cls.class_name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Clock size={14} /> {cls.schedule?.time || 'TBA'} • {cls.student_count || 0} Students
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={(e) => handleDeleteClick(e, cls)}
                            title="Delete Class"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No classes scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights Concept */}
            {aiSuggestion && (
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <Lightbulb size={24} className="text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{aiSuggestion.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                      {aiSuggestion.text}
                    </p>
                    <button className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-sm transition-colors">
                      Create Poll Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: At Risk & Upcoming */}
          <div className="space-y-6">
            <div className="bg-[#FFF1F2] rounded-2xl shadow-sm border border-[#FECDD3] overflow-hidden">
              <div className="p-5 border-b border-[#FECDD3] bg-[#FFE4E6]/50">
                <h2 className="font-bold text-lg text-[#9F1239] flex items-center gap-2">
                  <AlertTriangle size={20} /> Attention Needed
                </h2>
              </div>
              <div className="p-2">
                {atRiskStudents.length > 0 ? (atRiskStudents.map((alert) => (
                  <div
                    key={alert.alert_id} // Unique key
                    onClick={() => setInterventionStudent({ student_id: alert.student_id, name: alert.student_name })}
                    className="p-3 transition-colors hover:bg-[#FECDD3]/30 rounded-xl cursor-pointer group relative"
                  >
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveAlert(alert.student_id);
                        }}
                        className="text-[#FDA4AF] hover:text-[#10B981] p-1 hover:bg-[#D1FAE5] rounded"
                        title="Mark as Done"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissAlert(alert.student_id);
                        }}
                        className="text-[#FDA4AF] hover:text-[#E11D48] p-1 hover:bg-[#FFE4E6] rounded"
                        title="Dismiss/Delete Alert"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between items-start mb-1 pr-6">
                      <span className="font-bold text-[#881337] text-sm">{alert.student_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFE4E6] text-[#BE123C] rounded-full uppercase">
                        {alert.severity} Risk
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.behaviors?.map((b, i) => (
                        <span key={i} className={`text-[10px] bg-white/50 border px-1 rounded
                              ${(typeof b === 'string' ? b : b.type) === 'productive_struggle' || (typeof b === 'string' ? b : b.type) === 'concept_struggle'
                            ? 'text-orange-600 border-orange-200'
                            : 'text-[#E11D48] border-[#FECDD3]'}`}
                        >
                          {typeof b === 'string' ? b : b.description || b.type}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#E11D48] font-medium mt-1">Rec: {alert.recommendations?.[0] || 'Monitor'}</p>
                  </div>
                ))) : (
                  <div className="p-4 text-center text-sm text-[#9F1239]/70">
                    No critical alerts at this time.
                  </div>
                )}
                <NavLink to="/teacher/interventions" className="block w-full text-center py-3 text-xs font-bold text-[#FDA4AF] hover:text-[#E11D48] border-t border-[#FECDD3] mt-1">
                  View All Alerts
                </NavLink>
              </div>
            </div>

            <div className="bg-[#F4FFFD] rounded-2xl shadow-sm border-2 border-[#065F46]/20 p-6">
              <h3 className="font-bold text-[#065F46] mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-medium transition-colors">
                  📝 Grade Pending Submissions (5)
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-medium transition-colors">
                  📊 View Weekly Report
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-medium transition-colors">
                  ⚙️ Update Class Settings
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
      {
        interventionStudent && (
          <CreateInterventionModal
            studentId={interventionStudent.student_id}
            teacherId={getUserId()}
            initialData={{}}
            onClose={() => setInterventionStudent(null)}
            triggerRefresh={() => setAtRiskStudents(prev => prev.filter(a => a.student_id !== interventionStudent.student_id))}
          />
        )
      }
      {/* Delete Confirmation Modal */}
      {
        deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-gray-800">Delete Class?</h3>
                <button onClick={() => setDeleteModalOpen(false)}><div className="bg-gray-100 p-1 rounded-full"><AlertTriangle size={16} className="text-gray-500" /></div></button>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-800">{classToDelete?.class_name}</span>?
                This action cannot be undone and will archive all associated data.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-50 bg-white border border-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )
      }
      <BulkReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        teacherId={getUserId()}
      />

      {/* Teacher Achievements Modal */}
      {achievementsModalOpen && (
        <TeacherAchievementsModal
          isOpen={achievementsModalOpen}
          onClose={() => setAchievementsModalOpen(false)}
          teacherId={getUserId()}
        />
      )}
    </TeacherLayout >
  );
};

export default TeacherDashboard;