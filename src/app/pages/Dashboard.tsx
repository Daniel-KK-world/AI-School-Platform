import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { Brain, Lock, CheckCircle, LogOut, Loader2, BookOpen, Trophy, PlayCircle, Megaphone, Palette, Code, Video, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

// --- Types ---
interface Course { id: string; title: string; description: string; icon: string; color: string; }
interface Task { id: string; sequence_order: number; title: string; breif_description: string; instructional_content: string | null; is_unlocked: boolean; is_passed: boolean; highest_score: number | null; }
interface Question { id: string; task_id: string; question_text: string; options: Record<string, string>; }
interface QuizResult { score: number; passed: boolean; message: string; }

const iconMap: Record<string, any> = { megaphone: Megaphone, palette: Palette, code: Code, video: Video };
const colorMap: Record<string, string> = { purple: "bg-purple-600", pink: "bg-pink-600", blue: "bg-blue-600", green: "bg-green-600" };

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  // Hardcoded courses for the UI (since backend only handles auth/tasks right now)
  const [courses, setCourses] = useState<Course[]>([
    { id: "devs", title: "AI for Developers", description: "Build intelligent applications with LLMs.", icon: "code", color: "blue" },
    { id: "designers", title: "AI for Designers", description: "Enhance creative workflows with Generative AI.", icon: "palette", color: "pink" },
    { id: "marketing", title: "AI for Marketing", description: "Master AI-driven campaign strategies.", icon: "megaphone", color: "purple" }
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [activeTab, setActiveTab] = useState<"instructions" | "quiz">("instructions");
  const [view, setView] = useState<"courses" | "tasks">("courses");

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!userData || !token) { 
      navigate("/login"); 
      return; 
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [navigate]);

  // --- 2. FETCH REAL TASKS FROM FASTAPI ---
  const fetchTasksFromBackend = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("http://127.0.0.1:8000/api/tasks", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to fetch tasks");
    return await response.json();
  };

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setLoading(true);
    
    try {
      const realTasks = await fetchTasksFromBackend();
      setTasks(realTasks);

      // Auto-select the first task the user needs to work on
      if (realTasks.length > 0) {
        const firstUnlocked = realTasks.find((t: Task) => t.is_unlocked && !t.is_passed) || realTasks[0];
        setSelectedTask(firstUnlocked); 
      }
      setView("tasks");
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Failed to load tasks. Is the FastAPI server running?");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. FETCH REAL QUIZ QUESTIONS ---
  const fetchQuiz = async (taskId: string) => {
    setQuizLoading(true);
    setQuizResult(null); // Clear previous results
    setAnswers({}); // Clear previous answers
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/quiz`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to load quiz");

      const realQuestions = await response.json();
      setQuestions(realQuestions);
    } catch (err) {
      console.error(err);
      alert("Failed to load quiz questions.");
    } finally {
      setQuizLoading(false);
    }
  };

  // --- 4. SUBMIT QUIZ & TRIGGER DB TRANSACTION ---
  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/${selectedTask?.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answers }) // Format expected by backend
      });

      if (!response.ok) throw new Error("Submission failed");

      const result = await response.json();
      setQuizResult(result);

      // If passed, re-fetch tasks to get the updated DB state (unlocking the next module)
      if (result.passed) {
        const updatedTasks = await fetchTasksFromBackend();
        setTasks(updatedTasks);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting quiz. Check the backend console.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI NAVIGATION HELPERS ---
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };
  const handleBackToCourses = () => { setView("courses"); setSelectedCourse(null); };
  
  const handleTaskClick = (task: Task) => { 
    if (task.is_unlocked) { 
      setSelectedTask(task); 
      setQuizResult(null); 
      setActiveTab("instructions"); 
    } 
  };

  const completedTasks = tasks.filter(t => t.is_passed).length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin size-10 text-blue-600 mb-4" /><p>Connecting to Hawkman Labs API...</p></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Brain className="text-white size-6" /></div>
          <div><h1 className="text-lg font-bold leading-none">Hawkman Labs LMS</h1><p className="text-xs text-gray-500">Candidate: {user?.email}</p></div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="mr-2 size-4" />Logout</Button>
      </header>

      <main className="container mx-auto px-4 py-8">
        {view === "courses" ? (
          /* Course Selection View */
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Choose Your Assessment Path</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {courses.map(c => (
                <Card key={c.id} className="p-6 text-center border-2 hover:border-blue-500 transition-all cursor-pointer" onClick={() => handleCourseSelect(c)}>
                  <div className={`${colorMap[c.color]} p-4 rounded-xl inline-block mb-4`}><Code className="text-white size-8" /></div>
                  <h3 className="text-xl font-bold mb-2">{c.title}</h3>
                  <p className="text-gray-500 text-sm mb-6">{c.description}</p>
                  <Button className="w-full">Start <ArrowRight className="ml-2 size-4" /></Button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Tasks & Quiz View */
          <div>
            {/* Top Progress Bar */}
            <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
              <Button variant="ghost" onClick={handleBackToCourses}>← Back</Button>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>{selectedCourse?.title} Progress</span>
                  <span>{completedTasks} of {tasks.length} Modules</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Sidebar: Syllabus */}
              <aside className="lg:col-span-1 space-y-4">
                <Card className="p-4 border-slate-200 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-lg"><Trophy className="size-5 text-yellow-500" /> Syllabus</h3>
                  <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                    <div className="space-y-3">
                      {tasks.map(t => (
                        <button 
                          key={t.id} 
                          disabled={!t.is_unlocked} 
                          onClick={() => handleTaskClick(t)} 
                          className={`w-full text-left p-4 rounded-xl border flex flex-col gap-2 transition-all ${selectedTask?.id === t.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : t.is_unlocked ? 'bg-white hover:border-blue-300' : 'bg-slate-100 opacity-60'}`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm font-semibold text-slate-500">Module {t.sequence_order}</span>
                            {t.is_passed ? <CheckCircle className="text-green-500 size-5" /> : !t.is_unlocked && <Lock className="text-slate-400 size-4" />}
                          </div>
                          <span className="font-medium">{t.title}</span>
                          {t.highest_score !== null && <Badge variant="secondary" className="w-fit text-xs">Best Score: {t.highest_score}%</Badge>}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </aside>

              {/* Main Area: Instructions & Quiz */}
              <section className="lg:col-span-2">
                <Card className="p-8 shadow-sm border-slate-200 min-h-[calc(100vh-250px)]">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{selectedTask?.title}</h2>
                    <p className="text-slate-600">{selectedTask?.description}</p>
                  </div>

                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="mb-6 w-full grid grid-cols-2">
                      <TabsTrigger value="instructions"><BookOpen className="size-4 mr-2"/> Study Material</TabsTrigger>
                      <TabsTrigger value="quiz" onClick={() => fetchQuiz(selectedTask!.id)}><PlayCircle className="size-4 mr-2"/> Assessment</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="instructions">
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="prose prose-slate max-w-none">
                          {selectedTask?.instructional_content ? (
                            <ReactMarkdown>{selectedTask.instructional_content}</ReactMarkdown>
                          ) : (
                            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                              <Lock className="size-12 mb-4 opacity-20" />
                              <p>Material is locked. Please pass previous modules.</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      {selectedTask?.is_unlocked && (
                        <div className="mt-6 pt-6 border-t flex justify-end">
                          <Button onClick={() => { setActiveTab("quiz"); fetchQuiz(selectedTask!.id); }} className="bg-blue-600 hover:bg-blue-700">
                            Start Assessment <ArrowRight className="ml-2 size-4" />
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="quiz">
                      {quizLoading ? (
                        <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin size-10 text-blue-600 mb-4" /><p className="text-slate-500">Fetching assessment from server...</p></div>
                      ) : quizResult ? (
                        <div className={`text-center p-8 rounded-xl border ${quizResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <h3 className={`text-3xl font-bold mb-2 ${quizResult.passed ? 'text-green-700' : 'text-red-700'}`}>
                            {quizResult.score}%
                          </h3>
                          <p className="text-lg font-medium mb-4">{quizResult.message}</p>
                          <Button onClick={() => {
                            if (quizResult.passed) {
                              // Find next task and select it
                              const nextTask = tasks.find(t => t.sequence_order === (selectedTask?.sequence_order || 0) + 1);
                              if (nextTask) {
                                setSelectedTask(nextTask);
                                setActiveTab("instructions");
                              } else {
                                handleBackToCourses();
                              }
                            } else {
                              setQuizResult(null);
                              fetchQuiz(selectedTask!.id);
                            }
                          }}>
                            {quizResult.passed ? "Continue to Next Module" : "Retake Assessment"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {questions.length === 0 && !quizLoading && (
                            <p className="text-center text-slate-500 py-10">No questions found for this module.</p>
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
                            <Button 
                              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" 
                              onClick={submitQuiz} 
                              disabled={submitting || Object.keys(answers).length !== questions.length}
                            >
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