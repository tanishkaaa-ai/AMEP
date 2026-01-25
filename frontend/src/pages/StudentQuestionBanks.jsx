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

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-orange-500" /></div>;

    if (selectedBank) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <button onClick={() => setSelectedBank(null)} className="text-[#EAE0CF]/60 mb-4 hover:underline hover:text-[#EAE0CF]">
                    &larr; Back to Question Banks
                </button>

                <div className="bg-[#213448] rounded-2xl shadow-sm p-8 border border-[#EAE0CF]/20">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-[#EAE0CF]">{selectedBank.title}</h1>
                            <p className="text-[#EAE0CF]/60">{selectedBank.description}</p>
                        </div>
                        {score !== null && (
                            <div className="bg-[#1a2c3d] px-4 py-2 rounded-xl text-[#547792] font-bold text-lg border border-[#547792]/20">
                                Score: {score} / {selectedBank.questions.length}
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {selectedBank.questions.map((q, qIdx) => (
                            <div key={qIdx} className="border-b border-[#EAE0CF]/10 pb-6 last:border-0">
                                <h3 className="text-lg font-medium text-[#EAE0CF] mb-4 flex gap-2">
                                    <span className="text-[#EAE0CF]/40">{qIdx + 1}.</span> {q.question}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {q.options.map((opt, oIdx) => {
                                        const isSelected = answers[qIdx] === opt;
                                        const isCorrect = q.correct_answer === opt;
                                        const showResult = score !== null;

                                        let className = "p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ";
                                        if (showResult) {
                                            if (isCorrect) className += "border-green-500/50 bg-green-900/20 text-green-400";
                                            else if (isSelected) className += "border-red-500/50 bg-red-900/20 text-red-400";
                                            else className += "border-[#EAE0CF]/10 opacity-50 text-[#EAE0CF]/60";
                                        } else {
                                            if (isSelected) className += "border-[#547792] bg-[#1a2c3d] text-[#EAE0CF] shadow-md";
                                            else className += "border-[#EAE0CF]/10 hover:border-[#547792]/50 hover:bg-[#1a2c3d] text-[#EAE0CF]/80";
                                        }

                                        return (
                                            <div
                                                key={oIdx}
                                                onClick={() => !showResult && handleAnswer(qIdx, opt)}
                                                className={className}
                                            >
                                                <span className="font-medium">{opt}</span>
                                                {showResult && isCorrect && <CheckCircle size={20} className="text-green-500" />}
                                                {showResult && isSelected && !isCorrect && <AlertCircle size={20} className="text-red-500" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                {score !== null && (
                                    <div className="mt-4 p-4 bg-[#1a2c3d] rounded-xl text-[#EAE0CF]/80 text-sm border border-[#EAE0CF]/10">
                                        <strong className="text-[#EAE0CF]">Explanation:</strong> {q.explanation}
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
                                className="bg-[#EAE0CF] text-[#213448] px-8 py-3 rounded-xl font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
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
            <h1 className="text-2xl font-bold text-[#EAE0CF] mb-6 flex items-center gap-2">
                <BookOpen className="text-[#547792]" />
                Practice Question Banks
            </h1>

            {banks.length === 0 ? (
                <div className="text-center py-20 bg-[#213448] rounded-2xl border border-[#EAE0CF]/10">
                    <p className="text-[#EAE0CF]/40">No question banks available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map(bank => (
                        <div key={bank._id} className="bg-[#213448] p-6 rounded-2xl border border-[#EAE0CF]/10 hover:border-[#547792]/50 transition-all hover:shadow-lg cursor-pointer group" onClick={() => handleSelectBank(bank)}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${bank.difficulty_level === 'Easy' ? 'bg-green-900/30 text-green-400' :
                                    bank.difficulty_level === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                        'bg-red-900/30 text-red-400'
                                    }`}>
                                    {bank.difficulty_level}
                                </span>
                                <span className="text-[#EAE0CF]/40 text-sm flex items-center gap-1">
                                    <Clock size={14} /> {new Date(bank.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-[#EAE0CF] mb-2 group-hover:text-[#547792] transition-colors">{bank.title}</h3>
                            <p className="text-[#EAE0CF]/60 text-sm line-clamp-2 mb-4">{bank.description}</p>
                            <div className="flex items-center text-[#547792] font-medium text-sm">
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
