import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Target, Lock, CheckCircle, Clock, AlertTriangle, Send, Loader2, X, FileText, Package } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StudentProjectMilestones = () => {
    const { getUserId } = useAuth();
    const location = useLocation();
    const [team, setTeam] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submittingId, setSubmittingId] = useState(null);
    const [submissionNotes, setSubmissionNotes] = useState('');
    const [reportFile, setReportFile] = useState(null);
    const [zipFile, setZipFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchTeamAndMilestones = async () => {
            try {
                const userId = getUserId();
                const teamsRes = await projectsAPI.getStudentTeams(userId);
                const teams = teamsRes.data.teams || [];
                if (teams.length === 0) {
                    setLoading(false);
                    return;
                }
                const stateTeamId = location.state?.selectedTeamId;
                let currentTeam = teams[0];
                if (stateTeamId) {
                    const foundTeam = teams.find(t => (t.team_id || t._id) === stateTeamId);
                    if (foundTeam) currentTeam = foundTeam;
                }
                setTeam(currentTeam);
                try {
                    const [milestonesRes, progressRes] = await Promise.allSettled([
                        projectsAPI.getProjectMilestones(currentTeam.project_id),
                        projectsAPI.getTeamProgress(currentTeam.team_id || currentTeam._id)
                    ]);
                    const projectMilestones = milestonesRes.status === 'fulfilled' ? (milestonesRes.value.data || []) : [];
                    const progress = progressRes.status === 'fulfilled' ? progressRes.value.data : null;
                    const mergedMilestones = projectMilestones.map((m, index) => {
                        let isCompleted = false;
                        let isPending = false;
                        let isLocked = index > 0;
                        if (progress) {
                            const unlockedIds = (progress.unlocked_milestones || []).map(x => x.milestone_id);
                            const inUnlocked = unlockedIds.includes(m.milestone_id);
                            if (m.is_completed) isCompleted = true;
                            if (m.pending_approval) isPending = true;
                            isLocked = !inUnlocked && !isCompleted && !isPending;
                            if (progress.current_milestone_index !== undefined) {
                                if (index <= progress.current_milestone_index) isLocked = false;
                                if (index < progress.milestones_completed) isCompleted = true;
                            }
                        }
                        return { ...m, is_completed: isCompleted, pending_approval: isPending, is_locked: isLocked };
                    });
                    setMilestones(mergedMilestones);
                } catch (innerErr) {
                    console.error("Error creating merged view:", innerErr);
                    const res = await projectsAPI.getProjectMilestones(currentTeam.project_id);
                    setMilestones(res.data || []);
                }
            } catch (err) {
                console.error("Failed to load project milestones", err);
                setError("Failed to load project milestones");
            } finally {
                setLoading(false);
            }
        };
        fetchTeamAndMilestones();
    }, [getUserId]);

    const handleFileSelect = (e, setFile) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const uploadFile = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            const res = await fetch(`${apiBaseUrl}/api/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            return data.file_url;
        } catch (e) {
            console.error("Upload error:", e);
            toast.error(`Failed to upload ${file.name}`);
            return null;
        }
    };

    const handleSubmitMilestone = async () => {
        if (!submittingId) return;
        if (!submissionNotes) {
            toast.error("Please add some notes about your submission");
            return;
        }
        setIsUploading(true);
        try {
            const reportUrl = await uploadFile(reportFile);
            const zipUrl = await uploadFile(zipFile);
            await projectsAPI.submitMilestone(team.project_id, submittingId, {
                team_id: team.team_id || team._id,
                notes: submissionNotes,
                report_url: reportUrl,
                zip_url: zipUrl
            });
            toast.success('Milestone submitted for approval!');
            setSubmittingId(null);
            setSubmissionNotes('');
            setReportFile(null);
            setZipFile(null);
            setMilestones(prevMilestones => prevMilestones.map(m => {
                if (m.milestone_id === submittingId) return { ...m, pending_approval: true, is_locked: false };
                return m;
            }));
        } catch (error) {
            console.error('Submit failed:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to submit milestone';
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center h-[calc(100vh-8rem)]">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </motion.div>
        </DashboardLayout>
    );

    if (!team) return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center bg-gray-50 rounded-2xl mx-auto mt-10 max-w-2xl">
                <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Project Team</h2>
                <p className="text-gray-600">You must be assigned to a team to view milestones</p>
            </motion.div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="p-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <Target className="text-blue-600" size={32} />
                        Project Milestones
                    </h1>
                    <p className="text-gray-500 mt-2">Track your team's progress and submit milestones for approval to earn XP</p>
                </motion.div>

                <div className="space-y-6 max-w-4xl mx-auto">
                    {milestones.length === 0 ? (
                        <p className="text-gray-500 text-center">No milestones found for this project</p>
                    ) : (
                        milestones.map((milestone, index) => (
                            <motion.div key={milestone.milestone_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                                className={`border rounded-2xl p-6 shadow-sm transition-all ${milestone.is_completed ? 'bg-green-50 border-green-200' : milestone.pending_approval ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100 opacity-90'}`}>
                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 ${milestone.is_completed ? 'bg-green-100 border-green-500 text-green-700' : milestone.pending_approval ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                                {index + 1}
                                            </span>
                                            <h3 className="font-bold text-xl text-gray-800">{milestone.title}</h3>
                                            {milestone.is_completed && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Completed</span>}
                                            {milestone.pending_approval && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Pending</span>}
                                            {!milestone.is_completed && !milestone.pending_approval && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><Lock size={12} /> In Progress</span>}
                                        </div>
                                        <div className="pl-11">
                                            {milestone.due_date && <p className="text-sm text-gray-500 flex items-center gap-2 mb-2"><Clock size={14} /> Due: {new Date(milestone.due_date).toLocaleDateString()}</p>}
                                            {milestone.description && <p className="text-gray-600 mb-2">{milestone.description}</p>}
                                        </div>
                                    </div>
                                    <div className="pl-11 md:pl-0">
                                        {!milestone.is_completed && !milestone.pending_approval && (
                                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSubmittingId(milestone.milestone_id)}
                                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                                                <Send size={16} /> Submit Work
                                            </motion.button>
                                        )}
                                        {milestone.pending_approval && <span className="text-sm font-medium text-yellow-600 italic">Waiting for teacher review...</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                <AnimatePresence>
                    {submittingId && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSubmittingId(null)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
                                <button onClick={() => setSubmittingId(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Milestone</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Submission Notes</label>
                                        <textarea value={submissionNotes} onChange={(e) => setSubmissionNotes(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all" rows={3}
                                            placeholder="Describe what you accomplished..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-all relative cursor-pointer">
                                            <input type="file" accept=".pdf" onChange={(e) => handleFileSelect(e, setReportFile)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <div className="pointer-events-none">
                                                <div className="bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <FileText size={20} />
                                                </div>
                                                <p className="text-sm font-bold text-gray-600">Project Report</p>
                                                <p className="text-xs text-gray-400 truncate">{reportFile ? reportFile.name : "Upload PDF"}</p>
                                            </div>
                                        </div>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-all relative cursor-pointer">
                                            <input type="file" accept=".zip,.rar" onChange={(e) => handleFileSelect(e, setZipFile)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <div className="pointer-events-none">
                                                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <Package size={20} />
                                                </div>
                                                <p className="text-sm font-bold text-gray-600">Project Code</p>
                                                <p className="text-xs text-gray-400 truncate">{zipFile ? zipFile.name : "Upload ZIP"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setSubmittingId(null)}
                                        className="flex-1 py-2.5 text-gray-500 font-bold hover:bg-gray-50 active:scale-95 rounded-xl transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSubmitMilestone} disabled={isUploading}
                                        className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                        {isUploading ? <><Loader2 className="animate-spin" size={18} />Uploading...</> : 'Submit Work'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default StudentProjectMilestones;
