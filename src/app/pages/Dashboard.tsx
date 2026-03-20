import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { Brain, Lock, CheckCircle, LogOut, Loader2, BookOpen, Trophy, PlayCircle, Code, ArrowRight, Compass, Play } from "lucide-react";
import rehypeRaw from "rehype-raw";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

// --- Types Updated to Match New Backend Schemas ---
interface LearningPath { id: string; sequence_order: number; title: string; description: string; is_enrolled: boolean; }
interface DashboardData { resume_learning: LearningPath[]; explore_more: LearningPath[]; }
interface Tool { id: string; path_id: string; sequence_order: number; title: string; brief_description: string; is_unlocked: boolean; }
interface Lesson { id: string; tool_id: string; sequence_order: number; title: string; brief_description: string; instructional_content: string | null; is_quiz_module: boolean; is_unlocked: boolean; is_passed: boolean; highest_score: number | null; }
interface Question { id: string; lesson_id: string; question_text: string; options: Record<string, string>; }
interface QuizResult { score: number; passed: boolean; message: string; }

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  // --- The 3-Tier State ---
  const [view, setView] = useState<"paths" | "tools" | "lessons">("paths");
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({ resume_learning: [], explore_more: [] });
  const [tools, setTools] = useState<Tool[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [activeTab, setActiveTab] = useState<"instructions" | "quiz">("instructions");

  // --- 1. INITIAL LOAD (Real Login Workflow Restored) ---
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    // Strict guard: if no token, kick back to login
    if (!userData || !token) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboard(token);
  }, [navigate]);

  const fetchDashboard = async (token: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) handleLogout(); // Kick out if token expired
        throw new Error("Failed to fetch dashboard");
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (path: LearningPath) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://127.0.0.1:8000/api/paths/${path.id}/enroll`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      await fetchDashboard(token!); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePathSelect = async (path: LearningPath) => {
    setSelectedPath(path);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/paths/${path.id}/tools`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch tools");
      setTools(await response.json());
      setView("tools");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolSelect = async (tool: Tool) => {
    if (!tool.is_unlocked) return;
    setSelectedTool(tool);
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/tools/${tool.id}/lessons`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch lessons");
      const realLessons = await response.json();
      setLessons(realLessons);

      if (realLessons.length > 0) {
        const firstUnlocked = realLessons.find((l: Lesson) => l.is_unlocked && !l.is_passed) || realLessons[0];
        setSelectedLesson(firstUnlocked); 
        setActiveTab("instructions");
        setQuizResult(null);
      }
      setView("lessons");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuiz = async (lessonId: string) => {
    setQuizLoading(true);
    setQuizResult(null);
    setAnswers({}); 
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/lessons/${lessonId}/quiz`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load quiz");
      setQuestions(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/lessons/${selectedLesson?.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ answers: answers }) 
      });

      if (!response.ok) throw new Error("Submission failed");
      const result = await response.json();
      setQuizResult(result);

      if (result.passed) {
        const lessonsResponse = await fetch(`http://127.0.0.1:8000/api/tools/${selectedTool?.id}/lessons`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        setLessons(await lessonsResponse.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };
  
  const handleBackToDashboard = () => { 
    setView("paths"); 
    setSelectedPath(null);
    fetchDashboard(localStorage.getItem("token")!);
  };

  const handleBackToTools = () => { 
    setView("tools"); 
    setSelectedTool(null);
    handlePathSelect(selectedPath!); 
  };
  
  const handleLessonClick = (lesson: Lesson) => { 
    if (lesson.is_unlocked) { 
      setSelectedLesson(lesson); 
      setQuizResult(null); 
      setActiveTab("instructions"); 
    } 
  };

  const completedLessons = lessons.filter(l => l.is_passed).length;
  const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin size-10 text-blue-600 mb-4" /><p>Connecting to Hawkman Labs API...</p></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Brain className="text-white size-6" /></div>
          <div><h1 className="text-lg font-bold leading-none">Hawkman Labs LMS</h1><p className="text-xs text-gray-500">Candidate: {user?.email}</p></div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="mr-2 size-4" />Logout</Button>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {view === "paths" && (
          <div className="max-w-5xl mx-auto space-y-12">
            {dashboardData.resume_learning.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6"><Play className="size-6 text-blue-600"/> Resume Learning</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {dashboardData.resume_learning.map(path => (
                    <Card key={path.id} className="p-6 border-2 border-blue-200 hover:border-blue-400 cursor-pointer transition-all" onClick={() => handlePathSelect(path)}>
                      <h3 className="text-xl font-bold mb-2">{path.title}</h3>
                      <p className="text-gray-500 mb-4">{path.description}</p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Continue Track <ArrowRight className="ml-2 size-4" /></Button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-6"><Compass className="size-6 text-slate-600"/> Explore New Paths</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {dashboardData.explore_more.map(path => (
                  <Card key={path.id} className="p-6">
                    <h3 className="text-lg font-bold mb-2">{path.title}</h3>
                    <p className="text-gray-500 text-sm mb-6">{path.description}</p>
                    <Button variant="outline" className="w-full" onClick={() => handleEnroll(path)}>Enroll & Start</Button>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === "tools" && (
          <div className="max-w-5xl mx-auto">
            <Button variant="ghost" onClick={handleBackToDashboard} className="mb-6">← Back to Dashboard</Button>
            <h2 className="text-3xl font-bold text-center mb-8">{selectedPath?.title} Toolkit</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <Card key={tool.id} className={`p-6 text-center border-2 transition-all ${tool.is_unlocked ? 'hover:border-blue-500 cursor-pointer' : 'opacity-70 bg-slate-50 cursor-not-allowed'}`} onClick={() => handleToolSelect(tool)}>
                  <div className={`${tool.is_unlocked ? 'bg-blue-600' : 'bg-slate-400'} p-4 rounded-xl inline-block mb-4`}>
                    {tool.is_unlocked ? <Code className="text-white size-8" /> : <Lock className="text-white size-8" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                  <p className="text-gray-500 text-sm mb-6">{tool.brief_description}</p>
                  <Button className="w-full" variant={tool.is_unlocked ? "default" : "secondary"} disabled={!tool.is_unlocked}>
                    {tool.is_unlocked ? <>Enter Tool <ArrowRight className="ml-2 size-4" /></> : "Locked"}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {view === "lessons" && (
          <div>
            <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
              <Button variant="ghost" onClick={handleBackToTools}>← Back to {selectedPath?.title}</Button>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>{selectedTool?.title} Progress</span>
                  <span>{completedLessons} of {lessons.length} Modules</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <aside className="lg:col-span-1 space-y-4">
                <Card className="p-4 border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-lg"><Trophy className="size-5 text-yellow-500" /> Syllabus</h3>
                  <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                    <div className="space-y-3">
                      {lessons.map((l) => (
                        <button key={l.id} disabled={!l.is_unlocked} onClick={() => handleLessonClick(l)} className={`w-full text-left p-4 rounded-xl border flex flex-col gap-2 transition-all ${selectedLesson?.id === l.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : l.is_unlocked ? 'bg-white hover:border-blue-300' : 'bg-slate-100 opacity-60'}`}>
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm font-semibold text-slate-500">Module {l.sequence_order}</span>
                            {l.is_passed ? <CheckCircle className="text-green-500 size-5" /> : !l.is_unlocked && <Lock className="text-slate-400 size-4" />}
                          </div>
                          <span className="font-medium">{l.title}</span>
                          {l.highest_score !== null && <Badge variant="secondary" className="w-fit text-xs">Best Score: {l.highest_score}%</Badge>}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </aside>

              <section className="lg:col-span-2">
                <Card className="p-8 shadow-sm border-slate-200 min-h-[calc(100vh-250px)]">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{selectedLesson?.title}</h2>
                    <p className="text-slate-600">{selectedLesson?.brief_description}</p>
                  </div>

                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className={`mb-6 w-full grid ${selectedLesson?.is_quiz_module ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <TabsTrigger value="instructions"><BookOpen className="size-4 mr-2"/> Study Material</TabsTrigger>
                      
                      {/* Only render the Quiz tab if it's an actual Quiz Module */}
                      {selectedLesson?.is_quiz_module && (
                        <TabsTrigger value="quiz" onClick={() => fetchQuiz(selectedLesson!.id)} disabled={!selectedLesson?.is_unlocked}>
                          <PlayCircle className="size-4 mr-2"/> Final Assessment
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="instructions">
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="prose prose-slate max-w-none">
                          {selectedLesson?.instructional_content ? (
                            <ReactMarkdown 
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                // Automatically style standard markdown elements to make them look premium
                                h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-blue-700 mb-6 border-b pb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-slate-700 mt-6 mb-3" {...props} />,
                                blockquote: ({node, ...props}) => (
                                  <blockquote className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg text-slate-700 my-6 italic" {...props} />
                                ),
                                code: ({node, inline, ...props}: any) => 
                                  inline 
                                    ? <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded-md font-mono text-sm" {...props} />
                                    : <code className="block bg-slate-800 text-slate-50 p-4 rounded-xl overflow-x-auto font-mono text-sm my-4 shadow-sm" {...props} />,
                                a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-2" {...props} />,
                              }}
                            >
                              {selectedLesson.instructional_content}
                            </ReactMarkdown>
                          ) : (
                            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                              <Lock className="size-12 mb-4 opacity-20" />
                              <p>Material is locked. Please pass previous modules.</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      
                      {selectedLesson?.is_unlocked && selectedLesson?.is_quiz_module && (
                        <div className="mt-6 pt-6 border-t flex justify-end">
                          <Button onClick={() => { setActiveTab("quiz"); fetchQuiz(selectedLesson!.id); }} className="bg-blue-600 hover:bg-blue-700">
                            Start Assessment <ArrowRight className="ml-2 size-4" />
                          </Button>
                        </div>
                      )}
                      
                      {selectedLesson?.is_unlocked && !selectedLesson?.is_quiz_module && !selectedLesson.is_passed && (
                         <div className="mt-6 pt-6 border-t flex justify-end">
                         <Button onClick={submitQuiz} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                           {submitting ? "Marking Complete..." : "Mark as Complete & Continue"} <ArrowRight className="ml-2 size-4" />
                         </Button>
                       </div>
                      )}
                    </TabsContent>

                    <TabsContent value="quiz">
                      {quizLoading ? (
                        <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin size-10 text-blue-600 mb-4" /><p className="text-slate-500">Fetching assessment...</p></div>
                      ) : quizResult ? (
                        <div className={`text-center p-8 rounded-xl border ${quizResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <h3 className={`text-3xl font-bold mb-2 ${quizResult.passed ? 'text-green-700' : 'text-red-700'}`}>{quizResult.score}%</h3>
                          <p className="text-lg font-medium mb-4">{quizResult.message}</p>
                          <Button onClick={() => {
                            if (quizResult.passed) {
                              const nextLesson = lessons.find(l => l.sequence_order === (selectedLesson?.sequence_order || 0) + 1);
                              if (nextLesson) { setSelectedLesson(nextLesson); setActiveTab("instructions"); } 
                              else { handleBackToTools(); }
                            } else { setQuizResult(null); fetchQuiz(selectedLesson!.id); }
                          }}>
                            {quizResult.passed ? (lessons.find(l => l.sequence_order === (selectedLesson?.sequence_order || 0) + 1) ? "Continue to Next Module" : "Return to Toolkit") : "Retake Assessment"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {questions.length === 0 && !quizLoading && (
                            <p className="text-center text-slate-500 py-10">No assessment questions for this section. Click "Mark as Complete" on the instructions tab.</p>
                          )}
                          {questions.map((q, i) => (
                            <div key={q.id} className="p-6 border rounded-xl bg-slate-50/50">
                              <p className="font-bold mb-4 text-lg">{i+1}. {q.question_text}</p>
                              <RadioGroup onValueChange={(v) => setAnswers({...answers, [q.id]: v})}>
                                {Object.entries(q.options).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer">
                                    <RadioGroupItem value={key} id={key+q.id} />
                                    <Label htmlFor={key+q.id} className="cursor-pointer flex-1">{value}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          ))}
                          {questions.length > 0 && (
                            <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" onClick={submitQuiz} disabled={submitting || Object.keys(answers).length !== questions.length}>
                              {submitting ? <><Loader2 className="animate-spin size-5 mr-2" /> Grading...</> : "Submit Answers"}
                            </Button>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </Card>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}