
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  Plus,
  Clock,
  Network,
  CheckCircle2,
  ClipboardList,
  X,
} from "lucide-react";

import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebase";

const inputStyle =
  "w-full bg-[#080b16] border border-white/10 rounded-xl p-4 outline-none focus:border-violet-500 text-white";

const cardStyle =
  "bg-[#101323] border border-white/10 rounded-2xl p-6";

const buttonStyle =
  "bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50";

function QuizEditor({ course, concept, onBack }) {
  const [questions, setQuestions] = useState(
    () =>
      Array.from({ length: 3 }, () => ({
        prompt: "",
        options: ["", "", "", ""],
        correct: 0,
      }))
  );

  const [passPercentage, setPassPercentage] =
    useState("70");

  const [existingQuiz, setExistingQuiz] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    return onSnapshot(
      doc(
        db,
        "courses",
        course.id,
        "concepts",
        concept.id,
        "quizzes",
        "current"
      ),
      (snapshot) => {
        setExistingQuiz(
          snapshot.exists() ? snapshot.data() : null
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [course.id, concept.id]);

  const updateQuestion = (index, key, value) => {
    setQuestions((previous) =>
      previous.map((question, i) =>
        i === index
          ? { ...question, [key]: value }
          : question
      )
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map(
                (option, i) =>
                  i === optionIndex ? value : option
              ),
            }
          : question
      )
    );
  };

  const saveQuiz = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (existingQuiz || saving || loading) return;

    const threshold = Number(passPercentage);

    if (
      !Number.isInteger(threshold) ||
      threshold < 1 ||
      threshold > 100
    ) {
      setError("Enter a passing percentage from 1 to 100.");
      return;
    }

    for (const question of questions) {
      const options = question.options.map(
        (option) => option.trim()
      );

      if (
        !question.prompt.trim() ||
        options.some((option) => !option)
      ) {
        setError("Complete every question and option.");
        return;
      }

      if (new Set(options).size !== 4) {
        setError("Each question must have four different options.");
        return;
      }
    }

    setSaving(true);

    try {
      const quizRef = doc(
        db,
        "courses",
        course.id,
        "concepts",
        concept.id,
        "quizzes",
        "current"
      );

      const keyRef = doc(
        db,
        "courses",
        course.id,
        "concepts",
        concept.id,
        "quizKeys",
        "current"
      );

      const batch = writeBatch(db);

      batch.set(quizRef, {
        questions: questions.map((question) => ({
          prompt: question.prompt.trim(),
          options: question.options.map(
            (option) => option.trim()
          ),
        })),
        passPercentage: threshold,
        createdAt: serverTimestamp(),
      });

      batch.set(keyRef, {
        answers: questions.map(
          (question) => question.correct
        ),
      });

      await batch.commit();

      setMessage("Quiz saved successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b16] text-white p-8">

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
      >
        <ArrowLeft size={20} />
        Back to Concepts
      </button>

      <div className="flex items-center gap-4 mb-8">

        <div className="bg-violet-600/20 p-4 rounded-xl">
          <ClipboardList
            size={32}
            className="text-violet-400"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            Quiz Management
          </h1>

          <p className="text-gray-400 mt-2">
            {concept.title}
          </p>
        </div>

      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 mb-6">
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading quiz...</p>
      ) : existingQuiz ? (

        <div className={cardStyle}>

          <div className="flex items-center gap-3 text-green-400 mb-6">
            <CheckCircle2 size={25} />
            Quiz already created
          </div>

          <p className="mb-6">
            Passing percentage:{" "}
            <strong>
              {existingQuiz.passPercentage}%
            </strong>
          </p>

          {existingQuiz.questions.map((question, index) => (
            <div
              key={index}
              className="border border-white/10 rounded-xl p-5 mb-4"
            >
              <h3 className="font-bold mb-4">
                {index + 1}. {question.prompt}
              </h3>

              {question.options.map((option, i) => (
                <p
                  key={i}
                  className="text-gray-400 mb-2"
                >
                  {String.fromCharCode(65 + i)}. {option}
                </p>
              ))}
            </div>
          ))}

          <p className="text-gray-500 text-sm">
            Quiz editing is temporarily disabled to
            preserve learner assessment integrity.
          </p>

        </div>

      ) : (

        <form
          onSubmit={saveQuiz}
          className="max-w-4xl space-y-6"
        >

          <div className={cardStyle}>

            <label className="block font-bold mb-3">
              Passing Percentage
            </label>

            <input
              type="number"
              min={1}
              max={100}
              required
              value={passPercentage}
              onChange={(e) =>
                setPassPercentage(e.target.value)
              }
              className={inputStyle}
            />

            <p className="text-gray-400 text-sm mt-3">
              Students must achieve this score to master
              the concept.
            </p>

          </div>

          {questions.map((question, index) => (

            <div
              key={index}
              className={cardStyle}
            >

              <h2 className="text-xl font-bold text-violet-400 mb-5">
                Question {index + 1}
              </h2>

              <input
                type="text"
                placeholder="Enter your question"
                required
                maxLength={1000}
                value={question.prompt}
                onChange={(e) =>
                  updateQuestion(
                    index,
                    "prompt",
                    e.target.value
                  )
                }
                className={`${inputStyle} mb-5`}
              />

              <p className="text-gray-400 mb-4">
                Enter four options and select the correct answer.
              </p>

              {question.options.map((option, optionIndex) => (

                <div
                  key={optionIndex}
                  className={`flex items-center gap-3 rounded-xl border p-3 mb-3 ${
                    question.correct === optionIndex
                      ? "border-green-500 bg-green-500/5"
                      : "border-white/10"
                  }`}
                >

                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correct === optionIndex}
                    onChange={() =>
                      updateQuestion(
                        index,
                        "correct",
                        optionIndex
                      )
                    }
                    aria-label={`Correct answer option ${optionIndex + 1}`}
                    className="w-5 h-5 accent-green-500"
                  />

                  <span className="text-violet-400">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>

                  <input
                    type="text"
                    required
                    maxLength={500}
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) =>
                      updateOption(
                        index,
                        optionIndex,
                        e.target.value
                      )
                    }
                    className={inputStyle}
                  />

                </div>
              ))}

            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className={buttonStyle}
          >
            <CheckCircle2 size={20} />
            {saving ? "Saving..." : "Save Quiz"}
          </button>

        </form>
      )}
    </div>
  );
}

export default function ConceptManager({ course, onBack }) {
  const [concepts, setConcepts] = useState([]);
  const [title, setTitle] = useState("");
  const [lesson, setLesson] = useState("");
  const [duration, setDuration] = useState("30");
  const [prerequisites, setPrerequisites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!course?.id) return;

    return onSnapshot(
      collection(db, "courses", course.id, "concepts"),

      (snapshot) => {
        setConcepts(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }))
        );

        setLoading(false);
      },

      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [course?.id]);

  const togglePrerequisite = (id) => {
    setError("");

    if (prerequisites.includes(id)) {
      setPrerequisites((previous) =>
        previous.filter((item) => item !== id)
      );
    } else {
      if (prerequisites.length >= 5) {
        setError("Maximum five prerequisites allowed.");
        return;
      }

      setPrerequisites((previous) => [...previous, id]);
    }
  };

  const createConcept = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (saving || !course?.id) return;

    const minutes = Number(duration);

    if (!title.trim() || !lesson.trim()) {
      setError("Please complete all fields.");
      return;
    }

    if (
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 600
    ) {
      setError("Duration must be between 1 and 600 minutes.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(
        collection(db, "courses", course.id, "concepts"),
        {
          title: title.trim(),
          lesson: lesson.trim(),
          duration: minutes,
          prerequisites,
          createdAt: serverTimestamp(),
        }
      );

      setTitle("");
      setLesson("");
      setDuration("30");
      setPrerequisites([]);
      setShowForm(false);
      setMessage("Concept created successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentQuizConcept = concepts.find(
    (concept) => concept.id === selectedQuiz
  );

  if (currentQuizConcept) {
    return (
      <QuizEditor
        key={currentQuizConcept.id}
        course={course}
        concept={currentQuizConcept}
        onBack={() => setSelectedQuiz(null)}
      />
    );
  }

  if (!course?.id) {
    return (
      <div className="p-8">
        <p>No course selected.</p>

        <button onClick={onBack} className="mt-4">
          Back to Courses
        </button>
      </div>
    );
  }

  const totalDuration = concepts.reduce(
    (total, concept) =>
      total + Number(concept.duration || 0),
    0
  );

  const totalConnections = concepts.reduce(
    (total, concept) =>
      total + (concept.prerequisites?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#080b16] text-white p-8">

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
      >
        <ArrowLeft size={20} />
        Back to Courses
      </button>

      <div className="flex justify-between items-center flex-wrap gap-5 mb-10">

        <div>
          <h1 className="text-3xl font-bold">
            {course.title}
          </h1>

          <p className="text-gray-400 mt-3">
            {course.description}
          </p>
        </div>

        <button
          disabled={saving || loading}
          onClick={() => setShowForm(!showForm)}
          className={buttonStyle}
        >
          <Plus size={20} />
          Add Concept
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

        {[
          {
            label: "Total Concepts",
            value: concepts.length,
            icon: BookOpen,
          },
          {
            label: "Total Duration",
            value: `${totalDuration} min`,
            icon: Clock,
          },
          {
            label: "Prerequisite Connections",
            value: totalConnections,
            icon: Network,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className={cardStyle}>

              <Icon
                size={28}
                className="text-violet-400 mb-4"
              />

              <p className="text-gray-400">
                {item.label}
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {item.value}
              </h2>

            </div>
          );
        })}

      </div>

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

      {showForm && (

        <form
          onSubmit={createConcept}
          className={`${cardStyle} mb-10 space-y-5`}
        >

          <div className="flex justify-between items-center">

            <h2 className="text-2xl font-bold">
              Create New Concept
            </h2>

            <button
              type="button"
              disabled={saving}
              onClick={() => setShowForm(false)}
            >
              <X size={24} />
            </button>

          </div>

          <label className="block">Concept Name</label>

          <input
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Concept name"
            className={inputStyle}
          />

          <label className="block">Lesson Content</label>

          <textarea
            required
            rows={6}
            maxLength={50000}
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            placeholder="Write your lesson here..."
            className={inputStyle}
          />

          <label className="block">
            Duration in Minutes
          </label>

          <input
            type="number"
            min={1}
            max={600}
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputStyle}
          />

          <h3 className="text-xl font-bold">
            Select Prerequisites
          </h3>

          {concepts.length === 0 && (
            <p className="text-gray-400">
              No prerequisites available.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {concepts.map((concept) => (
              <label
                key={concept.id}
                className="flex items-center gap-3 border border-white/10 rounded-xl p-4 cursor-pointer"
              >

                <input
                  type="checkbox"
                  checked={prerequisites.includes(concept.id)}
                  onChange={() => togglePrerequisite(concept.id)}
                  className="accent-violet-600 w-5 h-5"
                />

                {concept.title}

              </label>
            ))}

          </div>

          <button
            type="submit"
            disabled={saving}
            className={buttonStyle}
          >
            {saving ? "Saving..." : "Save Concept"}
          </button>

        </form>
      )}

      <h2 className="text-2xl font-bold mb-6">
        Course Concepts
      </h2>

      {loading ? (

        <p className="text-gray-400">
          Loading concepts...
        </p>

      ) : concepts.length === 0 ? (

        <div className={cardStyle}>
          No concepts yet. Click Add Concept.
        </div>

      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {concepts.map((concept) => (

            <div
              key={concept.id}
              className={cardStyle}
            >

              <div className="flex items-center gap-4 mb-5">

                <div className="bg-violet-600/20 p-4 rounded-xl">
                  <BookOpen
                    className="text-violet-400"
                    size={28}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold">
                    {concept.title}
                  </h3>

                  <p className="text-gray-400 mt-1">
                    {concept.duration} minutes
                  </p>
                </div>

              </div>

              <p className="text-gray-400 mb-5 whitespace-pre-wrap">
                {concept.lesson?.slice(0, 200)}
                {concept.lesson?.length > 200 ? "..." : ""}
              </p>

              <div className="border-t border-white/10 pt-4 mb-5">

                <p className="text-gray-400 text-sm mb-3">
                  Prerequisites
                </p>

                {concept.prerequisites?.length ? (

                  <div className="flex flex-wrap gap-2">

                    {concept.prerequisites.map((id) => (

                      <span
                        key={id}
                        className="bg-violet-600/20 text-violet-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {concepts.find(
                          (item) => item.id === id
                        )?.title || "Unknown Concept"}
                      </span>

                    ))}

                  </div>

                ) : (

                  <p className="text-green-400 text-sm">
                    No prerequisites required
                  </p>

                )}

              </div>

              <button
                onClick={() => setSelectedQuiz(concept.id)}
                className={`${buttonStyle} w-full`}
              >
                <ClipboardList size={20} />
                Manage Quiz
              </button>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}
