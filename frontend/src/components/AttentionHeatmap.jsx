import React from 'react';
import { motion } from 'framer-motion';
import { Users, Info } from 'lucide-react';

const AttentionHeatmap = ({ attentionMap, loading }) => {
    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8 h-64 flex items-center justify-center animate-pulse">
                <div className="text-gray-400">Loading Attention Map...</div>
            </div>
        );
    }

    // Sort: CRITICAL first, then AT_RISK, then by score
    const students = attentionMap?.attention_map ? [...attentionMap.attention_map] : [];

    // Safety check if sorting is needed or if backend did it (backend does it, but safety is good)
    // We'll trust backend sort or props.

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2 mt-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Users className="text-teal-600" size={20} /> Real-time Attention Map
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                        Visualizing student engagement states. Data refreshes every 30s.
                    </p>
                </div>
                <div className="flex gap-2 text-xs font-bold">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Engaged</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Passive</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> At Risk</div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {students.length > 0 ? (
                    students.map((student) => (
                        <motion.div
                            key={student.student_id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all hover:shadow-md cursor-help relative group"
                            style={{
                                backgroundColor: student.color + '15', // 15% opacity
                                borderColor: student.color + '40', // 40% opacity
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs mb-2"
                                style={{ backgroundColor: student.color }}
                            >
                                {student.engagement_score}
                            </div>

                            <div className="font-bold text-gray-800 text-sm truncate w-full px-1">
                                {student.student_name}
                            </div>

                            <div className="text-[10px] font-bold mt-1 uppercase tracking-wide" style={{ color: student.color }}>
                                {student.engagement_level}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-gray-800 text-white text-xs p-2 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                Last Active: {student.last_activity ? new Date(student.last_activity).toLocaleTimeString() : 'N/A'}
                                <div className="arrow-down absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-gray-800 border-l-transparent border-r-transparent"></div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                        <Info size={32} className="mb-2 opacity-50" />
                        <p>No attention data available for this class.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttentionHeatmap;
