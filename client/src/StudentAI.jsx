
import { useState, useEffect, useRef } from "react";

import {
  Bot,
  Send,
  User,
  BookOpen,
  FileText,
  ClipboardList,
  Code,
  Trash2,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";

const welcomeMessage = {
  role: "assistant",
  content:
    "Hello! I am CUBIX AI, your personal study assistant. Ask me anything about your studies!",
};

const suggestions = [
  {
    title: "Explain a concept",
    prompt: "Explain variables in simple words with examples.",
    icon: BookOpen,
  },
  {
    title: "Generate study notes",
    prompt: "Create short study notes about programming fundamentals.",
    icon: FileText,
  },
  {
    title: "Practice questions",
    prompt: "Give me five beginner programming practice questions.",
    icon: ClipboardList,
  },
  {
    title: "Explain code",
    prompt: "Explain how a Python for loop works with an example.",
    icon: Code,
  },
];

export default function StudentAI({ course, onClose }) {
  const [messages, setMessages] = useState([
    welcomeMessage,
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  const sendMessage = async (question = input) => {
    const text = question.trim();

    if (!text || requestRef.current) return;

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: text,
      },
    ];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    const controller = new AbortController();
    requestRef.current = controller;

    const timer = setTimeout(
      () => controller.abort(),
      180000
    );

    try {
      const courseContext = course
        ? `Current course: ${course.title}.
           Description: ${course.description || ""}`
        : "";

      const response = await fetch("/ai/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        signal: controller.signal,

        body: JSON.stringify({
          model: "llama3.2:1b",

          stream: false,

          messages: [
            {
              role: "system",

              content: `
You are CUBIX AI, a helpful student tutor.

Explain concepts in simple language.
Use short paragraphs and examples.
Help students understand rather than memorize.
Teach programming step by step.
Generate notes and practice questions when requested.
Never invent facts when unsure.
Do not claim to access student records or quiz keys.

${courseContext}
              `,
            },

            ...updatedMessages.slice(-8),
          ],

          options: {
            temperature: 0.4,
            num_predict: 400,
            num_ctx: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          "AI connection failed. Make sure Ollama is running."
        );
      }

      const data = await response.json();

      const answer = data.message?.content?.trim();

      if (!answer) {
        throw new Error("No response from the AI.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: answer,
        },
      ]);

    } catch (err) {
      setError(
        err.name === "AbortError"
          ? "The AI request was stopped or timed out."
          : "Unable to connect to Ollama. Check that Ollama and llama3.2:1b are running."
      );

    } finally {
      clearTimeout(timer);

      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  };

  const clearChat = () => {
    if (loading) return;

    setMessages([welcomeMessage]);
    setInput("");
    setError("");
  };

  return (
    <div className="bg-[#080b16] text-white border border-violet-500/30 rounded-2xl overflow-hidden flex flex-col h-[75vh] min-h-[400px] shadow-2xl">

      {/* Header */}

      <header className="bg-[#101323] border-b border-white/10 p-5 flex items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <div className="bg-violet-600/20 p-3 rounded-xl">
            <Bot
              size={30}
              className="text-violet-400"
            />
          </div>

          <div>
            <h1 className="text-xl font-bold">
              CUBIX AI
            </h1>

            <p className="text-gray-400 text-xs mt-1">
              Your Personal Learning Companion
            </p>

            <p className="text-violet-400 text-xs mt-1">
              Llama 3.2 · Local AI
            </p>
          </div>

        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={clearChat}
            disabled={loading}
            title="Clear Chat"
            className="text-gray-400 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 size={20} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close assistant"
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          )}

        </div>

      </header>

      {/* Messages */}

      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">

        {messages.map((message, index) => (

          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === "user"
                ? "flex-row-reverse"
                : ""
            }`}
          >

            <div
              className={`p-2 rounded-xl shrink-0 ${
                message.role === "user"
                  ? "bg-violet-600"
                  : "bg-violet-600/20 text-violet-400"
              }`}
            >

              {message.role === "user"
                ? <User size={20} />
                : <Bot size={20} />}

            </div>

            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                message.role === "user"
                  ? "bg-violet-600"
                  : "bg-[#101323] border border-white/10 text-gray-200"
              }`}
            >
              {message.content}
            </div>

          </div>

        ))}

        {/* Suggested questions */}

        {messages.length === 1 && (

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">

            {suggestions.map((suggestion) => {

              const Icon = suggestion.icon;

              return (

                <button
                  key={suggestion.title}
                  onClick={() =>
                    sendMessage(suggestion.prompt)
                  }
                  className="flex items-center gap-3 text-left bg-[#101323] border border-white/10 hover:border-violet-500 rounded-xl p-4"
                >

                  <Icon
                    size={22}
                    className="text-violet-400 shrink-0"
                  />

                  <span className="text-sm">
                    {suggestion.title}
                  </span>

                </button>

              );
            })}

          </div>

        )}

        {loading && (

          <div className="flex items-center gap-3 text-violet-400">

            <LoaderCircle
              size={22}
              className="animate-spin"
            />

            <span className="text-sm">
              CUBIX AI is thinking...
            </span>

          </div>

        )}

        {error && (

          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
            {error}
          </div>

        )}

        <div ref={bottomRef} />

      </div>

      {/* Input */}

      <footer className="bg-[#101323] border-t border-white/10 p-4">

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-3"
        >

          <input
            value={input}
            maxLength={3000}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your studies..."
            className="flex-1 min-w-0 bg-[#080b16] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-violet-500 text-sm"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 p-4 rounded-xl disabled:opacity-50"
          >

            <Send size={20} />

          </button>

        </form>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mt-3">

          <Sparkles size={13} />

          AI can make mistakes. Verify important answers.

        </div>

      </footer>

    </div>
  );
}
