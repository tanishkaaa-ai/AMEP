import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { Loader2, TrendingUp, CheckCircle, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentSoftSkillsProfile = ({ studentId }) => {
    const [skills, setSkills] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const teamsRes = await projectsAPI.getStudentTeams(studentId);
                const teamId = teamsRes.data.teams?.[0]?.team_id;
                const response = await projectsAPI.getStudentSoftSkills(studentId, teamId);
                setSkills(response.data);
            } catch (error) {
                console.error('[SOFT_SKILLS] Failed to load:', error);
            } finally {
                setLoading(false);
            }
        };
        if (studentId) fetchSkills();
    }, [studentId]);

    if (loading) return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-center min-h-[300px]">
            <Loader2 className="animate-spin text-gray-300" />
        </div>
    );

    if (!skills?.dimension_scores) return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-center min-h-[300px] text-gray-400 text-center text-sm">
            No soft skills data available yet. Receive peer reviews to unlock your profile!
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                        <BarChart2 className="text-blue-500" /> Soft Skills Profile
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Based on {skills.total_reviews_received} peer reviews</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-center">
                    <span className="block text-3xl font-extrabold text-blue-600 leading-none">
                        {skills.overall_soft_skills_score ? skills.overall_soft_skills_score.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Overall</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
                {Object.entries(skills.dimension_scores).map(([dimension, score], idx) => (
                    <motion.div key={dimension} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-sm font-bold text-gray-700 capitalize">
                                {dimension.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(score / 5) * 100}%` }} transition={{ duration: 1, delay: idx * 0.1, ease: "circOut" }}
                                className={`h-full rounded-full transition-all ${score >= 4.0 ? 'bg-green-500' : score >= 3.0 ? 'bg-blue-500' : 'bg-orange-400'}`} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-green-50 rounded-xl p-4">
                    <h3 className="font-bold text-green-700 mb-2 flex items-center gap-1.5 text-sm">
                        <CheckCircle size={14} /> Strengths
                    </h3>
                    <ul className="space-y-1">
                        {skills.strengths?.length > 0 ? skills.strengths.slice(0, 3).map((strength, idx) => (
                            <li key={idx} className="text-xs text-green-800 font-medium truncate">• {strength}</li>
                        )) : <span className="text-xs text-green-600/50 italic">None identified yet</span>}
                    </ul>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="bg-orange-50 rounded-xl p-4">
                    <h3 className="font-bold text-orange-700 mb-2 flex items-center gap-1.5 text-sm">
                        <TrendingUp size={14} /> Growth Areas
                    </h3>
                    <ul className="space-y-1">
                        {skills.areas_for_improvement?.length > 0 ? skills.areas_for_improvement.slice(0, 3).map((area, idx) => (
                            <li key={idx} className="text-xs text-orange-800 font-medium truncate">• {area}</li>
                        )) : <span className="text-xs text-orange-600/50 italic">None identified yet</span>}
                    </ul>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default StudentSoftSkillsProfile;
