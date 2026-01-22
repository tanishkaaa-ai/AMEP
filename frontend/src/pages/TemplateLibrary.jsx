import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Search, Filter, Clock, Users, Target, Workflow, Sparkles, Award, Shield, Globe, Code2, Zap, TrendingUp, Loader } from 'lucide-react';
import { templatesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TemplateLibrary = () => {
  const { getUserId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [favorites, setFavorites] = useState([]);

  // Data State
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, downloads: 0 });

  const categories = ['Project', 'Lesson', 'Assessment', 'Activity', 'Unit Plan'];
  const subjects = ['Science', 'Mathematics', 'History', 'English', 'Civics', 'Computer Science'];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchTerm,
        limit: 20
      };
      if (selectedCategory) params.template_type = selectedCategory.toLowerCase().replace(' ', '_');
      if (selectedSubject) params.subject = selectedSubject;
      // Sorting usually handled by backend, but we can pass a sort param if API supports it

      const response = await templatesAPI.searchTemplates(params);

      // Client-side sorting because the search endpoint might not support all sort options yet
      let fetchedTemplates = response.data.templates || [];

      if (sortBy === 'downloads') {
        fetchedTemplates.sort((a, b) => b.usage_count - a.usage_count);
      } else if (sortBy === 'rating') {
        fetchedTemplates.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'date') {
        fetchedTemplates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      setTemplates(fetchedTemplates);
      setStats({
        total: response.data.total || fetchedTemplates.length,
        downloads: fetchedTemplates.reduce((sum, t) => sum + (t.usage_count || 0), 0)
      });

    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTemplates();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory, selectedSubject, sortBy]);

  const toggleFavorite = (templateId) => {
    if (favorites.includes(templateId)) {
      setFavorites(favorites.filter(id => id !== templateId));
    } else {
      setFavorites([...favorites, templateId]);
    }
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`${i < Math.floor(rating) ? 'text-yellow-400' : 'text-slate-600'} w-4 h-4`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-slate-400 text-sm ml-1">{rating}</span>
      </div>
    );
  };

  const TemplateCard = ({ template }) => (
    <div className={`bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 ${template.usage_count > 1000 ? 'ring-2 ring-cyan-500/30' : ''}`}>
      {template.usage_count > 1000 && (
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-medium mb-4">
          <Sparkles size={12} />
          Popular
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-700/50 rounded-xl">
          <FileText className="text-cyan-400" size={24} />
        </div>
        <button
          onClick={() => toggleFavorite(template.template_id)}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <svg
            className={`${favorites.includes(template.template_id) ? 'text-amber-400' : 'text-slate-500'} w-5 h-5`}
            fill={favorites.includes(template.template_id) ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{template.title}</h3>
      <p className="text-slate-400 mb-4 text-sm line-clamp-2">{template.description || 'No description available.'}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {template.template_type && (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 capitalize">
            {template.template_type.replace('_', ' ')}
          </span>
        )}
        {template.subject_area && (
          <span className="px-3 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-full border border-violet-500/30">
            {template.subject_area}
          </span>
        )}
        {template.grade_level && (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
            Grade {template.grade_level}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <StarRating rating={template.rating || 0} />
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <Download size={14} />
          <span>{(template.usage_count || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          By {template.author?.name || 'Unknown'}
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2">
          <Download size={16} />
          Use Template
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3">📚 Template Library</h1>
        <p className="text-slate-400 text-xl">BR3: Curriculum-Aligned Templates • Save 3 Hours Weekly</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category} className="bg-slate-800">{category}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject} className="bg-slate-800">{subject}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            <option value="downloads" className="bg-slate-800">Most Downloaded</option>
            <option value="rating" className="bg-slate-800">Highest Rated</option>
            <option value="date" className="bg-slate-800">Newest</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <FileText className="text-cyan-400" size={28} />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-400 text-sm">Total Templates</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Download className="text-green-400" size={28} />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.downloads.toLocaleString()}</p>
              <p className="text-slate-400 text-sm">Total Downloads</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Users className="text-amber-400" size={28} />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-400 text-sm">Curated Resources</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500/20 rounded-xl">
              <TrendingUp className="text-violet-400" size={28} />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50%</p>
              <p className="text-slate-400 text-sm">Time Saved</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-400" size={40} />
        </div>
      ) : (
        <>
          {/* All Templates */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="text-cyan-400" />
              Available Resources
            </h2>
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                  <TemplateCard key={template.template_id} template={template} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                No templates found matching your criteria.
              </div>
            )}
          </div>
        </>
      )}

      {/* Research Citation */}
      <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 p-6 rounded-2xl">
        <p className="text-slate-300 font-medium mb-2 flex items-center gap-2">
          <Zap className="text-purple-400" />
          Research-Backed Design
        </p>
        <p className="text-slate-300">
          Curriculum-aligned template libraries reduce teacher planning time by 50% while maintaining pedagogical quality.
          Standardized templates ensure consistent learning objectives while providing flexibility for diverse teaching styles.
        </p>
        <p className="text-slate-500 mt-3 flex items-center gap-2">
          <Award className="text-purple-400" />
          — Paper 12.pdf: Effectiveness of Template-Based Lesson Planning
        </p>
      </div>
    </div>
  );
};

export default TemplateLibrary;