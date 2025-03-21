import React, { useState } from "react";
import axios from "axios";

export default function TextAnalyzer() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert("Please enter some text.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/text-analyzer", {
        text: inputText,
      });
      setResult(response.data.factCheckedText);
    } catch (err) {
      console.error(err);
      setResult("Error occurred while fact-checking.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-gray-800 p-8 rounded-2xl shadow-lg">
        <p className="text-3xl font-bold mb-6 text-center text-white">Text Analyzer</p>

        <textarea
          className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg mb-6 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="6"
          placeholder="Paste your text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        ></textarea>

        <button
          onClick={handleAnalyze}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Submit"}
        </button>

        {result && (
          <div className="mt-8 p-6 bg-gray-700 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-white">Fact-Checked Result:</h2>
            <p className="whitespace-pre-wrap text-gray-300">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
