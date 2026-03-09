import { Link } from "react-router-dom";
import { Brain, Sparkles, GraduationCap, Rocket, CheckCircle, BookOpen } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import heroImage from "../../assets/hero-img.png";


export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div 
        className="relative min-h-[600px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        
        {/* Hero Content */}
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <div className="flex mb-6">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <Brain className="size-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl font-bold mb-6 text-white">
              AI Academy
            </h1>
            
            <p className="text-2xl text-white/90 mb-8 leading-relaxed">
              Master Artificial Intelligence with interactive courses designed for professionals.
              Learn at your own pace and unlock your potential in the world's most exciting field.
            </p>
            
            <div className="flex gap-4 flex-wrap">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 text-lg px-8 py-6">
                  Get Started Free
                  <Rocket className="ml-2 size-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-6 text-[#f06a6a]">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="size-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Professional Courses</h3>
            <p className="text-gray-600">
              Industry-relevant curriculum covering AI fundamentals, machine learning, deep learning, and NLP.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="size-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Interactive Learning</h3>
            <p className="text-gray-600">
              Hands-on quizzes and practical exercises to test your knowledge and reinforce learning.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="size-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Progressive Path</h3>
            <p className="text-gray-600">
              Structured learning path that unlocks new challenges as you master each topic.
            </p>
          </Card>
        </div>

        {/* Course Topics */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              "AI Fundamentals & Machine Learning Basics",
              "Supervised & Unsupervised Learning Algorithms",
              "Deep Learning & Neural Networks",
              "Natural Language Processing",
              "Computer Vision & CNNs",
              "Transformers & Modern AI Architectures",
              "Real-World AI Applications",
              "Industry Best Practices"
            ].map((topic, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="size-6 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your AI Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals learning AI skills for the future.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 AI Academy. Empowering the next generation of AI professionals.</p>
        </div>
      </footer>
    </div>
  );
}