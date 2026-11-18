
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  Clock,
  Lock,
  CheckCircle2,
  PlayCircle,
  ClipboardList,
  GraduationCap,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export default function LearningPage({ course, onBack }) {
  const [concepts, setConcepts] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const [conceptLoading, setConceptLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const uid = auth.currentUser?.uid;

  const loading = conceptLoading || progressLoading;

  // Load course concepts

  useEffect(() => {
    if (!course?.id || !uid) return;

    return onSnapshot(
      collection(db, "courses", course.id, "concepts"),

      (snapshot) => {
        setConcepts(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }))
        );

        setConceptLoading(false);
      },

      (error) => {
        setError(error.message);
        setConceptLoading(false);
      }
    );
  }, [course?.id, uid]);

  // Load personal learning progress

  useEffect(() => {
    if (!course?.id || !uid) return;

    return onSnapshot(
      collection(
        db,
        "users",
        uid,
        "enrollments",
        course.id,
        "progress"
      ),

      (snapshot) => {
        const progressData = {};

        snapshot.docs.forEach((item) => {
          progressData[item.id] = item.data();
        });

        setProgress(progressData);
        setProgressLoading(false);
      },

      (error) => {
        setError(error.message);
        setProgressLoading(false);
      }
    );
  }, [course?.id, uid]);

  // Check concept status

  const getStatus = (concept) => {
    if (progress[concept.id]?.mastered === true) {
      return "mastered";
    }

    const prerequisites = concept.prerequisites || [];

    const unlocked = prerequisites.every(
      (id) => progress[id]?.mastered === true
    );

    if (!unlocked) {
      return "locked";
    }

    if (progress[concept.id]?.lessonCompleted) {
      return "completed";
    }

    return "available";
  };

  // Find missing prerequisites

  const getMissingPrerequisites = (concept) => {
    return (concept.prerequisites || [])
      .filter((id) => progress[id]?.mastered !== true)
      .map((id) => {
        return (
          concepts.find((item) => item.id === id)?.title ||
          "Unknown Concept"
        );
      });
  };

  const selectedConcept =
    concepts.find((item) => item.id === selectedId) ||
    concepts.find((item) => getStatus(item) === "available") ||
    concepts[0];

  // Save lesson completion

  const markCompleted = async () => {
    if (!uid || !course?.id || !selectedConcept) return;

    if (getStatus(selectedConcept) !== "available") return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const progressRef = doc(
        db,
        "users",
        uid,
        "enrollments",
        course.id,
        "progress",
        selectedConcept.id
      );

      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(progressRef);

        if (!existing.exists()) {
          transaction.set(progressRef, {
            lessonCompleted: true,
            completedAt: serverTimestamp(),
          });
        }
      });

      setMessage("Lesson completed successfully!");

    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate course progress

  const completedCount = concepts.filter(
    (concept) =>
      progress[concept.id]?.lessonCompleted === true
  ).length;

  const masteredCount = concepts.filter(
    (concept) =>
      progress[concept.id]?.mastered === true
  ).length;

  const masteryPercentage = concepts.length
    ? Math.round(
        (masteredCount / concepts.length) * 100
      )
    : 0;

  const lessonPercentage = concepts.length
    ? Math.round(
        (completedCount / concepts.length) * 100
      )
    : 0;

  const statusStyles = {
    mastered:
      "bg-green-500/10 border-green-500/40 text-green-400",

    available:
      "bg-violet-600/10 border-violet-500/40 text-violet-300",

    completed:
      "bg-blue-500/10 border-blue-500/40 text-blue-400",

    locked:
      "bg-[#080b16] border-white/10 text-gray-500",
  };

  if (!course?.id || !uid) {
    return (
      <div className="p-8">
        <p>Course or login information unavailable.</p>
        <button onClick={onBack} className="mt-4">
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b16] text-white p-6 md:p-8">

      {/* Back button */}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
      >
        <ArrowLeft size={20} />
        Back to My Courses
      </button>

      {/* Course heading */}

      <div className="flex items-center gap-4 mb-8">

        <div className="bg-violet-600/20 p-4 rounded-2xl">
          <GraduationCap
            size={35}
            className="text-violet-400"
          />
        </div>

        <div>

          <h1 className="text-3xl font-bold">
            {course.title}
          </h1>

          <p className="text-gray-400 mt-2">
            {course.description}
          </p>

        </div>
      </div>

      {/* Progress cards */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-[#101323] p-6 rounded-2xl border border-white/10">

          <BookOpen
            className="text-violet-400 mb-4"
            size={28}
          />

          <p className="text-gray-400">
            Total Concepts
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {concepts.length}
          </h2>

        </div>

        <div className="bg-[#101323] p-6 rounded-2xl border border-white/10">

          <CheckCircle2
            className="text-blue-400 mb-4"
            size={28}
          />

          <p className="text-gray-400">
            Lessons Completed
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {completedCount}/{concepts.length}
          </h2>

        </div>

        <div className="bg-[#101323] p-6 rounded-2xl border border-white/10">

          <GraduationCap
            className="text-green-400 mb-4"
            size={28}
          />

          <p className="text-gray-400">
            Course Mastery
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {masteryPercentage}%
          </h2>

        </div>
      </div>

      {/* Progress bar */}

      <div className="bg-[#101323] border border-white/10 rounded-2xl p-6 mb-8">

        <div className="flex justify-between mb-4">

          <h2 className="font-semibold">
            Lesson Progress
          </h2>

          <span className="text-violet-400">
            {lessonPercentage}%
          </span>

        </div>

        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">

          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full transition-all duration-500"
            style={{
              width: `${lessonPercentage}%`,
            }}
          />

        </div>
      </div>

      {/* Messages */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-5">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 mb-5">
          {message}
        </div>
      )}

      {loading ? (

        <p className="text-gray-400">
          Loading your learning materials...
        </p>

      ) : concepts.length === 0 ? (

        <div className="bg-[#101323] border border-white/10 rounded-2xl p-10 text-center">

          <BookOpen
            className="mx-auto text-violet-400 mb-5"
            size={45}
          />

          <h2 className="text-xl font-bold">
            No Lessons Available
          </h2>

          <p className="text-gray-400 mt-3">
            Your instructor has not added any concepts yet.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* Concepts sidebar */}

          <aside className="bg-[#101323] border border-white/10 rounded-2xl p-5">

            <h2 className="text-xl font-bold mb-6">
              Course Concepts
            </h2>

            <div className="space-y-3">

              {concepts.map((concept) => {

                const status = getStatus(concept);

                const Icon =
                  status === "locked"
                    ? Lock
                    : status === "mastered" ||
                        status === "completed"
                      ? CheckCircle2
                      : PlayCircle;

                return (

                  <button
                    key={concept.id}
                    onClick={() => {
                      setSelectedId(concept.id);
                      setMessage("");
                    }}
                    className={`w-full text-left border rounded-xl p-4 transition-all ${
                      statusStyles[status]
                    } ${
                      selectedConcept?.id === concept.id
                        ? "ring-2 ring-violet-500"
                        : ""
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <Icon size={20} />

                      <span className="font-semibold">
                        {concept.title}
                      </span>

                    </div>

                    <p className="text-xs mt-3 capitalize">
                      {status === "completed"
                        ? "Lesson completed — quiz pending"
                        : status}
                    </p>

                  </button>
                );
              })}

            </div>
          </aside>

          {/* Lesson content */}

          <main className="bg-[#101323] border border-white/10 rounded-2xl p-7 md:p-10">

            {selectedConcept && (

              <>

                <p className="text-violet-400 text-sm mb-3">
                  LEARNING CONCEPT
                </p>

                <h1 className="text-3xl font-bold mb-4">
                  {selectedConcept.title}
                </h1>

                <div className="flex items-center gap-2 text-gray-400 mb-8">

                  <Clock size={18} />

                  {selectedConcept.duration} minutes

                </div>

                {getStatus(selectedConcept) === "locked" ? (

                  <div className="bg-[#080b16] border border-white/10 rounded-2xl p-8 text-center">

                    <Lock
                      size={50}
                      className="mx-auto text-gray-500 mb-5"
                    />

                    <h2 className="text-2xl font-bold">
                      Concept Locked
                    </h2>

                    <p className="text-gray-400 mt-4 mb-6">
                      Master the following prerequisites first:
                    </p>

                    <div className="space-y-3">

                      {getMissingPrerequisites(
                        selectedConcept
                      ).map((name, index) => (

                        <div
                          key={index}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl"
                        >
                          {name}
                        </div>

                      ))}

                    </div>
                  </div>

                ) : (

                  <>

                    <div className="border-t border-white/10 pt-7 mb-8">

                      <h2 className="text-xl font-bold mb-5">
                        Lesson Content
                      </h2>

                      <p className="text-gray-300 leading-loose whitespace-pre-wrap">
                        {selectedConcept.lesson}
                      </p>

                    </div>

                    {progress[selectedConcept.id]?.lessonCompleted ? (

                      <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 flex items-center gap-3">

                        <CheckCircle2 size={23} />

                        Lesson Completed

                      </div>

                    ) : (

                      <button
                        disabled={saving || getStatus(selectedConcept) !== "available"}
                        onClick={markCompleted}
                        className="bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-4 flex items-center gap-3 disabled:opacity-50"
                      >

                        <CheckCircle2 size={20} />

                        {saving
                          ? "Saving..."
                          : "Mark as Completed"}

                      </button>
                    )}

                    {/* Mastery quiz section */}

                    <div className="mt-8 border border-violet-500/20 bg-violet-600/5 rounded-2xl p-6">

                      <ClipboardList
                        size={30}
                        className="text-violet-400 mb-4"
                      />

                      <h2 className="text-xl font-bold">
                        Mastery Quiz
                      </h2>

                      <p className="text-gray-400 mt-3">
                        Pass the concept quiz to demonstrate
                        mastery and unlock dependent concepts.
                      </p>

                      <p className="text-violet-400 text-sm mt-4">
                        Quiz system coming next.
                      </p>

                    </div>
                  </>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
