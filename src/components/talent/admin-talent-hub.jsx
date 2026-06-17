'use client';

import { useState, useEffect } from 'react';
import {
    Users, Target, Award,
    BarChart3, Search, Filter,
    Loader2, Plus, ChevronRight,
    MoreVertical, Star, CheckCircle2,
    AlertCircle, TrendingUp, TrendingDown,
    Activity, BookOpen, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminTalentHub() {
    const [activeTab, setActiveTab] = useState('appraisals'); // 'appraisals', 'goals', 'skills', 'roadmaps'
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [appraisals, setAppraisals] = useState([]);
    const [goals, setGoals] = useState([]);
    const [skills, setSkills] = useState([]);
    const [careerPaths, setCareerPaths] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    useEffect(() => {
        fetchTalentData();
    }, [activeTab]);

    const fetchTalentData = async () => {
        try {
            setLoading(true);
            const [empRes, appRes, goalRes, skillRes, careerRes] = await Promise.all([
                fetch('/api/v1/admin/payroll/employees?limit=1000&status=Active'),
                fetch(`/api/talent/appraisals`),
                fetch(`/api/talent/goals`),
                fetch(`/api/talent/skills`),
                fetch(`/api/talent/career-path`)
            ]);

            const empData = await empRes.json();
            const appData = await appRes.json();
            const goalData = await goalRes.json();
            const skillData = await skillRes.json();
            const careerData = await careerRes.json();

            setEmployees(empData.data || empData.employees || []);
            setAppraisals(appData.appraisals || []);
            setGoals(goalData.goals || []);
            setSkills(skillData.skills || []);
            setCareerPaths(careerData.careerPaths || []);
        } catch (error) {
            toast.error("Error loading admin talent data");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Manager-Review': return 'bg-slate-50 text-blue-700 border-blue-100';
            case 'Self-Appraisal': return 'bg-purple-50 text-purple-700 border-purple-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showAppraisalModal, setShowAppraisalModal] = useState(false);
    const [showSkillModal, setShowSkillModal] = useState(false);
    const [showCareerModal, setShowCareerModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedAppraisal, setSelectedAppraisal] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Derived State for Search Filtering
    const filteredAppraisals = appraisals.filter(app => {
        const term = searchQuery.toLowerCase();
        const name = `${app.employee?.personalDetails?.firstName || ''} ${app.employee?.personalDetails?.lastName || ''}`.toLowerCase();
        const matchesSearch = name.includes(term);
        const matchesFilter = statusFilter === 'All' || app.status === statusFilter;
        return matchesSearch && matchesFilter;
    });

    const filteredGoals = goals.filter(goal => {
        const term = searchQuery.toLowerCase();
        const title = goal.title?.toLowerCase() || '';
        const name = `${goal.employee?.personalDetails?.firstName || ''} ${goal.employee?.personalDetails?.lastName || ''}`.toLowerCase();
        const matchesSearch = title.includes(term) || name.includes(term);
        const matchesFilter = priorityFilter === 'All' || goal.priority === priorityFilter;
        return matchesSearch && matchesFilter;
    });

    const filteredSkills = skills.filter(skill => {
        const term = searchQuery.toLowerCase();
        const skillName = skill.name?.toLowerCase() || '';
        const empName = `${skill.employee?.personalDetails?.firstName || ''} ${skill.employee?.personalDetails?.lastName || ''}`.toLowerCase();
        const category = skill.category?.toLowerCase() || '';
        const matchesSearch = skillName.includes(term) || empName.includes(term) || category.includes(term);
        const matchesFilter = categoryFilter === 'All' || skill.category === categoryFilter;
        return matchesSearch && matchesFilter;
    });

    const filteredCareerPaths = careerPaths.filter(cp => {
        const term = searchQuery.toLowerCase();
        const empName = `${cp.employee?.personalDetails?.firstName || ''} ${cp.employee?.personalDetails?.lastName || ''}`.toLowerCase();
        const currentDesignation = cp.currentDesignation?.toLowerCase() || '';
        const targetDesignation = cp.targetDesignation?.toLowerCase() || '';
        return empName.includes(term) || currentDesignation.includes(term) || targetDesignation.includes(term);
    });

    const averageProficiency = skills.length > 0 
        ? (skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length).toFixed(1) 
        : "0.0";
    const criticalGapsCount = skills.filter(s => s.proficiency <= 2).length;
    const totalCertifications = skills.reduce((sum, s) => sum + (s.certifications?.length || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Panel */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                            <Award className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Talent Management Hub</h1>
                            <p className="text-sm text-slate-500 mt-1">Nurturing excellence and tracking organizational growth</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        {[
                            { id: 'appraisals', name: 'Appraisals', icon: Award },
                            { id: 'goals', name: 'Team Goals', icon: Target },
                            { id: 'skills', name: 'Skill Matrix', icon: Activity },
                            { id: 'roadmaps', name: 'Career Roadmaps', icon: MapPin }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-32 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                            <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-xl animate-pulse"></div>
                        </div>
                        <p className="text-sm font-black text-indigo-900/40 uppercase tracking-[0.2em]">Synchronizing Talent Data...</p>
                    </div>
                ) : (
                    <div className="p-0">
                        {/* Dynamic Sub-header Based on Tab */}
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                            <div className="relative group flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab === 'appraisals' ? 'appraisals' : activeTab === 'goals' ? 'goals' : activeTab === 'skills' ? 'skills' : 'roadmaps'}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                {activeTab !== 'roadmaps' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                                showFilterDropdown
                                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 ring-2 ring-indigo-500/10'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            <Filter className="w-3.5 h-3.5" /> Filter
                                            {((activeTab === 'appraisals' && statusFilter !== 'All') ||
                                              (activeTab === 'goals' && priorityFilter !== 'All') ||
                                              (activeTab === 'skills' && categoryFilter !== 'All')) && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                            )}
                                        </button>

                                        {showFilterDropdown && (
                                            <>
                                                {/* Backdrop to close dropdown */}
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setShowFilterDropdown(false)}
                                                />
                                                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-150 rounded-2xl z-50 p-2 animate-in fade-in slide-in-from-top-3 duration-200">
                                                    <div className="px-3 py-2 border-b border-slate-50">
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filter options</p>
                                                    </div>
                                                    <div className="py-1 space-y-1">
                                                        {activeTab === 'appraisals' && [
                                                            { label: 'All Stages', value: 'All' },
                                                            { label: 'Self Appraisal', value: 'Self-Appraisal' },
                                                            { label: 'Manager Review', value: 'Manager-Review' },
                                                            { label: 'Completed', value: 'Completed' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => {
                                                                    setStatusFilter(opt.value);
                                                                    setShowFilterDropdown(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                                                                    statusFilter === opt.value
                                                                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                                                        : 'text-slate-650 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span>{opt.label}</span>
                                                                {statusFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                                                            </button>
                                                        ))}

                                                        {activeTab === 'goals' && [
                                                            { label: 'All Priorities', value: 'All' },
                                                            { label: 'Critical', value: 'Critical' },
                                                            { label: 'High', value: 'High' },
                                                            { label: 'Medium', value: 'Medium' },
                                                            { label: 'Low', value: 'Low' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => {
                                                                    setPriorityFilter(opt.value);
                                                                    setShowFilterDropdown(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                                                                    priorityFilter === opt.value
                                                                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                                                        : 'text-slate-650 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span>{opt.label}</span>
                                                                {priorityFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                                                            </button>
                                                        ))}

                                                        {activeTab === 'skills' && [
                                                            { label: 'All Categories', value: 'All' },
                                                            { label: 'Technical', value: 'Technical' },
                                                            { label: 'Soft Skill', value: 'Soft Skill' },
                                                            { label: 'Leadership', value: 'Leadership' },
                                                            { label: 'Tool', value: 'Tool' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => {
                                                                    setCategoryFilter(opt.value);
                                                                    setShowFilterDropdown(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                                                                    categoryFilter === opt.value
                                                                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                                                                        : 'text-slate-650 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span>{opt.label}</span>
                                                                {categoryFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {((activeTab === 'appraisals' && statusFilter !== 'All') ||
                                                      (activeTab === 'goals' && priorityFilter !== 'All') ||
                                                      (activeTab === 'skills' && categoryFilter !== 'All')) && (
                                                        <div className="border-t border-slate-50 pt-1.5 mt-1.5 px-1">
                                                            <button
                                                                onClick={() => {
                                                                    setStatusFilter('All');
                                                                    setPriorityFilter('All');
                                                                    setCategoryFilter('All');
                                                                    setShowFilterDropdown(false);
                                                                }}
                                                                className="w-full py-1.5 text-center text-[10px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                                                            >
                                                                Clear Active Filter
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                {(activeTab === 'skills' || activeTab === 'roadmaps') && (
                                    <button
                                        onClick={() => {
                                            setSelectedEmployeeId('');
                                            setShowCareerModal(true);
                                        }}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all"
                                    >
                                        <MapPin className="w-3.5 h-3.5" /> Set Roadmap
                                    </button>
                                )}
                                {activeTab !== 'roadmaps' && (
                                    <button
                                        onClick={() => {
                                            if (activeTab === 'appraisals') setShowAppraisalModal(true);
                                            if (activeTab === 'goals') setShowGoalModal(true);
                                            if (activeTab === 'skills') setShowSkillModal(true);
                                        }}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> {activeTab === 'appraisals' ? 'Start Cycle' : activeTab === 'goals' ? 'Assign Goal' : 'Update Matrix'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeTab === 'appraisals' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Employee</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Review Period</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Stage</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Score</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredAppraisals.length === 0 ? (
                                            <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold italic">No matching appraisals found</td></tr>
                                        ) : (
                                            filteredAppraisals.map((app) => (
                                                <tr key={app._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100 uppercase tracking-tighter">
                                                                {(app.employee?.personalDetails?.firstName || '?')[0]}{(app.employee?.personalDetails?.lastName || '')[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                    {app.employee?.personalDetails?.firstName || 'Unknown'} {app.employee?.personalDetails?.lastName || 'Employee'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 font-mono tracking-tighter">{app.employee?.employeeId}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{app.period}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter ${getStatusBadge(app.status)}`}>
                                                            {app.status.replace('-', ' ')}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1">
                                                            <Star className={`w-3.5 h-3.5 ${app.overallScore >= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                            <span className="text-sm font-black text-slate-900">{app.overallScore.toFixed(2)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-xs font-medium text-slate-500">{format(new Date(app.updatedAt), 'MMM dd, yyyy')}</p>
                                                    </td>
                                                    <td className="p-4">
                                                         <button
                                                             onClick={() => {
                                                                 setSelectedAppraisal(app);
                                                                 setShowReviewModal(true);
                                                             }}
                                                             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                         >
                                                             <ChevronRight className="w-5 h-5" />
                                                         </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'goals' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {filteredGoals.length === 0 ? (
                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No matching goals found</div>
                                ) : (
                                    filteredGoals.map((goal) => (
                                        <div key={goal._id} className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-indigo-100  hover:shadow-indigo-100/30 transition-all group relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <Target className="w-5 h-5" />
                                                </div>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${goal.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-slate-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {goal.priority}
                                                </span>
                                            </div>
                                            <h5 className="text-sm font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{goal.title}</h5>
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-6 leading-relaxed italic">"{goal.description}"</p>

                                            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                    {(goal.employee?.personalDetails?.firstName || '?')[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-900 leading-none">{goal.employee?.personalDetails?.firstName || 'Unknown'} {goal.employee?.personalDetails?.lastName || 'Employee'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{goal.category}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>Completion</span>
                                                    <span className="text-indigo-600">{goal.progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-indigo-600 h-full rounded-full group-hover:bg-[#FB9D00] transition-all duration-700"
                                                        style={{ width: `${goal.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'skills' && (
                            <div className="p-8 space-y-12">
                                {/* Skill Gap Analysis Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 group hover:bg-white  transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900">Average Proficiency</h4>
                                        </div>
                                        <p className="text-3xl font-black text-slate-900">{averageProficiency} <span className="text-sm text-slate-400 font-bold">/ 5.0</span></p>
                                        <p className="text-xs text-slate-500 mt-1">Average rating across all skills</p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 group hover:bg-white  transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900">Critical Gaps</h4>
                                        </div>
                                        <p className="text-3xl font-black text-slate-900">{criticalGapsCount}</p>
                                        <p className="text-xs text-slate-500 mt-1">Skills with low proficiency (≤ 2)</p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 group hover:bg-white  transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900">Certifications</h4>
                                        </div>
                                        <p className="text-3xl font-black text-slate-900">{totalCertifications}</p>
                                        <p className="text-xs text-slate-500 mt-1">Total credentials listed in profiles</p>
                                    </div>
                                </div>

                                {/* Quick Skill Look-up */}
                                <div className="space-y-6">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                        Organizational Skill Matrix
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {filteredSkills.length === 0 ? (
                                            <p className="text-slate-400 col-span-4 text-center py-8 font-medium bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                                {skills.length === 0 
                                                    ? "No skills recorded in the organizational matrix yet. Click 'Update Matrix' to add a skill." 
                                                    : "No skills match your search query."}
                                            </p>
                                        ) : (
                                            filteredSkills.map(skill => (
                                                <div key={skill._id} className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col justify-between gap-3 hover:border-indigo-200  hover:shadow-indigo-50/20 transition-all">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="text-xs font-extrabold text-slate-800 truncate">{skill.name}</span>
                                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-400 shrink-0">
                                                                {skill.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-500 truncate">
                                                            👤 {skill.employee?.personalDetails?.firstName || 'Unknown'} {skill.employee?.personalDetails?.lastName || 'Employee'}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-slate-50 pt-2.5">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Proficiency</span>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(level => (
                                                                <div
                                                                    key={level}
                                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                                        level <= skill.proficiency
                                                                            ? 'bg-indigo-600'
                                                                            : 'bg-slate-200'
                                                                    }`}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'roadmaps' && (
                            <div className="p-6 space-y-6">
                                <div className="space-y-6">
                                    <h4 className="font-black text-slate-900 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-indigo-600" />
                                        Organizational Career Roadmaps
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredCareerPaths.length === 0 ? (
                                            <p className="text-slate-400 col-span-3 text-center py-12 font-medium bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                                {careerPaths.length === 0 
                                                    ? "No career roadmaps established yet. Click 'Set Roadmap' to define a career path for an employee." 
                                                    : "No career roadmaps match your search query."}
                                            </p>
                                        ) : (
                                            filteredCareerPaths.map(cp => {
                                                const totalMilestones = cp.milestones?.length || 0;
                                                const achievedMilestones = cp.milestones?.filter(m => m.status === 'Achieved').length || 0;
                                                const progressPercent = totalMilestones > 0 ? Math.round((achievedMilestones / totalMilestones) * 100) : 0;
                                                const empName = `${cp.employee?.personalDetails?.firstName || 'Unknown'} ${cp.employee?.personalDetails?.lastName || ''}`.trim();
                                                const empId = cp.employee?.employeeId || 'N/A';

                                                return (
                                                    <div key={cp._id} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between gap-4 hover:border-indigo-200  transition-all duration-300 relative group">
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div>
                                                                    <h5 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{empName}</h5>
                                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {empId}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedEmployeeId(cp.employee?._id || '');
                                                                        setShowCareerModal(true);
                                                                    }}
                                                                    className="px-3 py-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                                                                >
                                                                    Edit Roadmap
                                                                </button>
                                                            </div>

                                                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                                                <div className="text-center flex-1">
                                                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Current Role</p>
                                                                    <p className="font-extrabold text-slate-800 mt-0.5 truncate max-w-[100px] mx-auto">{cp.currentDesignation || 'N/A'}</p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                                                <div className="text-center flex-1">
                                                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Target Role</p>
                                                                    <p className="font-extrabold text-indigo-600 mt-0.5 truncate max-w-[100px] mx-auto">{cp.targetDesignation || 'N/A'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                                    <span className="text-slate-400">{achievedMilestones} of {totalMilestones} Milestones Reached</span>
                                                                    <span className="text-indigo-600">{progressPercent}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-50">
                                                                    <div
                                                                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                                                                        style={{ width: `${progressPercent}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-slate-50 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Milestones Timeline</p>
                                                                {cp.milestones?.map((m, mIdx) => (
                                                                    <div key={m._id || mIdx} className="flex justify-between items-center gap-2 text-[11px]">
                                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                                                m.status === 'Achieved' ? 'bg-emerald-500' :
                                                                                m.status === 'In Progress' ? 'bg-blue-500 font-bold' : 'bg-slate-300'
                                                                            }`} />
                                                                            <span className={`truncate ${m.status === 'Achieved' ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{m.title}</span>
                                                                        </div>
                                                                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                                                            {m.date ? (() => {
                                                                                try {
                                                                                    const d = new Date(m.date);
                                                                                    return isNaN(d.getTime()) ? '' : format(d, 'MMM yyyy');
                                                                                } catch {
                                                                                    return '';
                                                                                }
                                                                            })() : ''}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showGoalModal && (
                <AssignGoalModal
                    employees={employees}
                    onClose={() => setShowGoalModal(false)}
                    onSuccess={() => {
                        setShowGoalModal(false);
                        fetchTalentData();
                    }}
                />
            )}

            {showAppraisalModal && (
                <StartAppraisalModal
                    employees={employees}
                    onClose={() => setShowAppraisalModal(false)}
                    onSuccess={() => {
                        setShowAppraisalModal(false);
                        fetchTalentData();
                    }}
                />
            )}

            {showSkillModal && (
                <SkillUpdateModal
                    employees={employees}
                    onClose={() => setShowSkillModal(false)}
                    onSuccess={() => {
                        setShowSkillModal(false);
                        fetchTalentData();
                    }}
                />
            )}

            {showCareerModal && (
                <SetCareerPathModal
                    employees={employees}
                    initialEmployeeId={selectedEmployeeId}
                    onClose={() => {
                        setShowCareerModal(false);
                        setSelectedEmployeeId('');
                    }}
                    onSuccess={() => {
                        setShowCareerModal(false);
                        setSelectedEmployeeId('');
                        fetchTalentData();
                    }}
                />
            )}

            {showReviewModal && selectedAppraisal && (
                <AppraisalReviewModal
                    appraisal={selectedAppraisal}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedAppraisal(null);
                    }}
                    onSuccess={() => {
                        setShowReviewModal(false);
                        setSelectedAppraisal(null);
                        fetchTalentData();
                    }}
                />
            )}
        </div>
    );
}

function AssignGoalModal({ employees, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        title: '',
        description: '',
        category: 'Performance',
        priority: 'Medium',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch('/api/talent/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to assign goal");
            toast.success("Performance goal assigned successfully!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">Assign New Goal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Employee</label>
                        <select
                            required
                            value={formData.employeeId}
                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                        >
                            <option value="">Choose an employee...</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Goal Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            >
                                <option>Performance</option>
                                <option>Development</option>
                                <option>Soft Skills</option>
                                <option>Technical</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Goal Title</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g., Complete Cloud Migration"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</label>
                        <textarea
                            rows="3"
                            placeholder="Detail out the core objectives..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Start Date</label>
                            <input
                                required
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">End Date</label>
                            <input
                                required
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            />
                        </div>
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign Goal"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StartAppraisalModal({ employees, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        managerId: '', // Ideally current user id
        period: `Annual ${new Date().getFullYear()}`,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            // Using a default manager ID for now - should be from Auth
            const res = await fetch('/api/talent/appraisals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    managerId: employees[0]?._id // Mocking manager for functionality
                })
            });

            if (!res.ok) throw new Error("Failed to start cycle");
            toast.success("Appraisal cycle started!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">Initiate Appraisal Cycle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Employee</label>
                        <select
                            required
                            value={formData.employeeId}
                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                        >
                            <option value="">Choose an employee...</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Review Period Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g., Q1 2026 Appraisal"
                            value={formData.period}
                            onChange={e => setFormData({ ...formData, period: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cycle Starts</label>
                            <input
                                required
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cycle Ends</label>
                            <input
                                required
                                type="date"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            />
                        </div>
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Cycle"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SkillUpdateModal({ employees, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        category: 'Technical',
        proficiency: 3
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch('/api/talent/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to update skill");
            toast.success("Skill Matrix updated!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">Update Skill Proficiency</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Employee</label>
                        <select
                            required
                            value={formData.employeeId}
                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                        >
                            <option value="">Select individual...</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            >
                                <option>Technical</option>
                                <option>Soft Skill</option>
                                <option>Leadership</option>
                                <option>Tool</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Skill Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Next.js, Teamwork"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-12">Proficiency Level (1-5)</label>
                        <div className="px-4">
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={formData.proficiency}
                                onChange={e => setFormData({ ...formData, proficiency: parseInt(e.target.value) })}
                                className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400">
                                <span>Beginner</span>
                                <span>Intermediate</span>
                                <span>Advanced</span>
                                <span>Expert</span>
                                <span>Master</span>
                            </div>
                        </div>
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Matrix"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SetCareerPathModal({ employees, onClose, onSuccess, initialEmployeeId = '' }) {
    const [submitting, setSubmitting] = useState(false);
    const [milestones, setMilestones] = useState([
        { title: '', status: 'Planned', date: format(new Date(), 'yyyy-MM-dd') }
    ]);
    const [formData, setFormData] = useState({
        employeeId: initialEmployeeId,
        currentDesignation: '',
        targetDesignation: ''
    });

    useEffect(() => {
        if (!formData.employeeId) {
            setFormData(prev => ({ ...prev, currentDesignation: '', targetDesignation: '' }));
            setMilestones([{ title: '', status: 'Planned', date: format(new Date(), 'yyyy-MM-dd') }]);
            return;
        }

        const fetchExistingPath = async () => {
            try {
                const res = await fetch(`/api/talent/career-path?employeeId=${formData.employeeId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.careerPath) {
                        setFormData({
                            employeeId: formData.employeeId,
                            currentDesignation: data.careerPath.currentDesignation || '',
                            targetDesignation: data.careerPath.targetDesignation || ''
                        });
                        if (data.careerPath.milestones && data.careerPath.milestones.length > 0) {
                            const formattedMilestones = data.careerPath.milestones.map(m => {
                                // format date to yyyy-MM-dd safely
                                let dStr = format(new Date(), 'yyyy-MM-dd');
                                if (m.date) {
                                    try {
                                        const d = new Date(m.date);
                                        if (!isNaN(d.getTime())) {
                                            dStr = format(d, 'yyyy-MM-dd');
                                        }
                                    } catch {}
                                }
                                return {
                                    title: m.title || '',
                                    status: m.status || 'Planned',
                                    date: dStr
                                };
                            });
                            setMilestones(formattedMilestones);
                        } else {
                            setMilestones([{ title: '', status: 'Planned', date: format(new Date(), 'yyyy-MM-dd') }]);
                        }
                    } else {
                        // Reset if no roadmap exists
                        setFormData({
                            employeeId: formData.employeeId,
                            currentDesignation: '',
                            targetDesignation: ''
                        });
                        setMilestones([{ title: '', status: 'Planned', date: format(new Date(), 'yyyy-MM-dd') }]);
                    }
                }
            } catch (err) {
                console.error("Error fetching existing career path:", err);
            }
        };

        fetchExistingPath();
    }, [formData.employeeId]);

    const addMilestone = () => {
        setMilestones([...milestones, { title: '', status: 'Planned', date: format(new Date(), 'yyyy-MM-dd') }]);
    };

    const removeMilestone = (index) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const updateMilestone = (index, field, value) => {
        const newMilestones = [...milestones];
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch('/api/talent/career-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, milestones })
            });

            if (!res.ok) throw new Error("Failed to set roadmap");
            toast.success("Career roadmap established!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">Define Career Roadmap</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Employee</label>
                            <select
                                required
                                value={formData.employeeId}
                                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            >
                                <option value="">Select individual...</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Role</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.currentDesignation}
                                    onChange={e => setFormData({ ...formData, currentDesignation: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Role</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.targetDesignation}
                                    onChange={e => setFormData({ ...formData, targetDesignation: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Milestones</label>
                            <button
                                type="button"
                                onClick={addMilestone}
                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <Plus className="w-3 h-3" /> Add Milestone
                            </button>
                        </div>

                        {milestones.map((ms, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 relative group">
                                <div className="flex-1">
                                    <input
                                        placeholder="Milestone title (e.g., Certify as AWS Architect)"
                                        value={ms.title}
                                        onChange={e => updateMilestone(idx, 'title', e.target.value)}
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                    />
                                </div>
                                <div className="w-full md:w-32">
                                    <select
                                        value={ms.status}
                                        onChange={e => updateMilestone(idx, 'status', e.target.value)}
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                    >
                                        <option>Planned</option>
                                        <option>In Progress</option>
                                        <option>Achieved</option>
                                    </select>
                                </div>
                                <div className="w-full md:w-40">
                                    <input
                                        type="date"
                                        value={ms.date}
                                        onChange={e => updateMilestone(idx, 'date', e.target.value)}
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                    />
                                </div>
                                {milestones.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMilestone(idx)}
                                        className="absolute -right-2 -top-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black">Discard</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-emerald-600 text-white rounded-2xl text-xs font-black"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Roadmap"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AppraisalReviewModal({ appraisal, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const isCompleted = appraisal.status === 'Completed';

    const categories = ['Performance', 'Technical Skills', 'Communication', 'Leadership', 'Teamwork'];

    const [ratings, setRatings] = useState(() => {
        if (appraisal.managerRatings && appraisal.managerRatings.length > 0) {
            return appraisal.managerRatings;
        }
        return categories.map(cat => {
            const selfCat = appraisal.selfRatings?.find(r => r.category === cat);
            return {
                category: cat,
                score: selfCat ? selfCat.score : 3,
                comment: ''
            };
        });
    });

    const [managerComments, setManagerComments] = useState(appraisal.managerComments || '');
    const [strengths, setStrengths] = useState(appraisal.employeeStrengths?.join(', ') || '');
    const [gaps, setGaps] = useState(appraisal.improvementAreas?.join(', ') || '');

    const handleRatingChange = (idx, field, val) => {
        if (isCompleted) return;
        const newRatings = [...ratings];
        newRatings[idx][field] = val;
        setRatings(newRatings);
    };

    const currentAverage = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCompleted) return;

        try {
            setSubmitting(true);
            const res = await fetch(`/api/talent/appraisals/${appraisal._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Completed',
                    managerRatings: ratings,
                    overallScore: currentAverage,
                    employeeStrengths: strengths.split(',').map(s => s.trim()).filter(Boolean),
                    improvementAreas: gaps.split(',').map(s => s.trim()).filter(Boolean),
                    managerComments,
                    finalReviewDate: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error("Failed to finalize appraisal");
            toast.success("Appraisal finalized successfully!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const empName = `${appraisal.employee?.personalDetails?.firstName || 'Unknown'} ${appraisal.employee?.personalDetails?.lastName || 'Employee'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-3xl border border-slate-200 overflow-hidden scale-in duration-300">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Appraisal Details & Review</h2>
                        <p className="text-xs text-slate-500 mt-1">Employee: <span className="font-bold text-slate-700">{empName}</span> ({appraisal.employee?.employeeId}) • Period: <span className="font-bold text-slate-700">{appraisal.period}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 text-xl font-bold">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Appraisal Status</span>
                            <span className="text-sm font-black text-indigo-955 uppercase tracking-tight">{appraisal.status.replace('-', ' ')}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Overall Score</span>
                            <span className="text-xl font-black text-indigo-600">{isCompleted ? appraisal.overallScore.toFixed(2) : currentAverage.toFixed(2)} <span className="text-xs text-slate-400 font-bold">/ 5.0</span></span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Category Performance Ratings</h3>
                        {ratings.map((rate, idx) => {
                            const selfCat = appraisal.selfRatings?.find(s => s.category === rate.category);
                            return (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-black text-slate-900">{rate.category}</p>
                                        {selfCat && (
                                            <p className="text-[10px] text-slate-500">
                                                Self rating: <span className="font-bold text-slate-700">{selfCat.score}/5</span> {selfCat.comment ? `("${selfCat.comment}")` : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Score</span>
                                            {isCompleted ? (
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star
                                                            key={star}
                                                            className={`w-4 h-4 ${star <= rate.score ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <select
                                                    value={rate.score}
                                                    onChange={e => handleRatingChange(idx, 'score', parseInt(e.target.value))}
                                                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                                                </select>
                                            )}
                                        </div>
                                        <div className="w-full md:w-60">
                                            <input
                                                type="text"
                                                placeholder={isCompleted ? "No comment" : "Add manager comments..."}
                                                value={rate.comment || ''}
                                                onChange={e => handleRatingChange(idx, 'comment', e.target.value)}
                                                disabled={isCompleted}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {appraisal.employeeComments && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Comments</h4>
                                <p className="text-xs text-slate-700 italic">"{appraisal.employeeComments}"</p>
                            </div>
                        )}
                        <div className={`space-y-2 ${!appraisal.employeeComments ? 'col-span-2' : ''}`}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Manager Feedback</label>
                            <textarea
                                rows="3"
                                placeholder={isCompleted ? "No comments added" : "Detail the overall performance, goals, and guidance..."}
                                value={managerComments}
                                onChange={e => setManagerComments(e.target.value)}
                                disabled={isCompleted}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none disabled:bg-slate-100 disabled:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Key Strengths (Comma separated)</label>
                            <input
                                type="text"
                                placeholder={isCompleted ? "None" : "e.g., Problem Solving, Teamwork"}
                                value={strengths}
                                onChange={e => setStrengths(e.target.value)}
                                disabled={isCompleted}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Improvement Areas (Comma separated)</label>
                            <input
                                type="text"
                                placeholder={isCompleted ? "None" : "e.g., Public Speaking, AWS Certifications"}
                                value={gaps}
                                onChange={e => setGaps(e.target.value)}
                                disabled={isCompleted}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100"
                            />
                        </div>
                    </div>
                </form>
                
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black">Close</button>
                    {!isCompleted && (
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalize & Submit"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

