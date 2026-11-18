
import { useEffect, useState } from "react";

import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Compass,
  CheckCircle2,
  ArrowRight,
  Search,
  Library,
  PlayCircle,
  Bot,
  Sparkles,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import LearningPage from "./LearningPage";
import StudentAI from "./StudentAI";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [page, setPage] = useState("Dashboard");
  const [search, setSearch] = useState("");

  const [coursesLoading, setCoursesLoading] =
    useState(true);

  const [enrollmentLoading, setEnrollmentLoading] =
    useState(true);

  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedCourseId, setSelectedCourseId] =
    useState(null);

  const [showCourseAI, setShowCourseAI] =
    useState(false);

  const user = auth.currentUser;
  const uid = user?.uid;

  const loading =
    coursesLoading || enrollmentLoading;

  // Load courses

  useEffect(() => {
    if (!uid) return;

    return onSnapshot(
      collection(db, "courses"),

      (snapshot) => {
        setCourses(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }))
        );

        setCoursesLoading(false);
      },

      (err) => {
        setError(err.message);
        setCoursesLoading(false);
      }
    );
  }, [uid]);

  // Load enrolled courses

  useEffect(() => {
    if (!uid) return;

    return onSnapshot(
      collection(
        db,
        "users",
        uid,
        "enrollments"
      ),

      (snapshot) => {
        setEnrollments(
          snapshot.docs.map((item) => item.id)
        );

        setEnrollmentLoading(false);
      },

      (err) => {
        setError(err.message);
        setEnrollmentLoading(false);
      }
    );
  }, [uid]);

  // Enroll in a course

  const enrollCourse = async (courseId) => {
    if (!uid || saving || loading) return;

    setError("");
    setMessage("");
    setSaving(courseId);

    try {
      const enrollmentRef = doc(
        db,
        "users",
        uid,
        "enrollments",
        courseId
      );

      await runTransaction(db, async (transaction) => {
        const existing =
          await transaction.get(enrollmentRef);

        if (!existing.exists()) {
          transaction.set(enrollmentRef, {
            courseId,
            enrolledAt: serverTimestamp(),
          });
        }
      });

      setMessage("You have successfully enrolled!");

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const enrolledCourses = courses.filter(
    (course) => enrollments.includes(course.id)
  );

  const selectedCourse = enrolledCourses.find(
    (course) => course.id === selectedCourseId
  );

  const visibleCourses = (
    page === "My Courses"
      ? enrolledCourses
      : courses
  ).filter((course) =>
    course.title
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Sidebar menu

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Explore Courses",
      icon: Compass,
    },
    {
      name: "My Courses",
      icon: BookOpen,
    },
    {
      name: "AI Study Assistant",
      icon: Bot,
    },
  ];

  // Learning page with AI assistant

  if (selectedCourse) {
    return (
      <div className="relative">

        <LearningPage
          key={selectedCourse.id}
          course={selectedCourse}
          onBack={() => {
            setSelectedCourseId(null);
            setShowCourseAI(false);
            setPage("My Courses");
            setSearch("");
          }}
        />

        {/* Floating AI button */}

        {!showCourseAI && (
          <button
            onClick={() => setShowCourseAI(true)}
            className="fixed bottom-6 left-6 z-40 bg-violet-600 hover:bg-violet-500 text-white rounded-full px-6 py-4 flex items-center gap-3 shadow-2xl transition-all hover:scale-105"
          >

            <Bot size={25} />

            <span className="font-semibold">
              Ask AI
            </span>

            <Sparkles size={17} />

          </button>
        )}

        {/* AI chatbot window */}

        {showCourseAI && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="w-full max-w-3xl">

              <StudentAI
                course={selectedCourse}
                onClose={() => setShowCourseAI(false)}
              />

            </div>

          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b16] text-white flex flex-col md:flex-row">

      {/* Sidebar */}

      <aside className="w-full md:w-[240px] shrink-0 bg-[#101323] border-r border-white/10 p-6">

        <div className="flex items-center gap-3 mb-12">

          <GraduationCap
            size={32}
            className="text-violet-400"
          />

          <h1 className="text-2xl font-bold">
            CUB<span className="text-violet-400">IX</span>
          </h1>

        </div>

        <p className="text-xs text-gray-500 mb-5">
          LEARNER WORKSPACE
        </p>

        {menu.map((item) => {
          const Icon = item.icon;

          return (

            <button
              key={item.name}
              onClick={() => {
                setPage(item.name);
                setSearch("");
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl mb-2 transition-all text-left ${
                page === item.name
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >

              <Icon
                size={20}
                className="shrink-0"
              />

              <span className="flex-1 text-sm">
                {item.name}
              </span>

              {item.name === "AI Study Assistant" && (
                <Sparkles
                  size={15}
                  className="text-violet-400 shrink-0"
                />
              )}

            </button>

          );
        })}

        {/* Account */}

        <div className="mt-10 p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl">

          <h3 className="font-semibold">
            Your Account
          </h3>

          <p className="text-violet-300 mt-2">
            {user?.displayName || "Learner"}
          </p>

          <p className="text-xs text-gray-400 mt-2 break-all">
            {user?.email}
          </p>

        </div>

      </aside>

      {/* Main content */}

      <main className="flex-1 min-w-0 p-6 md:p-8 pb-24">

        {/* AI page */}

        {page === "AI Study Assistant" ? (

          <>

            <div className="mb-7">

              <div className="flex items-center gap-3 mb-3">

                <Bot
                  size={34}
                  className="text-violet-400"
                />

                <h1 className="text-3xl font-bold">
                  AI Study Assistant
                </h1>

              </div>

              <p className="text-gray-400">
                Learn smarter with your personal AI tutor.
              </p>

            </div>

            <StudentAI />

          </>

        ) : (

          <>

            {/* Page heading */}

            <div className="mb-10">

              <h1 className="text-3xl font-bold">

                {page === "Dashboard"
                  ? `Welcome, ${user?.displayName || "Learner"}!`
                  : page}

              </h1>

              <p className="text-gray-400 mt-3">
                Discover courses and continue your learning journey.
              </p>

            </div>

            {/* Statistics */}

            {page === "Dashboard" && (

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

                {[
                  {
                    label: "Available Courses",
                    value: courses.length,
                    icon: Library,
                    color: "text-violet-400",
                  },
                  {
                    label: "Enrolled Courses",
                    value: enrolledCourses.length,
                    icon: BookOpen,
                    color: "text-blue-400",
                  },
                  {
                    label: "Courses to Explore",
                    value:
                      courses.length - enrolledCourses.length,
                    icon: Compass,
                    color: "text-green-400",
                  },
                ].map((item) => {

                  const Icon = item.icon;

                  return (

                    <div
                      key={item.label}
                      className="bg-[#101323] border border-white/10 rounded-2xl p-6"
                    >

                      <Icon
                        size={30}
                        className={`${item.color} mb-5`}
                      />

                      <p className="text-gray-400">
                        {item.label}
                      </p>

                      <h2 className="text-4xl font-bold mt-3">
                        {loading ? "..." : item.value}
                      </h2>

                    </div>

                  );
                })}

              </div>

            )}

            {/* Learning banner */}

            {page === "Dashboard" && (

              <div className="bg-gradient-to-r from-violet-900/60 to-indigo-900/30 border border-violet-500/30 rounded-2xl p-8 mb-6">

                <h2 className="text-2xl font-bold">
                  Your Learning Journey
                </h2>

                <p className="text-gray-300 mt-4 mb-6">
                  Master concepts, complete lessons and unlock advanced topics.
                </p>

                <button
                  disabled={loading}
                  onClick={() => {
                    if (enrolledCourses.length > 0) {
                      setSelectedCourseId(
                        enrolledCourses[0].id
                      );
                    } else {
                      setPage("Explore Courses");
                      setSearch("");
                    }
                  }}
                  className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl flex items-center gap-3 disabled:opacity-50"
                >

                  {enrolledCourses.length > 0
                    ? "Continue Learning"
                    : "Explore Courses"}

                  <ArrowRight size={20} />

                </button>

              </div>

            )}

            {/* AI promotion card */}

            {page === "Dashboard" && (

              <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-violet-500/30 rounded-2xl p-7 mb-10 flex items-center justify-between gap-6 flex-wrap">

                <div className="flex items-center gap-5">

                  <div className="bg-violet-600/20 rounded-2xl p-5">

                    <Bot
                      size={42}
                      className="text-violet-300"
                    />

                  </div>

                  <div>

                    <h2 className="text-xl font-bold flex items-center gap-2">

                      Meet CUBIX AI

                      <Sparkles
                        size={19}
                        className="text-violet-400"
                      />

                    </h2>

                    <p className="text-gray-400 mt-2">
                      Ask doubts, generate notes and learn anything.
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setPage("AI Study Assistant")
                  }
                  className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl flex items-center gap-3"
                >

                  Start Chat

                  <ArrowRight size={19} />

                </button>

              </div>

            )}

            {/* Messages */}

            {error && (

              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-5">
                {error}
              </div>

            )}

            {message && (

              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 mb-5 flex items-center gap-3">

                <CheckCircle2 size={20} />

                {message}

              </div>

            )}

            {/* Search */}

            <div className="flex justify-between items-center flex-wrap gap-5 mb-7">

              <h2 className="text-2xl font-bold">

                {page === "My Courses"
                  ? "My Enrolled Courses"
                  : "Available Courses"}

              </h2>

              <div className="relative">

                <Search
                  size={19}
                  className="absolute left-4 top-4 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search courses..."
                  className="bg-[#101323] border border-white/10 pl-12 pr-4 py-3 rounded-xl outline-none focus:border-violet-500"
                />

              </div>

            </div>

            {/* Courses */}

            {loading ? (

              <p className="text-gray-400">
                Loading courses...
              </p>

            ) : visibleCourses.length === 0 ? (

              <div className="bg-[#101323] border border-white/10 rounded-2xl p-12 text-center">

                <BookOpen
                  size={50}
                  className="text-violet-400 mx-auto mb-5"
                />

                <h2 className="text-xl font-bold">
                  No Courses Found
                </h2>

                <p className="text-gray-400 mt-3">

                  {page === "My Courses"
                    ? "Explore available courses and enroll in one."
                    : "No matching courses are available."}

                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {visibleCourses.map((course) => {

                  const enrolled =
                    enrollments.includes(course.id);

                  return (

                    <div
                      key={course.id}
                      className="bg-[#101323] border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all"
                    >

                      <div className="h-36 bg-gradient-to-br from-violet-700/40 to-indigo-900/30 rounded-xl flex items-center justify-center mb-6">

                        <BookOpen
                          size={55}
                          className="text-violet-300"
                        />

                      </div>

                      <h2 className="text-xl font-bold mb-3">
                        {course.title}
                      </h2>

                      <p className="text-gray-400 leading-relaxed mb-6">
                        {course.description}
                      </p>

                      {enrolled ? (

                        <>

                          <div className="flex items-center gap-2 text-green-400 text-sm mb-5">

                            <CheckCircle2 size={18} />

                            Enrolled

                          </div>

                          <button
                            onClick={() =>
                              setSelectedCourseId(course.id)
                            }
                            className="w-full bg-violet-600 hover:bg-violet-500 rounded-xl py-4 flex items-center justify-center gap-3 font-semibold"
                          >

                            <PlayCircle size={20} />

                            Start Learning

                            <ArrowRight size={18} />

                          </button>

                        </>

                      ) : (

                        <button
                          disabled={saving !== null}
                          onClick={() =>
                            enrollCourse(course.id)
                          }
                          className="w-full bg-violet-600 hover:bg-violet-500 rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                        >

                          {saving === course.id
                            ? "Enrolling..."
                            : "Enroll Now"}

                          <ArrowRight size={18} />

                        </button>

                      )}

                    </div>

                  );
                })}

              </div>

            )}

          </>

        )}

      </main>

    </div>
  );
}
