import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // FIXED: Using -dom
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
interface Task { id: string; sequence_order: number; title: string; description: string; instructional_content: string; is_unlocked: boolean; is_passed: boolean; highest_score: number | null; passing_score: number; }
interface Question { id: string; task_id: string; question_text: string; options: Record<string, string>; }
interface QuizResult { score: number; passed: boolean; correctCount: number; totalQuestions: number; passingScore: number; results: any[]; nextTaskUnlocked: boolean; }

const iconMap: Record<string, any> = { megaphone: Megaphone, palette: Palette, code: Code, video: Video };
const colorMap: Record<string, string> = { purple: "bg-purple-600", pink: "bg-pink-600", blue: "bg-blue-600", green: "bg-green-600" };

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
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

  // --- 1. INITIALIZE DEMO ---
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { navigate("/login"); return; }
    setUser(JSON.parse(userData));

    // Load Mock Courses immediately
    setCourses([
      { id: "devs", title: "AI for Developers", description: "Build intelligent applications with LLMs.", icon: "code", color: "blue" },
      { id: "designers", title: "AI for Designers", description: "Enhance your creative workflow with Generative AI.", icon: "palette", color: "pink" },
      { id: "marketing", title: "AI for Marketing", description: "Master AI-driven campaign strategies.", icon: "megaphone", color: "purple" }
    ]);
    setLoading(false);
  }, [navigate]);

  // --- 2. MOCK DATA FETCHING ---
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setLoading(true);
    
    setTimeout(() => {
      const mockTasks: Task[] = [
        { 
          id: "t1", sequence_order: 1, title: "Fundamentals of LLMs", 
          description: "Understanding how transformer models process text.", 
          instructional_content: "# Welcome to AI 101 \n\n Transformers use **attention mechanisms** to weigh the importance of different words in a sentence.",
          is_unlocked: true, is_passed: true, highest_score: 90, passing_score: 70 
        },
        { 
          id: "t2", sequence_order: 2, title: "Effective Prompting", 
          description: "The 'Few-Shot' and 'Chain-of-Thought' methods.", 
          instructional_content: "### Learning Prompting \n\n 1. **Few-Shot**: Give examples. \n 2. **Chain-of-Thought**: Ask the AI to 'think step-by-step'.",
          is_unlocked: true, is_passed: false, highest_score: null, passing_score: 70 
        },
        { 
          id: "t3", sequence_order: 3, title: "API Integration", 
          description: "Connecting your app to OpenAI or Anthropic.", 
          instructional_content: "", is_unlocked: false, is_passed: false, highest_score: null, passing_score: 70 
        }
      ];
      setTasks(mockTasks);
      setSelectedTask(mockTasks[1]); // Focus on the first incomplete task
      setView("tasks");
      setLoading(false);
    }, 600);
  };

  const fetchQuiz = (taskId: string) => {
    setQuizLoading(true);
    setTimeout(() => {
      setQuestions([
        { id: "q1", task_id: taskId, question_text: "What does LLM stand for?", options: { a: "Large Language Model", b: "Local Linear Machine", c: "Logical Learning Method" } },
        { id: "q2", task_id: taskId, question_text: "Which technique asks the AI to 'think step-by-step'?", options: { a: "Few-shot", b: "Chain-of-Thought", c: "Zero-shot" } }
      ]);
      setQuizLoading(false);
    }, 500);
  };

  const submitQuiz = () => {
    setSubmitting(true);
    setTimeout(() => {
      setQuizResult({
        score: 100, passed: true, correctCount: 2, totalQuestions: 2, passingScore: 70, results: [], nextTaskUnlocked: true
      });
      setSubmitting(false);
      // Update local task state to show "passed"
      setTasks(prev => prev.map(t => t.id === selectedTask?.id ? { ...t, is_passed: true } : t));
    }, 1000);
  };

  // --- 3. UI HELPERS ---
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };
  const handleBackToCourses = () => { setView("courses"); setSelectedCourse(null); };
  const handleTaskClick = (task: Task) => { if (task.is_unlocked) { setSelectedTask(task); setQuizResult(null); setActiveTab("instructions"); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Brain className="text-white size-6" /></div>
          <div><h1 className="text-lg font-bold leading-none">AI Academy</h1><p className="text-xs text-gray-500">Demo Mode • {user?.name}</p></div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="mr-2 size-4" />Logout</Button>
      </header>

      <main className="container mx-auto px-4 py-8">
        {view === "courses" ? (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Your Learning Paths</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {courses.map(c => (
                <Card key={c.id} className="p-6 text-center border-2 hover:border-blue-500 transition-all cursor-pointer" onClick={() => handleCourseSelect(c)}>
                  <div className={`${colorMap[c.color]} p-4 rounded-xl inline-block mb-4`}><Code className="text-white size-8" /></div>
                  <h3 className="text-xl font-bold mb-2">{c.title}</h3>
                  <p className="text-gray-500 text-sm mb-6">{c.description}</p>
                  <Button className="w-full">Open Course <ArrowRight className="ml-2 size-4" /></Button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <aside className="lg:col-span-1 space-y-4">
              <Button variant="ghost" onClick={handleBackToCourses} className="mb-2">← All Courses</Button>
              <Card className="p-4">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Trophy className="size-4 text-yellow-500" /> Syllabus</h3>
                <div className="space-y-3">
                  {tasks.map(t => (
                    <button key={t.id} disabled={!t.is_unlocked} onClick={() => handleTaskClick(t)} className={`w-full text-left p-3 rounded-lg border flex items-center justify-between ${selectedTask?.id === t.id ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>
                      <span className="text-sm font-medium">{t.sequence_order}. {t.title}</span>
                      {t.is_passed ? <CheckCircle className="text-green-500 size-4" /> : !t.is_unlocked && <Lock className="text-gray-300 size-4" />}
                    </button>
                  ))}
                </div>
              </Card>
            </aside>

            <section className="lg:col-span-2">
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-2">{selectedTask?.title}</h2>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="mb-6"><TabsTrigger value="instructions">Material</TabsTrigger><TabsTrigger value="quiz" onClick={() => fetchQuiz(selectedTask!.id)}>Assessment</TabsTrigger></TabsList>
                  
                  <TabsContent value="instructions">
                    <div className="prose prose-slate max-w-none mb-8"><ReactMarkdown>{selectedTask?.instructional_content || ""}</ReactMarkdown></div>
                    <Button onClick={() => {setActiveTab("quiz"); fetchQuiz(selectedTask!.id)}}>Take the Quiz</Button>
                  </TabsContent>

                  <TabsContent value="quiz">
                    {quizLoading ? <Loader2 className="animate-spin mx-auto" /> : quizResult ? (
                      <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
                        <h3 className="text-2xl font-bold text-green-700">Passed! {quizResult.score}%</h3>
                        <p className="mb-4">You've mastered this module.</p>
                        <Button onClick={() => setView("courses")}>Next Module</Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {questions.map((q, i) => (
                          <div key={q.id} className="p-4 border rounded-lg">
                            <p className="font-bold mb-3">{i+1}. {q.question_text}</p>
                            <RadioGroup onValueChange={(v) => setAnswers({...answers, [q.id]: v})}>
                              {Object.entries(q.options).map(([k, v]) => (
                                <div key={k} className="flex items-center gap-2"><RadioGroupItem value={k} id={k+q.id}/><Label htmlFor={k+q.id}>{v}</Label></div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}
                        <Button className="w-full" onClick={submitQuiz} disabled={submitting}>{submitting ? "Checking..." : "Submit Answers"}</Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}