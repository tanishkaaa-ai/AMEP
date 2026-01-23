import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, User, AlertCircle } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const CreateTaskModal = ({
    isOpen,
    onClose,
    onTaskCreated,
    teamId,
    initialStatus = 'todo',
    members = []
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 1 week
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error("Task title is required");
            return;
        }

        if (!formData.assigned_to) {
            toast.error("Please assign the task to a team member");
            return;
        }

        try {
            setLoading(true);

            // Add status to payload
            const payload = {
                ...formData,
                status: initialStatus
            };

            await projectsAPI.createTask(teamId, payload);
            toast.success("Task created successfully!");
            onTaskCreated(); // Refresh parent
            onClose();
        } catch (error) {
            console.error("Failed to create task", error);
            toast.error("Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">Add New Task</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <span className="uppercase text-xs tracking-wider">Adding to:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${initialStatus === 'todo' ? 'bg-gray-200 text-gray-700' :
                                initialStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                            }`}>
                            {initialStatus.replace('_', ' ')}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Task Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            placeholder="e.g. Conduct market research"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[100px]"
                            placeholder="Add details about what needs to be done..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                <User size={14} /> Assignee
                            </label>
                            <select
                                value={formData.assigned_to}
                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm bg-white"
                            >
                                <option value="">Select Member</option>
                                {members.map(member => (
                                    <option key={member.student_id || member._id} value={member.student_id || member._id}>
                                        {member.name || member.student_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                <Flag size={14} /> Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm bg-white"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                            <Calendar size={14} /> Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div>
                                    Creating...
                                </>
                            ) : 'Create Task'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateTaskModal;
