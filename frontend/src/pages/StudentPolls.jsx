import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CheckCircle, Clock, BarChart2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { pollsAPI } from '../services/api';

const StudentPolls = () => {
    const [activePoll, setActivePoll] = useState(null);
    const [hasResponded, setHasResponded] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(false);
    const [studentId] = useState('student_456');
    const [classroomId] = useState('class_101');

    useEffect(() => {
        const checkPolls = async () => {
            try {
                const res = await pollsAPI.getClassPolls(classroomId);
                const active = res.data.find(p => p.is_active);
                if (active && active.poll_id !== activePoll?.poll_id) {
                    const fullPollRes = await pollsAPI.getPoll(active.poll_id);
                    setActivePoll(fullPollRes.data);
                    setHasResponded(false);
                    setSelectedOption(null);
                } else if (!active) setActivePoll(null);
            } catch (error) {
                console.error("Error checking polls:", error);
            }
        };
        checkPolls();
        const intervalId = setInterval(checkPolls, 3000);
        return () => clearInterval(intervalId);
    }, [activePoll?.poll_id, classroomId]);

    const submitResponse = async (option) => {
        if (!activePoll) return;
        try {
            setLoading(true);
            await pollsAPI.respondToPoll(activePoll.poll_id, { student_id: studentId, response: option });
            setHasResponded(true);
            setSelectedOption(option);
        } catch (error) {
            console.error("Poll response error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto p-6">
                <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
                    <BarChart2 className="text-blue-600" /> Live Polls
                </motion.h1>

                {activePoll ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-2 mb-4 text-blue-600">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            <span className="text-sm font-bold uppercase tracking-wider">Live Poll</span>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{activePoll.question}</h2>

                        {hasResponded ? (
                            <div className="p-6 bg-green-50 rounded-xl text-center border border-green-100">
                                <CheckCircle className="mx-auto mb-3 text-green-500" size={48} />
                                <h3 className="font-bold text-green-800 text-lg mb-1">Response Submitted!</h3>
                                <p className="text-green-600 text-sm">You voted for: <span className="font-bold">{selectedOption}</span></p>
                                <p className="text-xs text-green-400 mt-2">Wait for teacher to reveal results</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(activePoll.options || []).map((option, idx) => (
                                    <motion.button key={idx} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => submitResponse(option)} disabled={loading}
                                        className="w-full text-left p-4 bg-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all text-gray-800 font-bold disabled:opacity-50 shadow-sm">
                                        {option}
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="font-bold text-gray-800 text-lg mb-2">No Active Polls</h3>
                        <p className="text-gray-500">Waiting for your teacher to start a poll...</p>
                        <div className="mt-6 flex justify-center">
                            <Loader2 className="animate-spin text-gray-300" size={24} />
                        </div>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentPolls;
