
const express = require("express");
const cors = require("cors");
const path = require("path");
const os = require("os");

const {
  initializeApp,
  cert,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

// Firebase private key

const keyPath = path.join(
  os.homedir(),
  ".cubix-secrets",
  "serviceAccountKey.json"
);

const serviceAccount = require(keyPath);

if (serviceAccount.project_id !== "cubix-72bd2") {
  throw new Error("Incorrect Firebase project key.");
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
  })
);

app.use(express.json({ limit: "16kb" }));

// Verify Firebase login

async function verifyUser(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in first.",
      });
    }

    const token = header.split(" ")[1];

    const decodedToken = await getAuth().verifyIdToken(
      token,
      true
    );

    req.user = decodedToken;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login session.",
    });
  }
}

// Home route

app.get("/", (req, res) => {
  res.send("CUBIX Firebase Backend is running!");
});

// Health check

app.get("/api/health", async (req, res) => {
  try {
    await db.collection("courses").limit(1).get();

    res.json({
      success: true,
      backend: "Running",
      database: "Firebase Firestore Connected",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      database: "Connection failed",
    });
  }
});

// Custom error helper

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

// Quiz submission and mastery calculation

app.post(
  "/api/quiz/submit",
  verifyUser,
  async (req, res) => {
    try {
      const uid = req.user.uid;

      const {
        courseId,
        conceptId,
        answers,
      } = req.body || {};

      const validId = (id) =>
        typeof id === "string" &&
        /^[A-Za-z0-9]{20}$/.test(id);

      if (
        !validId(courseId) ||
        !validId(conceptId) ||
        !Array.isArray(answers) ||
        answers.length !== 3 ||
        !answers.every(
          (answer) =>
            Number.isInteger(answer) &&
            answer >= 0 &&
            answer <= 3
        )
      ) {
        return res.status(400).json({
          message: "Invalid quiz submission.",
        });
      }

      const userRef = db
        .collection("users")
        .doc(uid);

      const enrollmentRef = userRef
        .collection("enrollments")
        .doc(courseId);

      const conceptRef = db
        .collection("courses")
        .doc(courseId)
        .collection("concepts")
        .doc(conceptId);

      const progressRef = enrollmentRef
        .collection("progress")
        .doc(conceptId);

      const quizRef = conceptRef
        .collection("quizzes")
        .doc("current");

      const keyRef = conceptRef
        .collection("quizKeys")
        .doc("current");

      const result = await db.runTransaction(
        async (transaction) => {

          const [
            userDoc,
            enrollmentDoc,
            conceptDoc,
            progressDoc,
            quizDoc,
            keyDoc,
          ] = await Promise.all([
            transaction.get(userRef),
            transaction.get(enrollmentRef),
            transaction.get(conceptRef),
            transaction.get(progressRef),
            transaction.get(quizRef),
            transaction.get(keyRef),
          ]);

          // Check learner account

          if (
            !userDoc.exists ||
            userDoc.data().role !== "learner"
          ) {
            fail(403, "Learner account required.");
          }

          // Check course enrollment

          if (!enrollmentDoc.exists) {
            fail(403, "You are not enrolled.");
          }

          if (!conceptDoc.exists) {
            fail(404, "Concept not found.");
          }

          if (!quizDoc.exists || !keyDoc.exists) {
            fail(404, "Quiz not available.");
          }

          // Check lesson completion

          if (
            !progressDoc.exists ||
            progressDoc.data().lessonCompleted !== true
          ) {
            fail(403, "Complete the lesson first.");
          }

          // Verify all prerequisites

          const prerequisites =
            conceptDoc.data().prerequisites || [];

          for (const prerequisiteId of prerequisites) {
            const prerequisiteRef = enrollmentRef
              .collection("progress")
              .doc(prerequisiteId);

            const prerequisiteProgress =
              await transaction.get(prerequisiteRef);

            if (
              !prerequisiteProgress.exists ||
              prerequisiteProgress.data().mastered !== true
            ) {
              fail(
                403,
                "Master all prerequisites first."
              );
            }
          }

          // Validate saved quiz

          const quiz = quizDoc.data();
          const correctAnswers = keyDoc.data().answers;
          const threshold = quiz.passPercentage;

          if (
            !Array.isArray(quiz.questions) ||
            quiz.questions.length !== 3 ||
            !Array.isArray(correctAnswers) ||
            correctAnswers.length !== 3 ||
            !correctAnswers.every(
              (answer) =>
                Number.isInteger(answer) &&
                answer >= 0 &&
                answer <= 3
            ) ||
            !Number.isInteger(threshold) ||
            threshold < 1 ||
            threshold > 100
          ) {
            fail(500, "Quiz configuration is invalid.");
          }

          // Calculate score

          let correctCount = 0;

          answers.forEach((answer, index) => {
            if (answer === correctAnswers[index]) {
              correctCount++;
            }
          });

          const totalQuestions = correctAnswers.length;

          const score = Number(
            (
              (correctCount / totalQuestions) *
              100
            ).toFixed(2)
          );

          const passed =
            correctCount * 100 >=
            threshold * totalQuestions;

          const previous = progressDoc.data();

          const mastered =
            previous.mastered === true || passed;

          const bestScore = Math.max(
            previous.bestScore || 0,
            score
          );

          // Save progress permanently

          transaction.update(progressRef, {
            mastered,
            bestScore,
            lastScore: score,
            attempts: FieldValue.increment(1),
            lastAttemptAt: FieldValue.serverTimestamp(),

            ...(passed && !previous.mastered
              ? {
                  masteredAt:
                    FieldValue.serverTimestamp(),
                }
              : {}),
          });

          return {
            success: true,
            score,
            correctCount,
            totalQuestions,
            passPercentage: threshold,
            passed,
            mastered,
            bestScore,
            message: passed
              ? "Congratulations! Concept mastered."
              : "Quiz completed. Try again to improve your score.",
          };
        }
      );

      res.json(result);

    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.status
          ? error.message
          : "Unable to process quiz submission.",
      });

      console.error(
        "Quiz submission failed:",
        error.code || error.status || "unknown"
      );
    }
  }
);

// Start Firebase backend

async function startServer() {
  try {
    await db.collection("courses").limit(1).get();

    console.log("Firebase Connected Successfully!");

    app.listen(5000, "127.0.0.1", () => {
      console.log("================================");
      console.log("CUBIX Backend Started");
      console.log("Server: http://127.0.0.1:5000");
      console.log("Quiz Scoring API Ready");
      console.log("================================");
    });

  } catch (error) {
    console.error(
      "Firebase connection failed:",
      error.code || error.message
    );

    process.exit(1);
  }
}

startServer();
