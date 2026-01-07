"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

// Types matching backend
export type CommunicationStyle = "casual" | "formal" | "playful" | "professional";
export type ResponseLength = "concise" | "balanced" | "detailed" | "comprehensive";

export interface UserInstructions {
  custom_instructions?: string;
  communication_style?: CommunicationStyle;
  response_length?: ResponseLength;
  topics_to_avoid: string[];
  topics_to_focus: string[];
  language_preference: string;
  use_emojis: boolean;
  be_proactive: boolean;
  remember_context: boolean;
}

interface InstructionsEditorProps {
  companionId: string;
  companionName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (instructions: UserInstructions) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const COMMUNICATION_STYLES: { value: CommunicationStyle; label: string; description: string }[] = [
  { value: "casual", label: "Casual", description: "Friendly and relaxed tone" },
  { value: "formal", label: "Formal", description: "Polite and professional" },
  { value: "playful", label: "Playful", description: "Fun and energetic" },
  { value: "professional", label: "Professional", description: "Clear and business-like" },
];

const RESPONSE_LENGTHS: { value: ResponseLength; label: string; description: string }[] = [
  { value: "concise", label: "Concise", description: "Brief, 1-2 sentences" },
  { value: "balanced", label: "Balanced", description: "Moderate length" },
  { value: "detailed", label: "Detailed", description: "Thorough explanations" },
  { value: "comprehensive", label: "Comprehensive", description: "In-depth coverage" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

export default function InstructionsEditor({
  companionId,
  companionName,
  isOpen,
  onClose,
  onSave,
}: InstructionsEditorProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"freeform" | "structured">("freeform");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [customInstructions, setCustomInstructions] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState<CommunicationStyle>("casual");
  const [responseLength, setResponseLength] = useState<ResponseLength>("balanced");
  const [topicsToAvoid, setTopicsToAvoid] = useState<string[]>([]);
  const [topicsToFocus, setTopicsToFocus] = useState<string[]>([]);
  const [languagePreference, setLanguagePreference] = useState("en");
  const [useEmojis, setUseEmojis] = useState(true);
  const [beProactive, setBeProactive] = useState(false);
  const [rememberContext, setRememberContext] = useState(true);

  // Tag input states
  const [avoidInput, setAvoidInput] = useState("");
  const [focusInput, setFocusInput] = useState("");

  // Load existing instructions
  useEffect(() => {
    if (isOpen && address && companionId) {
      loadInstructions();
    }
  }, [isOpen, address, companionId]);

  const loadInstructions = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/companions/${companionId}/instructions?user_address=${address.toLowerCase()}`
      );

      if (response.ok) {
        const data: UserInstructions = await response.json();
        setCustomInstructions(data.custom_instructions || "");
        setCommunicationStyle(data.communication_style || "casual");
        setResponseLength(data.response_length || "balanced");
        setTopicsToAvoid(data.topics_to_avoid || []);
        setTopicsToFocus(data.topics_to_focus || []);
        setLanguagePreference(data.language_preference || "en");
        setUseEmojis(data.use_emojis ?? true);
        setBeProactive(data.be_proactive ?? false);
        setRememberContext(data.remember_context ?? true);
      }
    } catch (err) {
      console.error("Failed to load instructions:", err);
      // Not an error if instructions don't exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!address) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const instructions: UserInstructions = {
      custom_instructions: customInstructions || undefined,
      communication_style: communicationStyle,
      response_length: responseLength,
      topics_to_avoid: topicsToAvoid,
      topics_to_focus: topicsToFocus,
      language_preference: languagePreference,
      use_emojis: useEmojis,
      be_proactive: beProactive,
      remember_context: rememberContext,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/companions/${companionId}/instructions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_address: address.toLowerCase(),
            ...instructions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save instructions");
      }

      setSuccess(true);
      onSave?.(instructions);

      // Close after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const addTopic = (type: "avoid" | "focus") => {
    const input = type === "avoid" ? avoidInput : focusInput;
    const setTopics = type === "avoid" ? setTopicsToAvoid : setTopicsToFocus;
    const topics = type === "avoid" ? topicsToAvoid : topicsToFocus;
    const setInput = type === "avoid" ? setAvoidInput : setFocusInput;

    const trimmed = input.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setInput("");
    }
  };

  const removeTopic = (type: "avoid" | "focus", topic: string) => {
    const setTopics = type === "avoid" ? setTopicsToAvoid : setTopicsToFocus;
    const topics = type === "avoid" ? topicsToAvoid : topicsToFocus;
    setTopics(topics.filter((t) => t !== topic));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Customize {companionName}</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Set your preferences for how this companion responds to you
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("freeform")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "freeform"
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Free-form Instructions
            </button>
            <button
              onClick={() => setActiveTab("structured")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "structured"
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Behavior Rules
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              {/* Free-form Tab */}
              {activeTab === "freeform" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Custom Instructions
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Tell your companion how you'd like them to behave. For example: 'Always greet me warmly', 'Explain things like I'm a beginner', 'Use analogies when explaining complex topics'..."
                      className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Write anything you want. These instructions will be included in every conversation.
                    </p>
                  </div>
                </div>
              )}

              {/* Structured Tab */}
              {activeTab === "structured" && (
                <div className="space-y-6">
                  {/* Communication Style */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Communication Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COMMUNICATION_STYLES.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setCommunicationStyle(style.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            communicationStyle === style.value
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                          }`}
                        >
                          <div className="font-medium text-white">{style.label}</div>
                          <div className="text-xs text-zinc-400">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Response Length */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Response Length
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {RESPONSE_LENGTHS.map((length) => (
                        <button
                          key={length.value}
                          onClick={() => setResponseLength(length.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            responseLength === length.value
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                          }`}
                        >
                          <div className="font-medium text-white">{length.label}</div>
                          <div className="text-xs text-zinc-400">{length.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topics to Avoid */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Topics to Avoid
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={avoidInput}
                        onChange={(e) => setAvoidInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic("avoid"))}
                        placeholder="Add a topic..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => addTopic("avoid")}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topicsToAvoid.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm text-red-400"
                        >
                          {topic}
                          <button
                            onClick={() => removeTopic("avoid", topic)}
                            className="hover:text-red-300"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Topics to Focus On */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Topics to Focus On
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={focusInput}
                        onChange={(e) => setFocusInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic("focus"))}
                        placeholder="Add a topic..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => addTopic("focus")}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topicsToFocus.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400"
                        >
                          {topic}
                          <button
                            onClick={() => removeTopic("focus", topic)}
                            className="hover:text-green-300"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Preferred Language
                    </label>
                    <select
                      value={languagePreference}
                      onChange={(e) => setLanguagePreference(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-750">
                      <div>
                        <div className="font-medium text-white">Use Emojis</div>
                        <div className="text-xs text-zinc-400">Allow emojis in responses</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={useEmojis}
                        onChange={(e) => setUseEmojis(e.target.checked)}
                        className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-zinc-900"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-750">
                      <div>
                        <div className="font-medium text-white">Be Proactive</div>
                        <div className="text-xs text-zinc-400">Suggest next steps and ask follow-ups</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={beProactive}
                        onChange={(e) => setBeProactive(e.target.checked)}
                        className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-zinc-900"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-750">
                      <div>
                        <div className="font-medium text-white">Remember Context</div>
                        <div className="text-xs text-zinc-400">Use conversation history for better responses</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={rememberContext}
                        onChange={(e) => setRememberContext(e.target.checked)}
                        className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-zinc-900"
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
              Instructions saved successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isConnected || isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
