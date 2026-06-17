'use client';

import { useState, useEffect } from 'react';
import {
    Target, Trophy, BookOpen,
    Map as MapIcon, Star, TrendingUp,
    ChevronRight, Award, Zap,
    Clock, Plus, Loader2,
    Radar as RadarIcon, ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useLanguage } from '@/context/LanguageContext';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar as RadarChart } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export default function ESSTalentDashboard({ employeeId }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState([]);
    const [skills, setSkills] = useState([]);
    const [appraisals, setAppraisals] = useState([]);
    const [careerPath, setCareerPath] = useState(null);
    const [showGoalUpdateModal, setShowGoalUpdateModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [showSkillModal, setShowSkillModal] = useState(false);

    useEffect(() => {
        if (employeeId) {
            fetchTalentData();
        }
    }, [employeeId]);

    const fetchTalentData = async () => {
        try {
            setLoading(true);
            const [goalsRes, skillsRes, appraisalsRes, careerRes] = await Promise.all([
                fetch(`/api/talent/goals?employeeId=${employeeId}`),
                fetch(`/api/talent/skills?employeeId=${employeeId}`),
                fetch(`/api/talent/appraisals?employeeId=${employeeId}&status=Completed`),
                fetch(`/api/talent/career-path?employeeId=${employeeId}`)
            ]);

            const goalsData = await goalsRes.json();
            const skillsData = await skillsRes.json();
            const appraisalsData = await appraisalsRes.json();
            const careerData = await careerRes.json();

            setGoals(goalsData.goals || []);
            setSkills(skillsData.skills || []);
            setAppraisals(appraisalsData.appraisals || []);

            if (careerData.careerPath) {
                setCareerPath(careerData.careerPath);
            } else {
                // Default roadmap for first-time view
                setCareerPath({
                    currentDesignation: t("employee"),
                    targetDesignation: "Lead / Specialist",
                    milestones: [
                        { title: t("onboardingTraining") || "Onboarding & Training", status: "Achieved", date: new Date().toISOString() },
                        { title: t("defineAnnualGoals") || "Define Annual Goals", status: "In Progress", date: new Date().toISOString() }
                    ]
                });
            }
        } catch (error) {
            toast.error(t("errorLoadingTalentData") || "Error loading talent data");
        } finally {
            setLoading(false);
        }
    };

    const radarData = {
        labels: skills.length > 0 ? skills.map(s => s.name) : [t('logic') || 'Logic', t('softSkill') || 'Soft Skill', t('coding') || 'Coding', t('design') || 'Design', t('strategy') || 'Strategy', t('agile') || 'Agile'],
        datasets: [
            {
                label: t('proficiency'),
                data: skills.length > 0 ? skills.map(s => s.proficiency) : [4, 3, 5, 2, 3, 4],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
            },
        ],
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { display: true },
                suggestedMin: 0,
                suggestedMax: 5,
                ticks: { stepSize: 1, display: false }
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">{t("initializingTalentMatrix")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover: transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                            <Target className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("activeGoals")}</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">{goals.filter(g => g.status === 'In Progress').length}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        {goals.filter(g => g.status === 'Completed').length} {t("completed")}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover: transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                            <Star className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("skillsTracked")}</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">{skills.length}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {skills.filter(s => s.proficiency >= 4).length} {t("expertLevels")}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover: transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                            <Award className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("avgAppraisal")}</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">
                        {appraisals.length > 0 ? (appraisals.reduce((sum, a) => sum + a.overallScore, 0) / appraisals.length).toFixed(1) : t("notAvailable")}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{t("fromLastReviewCycle")}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover: transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                            <MapIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("nextMilestone")}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 truncate">
                        {careerPath?.milestones.find(m => m.status === 'Planned')?.title || t("achieved") || "Achieved!"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{t("inYourCareerRoadmap")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Goals Progress */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h4 className="font-black text-slate-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-600" />
                                {t("performanceGoals")}
                            </h4>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                                {t("viewAll")} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {goals.length === 0 ? (
                                <div className="py-12 text-center space-y-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">{t("noActiveGoals")}</p>
                                </div>
                            ) : (
                                goals.map((goal) => (
                                    <div
                                        key={goal._id}
                                        onClick={() => {
                                            setSelectedGoal(goal);
                                            setShowGoalUpdateModal(true);
                                        }}
                                        className="space-y-3 p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{goal.title}</h5>
                                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{goal.description}</p>
                                            </div>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${goal.priority === 'Critical' ? 'bg-rose-100 text-rose-600' :
                                                goal.priority === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {t(goal.priority.toLowerCase()) || goal.priority}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-slate-400">{t("progress")}</span>
                                                <span className="text-indigo-600">{goal.progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${goal.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <div className="flex -space-x-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 border border-white"></div>
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">+2</div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {t("due")} {format(new Date(goal.endDate), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-black text-slate-900 flex items-center gap-2">
                                <MapIcon className="w-5 h-5 text-orange-600" />
                                {t("careerRoadmap")}
                            </h4>
                        </div>
                        <div className="p-8 relative">
                            {/* Visual Timeline Connector */}
                            <div className="absolute left-10 top-12 bottom-12 w-0.5 bg-slate-100 hidden sm:block"></div>

                            <div className="space-y-10 relative">
                                {careerPath?.milestones.map((ms, idx) => (
                                    <div key={idx} className={`flex items-start gap-6 relative ${ms.status === 'Planned' ? 'opacity-60 grayscale' : ''}`}>
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${ms.status === 'Achieved' ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
                                            }`}>
                                            {ms.status === 'Achieved' ? <Trophy className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-sm font-black text-slate-900">{ms.title}</h5>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {(() => {
                                                        if (!ms.date) return '';
                                                        try {
                                                            const d = new Date(ms.date);
                                                            return isNaN(d.getTime()) ? '' : format(d, 'MMM yyyy');
                                                        } catch {
                                                            return '';
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">{t("designationGoal") || "Designation goal"}: {careerPath.targetDesignation}</p>
                                            {ms.status === 'Achieved' && (
                                                <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    <Award className="w-3 h-3" /> {t("milestoneReached")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills Radar & Matrix */}
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 overflow-hidden">
                        <h4 className="font-black text-slate-900 flex items-center gap-2 mb-6">
                            <RadarIcon className="w-5 h-5 text-indigo-600" />
                            {t("skillProficiency")}
                        </h4>
                        <div className="aspect-square relative flex items-center justify-center p-4">
                            <RadarChart data={radarData} options={radarOptions} />
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-full -z-10 animate-pulse"></div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-indigo-50 rounded-2xl">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{t("coreSkill")}</p>
                                <p className="text-sm font-black text-indigo-900">{skills[0]?.name || t("notAvailable")}</p>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 rounded-2xl">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">{t("growthRate")}</p>
                                <p className="text-sm font-black text-emerald-900">+12%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h4 className="font-black text-slate-900 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-500" />
                                {t("topSkills")}
                            </h4>
                            <button
                                onClick={() => setShowSkillModal(true)}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {skills.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic text-xs">{t("noSkillsRecorded")}</div>
                            ) : (
                                skills.slice(0, 5).map((skill) => (
                                    <div key={skill._id} className="p-5 hover:bg-slate-50 transition-colors group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-slate-900">{skill.name}</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-3 h-3 ${star <= skill.proficiency ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 flex items-center justify-between">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">{t(skill.category.toLowerCase().replace(" ", ""))}</span>
                                            <span className="text-emerald-500">{t("verified")} ✓</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 text-center">
                            <button
                                onClick={() => setShowSkillModal(true)}
                                className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                            >
                                {t("manageSkillMatrix")}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden group hover: hover: transition-all duration-500">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" /> {t("performanceHistory")}
                            </h4>
                        </div>
                        <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
                            {appraisals.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 font-bold italic text-xs">{t("noAppraisalsYet")}</div>
                            ) : (
                                appraisals.map((app) => (
                                    <div key={app._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:bg-white hover:border-indigo-200 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs font-black text-slate-900">{app.period}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{t("completedOn") || "Completed on"} {format(new Date(app.updatedAt), 'MMM dd, yyyy')}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-black text-slate-900">{app.overallScore.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{t("managerFeedback")}:</p>
                                            <p className="text-[10px] text-slate-600 line-clamp-2 italic leading-relaxed">"{app.managerComments}"</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#FB9D00] to-orange-600 rounded-3xl p-8 text-white group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h4 className="text-xl font-black mb-2">{t("growthCenter")}</h4>
                            <p className="text-white/80 text-xs leading-relaxed mb-6">{t("exploreLearningDesc") || "Explore recommended courses and certificates tailored for your roadmap."}</p>
                            <button className="w-full py-3 bg-white text-orange-600 rounded-2xl text-xs font-black hover:bg-orange-50 transition-all flex items-center justify-center gap-2 group">
                                {t("exploreLearning")} <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showGoalUpdateModal && selectedGoal && (
                <UpdateGoalModal
                    goal={selectedGoal}
                    onClose={() => setShowGoalUpdateModal(false)}
                    onSuccess={() => {
                        setShowGoalUpdateModal(false);
                        fetchTalentData();
                    }}
                />
            )}

            {showSkillModal && (
                <SkillManagementModal
                    employeeId={employeeId}
                    currentSkills={skills}
                    onClose={() => setShowSkillModal(false)}
                    onSuccess={() => {
                        setShowSkillModal(false);
                        fetchTalentData();
                    }}
                />
            )}
        </div>
    );
}

function UpdateGoalModal({ goal, onClose, onSuccess }) {
    const { t } = useLanguage();
    const [progress, setProgress] = useState(goal.progress);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch(`/api/talent/goals/${goal._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ progress })
            });
            if (!res.ok) throw new Error("Update failed");
            toast.success(t("goalProgressUpdated") || "Goal progress updated!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 overflow-hidden scale-in">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">{t("updateProgress")}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400">&times;</button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <h4 className="text-sm font-black text-slate-800">{goal.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 italic">"{goal.description}"</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                            <span>{t("selectedProgress")}</span>
                            <span className="text-indigo-600">{progress}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progress}
                            onChange={(e) => setProgress(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[8px] font-bold text-slate-300">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black">{t("cancel")}</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveChanges")}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SkillManagementModal({ employeeId, onClose, onSuccess }) {
    const { t } = useLanguage();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
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
                body: JSON.stringify({ ...formData, employeeId })
            });
            if (!res.ok) throw new Error("Failed to add skill");
            toast.success(t("skillAdded") || "Skill added to profile!");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 overflow-hidden scale-in">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-900">{t("addNewSkill")}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{t("skillName")}</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. React, Python, UI Design"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{t("category")}</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        >
                            <option value="Technical">{t("technical")}</option>
                            <option value="Soft Skill">{t("softSkill")}</option>
                            <option value="Management">{t("management")}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{t("currentProficiency")}</label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={formData.proficiency}
                            onChange={e => setFormData({ ...formData, proficiency: parseInt(e.target.value) })}
                            className="w-full h-2 bg-indigo-50 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 text-[8px] font-black text-slate-300">
                            <span>{t("level1")}</span>
                            <span>{t("level5")}</span>
                        </div>
                    </div>
                </form>
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black">{t("cancel")}</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("addSkill")}
                    </button>
                </div>
            </div>
        </div>
    );
}
