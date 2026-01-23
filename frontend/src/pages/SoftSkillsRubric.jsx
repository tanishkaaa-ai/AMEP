import React, { useState, useEffect } from 'react';
import { Award, Target, TrendingUp, Users, BarChart3, CheckCircle, AlertCircle, User, BookOpen, Code2, Sparkles, Zap, Shield, Globe, Workflow, Loader } from 'lucide-react';
import TeacherLayout from '../components/TeacherLayout';
import { useAuth } from '../contexts/AuthContext';
import { classroomAPI, projectsAPI } from '../services/api';

const SoftSkillsRubric = () => {
  const { user, getUserId } = useAuth();
  const { user, getUserId } = useAuth();
  const [activeTab, setActiveTab] = useState('rubric');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);

  // Data States
  const [rubricData, setRubricData] = useState({
    dimensions: [],
    overallScore: 0,
    classAverage: 0
  });
  const [studentsData, setStudentsData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Initial Data Fetch (Classes)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const userId = getUserId();
        if (!userId) return;

        const res = await classroomAPI.getTeacherClasses(userId);
        const fetchedClasses = res.data || [];
        setClasses(fetchedClasses);

        // Auto-select first class
        if (fetchedClasses.length > 0) {
          setSelectedClassId(fetchedClasses[0].classroom_id);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [getUserId]);

  // Fetch Class Data when selectedClassId changes
  useEffect(() => {
    const fetchClassData = async () => {
      if (!selectedClassId) return;

      setLoadingData(true);
      try {
        // 1. Fetch Classroom Summary (Rubric Tab)
        const summaryRes = await projectsAPI.getClassroomSoftSkills(selectedClassId);
        const summary = summaryRes.data || {};

        // Transform summary data for Rubric View
        const dimensions = summary.dimension_scores?.map(d => ({
          id: d.dimension,
          name: d.skill,
          description: getDimensionDescription(d.dimension),
          avgScore: (d.score / 20) // Convert 0-100 back to 0-5 scale for display consisteny with 5-point rubric
        })) || [];

        setRubricData({
          dimensions: dimensions,
          overallScore: (summary.class_average_score / 20) || 0,
          classAverage: summary.class_average_score || 0
        });

        // 2. Fetch Students Data (Students Tab)
        // Since there is no direct "get all students soft skills" endpoint, we iterate
        const studentsRes = await classroomAPI.getClassroomStudents(selectedClassId);
        const students = studentsRes.data || [];

        // Fetch soft skills for each student (Optimized: Parallel Requests)
        const studentPromises = students.map(async (student) => {
          try {
            const skillsRes = await projectsAPI.getStudentSoftSkills(student.student_id);
            const skills = skillsRes.data || {};

            // Map ratings to simpler object { dimension_id: score_1_5 }
            const scores = {};
            if (skills.dimension_scores) {
              Object.entries(skills.dimension_scores).forEach(([key, val]) => {
                scores[key] = (val.average_rating || 0);
              });
            }

            return {
              id: student.student_id,
              name: student.name,
              overall: skills.overall_soft_skills_score ? (skills.overall_soft_skills_score / 20) : 0,
              scores: scores
            };
          } catch (err) {
            console.warn(`Failed to fetch skills for student ${student.student_id}`, err);
            return {
              id: student.student_id,
              name: student.name,
              overall: 0,
              scores: {}
            };
          }
        });

        const studentsWithSkills = await Promise.all(studentPromises);
        setStudentsData(studentsWithSkills);

      } catch (error) {
        console.error("Error fetching class soft skills data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchClassData();
  }, [selectedClassId]);

  // Helper to get descriptions (since API might not return them in the summary view)
  const getDimensionDescription = (id) => {
    const map = {
      'TEAM_DYNAMICS': 'Quality of interpersonal interactions',
      'TEAM_STRUCTURE': 'Organization and coordination effectiveness',
      'TEAM_MOTIVATION': 'Drive and commitment to goals',
      'TEAM_EXCELLENCE': 'Quality of output and continuous improvement',
      'COLLABORATION': 'Working effectively with peers',
      'CRITICAL_THINKING': 'Analyzing and evaluating information',
      'COMMUNICATION': 'Expressing ideas clearly',
      'CREATIVITY': 'Generating innovative solutions'
    };
    return map[id] || map[id.toUpperCase()] || 'Assessment Dimension';
  };

  const getLevelColor = (level) => {
    const l = Math.round(level);
    switch (l) {
      case 1: return 'text-red-600 bg-red-50';
      case 2: return 'text-orange-600 bg-orange-50';
      case 3: return 'text-amber-600 bg-amber-50';
      case 4: return 'text-green-600 bg-green-50';
      case 5: return 'text-teal-600 bg-teal-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getLevelLabel = (level) => {
    const l = Math.round(level);
    switch (l) {
    const l = Math.round(level);
    switch (l) {
      case 1: return 'Beginning';
      case 2: return 'Developing';
      case 3: return 'Proficient';
      case 4: return 'Advanced';
      case 5: return 'Exceptional';
      default: return 'No Data';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
          <p className="text-gray-500 font-medium text-lg">Loading your assessment...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!softSkillsData || !softSkillsData.dimension_scores) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200">
          <Award size={64} className="text-gray-200 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Soft Skills Data Yet</h2>
          <p className="text-gray-500 max-w-md">Complete your peer reviews in the project workspace to build your competency profile!</p>
        </div>
      </DashboardLayout>
    );
  }

  const dimensions = Object.entries(softSkillsData.dimension_scores).map(([id, data]) => ({
    id,
    name: data.dimension_name,
    avgScore: data.average_rating,
    description: data.level || "Competency Rating",
    indicators: [] // Backend doesn't support sub-indicators yet
  }));

  const overallScorePercent = softSkillsData.overall_soft_skills_score || 0;
  const overallDisplayScore = (overallScorePercent / 20).toFixed(1); // 0-100 to 0-5

  const RubricView = () => (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Overall Soft Skills Assessment</h2>
            <p className="text-gray-500">4-Dimensional Framework • Class Average</p>
          </div>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-8 border-teal-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600">{rubricData.overallScore.toFixed(1)}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Out of 5.0</div>
                </div>
              </div>
              <svg className="absolute top-0 left-0 w-32 h-32 transform -rotate-90 pointer-events-none">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="365"
                  strokeDashoffset={365 - (365 * (rubricData.overallScore / 5))}
                  className="text-teal-500"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-1 gap-6">
        {rubricData.dimensions.length > 0 ? (rubricData.dimensions.map((dimension) => (
          <div
            key={dimension.id}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                  {/* Simplistic Icon Mapping based on typical Strings, fallback to generic */}
                  {(dimension.id.includes('TEAM') || dimension.id.includes('COLLAB')) ? <Users size={24} /> :
                    (dimension.id.includes('THINK') || dimension.id.includes('STRUCT')) ? <Target size={24} /> :
                      (dimension.id.includes('COMM') || dimension.id.includes('MOTIV')) ? <BookOpen size={24} /> :
                        <Sparkles size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{dimension.name}</h3>
                  <p className="text-gray-500">{dimension.description}</p>
                </div>
              </div>
              <div className="text-left md:text-right bg-gray-50 px-4 py-2 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{dimension.avgScore.toFixed(1)}</div>
                <div className="text-xs text-gray-500 font-medium uppercase">Avg Score</div>
              </div>
            </div>

            {/* If we had sub-indicators they would go here, but for now we only have dimension level data from summary endpoint */}
            <div className="w-full bg-gray-100 rounded-full h-3 mt-4">
              <div
                className={`h-3 rounded-full ${dimension.avgScore >= 4 ? 'bg-teal-500' : dimension.avgScore >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${(dimension.avgScore / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        ))) : (
          <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
            No soft skills data found for this class yet. Start a project and submit peer reviews to see data.
          </div>
        )}
      </div>
    </div>
  );

  const StudentsView = () => (
    <div className="grid grid-cols-1 gap-6">
      {studentsData.length > 0 ? (studentsData.map((student) => (
        <div
          key={student.id}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-lg">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                <p className="text-sm text-gray-500">Individual Assessment</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {student.overall.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 uppercase font-bold">Overall</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(student.scores).length > 0 ? (Object.entries(student.scores).map(([skill, score]) => (
              <div key={skill} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm font-medium capitalize">{skill.replace('_', ' ').toLowerCase()}</span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${getLevelColor(score)}`}>{score.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${score >= 4 ? 'bg-teal-500' : score >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))) : (
              <div className="col-span-4 text-center text-sm text-gray-400 py-2">
                No peer review data available for this student.
              </div>
            )}
          </div>
        </div>
      ))) : (
        <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
          No students found in this class.
        </div>
      )}
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="text-teal-600" />
          Skill Distribution Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Class Average by Dimension</h4>
            <div className="space-y-4">
              {rubricData.dimensions.map((dimension) => (
                <div key={dimension.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700 font-medium">{dimension.name}</span>
                    <span className="text-gray-900 font-bold">{dimension.avgScore.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-teal-500"
                      style={{ width: `${(dimension.avgScore / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Skill Level Distribution</h4>
            {/* Mock distribution for now as API doesn't provide buckets yet, but we can compute from studentsData if needed */}
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-4">
              Note: Distribution is currently estimated based on available student data.
            </div>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((level) => {
                // Simple computation from studentsData if available
                const studentsAtLevel = studentsData.filter(s => Math.round(s.overall) === level).length;
                const percentage = studentsData.length > 0 ? (studentsAtLevel / studentsData.length) * 100 : 0;

                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-700 font-medium">{getLevelLabel(level)} ({level})</span>
                      <span className="text-gray-900 font-bold">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${level >= 4 ? 'bg-teal-500' : level >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TeacherLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Award className="text-teal-600" size={32} />
                Soft Skills Assessment
              </h1>
              <p className="text-gray-500">Track and assess student development in key 21st-century competencies.</p>
            </div>

            {/* Classroom Selector */}
            <div className="min-w-[250px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Classroom</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                disabled={loading}
              >
                {loading && <option>Loading classes...</option>}
                {!loading && classes.length === 0 && <option>No classes found</option>}
                {classes.map(cls => (
                  <option key={cls.classroom_id} value={cls.classroom_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-6 py-3 font-bold transition-all border-b-2 ${activeTab === 'rubric'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <Target size={18} />
              Rubric
            </div>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 font-bold transition-all border-b-2 ${activeTab === 'students'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              Students
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-bold transition-all border-b-2 ${activeTab === 'analytics'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={18} />
              Analytics
            </div>
          </button>
        </div>

        {/* Content */}
        {loadingData ? (
          <div className="py-20 flex justify-center">
            <Loader className="animate-spin text-teal-600" size={40} />
          </div>
        ) : (
          <>
            {activeTab === 'rubric' && <RubricView />}
            {activeTab === 'students' && <StudentsView />}
            {activeTab === 'analytics' && <AnalyticsView />}
          </>
        )}

        {/* Research Citation */}
        <div className="mt-8 bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-indigo-900 font-bold mb-1">
                Research-Backed Framework
              </p>
              <p className="text-indigo-700 text-sm leading-relaxed">
                The 4-dimensional soft skills framework incorporates collaboration, critical thinking, communication,
                and creativity dimensions. Validated with α=0.98 Cronbach's reliability coefficient, this assessment
                tool provides objective measurement of 21st-century competencies essential for student success.
              </p>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default SoftSkillsRubric;