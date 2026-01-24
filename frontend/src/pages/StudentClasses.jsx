import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Book, User, Clock, MessageSquare, FileText, Loader2, AlertCircle, Plus, X, BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { classroomAPI, pollsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const StudentClasses = () => {
    const { getUserId } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [stream, setStream] = useState([]);
    const [loading, setLoading] = useState(true);
    const [streamLoading, setStreamLoading] = useState(false);
    const [error, setError] = useState(null);

    // Poll State
    const [activePoll, setActivePoll] = useState(null);
    const [pollSubmitted, setPollSubmitted] = useState(false);

    // Join Class State
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState(null);

    const STUDENT_ID = getUserId();

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await classroomAPI.getStudentClasses(STUDENT_ID);
            setClasses(response.data);
            if (response.data.length > 0 && !selectedClass) {
                setSelectedClass(response.data[0]);
            }
        } catch (err) {
            console.error("Error fetching classes:", err);
            setError("Failed to load your classes.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch classes on mount
    useEffect(() => {
        if (STUDENT_ID) {
            fetchClasses();
        } else {
            setLoading(false);
            setError("Please log in to view your classes.");
        }
    }, [STUDENT_ID]);

    // Fetch stream and active poll when selected class changes
    useEffect(() => {
        if (!selectedClass) return;

        const fetchStream = async () => {
            try {
                setStreamLoading(true);
                const response = await classroomAPI.getClassStream(selectedClass.classroom_id);
                setStream(response.data);
            } catch (err) {
                console.error("Error fetching stream:", err);
            } finally {
                setStreamLoading(false);
            }
        };

        const fetchActivePoll = async () => {
            try {
                // Fetch all polls for class, look for active one
                // Optimally we'd have an endpoint just for 'active poll', but filtering is fine for now
                const res = await pollsAPI.getClassPolls(selectedClass.classroom_id, {
                    student_id: STUDENT_ID,
                    active_only: true
                });
                const active = res.data.find(p => p.is_active);

                // Reset submission state if poll changes
                if (active?.poll_id !== activePoll?.poll_id) {
                    setPollSubmitted(active?.has_responded || false);
                } else if (active?.has_responded && !pollSubmitted) {
                    // Update state if we learned we responded (e.g. from background refresh)
                    setPollSubmitted(true);
                }
                setActivePoll(active || null);
            } catch (err) {
                console.error("Error fetching polls:", err);
            }
        };

        fetchStream();
        fetchActivePoll();

        // Poll for poll updates every 10s
        const pollInterval = setInterval(fetchActivePoll, 10000);
        return () => clearInterval(pollInterval);
    }, [selectedClass, location.key]); // Add location.key to force refresh on navigation back

    const handleSubmitPoll = async (option) => {
        if (!activePoll) return;
        try {
            await pollsAPI.respondToPoll(activePoll.poll_id, {
                student_id: STUDENT_ID,
                response: option
            });
            setPollSubmitted(true);
            toast.success("Poll response submitted!");
        } catch (err) {
            console.error("Poll submission error:", err);
            if (err.response?.data?.error === 'You have already responded to this poll') {
                setPollSubmitted(true);
                toast.error("You have already responded.");
            } else {
                toast.error("Failed to submit response.");
            }
        }
    };

    const handleStartAssignment = (assignmentId) => {
        navigate(`/student/assignment/${assignmentId}`);
    };

    const handleViewDetails = (postId) => {
        navigate(`/student/assignment/${postId}`);
    };

    const handleJoinClass = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoinLoading(true);
        setJoinError(null);

        try {
            await classroomAPI.joinClass({
                student_id: STUDENT_ID,
                join_code: joinCode.trim()
            });

            toast.success("Successfully joined the class!");
            setShowJoinModal(false);
            setJoinCode('');
            // Refresh classes
            fetchClasses();
        } catch (err) {
            console.error("Join class error:", err);
            setJoinError(err.response?.data?.error || "Failed to join class. Please check the code.");
        } finally {
            setJoinLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                    <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading your classes...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Oops!</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
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

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
                <div className="lg:col-span-1 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <BookOpen className="text-purple-600" size={28} />
                                My Classes
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Select a class to view</p>
                        </div>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl hover:shadow-lg transition-all"
                            title="Join a Class"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto pr-2 flex-1 space-y-3">
                        {classes.length === 0 ? (
                            <div className="text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center flex flex-col items-center bg-gray-50">
                                <Book size={48} className="mb-4 opacity-20" />
                                <p className="font-semibold">No classes yet</p>
                                <button
                                    onClick={() => setShowJoinModal(true)}
                                    className="mt-4 text-purple-600 font-bold hover:underline"
                                >
                                    Join your first class
                                </button>
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <motion.div
                                    key={cls.classroom_id}
                                    onClick={() => setSelectedClass(cls)}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                                        selectedClass?.classroom_id === cls.classroom_id
                                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg'
                                            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div
                                            className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider ${
                                                cls.theme_color ? '' : 'bg-teal-100 text-teal-700'
                                            }`}
                                            style={cls.theme_color ? { backgroundColor: `${cls.theme_color}20`, color: cls.theme_color } : {}}
                                        >
                                            {cls.class_name.split(' ')[0]}
                                        </div>
                                        {selectedClass?.classroom_id === cls.classroom_id && (
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                    <h3 className="font-black text-gray-900 text-lg mb-2">{cls.class_name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User size={14} />
                                        <span className="font-medium">{cls.teacher_name}</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    {selectedClass ? (
                        <>
                            <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-b border-purple-500">
                                <h1 className="text-2xl font-black">{selectedClass.class_name}</h1>
                                <p className="text-purple-100 flex items-center gap-2 mt-2 text-sm">
                                    <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                        Active
                                    </span>
                                    <span>•</span>
                                    <span className="font-semibold">Instructor: {selectedClass.teacher_name}</span>
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
                                {activePoll && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-2xl p-6 shadow-lg relative overflow-hidden"
                                    >
                                        <div className="absolute top-3 right-3 flex items-center gap-2">
                                            <span className="text-xs font-bold text-teal-700 bg-white/80 px-2 py-1 rounded-lg">LIVE</span>
                                            <span className="flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-teal-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-white p-2 rounded-xl shadow-sm">
                                                <Sparkles className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900">{activePoll.question}</h3>
                                        </div>

                                        {!pollSubmitted ? (
                                            <div className="space-y-2 mt-4">
                                                {activePoll.options?.map((option, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSubmitPoll(option)}
                                                        className="w-full text-left p-4 bg-white border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 rounded-xl transition-all font-bold text-gray-700 hover:text-teal-700 group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-teal-500 transition-colors"></div>
                                                            {option}
                                                        </div>
                                                    </button>
                                                )) || <p className="text-gray-500 text-center">Loading options...</p>}
                                            </div>
                                        ) : (
                                            <div className="mt-4 p-5 bg-white rounded-xl border-2 border-teal-400 text-center">
                                                <div className="inline-flex items-center gap-2 font-black text-teal-700 text-lg">
                                                    <div className="bg-teal-600 text-white rounded-full p-2"><User size={16} /></div>
                                                    Response Submitted!
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">Waiting for results...</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {streamLoading ? (
                                    <div className="flex justify-center p-12">
                                        <Loader2 className="animate-spin text-purple-400" size={32} />
                                    </div>
                                ) : stream.length > 0 ? (
                                    stream.map((post) => (
                                        <motion.div
                                            key={post.post_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100 hover:border-purple-300 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                                                    {post.author.author_name[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-gray-900">{post.author.author_name}</p>
                                                    <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                {post.post_type === 'assignment' && (
                                                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase shadow-md">
                                                        Assignment
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{post.content || post.title}</p>
                                            {post.content && post.title && post.title !== post.content && <h4 className='font-bold mb-2'>{post.title}</h4>}


                                            {post.post_type === 'assignment' && post.assignment_details && (
                                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 p-4 rounded-xl flex items-center justify-between mb-4 shadow-sm">
                                                    <span className="text-sm text-blue-900 font-bold flex items-center gap-2">
                                                        <Clock size={18} className="text-blue-600" /> Due: {post.assignment_details.due_date ? new Date(post.assignment_details.due_date).toLocaleDateString() : 'No Due Date'}
                                                    </span>
                                                    {post.current_user_submission && ['turned_in', 'graded', 'returned'].includes(post.current_user_submission.status) ? (
                                                        <div className="flex items-center gap-2">
                                                            {post.current_user_submission.grade !== undefined && post.current_user_submission.grade !== null ? (
                                                                <span className="font-bold text-green-600 bg-green-100 px-3 py-1 rounded-lg">
                                                                    {post.current_user_submission.grade}/{post.assignment_details.points || 100}
                                                                </span>
                                                            ) : (
                                                                <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-lg">
                                                                    Submitted
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => handleStartAssignment(post.post_id)}
                                                                className="text-blue-600 text-xs font-bold hover:underline"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStartAssignment(post.post_id)}
                                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:shadow-lg transition-all"
                                                        >
                                                            Start Now
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-5 pt-4 border-t border-gray-100 text-gray-500 text-sm">
                                                <button className="flex items-center gap-2 hover:text-purple-600 transition-colors font-semibold">
                                                    <MessageSquare size={18} />
                                                    {post.comment_count} Comments
                                                </button>
                                                {post.post_type === 'assignment' && (
                                                    <button
                                                        onClick={() => handleViewDetails(post.post_id)}
                                                        className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer font-semibold"
                                                    >
                                                        <FileText size={18} />
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-white rounded-full shadow-md mb-4 flex items-center justify-center relative">
                                            <Book size={32} className="text-gray-300" />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        </div>
                                        <h3 className="font-black text-gray-800 text-lg">All Caught Up!</h3>
                                        <p className="text-gray-500 max-w-xs mt-2">{selectedClass.class_name} has no new updates</p>
                                    </div>
                                )}

                                <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                                    — End of Stream —
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full flex-col">
                            <Book size={56} className="mb-4 text-gray-300" />
                            <p className="text-gray-500 font-semibold">Select a class to view stream</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showJoinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={() => setShowJoinModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowJoinModal(false)}
                                className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <X size={22} />
                            </button>

                            <div className="mb-7">
                                <h3 className="text-3xl font-black text-gray-900 mb-2">Join a Class</h3>
                                <p className="text-gray-600">
                                    Enter the class code provided by your teacher
                                </p>
                            </div>

                            <form onSubmit={handleJoinClass}>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3">
                                            Class Code
                                        </label>
                                        <input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            placeholder="AB12CD"
                                            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none text-xl font-mono tracking-wider uppercase transition-all text-center font-black"
                                            maxLength={6}
                                        />
                                    </div>

                                    {joinError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-3 border-2 border-red-200"
                                        >
                                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                            <span className="font-semibold">{joinError}</span>
                                        </motion.div>
                                    )}

                                    <div className="flex gap-3 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setShowJoinModal(false)}
                                            className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!joinCode.trim() || joinLoading}
                                            className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {joinLoading ? (
                                                <Loader2 size={22} className="animate-spin" />
                                            ) : (
                                                'Join Class'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default StudentClasses;
