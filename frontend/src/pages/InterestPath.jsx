import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dashboardAPI } from '../services/api'; import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Compass, BookOpen, Clock, Award, Briefcase, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data fallback if API returns empty
const MOCK_DATA = [
    { subject: 'Math', score: 80, fullMark: 100 },
    { subject: 'Science', score: 90, fullMark: 100 },
    { subject: 'History', score: 60, fullMark: 100 },
    { subject: 'Art', score: 70, fullMark: 100 },
    { subject: 'Tech', score: 85, fullMark: 100 },
    { subject: 'Literature', score: 65, fullMark: 100 },
];

const InterestPath = () => {
    const [interestData, setInterestData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInterestData();
    }, []);

    const fetchInterestData = async () => {
        try {
            const response = await dashboardAPI.getInterestPath();
            if (response.data && response.data.interests) {
                setInterestData(response.data.interests);
            }
        } catch (error) {
            console.error("Failed to fetch interest data", error);
        } finally {
            setLoading(false);
        }
    };

    // Process data for charts
    const chartData = interestData.length > 0
        ? interestData.map(i => ({ subject: i.subject, score: i.score, fullMark: 100 }))
        : MOCK_DATA;

    // Top career recommendations
    const topInterests = interestData.slice(0, 3);
    const careerRecommendations = [...new Set(topInterests.flatMap(i => i.careers || []))];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Compass className="text-blue-600" size={32} />
                        Your Interest NavigatR
                    </h1>
                    <p className="text-gray-600 mt-2">AI-driven analysis of your learning journey & career potential.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Chart Card */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Zap className="text-yellow-500" size={24} />
                            Skill & Interest Radar
                        </h2>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar
                                        name="Interest Score"
                                        dataKey="score"
                                        stroke="#4F46E5"
                                        fill="#4F46E5"
                                        fillOpacity={0.6}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-4">
                            * Score = Weighted average of Concept Mastery (70%) & Project Engagement (30%)
                        </p>
                    </div>

                    {/* Side Stats Card */}
                    <div className="space-y-6">
                        {/* Top Careers */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Briefcase size={20} /> Recommended Careers
                            </h2>
                            <div className="space-y-3">
                                {careerRecommendations.length > 0 ? careerRecommendations.map((career, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 hover:bg-white/20 transition-colors cursor-default"
                                    >
                                        {career}
                                    </motion.div>
                                )) : (
                                    <p className="text-white/70 text-sm">Complete more lessons to unlock recommendations!</p>
                                )}
                            </div>
                        </div>

                        {/* Top Strengths */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Award className="text-orange-500" size={20} /> Top Strengths
                            </h2>
                            <div className="space-y-4">
                                {topInterests.length > 0 ? topInterests.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-semibold text-gray-700">{item.subject}</span>
                                            <span className="text-gray-500">{item.score}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${item.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-400 text-sm">No data available yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Detailed Breakdown */}
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Explore Your Path</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {interestData.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800">{item.subject}</h3>
                                    <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                                        Score: {item.score}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-xs text-gray-500 mt-3">
                                    <span className="flex items-center gap-1">
                                        <BookOpen size={14} /> {item.mastery}% Mastery
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {item.projects} Projects
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default InterestPath;
