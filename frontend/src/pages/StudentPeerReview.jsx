import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { User, Users, Star, Award, Zap, Layout, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentPeerReview = () => {
    const { getUserId } = useAuth();
    const [teamMembers, setTeamMembers] = useState([]);
    const [team, setTeam] = useState(null);
    const [selectedReviewee, setSelectedReviewee] = useState(null);
    const [loading, setLoading] = useState(true);

    const [ratings, setRatings] = useState({
        team_dynamics: {
            communication: 3,
            active_listening: 3,
            conflict_resolution: 3,
            collaboration: 3
        },
        team_structure: {
            responsibility: 3,
            time_management: 3,
            organization: 3,
            role_clarity: 3
        },
        team_motivation: {
            enthusiasm: 3,
            commitment: 3,
            initiative: 3,
            perseverance: 3
        },
        team_excellence: {
            quality_focus: 3,
            creativity: 3,
            problem_solving: 3,
            innovation: 3
        }
    });

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                console.info('[PEER_REVIEW] Fetching team members');
                const userId = getUserId();
                const teamsRes = await projectsAPI.getStudentTeams(userId);

                if (teamsRes.data.teams && teamsRes.data.teams.length > 0) {
                    const currentTeam = teamsRes.data.teams[0];
                    setTeam(currentTeam);

                    // Fetch full team details to get members
                    const teamDetails = await projectsAPI.getTeam(currentTeam.team_id || currentTeam._id);

                    // Filter out self
                    const members = (teamDetails.data.members || []).filter(m => m.student_id !== userId);
                    setTeamMembers(members);

                    console.info('[PEER_REVIEW] Team members loaded:', members.length);
                }
            } catch (error) {
                console.error("Failed to load team data", error);
                toast.error("Failed to load team members");
            } finally {
                setLoading(false);
            }
        };

        if (getUserId()) {
            fetchTeamMembers();
        }
    }, [getUserId]);

    const handleSubmitReview = async () => {
        if (!selectedReviewee) {
            toast.error('Please select a team member to review');
            return;
        }

        try {
            console.info('[PEER_REVIEW] Submitting review:', {
                reviewee_id: selectedReviewee,
                reviewer_id: getUserId()
            });

            await projectsAPI.submitPeerReview(team.team_id || team._id, {
                reviewer_id: getUserId(),
                reviewee_id: selectedReviewee,
                review_type: 'mid_project',
                ratings: ratings
            });

            toast.success('Peer review submitted successfully!');
            console.info('[PEER_REVIEW] Review submitted successfully');

            // Reset form
            setSelectedReviewee(null);
            // Reset ratings logic if needed, keeping simple for now
        } catch (error) {
            console.error('[PEER_REVIEW] Submission failed:', error);
            toast.error('Failed to submit peer review');
        }
    };

    const RatingSlider = ({ dimension, skill, value, onChange }) => (
        <div className="mb-6">
            <div className="flex justify-between mb-2">
                <label className="font-bold text-gray-700 capitalize flex items-center gap-2">
                    {skill.replace('_', ' ')}
                </label>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{value}/5</span>
            </div>
            <input
                type="range"
                min="1"
                max="5"
                value={value}
                onChange={(e) => onChange(dimension, skill, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 font-medium mt-1">
                <span>Needs Work</span>
                <span>Excellent</span>
            </div>
        </div>
    );

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                        <Users className="text-blue-600" size={32} />
                        Peer Review
                    </h1>
                    <p className="text-gray-500 mt-2">Evaluate your team members on 4D Soft Skills dimensions.</p>
                </div>

                {teamMembers.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center text-yellow-800">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold">No Team Members Found</h3>
                        <p>You need to be in a team with other students to submit peer reviews.</p>
                    </div>
                ) : (
                    <>
                        {/* Team Member Selection */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                <User size={20} className="text-blue-500" />
                                Select Team Member to Review
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {teamMembers.map((member) => (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        key={member.student_id}
                                        onClick={() => setSelectedReviewee(member.student_id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedReviewee === member.student_id
                                                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">
                                            {member.student_name ? member.student_name[0] : '?'}
                                        </div>
                                        <p className="font-bold text-gray-800">{member.student_name || 'Unknown Student'}</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">{member.role || 'Member'}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {selectedReviewee && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Team Dynamics */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-indigo-600">
                                            <Users size={24} /> Team Dynamics
                                        </h2>
                                        {Object.keys(ratings.team_dynamics).map((skill) => (
                                            <RatingSlider
                                                key={skill}
                                                dimension="team_dynamics"
                                                skill={skill}
                                                value={ratings.team_dynamics[skill]}
                                                onChange={(dim, sk, val) => setRatings({
                                                    ...ratings,
                                                    [dim]: { ...ratings[dim], [sk]: val }
                                                })}
                                            />
                                        ))}
                                    </div>

                                    {/* Team Structure */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-teal-600">
                                            <Layout size={24} /> Team Structure
                                        </h2>
                                        {Object.keys(ratings.team_structure).map((skill) => (
                                            <RatingSlider
                                                key={skill}
                                                dimension="team_structure"
                                                skill={skill}
                                                value={ratings.team_structure[skill]}
                                                onChange={(dim, sk, val) => setRatings({
                                                    ...ratings,
                                                    [dim]: { ...ratings[dim], [sk]: val }
                                                })}
                                            />
                                        ))}
                                    </div>

                                    {/* Team Motivation */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-orange-600">
                                            <Zap size={24} /> Team Motivation
                                        </h2>
                                        {Object.keys(ratings.team_motivation).map((skill) => (
                                            <RatingSlider
                                                key={skill}
                                                dimension="team_motivation"
                                                skill={skill}
                                                value={ratings.team_motivation[skill]}
                                                onChange={(dim, sk, val) => setRatings({
                                                    ...ratings,
                                                    [dim]: { ...ratings[dim], [sk]: val }
                                                })}
                                            />
                                        ))}
                                    </div>

                                    {/* Team Excellence */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-purple-600">
                                            <Award size={24} /> Team Excellence
                                        </h2>
                                        {Object.keys(ratings.team_excellence).map((skill) => (
                                            <RatingSlider
                                                key={skill}
                                                dimension="team_excellence"
                                                skill={skill}
                                                value={ratings.team_excellence[skill]}
                                                onChange={(dim, sk, val) => setRatings({
                                                    ...ratings,
                                                    [dim]: { ...ratings[dim], [sk]: val }
                                                })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmitReview}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all text-lg flex items-center justify-center gap-2"
                                >
                                    <Star fill="currentColor" /> Submit Peer Review
                                </button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentPeerReview;
