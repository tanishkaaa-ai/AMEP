import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, Users, FileText, Upload, Calendar, AlertTriangle } from 'lucide-react';

// Mock project data
const mockProject = {
  id: 'proj_001',
  title: 'Sustainable Energy Solutions for Local Community',
  description: 'Design and propose renewable energy solutions for our school district',
  currentStage: 'research',
  startDate: '2025-01-06',
  endDate: '2025-02-14',
  team: {
    id: 'team_alpha',
    name: 'Team Alpha',
    members: [
      { id: 's1', name: 'Alice Johnson', role: 'Team Leader' },
      { id: 's2', name: 'Bob Smith', role: 'Researcher' },
      { id: 's3', name: 'Carol Davis', role: 'Designer' },
      { id: 's4', name: 'David Lee', role: 'Technical Lead' }
    ]
  },
  stages: [
    { id: 'questioning', name: 'Questioning', status: 'completed' },
    { id: 'define', name: 'Define', status: 'completed' },
    { id: 'research', name: 'Research', status: 'in_progress' },
    { id: 'create', name: 'Create', status: 'pending' },
    { id: 'present', name: 'Present', status: 'pending' }
  ],
  milestones: [
    { id: 'm1', title: 'Problem Statement', dueDate: '2025-01-10', status: 'completed' },
    { id: 'm2', title: 'Research Report', dueDate: '2025-01-20', status: 'in_progress' },
    { id: 'm3', title: 'Prototype Design', dueDate: '2025-01-30', status: 'pending' },
    { id: 'm4', title: 'Final Presentation', dueDate: '2025-02-14', status: 'pending' }
  ],
  artifacts: [
    { id: 'a1', name: 'SWOT Analysis.pdf', type: 'document', uploadedBy: 'Alice Johnson', date: '2025-01-08' },
    { id: 'a2', name: 'Consumer Insights.docx', type: 'document', uploadedBy: 'Bob Smith', date: '2025-01-09' }
  ]
};

const PBLWorkspace = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch('/api/projects/current');
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }
        const data = await response.json();
        setProject(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setProject(mockProject); // fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, []);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState(null);

  const getStageIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="text-green-500" size={24} />;
      case 'in_progress': return <Clock className="text-blue-500 animate-pulse" size={24} />;
      default: return <Circle className="text-gray-300" size={24} />;
    }
  };

  const getMilestoneStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const StageProgress = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-4">5-Stage PBL Process</h3>
      <div className="space-y-4">
        {project.stages.map((stage, idx) => (
          <div key={stage.id}>
            <div className="flex items-center gap-3">
              {getStageIcon(stage.status)}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  stage.status === 'completed' ? 'text-green-700' :
                  stage.status === 'in_progress' ? 'text-blue-700' :
                  'text-gray-500'
                }`}>
                  Stage {idx + 1}: {stage.name}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {stage.status === 'completed' && '✓ Completed'}
                  {stage.status === 'in_progress' && '→ Currently working on this stage'}
                  {stage.status === 'pending' && '○ Not started yet'}
                </p>
              </div>
            </div>
            {idx < project.stages.length - 1 && (
              <div className={`ml-3 w-0.5 h-6 ${
                stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Stage Details */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <h4 className="font-medium text-blue-900 mb-2">Current Stage: Research</h4>
        <p className="text-sm text-blue-800 mb-3">
          Gather information from multiple sources, conduct interviews, and collect data
          to support your solution design.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-600" />
            <span className="text-blue-900">Resource library integration</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-600" />
            <span className="text-blue-900">Citation management</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-blue-900">Knowledge sharing space (in progress)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const TeamManagement = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        <Users className="inline mr-2" size={20} />
        {project.team.name}
      </h3>
      
      <div className="space-y-3">
        {project.team.members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View Profile
            </button>
          </div>
        ))}
      </div>

      {/* Role Distribution */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">Role Assignment</h4>
        <p className="text-sm text-purple-800">
          Clear roles and responsibilities ensure effective collaboration. Each team member
          has a defined role aligned with their strengths and project needs.
        </p>
      </div>
    </div>
  );

  const MilestoneTracking = () => {
    // Calculate Gantt chart data
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const totalDays = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
    
    const getMilestonePosition = (dueDate) => {
      const milestoneDate = new Date(dueDate);
      const daysFromStart = Math.ceil((milestoneDate - projectStart) / (1000 * 60 * 60 * 24));
      return (daysFromStart / totalDays) * 100;
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          <Calendar className="inline mr-2" size={20} />
          Milestones & Timeline
        </h3>

        {/* Gantt Chart Visualization */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>{new Date(project.startDate).toLocaleDateString()}</span>
            <span>Project Timeline</span>
            <span>{new Date(project.endDate).toLocaleDateString()}</span>
          </div>
          
          <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
            {/* Progress bar */}
            <div 
              className="absolute top-0 left-0 h-full bg-blue-200 transition-all"
              style={{ width: '40%' }}
            />
            
            {/* Current date marker */}
            <div 
              className="absolute top-0 h-full w-0.5 bg-red-500"
              style={{ left: '35%' }}
            >
              <div className="absolute -top-6 -left-8 text-xs text-red-600 font-medium whitespace-nowrap">
                Today
              </div>
            </div>

            {/* Milestone markers */}
            {project.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${getMilestonePosition(milestone.dueDate)}%` }}
              >
                <div className={`w-4 h-4 rounded-full border-2 border-white ${getMilestoneStatusColor(milestone.status)}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Milestone List */}
        <div className="space-y-3">
          {project.milestones.map((milestone) => (
            <div 
              key={milestone.id} 
              className={`p-4 rounded-lg border-2 ${
                milestone.status === 'completed' ? 'border-green-500 bg-green-50' :
                milestone.status === 'in_progress' ? 'border-blue-500 bg-blue-50' :
                'border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStageIcon(milestone.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {milestone.status === 'pending' && (
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    Start Work
                  </button>
                )}
                {milestone.status === 'in_progress' && (
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ArtifactSubmission = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        <FileText className="inline mr-2" size={20} />
        Project Artifacts
      </h3>

      {/* Upload Area */}
      <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
        <Upload className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-700 font-medium mb-1">Upload Project Files</p>
        <p className="text-sm text-gray-600 mb-3">
          Drag and drop or click to browse
        </p>
        <input 
          type="file" 
          className="hidden" 
          id="file-upload"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <label 
          htmlFor="file-upload"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
        >
          Select File
        </label>
        <p className="text-xs text-gray-500 mt-3">
          Supported: PDF, DOCX, PPTX, Images, Videos
        </p>
      </div>

      {/* Artifact List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Uploaded Files ({project.artifacts.length})</h4>
        {project.artifacts.map((artifact) => (
          <div key={artifact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-500" size={24} />
              <div>
                <p className="font-medium text-gray-900">{artifact.name}</p>
                <p className="text-xs text-gray-600">
                  Uploaded by {artifact.uploadedBy} • {artifact.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-700">
                View
              </button>
              <button className="text-sm text-red-600 hover:text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Version Control Note */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
        <p className="text-sm text-green-800">
          ✓ All files are version-controlled. Previous versions are saved automatically.
        </p>
      </div>
    </div>
  );

  const ProjectOverview = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
        <p className="text-gray-600 mb-4">{project.description}</p>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-blue-600 font-medium">Start Date</p>
            <p className="text-sm font-bold text-blue-900">
              {new Date(project.startDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <p className="text-xs text-purple-600 font-medium">End Date</p>
            <p className="text-sm font-bold text-purple-900">
              {new Date(project.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-xs text-green-600 font-medium">Days Remaining</p>
            <p className="text-sm font-bold text-green-900">31 days</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded">
          <AlertTriangle className="text-yellow-600" size={20} />
          <p className="text-sm text-yellow-800">
            Research milestone due in 7 days. Make sure to submit your research report!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StageProgress />
        <TeamManagement />
      </div>

      <MilestoneTracking />
      <ArtifactSubmission />
    </div>
  );

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6 text-gray-600">Loading project...</div>;
  }

    return (
      <div className="min-h-screen bg-gray-50 p-6">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800">Error loading project</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">Displaying mock project data.</p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 PBL Workspace</h1>
        <p className="text-gray-600">BR9: Centralized Project Management • 5-Stage Workflow</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['overview', 'stages', 'team', 'milestones', 'artifacts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && <ProjectOverview />}
      {activeTab === 'stages' && <StageProgress />}
      {activeTab === 'team' && <TeamManagement />}
      {activeTab === 'milestones' && <MilestoneTracking />}
      {activeTab === 'artifacts' && <ArtifactSubmission />}

      {/* Research Citation */}
      <div className="mt-8 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
        <p className="text-sm text-purple-900 font-medium mb-1">Research-Backed Design</p>
        <p className="text-sm text-purple-800">
          The 5-stage PBL workflow (Questioning → Define → Research → Create → Present) is based
          on evidence-based practices for inquiry-based learning. This structured approach includes
          SWOT analysis tools, consumer insight templates, and role assignment frameworks to tackle
          common PBL implementation challenges.
        </p>
        <p className="text-xs text-purple-700 mt-2">— Paper 17.pdf: Tackle Implementation Challenges in PBL</p>
      </div>
    </div>
  );
};

export default PBLWorkspace;
