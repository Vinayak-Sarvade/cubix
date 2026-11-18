
import { useEffect, useState } from "react";

import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Network,
  Plus,
  ClipboardList,
  LogOut,
  Layers,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import ConceptManager from "./ConceptManager";

export default function InstructorDashboard({
  onBack,
  onOpenGraph,
}) {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState("Dashboard");

  const [selectedCourseId, setSelectedCourseId] =
    useState(null);

  const user = auth.currentUser;
  const uid = user?.uid;

  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId
  );

  // Load courses from Firestore

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const courseQuery = query(
      collection(db, "courses"),
      where("ownerId", "==", uid)
    );

    const unsubscribe = onSnapshot(
      courseQuery,
      (snapshot) => {
        setCourses(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }))
        );

        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  // Create course

  const createCourse = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!title.trim() || !description.trim()) {
      setError("Please complete all fields.");
      return;
    }

    if (!uid) {
      setError("Please log in again.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "courses"), {
        title: title.trim(),
        description: description.trim(),
        ownerId: uid,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setDescription("");
      setShowForm(false);
      setMessage("Course created successfully!");

    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Courses", icon: BookOpen },
    { name: "Knowledge Graph", icon: Network },
    { name: "Quizzes", icon: ClipboardList },
  ];

  // Open concept manager

  if (selectedCourse) {
    return (
      <ConceptManager
        key={selectedCourse.id}
        course={selectedCourse}
        onBack={() => setSelectedCourseId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080b16] text-white flex">

      {/* Sidebar */}

      <aside className="w-[240px] shrink-0 bg-[#101323] border-r border-white/10 p-6">

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
          INSTRUCTOR WORKSPACE
        </p>

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.name === "Knowledge Graph") {
                  onOpenGraph?.();
                } else {
                  setPage(item.name);
                }
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl mb-2 transition-all ${
                page === item.name
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </button>
          );
        })}

        <button
          onClick={onBack}
          className="flex items-center gap-3 p-4 text-red-400 mt-10"
        >
          <LogOut size={20} />
          Logout
        </button>

      </aside>

      {/* Main content */}

      <main className="flex-1 min-w-0 p-8">

        <div className="flex justify-between items-center flex-wrap gap-4 mb-10">

          <div>
            <h1 className="text-3xl font-bold">
              {page === "Dashboard"
                ? "Instructor Dashboard"
                : page}
            </h1>

            <p className="text-gray-400 mt-2">
              Welcome, {user?.displayName || "Instructor"}
            </p>
          </div>

          <div className="bg-violet-600/20 border border-violet-500/30 text-violet-300 px-5 py-3 rounded-xl">
            Instructor Account
          </div>
        </div>

        {/* Messages */}

        {error && (
          <div className="p-4 mb-5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
            {error}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-3 p-4 mb-5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30">
            <CheckCircle2 size={20} />
            {message}
          </div>
        )}

        {(page === "Dashboard" ||
          page === "My Courses") && (
          <>

            {/* Statistics */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

              <div className="bg-[#101323] border border-white/10 p-6 rounded-2xl">

                <BookOpen
                  size={30}
                  className="text-violet-400 mb-5"
                />

                <p className="text-gray-400">
                  My Courses
                </p>

                <h2 className="text-4xl font-bold mt-2">
                  {loading ? "..." : courses.length}
                </h2>
              </div>

              <div className="bg-[#101323] border border-white/10 p-6 rounded-2xl">

                <Layers
                  size={30}
                  className="text-green-400 mb-5"
                />

                <p className="text-gray-400">
                  Course Storage
                </p>

                <h2 className="text-2xl font-bold mt-2">
                  Cloud Firestore
                </h2>

                <p className="text-gray-500 text-sm mt-2">
                  Permanent course storage
                </p>
              </div>
            </div>

            {/* Course management */}

            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">

              <div>
                <h2 className="text-2xl font-bold">
                  Course Management
                </h2>

                <p className="text-gray-400 mt-2">
                  Create courses and manage learning concepts.
                </p>
              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Plus size={20} />
                Create Course
              </button>
            </div>

            {/* Course creation form */}

            {showForm && (
              <form
                onSubmit={createCourse}
                className="bg-[#101323] border border-violet-500/40 rounded-2xl p-7 mb-8"
              >

                <div className="flex justify-between items-center mb-6">

                  <h2 className="text-xl font-bold">
                    Create New Course
                  </h2>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowForm(false)}
                    className="text-gray-400"
                  >
                    <X size={22} />
                  </button>
                </div>

                <label className="block text-gray-400 mb-2">
                  Course Name
                </label>

                <input
                  type="text"
                  placeholder="Example: Programming Fundamentals"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  required
                  maxLength={150}
                  className="w-full bg-[#080b16] border border-white/10 rounded-xl p-4 mb-5 outline-none focus:border-violet-500"
                />

                <label className="block text-gray-400 mb-2">
                  Course Description
                </label>

                <textarea
                  placeholder="Describe your course..."
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  required
                  rows={4}
                  className="w-full bg-[#080b16] border border-white/10 rounded-xl p-4 mb-5 outline-none focus:border-violet-500"
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Save Course"}
                </button>
              </form>
            )}

            {/* Course list */}

            {loading ? (
              <p className="text-gray-400">
                Loading your courses...
              </p>
            ) : courses.length === 0 ? (

              <div className="bg-[#101323] border border-white/10 rounded-2xl p-12 text-center">

                <BookOpen
                  size={50}
                  className="text-violet-400 mx-auto mb-5"
                />

                <h2 className="text-xl font-bold">
                  No Courses Yet
                </h2>

                <p className="text-gray-400 mt-3">
                  Create your first course to get started.
                </p>
              </div>

            ) : (

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {courses.map((course) => (

                  <div
                    key={course.id}
                    className="bg-[#101323] border border-white/10 rounded-2xl p-7 hover:border-violet-500/60 transition-all"
                  >

                    <div className="bg-violet-600/20 w-14 h-14 rounded-xl flex items-center justify-center mb-5">

                      <BookOpen
                        size={28}
                        className="text-violet-400"
                      />
                    </div>

                    <h2 className="text-2xl font-bold mb-3">
                      {course.title}
                    </h2>

                    <p className="text-gray-400 leading-relaxed mb-6">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-2 text-green-400 text-sm mb-5">
                      <CheckCircle2 size={17} />
                      Saved in Firestore
                    </div>

                    {/* Manage concepts button */}

                    <button
                      onClick={() =>
                        setSelectedCourseId(course.id)
                      }
                      className="w-full bg-violet-600 hover:bg-violet-500 rounded-xl py-4 flex items-center justify-center gap-3 font-semibold"
                    >
                      <Layers size={20} />

                      Manage Concepts

                      <ArrowRight size={18} />
                    </button>

                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {page === "Quizzes" && (
          <div className="bg-[#101323] rounded-2xl border border-white/10 p-8">

            <ClipboardList
              size={40}
              className="text-violet-400 mb-5"
            />

            <h2 className="text-2xl font-bold">
              Quiz Management
            </h2>

            <p className="text-gray-400 mt-3">
              Quiz creation will be added in the next development stage.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
