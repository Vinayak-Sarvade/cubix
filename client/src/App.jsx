
import { useEffect, useState } from "react";

import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Brain,
  Network,
  Zap,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Lock,
  Target,
  Play,
  Presentation,
  LogOut,
} from "lucide-react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "./firebase";
import Auth from "./Auth";
import KnowledgeGraph from "./KnowledgeGraph";
import StudentDashboard from "./StudentDashboard";
import InstructorDashboard from "./InstructorDashboard";

export default function App() {
  const [page, setPage] = useState("home");
  const [requestedRole, setRequestedRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setProfile(null);

    if (!user) return;

    return onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        setProfile({
          uid: user.uid,
          role: snapshot.exists()
            ? snapshot.data().role
            : null,
        });
      },
      () => {
        setProfile({
          uid: user.uid,
          error: "Unable to load your account permissions.",
        });
      }
    );
  }, [user]);

  const role =
    profile?.uid === user?.uid ? profile?.role : null;

  const selectRole = (selectedRole) => {
    setRequestedRole(selectedRole);
    setPage("dashboard");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setRequestedRole(null);
    setProfile(null);
    setPage("home");
  };

  const features = [
    {
      icon: Network,
      title: "Knowledge Graph",
      description:
        "Visualize connections between learning concepts.",
    },
    {
      icon: Brain,
      title: "Mastery-Based Learning",
      description:
        "Unlock advanced concepts by mastering prerequisites.",
    },
    {
      icon: Target,
      title: "Adaptive Learning Paths",
      description:
        "Discover personalized paths based on your progress.",
    },
  ];

  const concepts = [
    { name: "Variables", completed: true },
    { name: "Data Types", completed: true },
    { name: "Operators", completed: false },
    { name: "Loops", completed: false },
    { name: "Functions", completed: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5">
        <GraduationCap
          size={60}
          className="text-violet-400 animate-pulse"
        />
        <h1 className="text-3xl font-bold">CUBIX</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Protected dashboards

  if (page === "dashboard" || page === "graph") {
    if (!user) {
      return (
        <Auth
          role={requestedRole}
          onBack={() => setPage("roles")}
        />
      );
    }

    if (role !== "learner" && role !== "instructor") {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6">
          <GraduationCap
            size={50}
            className="text-violet-400"
          />

          <h2 className="text-xl font-bold">
            {profile?.error
              ? "Account permissions unavailable"
              : "Loading your account..."}
          </h2>

          <p className="text-gray-400 text-center">
            {profile?.error ||
              "If this screen remains, log out and log in again."}
          </p>

          <button
            onClick={handleLogout}
            className="bg-violet-600 px-6 py-3 rounded-xl"
          >
            Logout
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#080b16]">
        <div className={page === "graph" ? "hidden" : ""}>
          {role === "learner" ? (
            <StudentDashboard
              onOpenGraph={() => setPage("graph")}
            />
          ) : (
            <InstructorDashboard
              onBack={handleLogout}
              onOpenGraph={() => setPage("graph")}
            />
          )}
        </div>

        {page === "graph" && (
          <div>
            <button
              onClick={() => setPage("dashboard")}
              className="fixed top-5 right-5 z-[1000] bg-violet-600 px-5 py-3 rounded-xl flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>

            <KnowledgeGraph />
          </div>
        )}

        {page === "dashboard" && (
          <button
            onClick={handleLogout}
            className="fixed bottom-5 right-5 z-[1000] bg-red-600 hover:bg-red-500 px-5 py-3 rounded-xl flex items-center gap-2 shadow-xl"
          >
            <LogOut size={18} />
            Logout
          </button>
        )}
      </div>
    );
  }

  // Role selection

  if (page === "roles") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#25134a,_#080b16_65%)] px-6 py-10">

        <button
          onClick={() => setPage("home")}
          className="flex items-center gap-2 text-gray-400"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="max-w-5xl mx-auto text-center mt-16">

          <GraduationCap
            size={60}
            className="text-violet-400 mx-auto"
          />

          <h1 className="text-4xl font-bold mt-4">
            CUB<span className="text-violet-400">IX</span>
          </h1>

          <h2 className="text-4xl font-bold mt-8">
            Choose Your Learning Journey
          </h2>

          <p className="text-gray-400 mt-4 mb-12">
            Sign in to your CUBIX workspace.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

            <div className="bg-[#15172b] border border-violet-500/40 rounded-3xl p-10 hover:scale-[1.02] transition-all">

              <GraduationCap
                size={65}
                className="text-violet-400 mx-auto"
              />

              <h2 className="text-3xl font-bold mt-6 mb-4">
                Learner
              </h2>

              <p className="text-gray-400">
                Explore courses, master concepts and unlock knowledge.
              </p>

              <button
                onClick={() => selectRole("learner")}
                className="w-full mt-8 bg-violet-600 rounded-xl py-4 flex justify-center items-center gap-2"
              >
                Continue as Learner
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="bg-[#15172b] border border-blue-500/40 rounded-3xl p-10 hover:scale-[1.02] transition-all">

              <Presentation
                size={65}
                className="text-blue-400 mx-auto"
              />

              <h2 className="text-3xl font-bold mt-6 mb-4">
                Instructor
              </h2>

              <p className="text-gray-400">
                Create courses and manage learning concepts.
              </p>

              <button
                onClick={() => selectRole("instructor")}
                className="w-full mt-8 bg-blue-600 rounded-xl py-4 flex justify-center items-center gap-2"
              >
                Continue as Instructor
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            Your actual workspace is determined by your registered account permissions.
          </p>
        </div>
      </div>
    );
  }

  // Landing page

  return (
    <div className="min-h-screen bg-[#080b16] text-white">

      <nav className="flex items-center justify-between flex-wrap gap-5 px-[6%] py-6 border-b border-white/10">

        <div className="flex items-center gap-3">
          <div className="bg-violet-600 p-3 rounded-xl">
            <GraduationCap size={28} />
          </div>

          <h1 className="text-2xl font-bold">
            CUB<span className="text-violet-400">IX</span>
          </h1>
        </div>

        <div className="hidden md:flex gap-8 text-gray-400">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>

        <button
          onClick={() => setPage("roles")}
          className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl"
        >
          {user ? "Open Dashboard" : "Get Started"}
        </button>
      </nav>

      <section className="max-w-[1450px] mx-auto px-[6%] py-24 flex items-center flex-wrap gap-14">

        <div className="flex-1 min-w-[280px]">

          <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/30 rounded-full px-4 py-2 text-violet-300 mb-6">
            <Sparkles size={16} />
            The Future of Intelligent Learning
          </div>

          <h1 className="text-[clamp(42px,5vw,72px)] font-extrabold leading-tight mb-6">
            Learn in the{" "}
            <span className="text-violet-400">
              right order.
            </span>
            <br />
            Grow without limits.
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed mb-8">
            CUBIX is a prerequisite-aware learning platform
            that helps students master concepts, unlock new
            knowledge and follow personalized learning paths.
          </p>

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() => setPage("roles")}
              className="bg-violet-600 px-6 py-4 rounded-xl flex items-center gap-3"
            >
              Get Started
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => selectRole("learner")}
              className="border border-white/20 px-6 py-4 rounded-xl flex items-center gap-3"
            >
              <Play size={18} />
              Explore Courses
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-[280px] bg-[#101323] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-violet-900/20">

          <div className="flex items-center gap-3">
            <Network className="text-violet-400" />
            <h2 className="text-xl font-bold">
              Your Learning Journey
            </h2>
          </div>

          <p className="text-gray-400 mt-3 mb-6">
            Master one concept at a time.
          </p>

          {concepts.map((concept, index) => (
            <div key={concept.name}>

              <div
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  concept.completed
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-[#1a1d30] border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen
                    size={20}
                    className="text-violet-400"
                  />
                  {concept.name}
                </div>

                {concept.completed ? (
                  <CheckCircle2 className="text-green-400" size={20} />
                ) : (
                  <Lock className="text-gray-500" size={18} />
                )}
              </div>

              {index !== concepts.length - 1 && (
                <div className="w-0.5 h-5 bg-violet-600 mx-auto" />
              )}
            </div>
          ))}

          <button
            onClick={() => selectRole("learner")}
            className="w-full bg-violet-600/20 text-violet-300 rounded-xl mt-6 py-4"
          >
            Explore Knowledge Graph
          </button>
        </div>
      </section>

      <section
        id="features"
        className="max-w-[1450px] mx-auto px-[6%] py-16"
      >
        <h2 className="text-4xl font-bold text-center mb-4">
          Smarter Learning Starts Here
        </h2>

        <p className="text-gray-400 text-center mb-12">
          Everything you need to master your learning journey.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="bg-[#101323] border border-white/10 rounded-2xl p-8 hover:border-violet-500 transition-all"
              >
                <div className="inline-flex bg-violet-600/20 p-4 rounded-xl mb-5">
                  <Icon size={28} className="text-violet-400" />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="how-it-works"
        className="text-center px-6 py-20"
      >
        <Zap
          size={40}
          className="text-violet-400 mx-auto mb-5"
        />

        <h2 className="text-3xl font-bold">
          Learn. Master. Unlock.
        </h2>

        <p className="text-gray-400 mt-4 mb-7">
          Complete lessons, pass quizzes and unlock advanced concepts.
        </p>

        <button
          onClick={() => setPage("roles")}
          className="bg-violet-600 px-7 py-4 rounded-xl"
        >
          Start Learning
        </button>
      </section>

      <footer
        id="about"
        className="border-t border-white/10 text-center text-gray-400 p-8"
      >
        © 2026 CUBIX — Prerequisite-Aware Learning Platform
      </footer>
    </div>
  );
}
