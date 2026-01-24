import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Bell, Save, Shield, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const StudentProfile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        name: user?.name || 'Student Name',
        email: user?.email || 'student@example.com',
        bio: 'Enthusiastic learner passionate about science and technology.',
        grade: '10th Grade'
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        assignmentDue: true,
        gradePosted: true,
        newBadges: false
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Profile updated successfully!");
        }, 1000);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password changed successfully!");
        }, 1000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-56 flex-shrink-0 space-y-2">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-left ${
                                    activeTab === id
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon size={20} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1">
                        {activeTab === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
                            >
                                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <User className="text-purple-600" size={28} />
                                    Personal Information
                                </h2>

                                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                                    <div className="relative group">
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-4xl font-black text-white border-4 border-white shadow-xl">
                                            {profileData.name.charAt(0)}
                                        </div>
                                        <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border-2 border-gray-100 hover:bg-purple-50 transition-colors">
                                            <Camera size={18} className="text-purple-600" />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-gray-900">{profileData.name}</h3>
                                        <p className="text-gray-600 font-medium">{profileData.grade}</p>
                                        <span className="inline-block mt-2 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">Student</span>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-28 resize-none transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Save size={20} />
                                        Save Changes
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
                            >
                                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Lock className="text-red-600" size={28} />
                                    Security Settings
                                </h2>
                                <form onSubmit={handlePasswordChange} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={securityData.currentPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={securityData.newPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={securityData.confirmPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Shield size={20} />
                                        Update Password
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
                            >
                                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Bell className="text-yellow-600" size={28} />
                                    Notification Preferences
                                </h2>
                                <div className="space-y-4">
                                    {Object.entries(notifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-all">
                                            <div>
                                                <h4 className="font-bold text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                <p className="text-sm text-gray-600 mt-0.5">Get notified via email and push notifications</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications({ ...notifications, [key]: !value })}
                                                className={`relative w-14 h-7 rounded-full transition-all ${value ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-7' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentProfile;
