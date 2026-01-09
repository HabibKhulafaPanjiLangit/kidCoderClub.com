import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Code2, BookOpen, Trophy, Clock, Play, LogOut, 
  Settings, User, ChevronRight, Flame
} from "lucide-react";

// Demo data - would come from database
const enrolledCourses = [
  {
    id: "1",
    title: "Scratch for Beginners",
    thumbnail: "🎮",
    progress: 75,
    nextLesson: "Creating Your First Animation",
  },
  {
    id: "3",
    title: "Build Your First Website",
    thumbnail: "🌐",
    progress: 30,
    nextLesson: "Adding CSS Styles",
  },
];

const achievements = [
  { id: "1", title: "First Steps", icon: "🌟", unlocked: true },
  { id: "2", title: "Code Explorer", icon: "🔍", unlocked: true },
  { id: "3", title: "Bug Hunter", icon: "🐛", unlocked: true },
  { id: "4", title: "Master Coder", icon: "👑", unlocked: false },
];

const Dashboard = () => {
  const userName = "Alex"; // Would come from auth context

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block">
        <div className="p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Code2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">KidCoderClub</span>
          </Link>

          {/* Nav Links */}
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium">
              <BookOpen className="w-5 h-5" />
              My Courses
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
              <Trophy className="w-5 h-5" />
              Achievements
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
              <User className="w-5 h-5" />
              Profile
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </a>
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" asChild>
            <Link to="/login">
              <LogOut className="w-5 h-5 mr-3" />
              Log Out
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {userName}! 👋</h1>
              <p className="text-muted-foreground">Ready to continue learning?</p>
            </div>
            
            {/* Streak */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-accent/20 rounded-xl">
              <Flame className="w-6 h-6 text-accent" />
              <div>
                <p className="font-bold text-accent-foreground">7 Day Streak!</p>
                <p className="text-xs text-muted-foreground">Keep it going!</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-sm text-muted-foreground">Active Courses</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12h</p>
                  <p className="text-sm text-muted-foreground">Learning Time</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Badges Earned</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Continue Learning */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Continue Learning</h2>
              <Link to="/classes" className="text-primary hover:underline text-sm font-medium">
                Browse more courses
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl gradient-primary flex items-center justify-center text-4xl shrink-0">
                      {course.thumbnail}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Next: {course.nextLesson}
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress value={course.progress} className="h-2 flex-1" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {course.progress}%
                        </span>
                      </div>
                    </div>
                    <Button size="icon" variant="hero" className="shrink-0">
                      <Play className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Achievements */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Achievements</h2>
              <a href="#" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                View all
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`bg-card rounded-2xl p-4 text-center shadow-sm border border-border ${
                    !achievement.unlocked ? "opacity-50 grayscale" : ""
                  }`}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <p className="font-medium text-sm">{achievement.title}</p>
                  {!achievement.unlocked && (
                    <p className="text-xs text-muted-foreground mt-1">Locked</p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;