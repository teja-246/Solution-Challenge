import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; 
import rehypeRaw from "rehype-raw"; 

const VideoAnalyzer = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [transcription, setTranscription] = useState("");
  const [factCheckedText, setFactCheckedText] = useState("");
  const [loading, setLoading] = useState(false);


  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return match ? match[1] : null;
  };

  const fetchTranscription = async () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      alert("Invalid YouTube URL!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/transcribe?videoId=${videoId}`);
      setTranscription(response.data.text);
    } catch (error) {
      console.error("Error fetching transcription:", error);
      alert("Failed to fetch transcription");
    }
    setLoading(false);
  };

  const factCheckText = async () => {
    if (!transcription) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/fact-check",
        { text: transcription },
        { headers: { "Content-Type": "application/json" } }
      );
      setFactCheckedText(response.data.factCheckedText);
    } catch (error) {
      console.error("Error in fact-checking:", error);
      alert("Fact-checking failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-8xl p-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">🔍 YouTube Fake News Detector</h2>

        {/* Input Section */}
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Paste YouTube video link here..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={fetchTranscription}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-600"
          >
            {loading ? "Fetching..." : "Get Transcription"}
          </button>
        </div>

        {transcription && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow">
            <h3 className="text-lg font-semibold">🎙 Transcription:</h3>
            <p className="mt-2 p-2 bg-gray-800 rounded-lg overflow-auto text-sm border-2 border-white">{transcription}</p>
            <button
              onClick={factCheckText}
              disabled={loading}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-600"
            >
              {loading ? "Checking..." : "Check for Fake Content"}
            </button>
          </div>
        )}

        {factCheckedText && (
  <div className="bg-gray-800 p-4 rounded-md mt-4 border border-white shadow-lg">
    <h3 className="text-lg font-semibold text-white mb-2">✅ Fact-Checked Content:</h3>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        strong: ({ children }) => <span className="text-red-400 font-bold">{children}</span>,
        em: ({ children }) => <span className="text-green-400 italic">{children}</span>,
        ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
      }}
    >
      {factCheckedText}
    </ReactMarkdown>
  </div>
)}
      </div>
    </div>
  );
};

export default VideoAnalyzer;
