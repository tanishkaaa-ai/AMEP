import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { X, Sparkles, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CreateInterventionModal = ({ onClose, studentId, teacherId, triggerRefresh, initialData = {} }) => {
    const [strategy, setStrategy] = useState(initialData.strategy || 'extra_practice');
    const [notes, setNotes] = useState(initialData.notes || '');
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [predicting, setPredicting] = useState(false);

    // AI Prediction Simulation
    useEffect(() => {
        if (strategy) {
            setPredicting(true);
            const timer = setTimeout(() => {
                // Simulate backend prediction
                const baseScore = 60;
                const randomVar = Math.floor(Math.random() * 30);

                let bonus = 0;
                if (strategy === '1on1') bonus = 15;
                if (strategy === 'peer_tutor') bonus = 10;

                setPrediction(Math.min(baseScore + randomVar + bonus, 98));
                setPredicting(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [strategy]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await dashboardAPI.createIntervention({
                student_id: studentId,
                teacher_id: teacherId,
                intervention_type: strategy,
                notes: notes,
                status: 'active'
            });
            toast.success("Intervention created successfully!");
            if (triggerRefresh) triggerRefresh();
            onClose();
        } catch (error) {
            console.error("Failed to create intervention", error);
            toast.error("Failed to create intervention.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                        <Sparkles className="text-purple-500" /> New Intervention
                    </h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Strategy</label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        >
                            <option value="extra_practice">Assign Extra Practice</option>
                            <option value="1on1">Schedule 1-on-1 Session</option>
                            <option value="peer_tutor">Assign Peer Tutor</option>
                            <option value="parent_meeting">Parent Meeting</option>
                            <option value="counselor">Refer to Counselor</option>
                            <option value="modify_assignment">Modify Assignment</option>
                        </select>
                    </div>

                    {/* AI Prediction Widget */}
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                            <BrainCircuit size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">AI Insight</h4>
                            {predicting ? (
                                <div className="h-4 w-24 bg-purple-200 rounded animate-pulse" />
                            ) : (
                                <div className="text-sm text-purple-900 font-medium">
                                    Predicted Effectiveness: <span className="font-bold text-lg">{prediction}%</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Notes & Goals</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all h-32 resize-none"
                            placeholder="Describe the specific goals for this intervention..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Creating...' : 'Create Intervention'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateInterventionModal;
