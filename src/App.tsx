import React, { useState, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Search, 
  FileText, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  BarChart3, 
  Users, 
  Briefcase, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Filter,
  ArrowUpRight,
  Lightbulb,
  Target,
  Trophy,
  Zap,
  TrendingUp,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Moon,
  Sun
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { analyzeCV } from "./services/gemini";
import { CandidateAnalysis, Classification } from "./types";

// --- Components ---

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
  key?: React.Key;
}

const Badge = ({ children, className, variant = "default" }: BadgeProps) => {
  const variants = {
    default: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
    neutral: "bg-slate-100 text-slate-700"
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, className, label }: { value: number, className?: string, label?: string }) => (
  <div className={cn("w-full", className)}>
    {label && <div className="flex justify-between text-xs mb-1.5 font-bold text-slate-700 dark:text-slate-300"><span>{label}</span><span>{value}%</span></div>}
    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={cn("h-full rounded-full shadow-sm", value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-blue-500" : value >= 40 ? "bg-amber-500" : "bg-rose-500")} 
      />
    </div>
  </div>
);

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  key?: React.Key;
}

const Card = ({ children, className, id }: CardProps) => (
  <div id={id} className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden", className)}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [jd, setJd] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassification, setFilterClassification] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"score" | "experience">("score");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "candidates" | "analytics">("dashboard");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!jd.trim()) {
      alert("يرجى إدخال الوصف الوظيفي أولاً.");
      return;
    }

    setIsAnalyzing(true);
    const newCandidates: CandidateAnalysis[] = [];

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = error => reject(error);
      });
    };

    for (const file of acceptedFiles) {
      try {
        const base64Data = await fileToBase64(file);
        const analysis = await analyzeCV(jd, { data: base64Data, mimeType: file.type });
        newCandidates.push(analysis);
      } catch (error) {
        console.error("Error analyzing CV:", error);
        alert(`فشل تحليل الملف: ${file.name}. تأكد من أن الملف صالح ومن وجود مفتاح API.`);
      }
    }

    if (newCandidates.length > 0) {
      setCandidates(prev => [...prev, ...newCandidates]);
      setActiveTab("candidates");
    }
    setIsAnalyzing(false);
  }, [jd]);

  const addSampleData = async () => {
    setJd("Senior Frontend Developer with 5+ years of experience in React, TypeScript, and Tailwind CSS. Must have experience with AI integrations and responsive design.");
    setIsAnalyzing(true);
    try {
      const sampleCV = "Ahmed Ali, Senior Web Developer. 6 years experience with React and Next.js. Expert in Tailwind CSS and UI/UX. Worked on several AI-powered dashboards. Education: Computer Science Degree.";
      const analysis = await analyzeCV("Senior Frontend Developer with 5+ years of experience in React, TypeScript, and Tailwind CSS.", undefined, sampleCV);
      setCandidates(prev => [...prev, analysis]);
      setActiveTab("candidates");
    } catch (error) {
      console.error("Error adding sample data:", error);
      alert("فشل إضافة بيانات تجريبية. تأكد من إعداد مفتاح API.");
    }
    setIsAnalyzing(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] },
    multiple: true
  } as any);

  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(c => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          c.name.toLowerCase().includes(searchLower) || 
          (c.skillsFound || []).some(s => s.toLowerCase().includes(searchLower)) ||
          (c.toolsFound || []).some(t => t.toLowerCase().includes(searchLower)) ||
          (c.strengths || []).some(s => s.toLowerCase().includes(searchLower)) ||
          (c.education || "").toLowerCase().includes(searchLower);
        const matchesFilter = filterClassification === "All" || c.classification === filterClassification;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => sortBy === "score" ? b.score - a.score : b.experienceYears - a.experienceYears);
  }, [candidates, searchQuery, filterClassification, sortBy]);

  const analytics = useMemo(() => {
    if (candidates.length === 0) return null;

    const avgScore = candidates.reduce((acc, c) => acc + c.score, 0) / candidates.length;
    
    const skillCounts: Record<string, number> = {};
    candidates.forEach(c => c.gaps.forEach(g => skillCounts[g] = (skillCounts[g] || 0) + 1));
    const skillsGap = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dist = [
      { range: "0-40", count: candidates.filter(c => c.score < 40).length },
      { range: "40-60", count: candidates.filter(c => c.score >= 40 && c.score < 60).length },
      { range: "60-80", count: candidates.filter(c => c.score >= 60 && c.score < 80).length },
      { range: "80-100", count: candidates.filter(c => c.score >= 80).length },
    ];

    const classDist = [
      { name: "Strong Fit", value: candidates.filter(c => c.classification === "Strong Fit").length },
      { name: "Good Fit", value: candidates.filter(c => c.classification === "Good Fit").length },
      { name: "Potential Fit", value: candidates.filter(c => c.classification === "Potential Fit").length },
      { name: "Not Fit", value: candidates.filter(c => c.classification === "Not Fit").length },
    ].filter(v => v.value > 0);

    return { avgScore, skillsGap, dist, classDist };
  }, [candidates]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className={cn("min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-300", isDarkMode && "dark bg-slate-950 text-slate-100")}>
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col items-center md:items-start py-8 px-4 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <Target size={24} />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight text-slate-900 dark:text-white">AI Screener</span>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
            { id: "candidates", icon: Users, label: "Candidates" },
            { id: "analytics", icon: BarChart3, label: "Analytics" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full group",
                activeTab === item.id 
                  ? "bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110", activeTab === item.id ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400")} />
              <span className="hidden md:block font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto w-full pt-8 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-3 p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="hidden md:block font-semibold">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 pt-6 pb-20 px-6 md:px-10">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold tracking-tight mb-1 text-slate-900 dark:text-white">
              {activeTab === "dashboard" ? "Talent Dashboard" : activeTab === "candidates" ? "Candidate Pipeline" : "Smart Insights"}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {candidates.length} candidates analyzed against your requirements.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 flex-grow max-w-4xl">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search by name, skill, or education..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-500 font-medium shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button 
                onClick={addSampleData}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <Zap size={18} className="text-amber-500" />
                <span className="hidden sm:inline">بيانات تجريبية</span>
              </button>
              <button className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
                <Download size={20} />
              </button>
              <button 
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
              >
                <Upload size={18} />
                <span>تحليل جديد</span>
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* JD & Upload Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400">
                    <Briefcase size={20} />
                    <h2 className="font-bold text-lg">Job Description</h2>
                  </div>
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Paste the job title, requirements, and skills here..."
                    className="w-full h-48 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none outline-none text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </Card>

                <div {...getRootProps()} className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                  isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900/50"
                )}>
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Upload CVs</h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto font-medium">
                    Drag and drop PDF or TXT files here, or click to browse.
                  </p>
                  {isAnalyzing && (
                    <div className="mt-6 flex items-center gap-3 text-blue-600 font-semibold">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Zap size={20} />
                      </motion.div>
                      <span>AI Analyzing...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Candidates", value: candidates.length, icon: Users, color: "blue" },
                  { label: "Avg. Match Score", value: analytics ? `${Math.round(analytics.avgScore)}%` : "0%", icon: TrendingUp, color: "emerald" },
                  { label: "Strong Fits", value: candidates.filter(c => c.classification === "Strong Fit").length, icon: Trophy, color: "amber" },
                  { label: "Skills Gaps", value: analytics?.skillsGap.length || 0, icon: AlertCircle, color: "rose" },
                ].map((stat, i) => (
                  <Card key={i} className="p-6 flex items-center gap-4 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border", 
                      stat.color === "blue" ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/30" :
                      stat.color === "emerald" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30" :
                      stat.color === "amber" ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/30" :
                      "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/30"
                    )}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Top Candidates Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Top Candidates</h2>
                  <button onClick={() => setActiveTab("candidates")} className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                    View all <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCandidates.slice(0, 3).map((candidate, i) => (
                    <CandidateCard key={candidate.id} candidate={candidate} index={i} />
                  ))}
                  {filteredCandidates.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                      {searchQuery ? "No candidates match your search." : "No candidates analyzed yet. Upload CVs to see results."}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "candidates" && (
            <motion.div 
              key="candidates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-end bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <Filter size={16} className="text-slate-500" />
                    <select 
                      value={filterClassification}
                      onChange={(e) => setFilterClassification(e.target.value)}
                      className="bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="All">All Status</option>
                      <option value="Strong Fit">Strong Fit</option>
                      <option value="Good Fit">Good Fit</option>
                      <option value="Potential Fit">Potential Fit</option>
                      <option value="Not Fit">Not Fit</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <BarChart3 size={16} className="text-slate-500" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="score">Sort by Score</option>
                      <option value="experience">Sort by Exp.</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCandidates.map((candidate, i) => (
                  <CandidateCard key={candidate.id} candidate={candidate} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Score Distribution
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.dist}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <PieChartIcon size={20} className="text-emerald-600" />
                    Classification Mix
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.classDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics?.classDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-8 lg:col-span-2">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                    <AlertCircle size={20} className="text-rose-600" />
                    Top Skills Gaps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {analytics?.skillsGap.map((gap, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{gap.skill}</span>
                          <Badge variant="error">{gap.count} Candidates Missing</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                      <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <Lightbulb size={18} />
                        Strategic Insight
                      </h4>
                      <p className="text-blue-800 dark:text-blue-400 text-sm leading-relaxed">
                        Based on the analysis, most candidates are missing <strong>{analytics?.skillsGap[0]?.skill}</strong>. 
                        Consider offering training for this skill or adjusting the job requirements if this isn't a hard prerequisite.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Candidate Card Component ---

interface CandidateCardProps {
  candidate: CandidateAnalysis;
  index: number;
  key?: React.Key;
}

function CandidateCard({ candidate, index }: CandidateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getVariant = (classification: Classification) => {
    switch (classification) {
      case "Strong Fit": return "success";
      case "Good Fit": return "info";
      case "Potential Fit": return "warning";
      case "Not Fit": return "error";
      default: return "neutral";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full flex flex-col">
        <div className="p-6 flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-lg border border-slate-200 dark:border-slate-700">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white">{candidate.name}</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{candidate.experienceYears} Years Exp. • {candidate.education}</p>
              </div>
            </div>
            <Badge variant={getVariant(candidate.classification)}>{candidate.classification}</Badge>
          </div>

          <ProgressBar value={candidate.score} label="Match Score" className="mb-6" />

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 mb-1">Top Strength</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{candidate.strengths[0]}</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
              <p className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 mb-1">Key Gap</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{candidate.gaps[0]}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-bold text-slate-700 dark:text-slate-400 flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {isExpanded ? "Show Less" : "View Details"}
            </button>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700">
                <FileText size={16} />
              </button>
              <button className="px-4 py-1.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm">
                Shortlist
              </button>
            </div>
          </div>
        </div>


        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
            >
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Detailed Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <ScoreItem label="Skills Match" value={candidate.breakdown.skillsMatch} />
                      <ScoreItem label="Experience" value={candidate.breakdown.experienceLevel} />
                      <ScoreItem label="Tools & Tech" value={candidate.breakdown.toolsAndTech} />
                    </div>
                    <div className="space-y-2">
                      <ScoreItem label="Education" value={candidate.breakdown.educationRelevance} />
                      <ScoreItem label="Certifications" value={candidate.breakdown.extraCertifications} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      {candidate.strengths.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3">Gaps</h4>
                    <ul className="space-y-2">
                      {candidate.gaps.map((g, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h4 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <Zap size={14} />
                    AI Insight
                  </h4>
                  <p className="text-sm text-blue-900 dark:text-blue-300 italic">"{candidate.quickInsight}"</p>
                </div>

                {candidate.careerGuidance && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <GraduationCap size={16} />
                      Career Guidance
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-2">Alternative Roles:</p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.careerGuidance.alternatives.map((alt, i) => (
                            <Badge key={i} variant="warning" className="bg-amber-200/50 text-amber-900 border border-amber-200 dark:border-none">{alt}</Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-400 leading-relaxed"><span className="font-bold">Reason:</span> {candidate.careerGuidance.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function ScoreItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

