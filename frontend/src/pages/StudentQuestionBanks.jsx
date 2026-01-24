import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, AlertCircle, CheckCircle, HelpCircle, ArrowRight, Loader } from 'lucide-react';
import { resourcesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentQuestionBanks = () => {
    const { user } = useAuth();
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBank, setSelectedBank] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        try {
            setLoading(true);
            // For now, fetch all banks or implement student-specific assignment logic backend side
            // Assuming open access for demo
            const res = await resourcesAPI.getQuestionBanks({});
            setBanks(res.data);
        } catch (err) {
            console.error("Failed to fetch banks", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBank = (bank) => {
        setSelectedBank(bank);
        setAnswers({});
        setScore(null);
    };

    const handleAnswer = (questionIndex, option) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: option
        }));
    };

    const handleSubmit = () => {
        let correct = 0;
        selectedBank.questions.forEach((q, idx) => {
            if (answers[idx] === q.correct_answer) correct++;
        });
        setScore(correct);
    };

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin" /></div>;

    if (selectedBank) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <button onClick={() => setSelectedBank(null)} className="text-gray-500 mb-4 hover:underline">
                    &larr; Back to Question Banks
                </button>

                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{selectedBank.title}</h1>
                            <p className="text-gray-500">{selectedBank.description}</p>
                        </div>
                        {score !== null && (
                            <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-700 font-bold text-lg">
                                Score: {score} / {selectedBank.questions.length}
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {selectedBank.questions.map((q, qIdx) => (
                            <div key={qIdx} className="border-b border-gray-100 pb-6 last:border-0">
                                <h3 className="text-lg font-medium text-gray-800 mb-4 flex gap-2">
                                    <span className="text-gray-400">{qIdx + 1}.</span> {q.question}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {q.options.map((opt, oIdx) => {
                                        const isSelected = answers[qIdx] === opt;
                                        const isCorrect = q.correct_answer === opt;
                                        const showResult = score !== null;

                                        let className = "p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ";
                                        if (showResult) {
                                            if (isCorrect) className += "border-green-500 bg-green-50 text-green-700";
                                            else if (isSelected) className += "border-red-500 bg-red-50 text-red-700";
                                            else className += "border-gray-200 opacity-50";
                                        } else {
                                            if (isSelected) className += "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md";
                                            else className += "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
                                        }

                                        return (
                                            <div
                                                key={oIdx}
                                                onClick={() => !showResult && handleAnswer(qIdx, opt)}
                                                className={className}
                                            >
                                                <span className="font-medium">{opt}</span>
                                                {showResult && isCorrect && <CheckCircle size={20} className="text-green-600" />}
                                                {showResult && isSelected && !isCorrect && <AlertCircle size={20} className="text-red-600" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                {score !== null && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl text-gray-600 text-sm">
                                        <strong>Explanation:</strong> {q.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {score === null && (
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < selectedBank.questions.length}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                            >
                                Submit Quiz
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BookOpen className="text-indigo-600" />
                Practice Question Banks
            </h1>

            {banks.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl">
                    <p className="text-gray-500">No question banks available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map(bank => (
                        <div key={bank._id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all hover:shadow-lg cursor-pointer group" onClick={() => handleSelectBank(bank)}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${bank.difficulty_level === 'Easy' ? 'bg-green-100 text-green-700' :
                                        bank.difficulty_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {bank.difficulty_level}
                                </span>
                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                    <Clock size={14} /> {new Date(bank.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">{bank.title}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-4">{bank.description}</p>
                            <div className="flex items-center text-indigo-600 font-medium text-sm">
                                Start Practice <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentQuestionBanks;
