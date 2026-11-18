
import { useEffect, useState, useMemo } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import {
  Network,
  BookOpen,
  Layers,
  Clock,
} from "lucide-react";

import { auth, db } from "./firebase";

export default function KnowledgeGraph() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [error, setError] = useState("");

  const uid = auth.currentUser?.uid;

  // Load instructor courses

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const courseQuery = query(
      collection(db, "courses"),
      where("ownerId", "==", uid)
    );

    return onSnapshot(
      courseQuery,
      (snapshot) => {
        const courseList = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        setCourses(courseList);

        setSelectedCourse((previous) =>
          courseList.some((course) => course.id === previous)
            ? previous
            : courseList[0]?.id || ""
        );

        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
  }, [uid]);

  // Load concepts from selected course

  useEffect(() => {
    setConcepts([]);

    if (!selectedCourse) {
      setConceptLoading(false);
      return;
    }

    setConceptLoading(true);
    setError("");

    const conceptRef = collection(
      db,
      "courses",
      selectedCourse,
      "concepts"
    );

    return onSnapshot(
      conceptRef,
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
  }, [selectedCourse]);

  // Generate graph automatically

  const graph = useMemo(() => {
    const levels = {};
    const byId = new Map(
      concepts.map((concept) => [concept.id, concept])
    );

    let hasCycle = false;
    const visiting = new Set();

    function getLevel(id) {
      if (visiting.has(id)) {
        hasCycle = true;
        return 0;
      }

      if (levels[id] !== undefined) {
        return levels[id];
      }

      const concept = byId.get(id);

      if (!concept) return 0;

      visiting.add(id);

      const prerequisites = (
        concept.prerequisites || []
      ).filter((id) => byId.has(id));

      const level = prerequisites.length
        ? 1 + Math.max(
            ...prerequisites.map(getLevel)
          )
        : 0;

      visiting.delete(id);
      levels[id] = level;

      return level;
    }

    concepts.forEach((concept) =>
      getLevel(concept.id)
    );

    if (hasCycle) {
      return {
        nodes: [],
        edges: [],
        hasCycle: true,
      };
    }

    // Position concepts based on their level

    const groups = {};

    concepts.forEach((concept) => {
      const level = levels[concept.id];

      if (!groups[level]) {
        groups[level] = [];
      }

      groups[level].push(concept);
    });

    const nodes = [];

    Object.entries(groups).forEach(
      ([level, group]) => {
        group.forEach((concept, index) => {
          nodes.push({
            id: concept.id,

            position: {
              x: index * 290,
              y: Number(level) * 160,
            },

            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,

            data: {
              label: (
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {concept.title}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      marginTop: "8px",
                      opacity: 0.7,
                    }}
                  >
                    {concept.duration} minutes
                  </div>
                </div>
              ),
            },

            style: {
              background: "#17152d",
              color: "#ffffff",
              border: "2px solid #8b5cf6",
              borderRadius: "15px",
              padding: "20px",
              width: 240,
              boxShadow: "0 0 20px #7c3aed25",
            },
          });
        });
      }
    );

    const edges = concepts.flatMap((concept) =>
      (concept.prerequisites || [])
        .filter((id) => byId.has(id))
        .map((id) => ({
          id: `${id}-${concept.id}`,

          source: id,
          target: concept.id,

          type: "smoothstep",
          animated: true,

          style: {
            stroke: "#a78bfa",
            strokeWidth: 2,
          },

          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#a78bfa",
          },
        }))
    );

    return {
      nodes,
      edges,
      hasCycle: false,
    };
  }, [concepts]);

  const totalDuration = concepts.reduce(
    (total, concept) =>
      total + Number(concept.duration || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#080b16] text-white p-8">

      {/* Heading */}

      <div className="flex items-center gap-4 mb-5">

        <div className="bg-violet-600/20 p-4 rounded-2xl">
          <Network
            size={32}
            className="text-violet-400"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            Knowledge Graph
          </h1>

          <p className="text-gray-400 mt-2">
            Visualize real prerequisite relationships.
          </p>
        </div>
      </div>

      {/* Course selector */}

      <div className="bg-[#101323] border border-white/10 rounded-2xl p-5 mb-6">

        <label className="block text-gray-400 mb-3">
          Select Course
        </label>

        <select
          value={selectedCourse}
          onChange={(e) =>
            setSelectedCourse(e.target.value)
          }
          disabled={loading || courses.length === 0}
          className="w-full bg-[#080b16] border border-violet-500/40 rounded-xl p-4 outline-none"
        >
          {courses.length === 0 && (
            <option value="">
              {loading
                ? "Loading courses..."
                : "No instructor courses available"}
            </option>
          )}

          {courses.map((course) => (
            <option
              key={course.id}
              value={course.id}
            >
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

        {[
          {
            icon: BookOpen,
            label: "Total Concepts",
            value: concepts.length,
          },
          {
            icon: Layers,
            label: "Connections",
            value: graph.edges.length,
          },
          {
            icon: Clock,
            label: "Learning Duration",
            value: `${totalDuration} min`,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="bg-[#101323] border border-white/10 rounded-2xl p-5"
            >
              <Icon
                size={26}
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

      {/* Real knowledge graph */}

      <div
        className="bg-[#101323] border border-white/10 rounded-2xl overflow-hidden"
        style={{ height: "600px" }}
      >

        {loading || conceptLoading ? (

          <div className="h-full flex items-center justify-center text-gray-400">
            Loading knowledge graph...
          </div>

        ) : graph.hasCycle ? (

          <div className="h-full flex items-center justify-center text-red-400 p-6 text-center">
            Circular prerequisite detected.
            Please correct the course structure.
          </div>

        ) : concepts.length === 0 ? (

          <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400 p-6 text-center">

            <Network
              size={55}
              className="text-violet-400"
            />

            <h2 className="text-xl font-bold text-white">
              No Concepts Available
            </h2>

            <p>
              Instructors can add concepts through
              Manage Concepts. Learner course access
              will be connected in the next stage.
            </p>
          </div>

        ) : (

          <ReactFlow
            key={selectedCourse}
            nodes={graph.nodes}
            edges={graph.edges}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            nodesDraggable={false}
            nodesConnectable={false}
            colorMode="dark"
          >

            <Background
              color="#35304d"
              gap={25}
            />

            <Controls />

            <MiniMap
              nodeColor="#8b5cf6"
              maskColor="#080b1680"
              style={{
                background: "#101323",
              }}
            />

          </ReactFlow>
        )}
      </div>

      <div className="mt-5 text-gray-400 text-sm">
        Follow the arrows to understand which concepts
        must be completed before learning advanced topics.
      </div>
    </div>
  );
}
