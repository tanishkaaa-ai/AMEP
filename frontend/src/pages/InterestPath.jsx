import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { dashboardAPI } from '../services/api'; import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Compass, BookOpen, Clock, Award, Briefcase, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const InterestPath = () => {
    const [interestData, setInterestData] = useState([]);
    const [learningPath, setLearningPath] = useState(null);
    const [interestInput, setInterestInput] = useState('');
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInterestData();
    }, []);

    const fetchInterestData = async () => {
        try {
            const response = await dashboardAPI.getInterestPath();
            if (response.data) {
                if (response.data.interests) {
                    setInterestData(response.data.interests);
                }
                if (response.data.learning_path) {
                    setLearningPath(response.data.learning_path);
                }
            }
        } catch (error) {
            console.error("Failed to fetch interest data", error);
            toast.error("Could not load your interest path");
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePath = async () => {
        if (!interestInput.trim()) return;

        try {
            setGenerating(true);
            const response = await dashboardAPI.generateLearningPath({ interest: interestInput });
            setLearningPath(response.data.path);
            toast.success("Learning path generated!");
            setInterestInput('');
        } catch (error) {
            console.error("Path generation failed", error);
            toast.error("Failed to generate path. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    // Process data for charts
    const chartData = interestData.length > 0
        ? interestData.map(i => ({ subject: i.subject, score: i.score, fullMark: 100 }))
        : [];

    // Top career recommendations
    const topInterests = interestData.slice(0, 3);
    const careerRecommendations = [...new Set(topInterests.flatMap(i => i.careers || []))];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Compass className="text-orange-600" size={32} />
                        Your Interest NavigatR
                    </h1>
                    <p className="text-gray-600 mt-2">AI-driven analysis of your learning journey & career potential.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Chart Card */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
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
                                        stroke="#FB923C"
                                        fill="#FB923C"
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
                        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
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

                {/* AI Learning Path Generator */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-8 text-white">
                    <div className="max-w-3xl">
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <Compass size={28} /> Design Your Future
                        </h2>
                        <p className="text-orange-100 mb-6">
                            Tell our AI what you're passionate about (e.g., "Building Game Engines", "Sustainable Architecture"),
                            and we'll build a custom 4-week roadmap for you.
                        </p>
                        <div className="flex gap-4 flex-col md:flex-row">
                            <input
                                type="text"
                                placeholder="I want to learn about..."
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                className="flex-1 px-6 py-4 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-300 shadow-inner"
                            />
                            <button
                                onClick={handleGeneratePath}
                                disabled={generating || !interestInput.trim()}
                                className="bg-white text-orange-600 font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 min-w-[150px]"
                            >
                                {generating ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600" />
                                ) : (
                                    <>
                                        <Zap size={20} /> Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Generated Path Display */}
                {learningPath && learningPath.path_data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8"
                    >
                        <div className="flex items-center gap-4 mb-8 border-b border-orange-50 pb-6">
                            <div className="bg-orange-100 p-4 rounded-2xl text-orange-600">
                                <Zap size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{learningPath.path_data.title}</h2>
                                <p className="text-gray-500">{learningPath.path_data.description}</p>
                            </div>
                        </div>

                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-200 to-transparent rounded-full" />

                            <div className="space-y-12">
                                {learningPath.path_data.weeks.map((week, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.2 }}
                                        className="relative pl-24"
                                    >
                                        {/* Timeline Node */}
                                        <div className="absolute left-0 w-16 h-16 bg-white border-4 border-orange-200 rounded-2xl flex items-center justify-center font-bold text-orange-500 text-xl shadow-sm z-10">
                                            W{week.week}
                                        </div>

                                        <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 hover:border-orange-300 transition-colors">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">{week.theme}</h3>

                                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Weekly Goals</h4>
                                                    <ul className="space-y-2">
                                                        {week.goals.map((goal, gIdx) => (
                                                            <li key={gIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                                                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                                {goal}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Resources</h4>
                                                    <div className="space-y-2">
                                                        {week.resources.map((res, rIdx) => (
                                                            <a
                                                                key={rIdx}
                                                                href={res.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block p-3 bg-white rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all group"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <BookOpen size={16} className="text-orange-400" />
                                                                        <span className="font-medium text-gray-700 text-sm group-hover:text-orange-600 transition-colors">{res.title}</span>
                                                                    </div>
                                                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">{res.type}</span>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default InterestPath;
