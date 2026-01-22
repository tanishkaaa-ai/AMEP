import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CheckCircle, Clock, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { pollsAPI } from '../services/api';

const StudentPolls = () => {
    const [activePoll, setActivePoll] = useState(null);
    const [hasResponded, setHasResponded] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(false);
    const [studentId] = useState('student_456'); // Mock Student ID
    const [classroomId] = useState('class_101'); // Mock Classroom ID

    // Polling for active polls
    useEffect(() => {
        const checkPolls = async () => {
            try {
                // Get active polls for this classroom
                const res = await pollsAPI.getClassPolls(classroomId);
                const active = res.data.find(p => p.is_active);

                if (active) {
                    // If we found a new active poll that is different from current
                    if (active.poll_id !== activePoll?.poll_id) {
                        // Fetch full details including options
                        const fullPollRes = await pollsAPI.getPoll(active.poll_id);
                        setActivePoll(fullPollRes.data);
                        setHasResponded(false); // Reset for new poll
                        setSelectedOption(null);
                    }
                } else {
                    setActivePoll(null);
                }
            } catch (error) {
                console.error("Error checking for polls:", error);
            }
        };

        // Check immediately then every 3s
        checkPolls();
        const intervalId = setInterval(checkPolls, 3000);
        return () => clearInterval(intervalId);
    }, [activePoll?.poll_id, classroomId]);

    const submitResponse = async (option) => {
        if (!activePoll) return;

        try {
            setLoading(true);
            setSelectedOption(option);

            await pollsAPI.respondToPoll(activePoll.poll_id, {
                student_id: studentId,
                response: option
            });

            setHasResponded(true);
        } catch (error) {
            console.error("Failed to submit vote:", error);
            alert("Failed to submit response. You may have already voted.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto py-10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Live Session</h1>
                    <p className="text-gray-500 mt-2">Real-time feedback & anonymous polling.</p>
                </div>

                {activePoll ? (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 relative overflow-hidden"
                    >
                        <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-bold animate-pulse mb-6">
                            <span className="w-2 h-2 bg-red-600 rounded-full" /> LIVE POLL ACTIVE
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10">{activePoll.question}</h2>

                        {!hasResponded ? (
                            <div className="space-y-4 relative z-10">
                                {activePoll.options.map((option, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.02, backgroundColor: '#fff7ed' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => submitResponse(option)}
                                        disabled={loading}
                                        className="w-full p-5 text-left border-2 border-gray-100 rounded-2xl hover:border-orange-300 transition-all font-medium text-gray-700 flex items-center justify-between group disabled:opacity-50"
                                    >
                                        <span>{option}</span>
                                        <span className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-orange-400 flex items-center justify-center">
                                            <span className="w-3 h-3 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 relative z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                                >
                                    <CheckCircle size={40} />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Response Submitted!</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    You selected <span className="font-bold text-gray-800">"{selectedOption}"</span>.
                                    Waiting for teacher to close the poll...
                                </p>
                                <div className="mt-8 flex justify-center">
                                    <BarChart2 className="animate-pulse text-orange-400" size={32} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center"
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Active Poll</h3>
                        <p className="text-gray-500">Sit tight! When your teacher launches a question, it will appear here automatically.</p>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentPolls;
