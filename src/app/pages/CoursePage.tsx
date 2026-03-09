import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Brain, LogOut, Loader2, BookOpen, CheckCircle, Lock, ArrowLeft, ArrowRight, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Chapter {
  id: string;
  course_id: string;
  sequence_order: number;
  title: string;
  description: string;
  content: string;
  is_unlocked: boolean;
  is_passed: boolean;
  highest_score: number | null;
  passing_score: number;
}

interface Question {
  id: string;
  task_id: string;
  question_text: string;
  options: Record<string, string>;
}

interface QuizResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  passingScore: number;
  results: Array<{
    questionId: string;
    correct: boolean;
    correctAnswer: string;
    userAnswer: string;
  }>;
  nextTaskUnlocked: boolean;
}

const courseInfo: Record<string, { title: string; color: string }> = {
  marketing: { title: "AI for Marketing", color: "purple" },
  designers: { title: "AI for Designers", color: "pink" },
  devs: { title: "AI for Developers", color: "blue" },
  creators: { title: "AI for Content Creators", color: "green" },
};

const colorMap: Record<string, string> = {
  purple: "bg-purple-600",
  pink: "bg-pink-600",
  blue: "bg-blue-600",
  green: "bg-green-600",
};

export default function CoursePage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const currentChapter = chapters[currentChapterIndex];
  const course = courseInfo[courseId || ""] || { title: "Course", color: "blue" };
  const bgColor = colorMap[course.color] || "bg-blue-600";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (courseId) {
      fetchChapters(parsedUser.id, token);
    }
  }, [courseId, navigate]);

  const fetchChapters = async (userId: string, token: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9bf00556/courses/${courseId}/tasks/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch chapters");
      }

      const data = await response.json();
      setChapters(data.tasks);

      // Find first incomplete chapter or start at beginning
      const firstIncomplete = data.tasks.findIndex(
        (ch: Chapter) => ch.is_unlocked && !ch.is_passed
      );
      if (firstIncomplete !== -1) {
        setCurrentChapterIndex(firstIncomplete);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuiz = async (chapterId: string) => {
    setQuizLoading(true);
    setQuizResult(null);
    setAnswers({});

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9bf00556/task/${chapterId}/quiz`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }

      const data = await response.json();
      setQuestions(data.questions);
      setShowQuiz(true);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!currentChapter) return;

    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9bf00556/task/${currentChapter.id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      const result = await response.json();
      setQuizResult(result);

      // Refresh chapters to update progress
      if (user) {
        const token = localStorage.getItem("token");
        if (token) {
          fetchChapters(user.id, token);
        }
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleTakeQuiz = () => {
    if (currentChapter) {
      fetchQuiz(currentChapter.id);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setShowQuiz(false);
      setQuizResult(null);
      setAnswers({});
      setQuestions([]);
    }
  };

  const handlePreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setShowQuiz(false);
      setQuizResult(null);
      setAnswers({});
      setQuestions([]);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizResult(null);
    setAnswers({});
    if (currentChapter) {
      fetchQuiz(currentChapter.id);
    }
  };

  const completedChapters = chapters.filter((ch) => ch.is_passed).length;
  const totalChapters = chapters.length;
  const progressPercentage =
    totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${bgColor} p-2 rounded-lg`}>
                <Brain className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{course.title}</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleBackToDashboard}>
                <ArrowLeft className="mr-2 size-4" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Course Progress
            </span>
            <span className="text-sm text-gray-600">
              {completedChapters} of {totalChapters} chapters completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Chapter List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="size-5 text-blue-600" />
                Days
              </h2>
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      if (chapter.is_unlocked) {
                        setCurrentChapterIndex(index);
                        setShowQuiz(false);
                        setQuizResult(null);
                        setAnswers({});
                        setQuestions([]);
                      }
                    }}
                    disabled={!chapter.is_unlocked}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentChapterIndex === index
                        ? "border-blue-600 bg-blue-50"
                        : chapter.is_unlocked
                        ? "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500">
                            Chapter {chapter.sequence_order}
                          </span>
                          {chapter.is_passed && (
                            <CheckCircle className="size-4 text-green-600" />
                          )}
                          {!chapter.is_unlocked && (
                            <Lock className="size-4 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-medium text-sm">{chapter.title}</h3>
                        {chapter.is_unlocked && chapter.highest_score !== null && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Score: {chapter.highest_score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {currentChapter ? (
              <Card className="p-6">
                {currentChapter.is_unlocked ? (
                  <>
                    {!showQuiz ? (
                      /* Chapter Content */
                      <>
                        <div className="mb-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                Chapter {currentChapter.sequence_order}
                              </Badge>
                              <h2 className="text-3xl font-bold mb-2">
                                {currentChapter.title}
                              </h2>
                              <p className="text-gray-600">
                                {currentChapter.description}
                              </p>
                            </div>
                            {currentChapter.is_passed && (
                              <Badge className="bg-green-600">
                                <CheckCircle className="mr-1 size-3" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>

                        <ScrollArea className="h-[calc(100vh-400px)]">
                          <div className="prose prose-blue max-w-none pr-4 mb-6">
                            <ReactMarkdown>
                              {currentChapter.instructional_content || ""}
                            </ReactMarkdown>
                          </div>

                          <div className="border-t pt-6 flex items-center justify-between">
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                onClick={handlePreviousChapter}
                                disabled={currentChapterIndex === 0}
                              >
                                <ArrowLeft className="mr-2 size-4" />
                                Previous
                              </Button>
                              {currentChapterIndex < chapters.length - 1 && currentChapter.is_passed && (
                                <Button
                                  variant="outline"
                                  onClick={handleNextChapter}
                                >
                                  Next
                                  <ArrowRight className="ml-2 size-4" />
                                </Button>
                              )}
                            </div>
                            <Button
                              onClick={handleTakeQuiz}
                              className={`${bgColor} hover:opacity-90`}
                            >
                              <Trophy className="mr-2 size-4" />
                              Take Chapter Quiz
                            </Button>
                          </div>
                        </ScrollArea>
                      </>
                    ) : (
                      /* Quiz Section */
                      <>
                        <div className="mb-6">
                          <Badge variant="outline" className="mb-2">
                            Chapter {currentChapter.sequence_order} Quiz
                          </Badge>
                          <h2 className="text-2xl font-bold">
                            {currentChapter.title} - Quiz
                          </h2>
                        </div>

                        {quizLoading ? (
                          <div className="text-center py-12">
                            <Loader2 className="size-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading quiz...</p>
                          </div>
                        ) : quizResult ? (
                          /* Quiz Results */
                          <ScrollArea className="h-[calc(100vh-400px)]">
                            <div className="space-y-6">
                              <div
                                className={`p-6 rounded-lg ${
                                  quizResult.passed
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-orange-50 border border-orange-200"
                                }`}
                              >
                                <div className="text-center">
                                  <div className="text-4xl font-bold mb-2">
                                    {quizResult.score}%
                                  </div>
                                  <p className="text-lg font-medium mb-1">
                                    {quizResult.passed
                                      ? "🎉 Congratulations!"
                                      : "Keep Learning!"}
                                  </p>
                                  <p className="text-gray-600">
                                    You got {quizResult.correctCount} out of{" "}
                                    {quizResult.totalQuestions} questions correct
                                  </p>
                                  <p className="text-sm text-gray-500 mt-2">
                                    Passing score: {quizResult.passingScore}%
                                  </p>
                                  {quizResult.nextTaskUnlocked && (
                                    <p className="text-green-700 font-medium mt-3">
                                      ✨ Next chapter unlocked!
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h3 className="font-semibold">
                                  Review Your Answers:
                                </h3>
                                {questions.map((q, index) => {
                                  const result = quizResult.results.find(
                                    (r) => r.questionId === q.id
                                  );
                                  return (
                                    <div
                                      key={q.id}
                                      className={`p-4 rounded-lg border ${
                                        result?.correct
                                          ? "bg-green-50 border-green-200"
                                          : "bg-red-50 border-red-200"
                                      }`}
                                    >
                                      <p className="font-medium mb-2">
                                        {index + 1}. {q.question_text}
                                      </p>
                                      <div className="text-sm space-y-1">
                                        <p>
                                          <span className="font-medium">
                                            Your answer:
                                          </span>{" "}
                                          {q.options[result?.userAnswer || ""]}
                                        </p>
                                        {!result?.correct && (
                                          <p className="text-green-700">
                                            <span className="font-medium">
                                              Correct answer:
                                            </span>{" "}
                                            {
                                              q.options[
                                                result?.correctAnswer || ""
                                              ]
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex gap-3">
                                <Button onClick={handleRetakeQuiz}>
                                  Retake Quiz
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowQuiz(false)}
                                >
                                  Back to Chapter
                                </Button>
                                {quizResult.passed &&
                                  currentChapterIndex < chapters.length - 1 && (
                                    <Button
                                      className={`${bgColor} hover:opacity-90`}
                                      onClick={handleNextChapter}
                                    >
                                      Next Chapter
                                      <ArrowRight className="ml-2 size-4" />
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </ScrollArea>
                        ) : (
                          /* Quiz Questions */
                          <ScrollArea className="h-[calc(100vh-400px)]">
                            <div className="space-y-6 pr-4">
                              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <p className="text-sm text-blue-900">
                                  <strong>Passing Score:</strong>{" "}
                                  {currentChapter.passing_score}%
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                  Answer all questions and submit to complete
                                  this chapter!
                                </p>
                              </div>

                              {questions.map((question, index) => (
                                <div
                                  key={question.id}
                                  className="border rounded-lg p-4 bg-white"
                                >
                                  <p className="font-medium mb-4">
                                    {index + 1}. {question.question_text}
                                  </p>
                                  <RadioGroup
                                    value={answers[question.id]}
                                    onValueChange={(value) =>
                                      setAnswers({
                                        ...answers,
                                        [question.id]: value,
                                      })
                                    }
                                  >
                                    {Object.entries(question.options).map(
                                      ([key, value]) => (
                                        <div
                                          key={key}
                                          className="flex items-center space-x-2 mb-2"
                                        >
                                          <RadioGroupItem
                                            value={key}
                                            id={`${question.id}-${key}`}
                                          />
                                          <Label
                                            htmlFor={`${question.id}-${key}`}
                                            className="cursor-pointer"
                                          >
                                            {value}
                                          </Label>
                                        </div>
                                      )
                                    )}
                                  </RadioGroup>
                                </div>
                              ))}

                              <Button
                                onClick={submitQuiz}
                                disabled={
                                  submitting ||
                                  Object.keys(answers).length !==
                                    questions.length
                                }
                                className={`w-full ${bgColor} hover:opacity-90`}
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  "Submit Quiz"
                                )}
                              </Button>
                            </div>
                          </ScrollArea>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="size-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Chapter Locked
                    </h3>
                    <p className="text-gray-600">
                      Complete previous chapters to unlock this one.
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <BookOpen className="size-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Chapters</h3>
                <p className="text-gray-600">
                  This course doesn't have any chapters yet.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
