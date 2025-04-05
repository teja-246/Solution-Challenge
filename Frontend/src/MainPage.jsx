import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import VideoAnalyzer from "./VideoAnalyzer";
import TextAnalyzer from "./TextAnalyzer";

const COLORS = ["#10b981", "#ef4444"]; // Green for Correct, Red for Incorrect

export default function Dashboard() {
  const [factCheckData, setFactCheckData] = useState({ correct: 12, incorrect: 5 });
  const [activeTab, setActiveTab] = useState("video");
  const [analysisResults, setAnalysisResults] = useState([
    {
      statement: "The Eiffel Tower is located in Paris, France.",
      isCorrect: true
    },
    {
      statement: "The Great Wall of China is visible from space with the naked eye.",
      isCorrect: false,
      correction: "The Great Wall of China is generally not visible from space with the naked eye."
    },
    {
      statement: "Water boils at 100 degrees Celsius at sea level.",
      isCorrect: true
    }
  ]);

  // Function to update fact-check results
  const handleFactCheckResults = (correct, incorrect, results = []) => {
    setFactCheckData({ correct, incorrect });
    setAnalysisResults(results);
  };

  // Data for Pie Chart
  const pieData = [
    { name: "Correct", value: factCheckData.correct },
    { name: "Incorrect", value: factCheckData.incorrect },
  ];

  // Calculate total and accuracy percentage
  const total = factCheckData.correct + factCheckData.incorrect;
  const accuracyPercentage = total > 0 
    ? Math.round((factCheckData.correct / total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Fact-Check Dashboard</h1>
          <p className="text-slate-400">Analyze and verify factual accuracy in your content</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Section - Content Input and Stats */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            {/* Upload Content */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700/50">
              <div className="p-5 border-b border-slate-700/50 bg-slate-700/30">
                <h2 className="text-xl font-semibold">Content Analysis</h2>
              </div>
              
              {/* Tabs */}
              <div className="flex">
                <button 
                  className={`flex-1 py-3.5 ${activeTab === "video" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700/50"} transition-all duration-200`}
                  onClick={() => setActiveTab("video")}
                >
                  Video Analysis
                </button>
                <button 
                  className={`flex-1 py-3.5 ${activeTab === "text" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700/50"} transition-all duration-200`}
                  onClick={() => setActiveTab("text")}
                >
                  Text Analysis
                </button>
              </div>
              
              {/* Content Area */}
              <div className="p-6">
                {activeTab === "video" ? (
                  <VideoAnalyzer onFactCheck={handleFactCheckResults} />
                ) : (
                  <TextAnalyzer onFactCheck={handleFactCheckResults} />
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700/50 p-6">
              <h3 className="text-lg font-medium text-slate-300 mb-4">Stats Overview</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Total Facts Card */}
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                  <p className="text-sm text-slate-400">Total Facts</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                
                {/* Accuracy Card */}
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                  <p className="text-sm text-slate-400">Accuracy</p>
                  <div className="flex items-end gap-1">
                    <p className="text-2xl font-bold">{accuracyPercentage}%</p>
                  </div>
                </div>
                
                {/* Correct Facts Card */}
                <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-700/10 rounded-lg p-4 border border-emerald-800/30">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-emerald-400">Correct</p>
                    <span className="text-emerald-500 font-bold text-lg">✓</span>
                  </div>
                  <p className="text-2xl font-bold">{factCheckData.correct}</p>
                </div>
                
                {/* Incorrect Facts Card */}
                <div className="bg-gradient-to-br from-red-900/20 to-red-700/10 rounded-lg p-4 border border-red-800/30">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-red-400">Incorrect</p>
                    <span className="text-red-500 font-bold text-lg">✗</span>
                  </div>
                  <p className="text-2xl font-bold">{factCheckData.incorrect}</p>
                </div>
              </div>
              
              {/* Pie Chart */}
              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} facts`, null]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Right Section - Analysis Results */}
          <div className="w-full lg:w-2/3">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700/50 h-full">
              <div className="p-5 border-b border-slate-700/50 bg-slate-700/30 flex justify-between items-center">
                <h3 className="text-xl font-semibold">Fact-Check Results</h3>
                <div className="bg-blue-600/20 text-blue-400 text-sm py-1 px-3 rounded-full border border-blue-500/30">
                  {total} facts analyzed
                </div>
              </div>
              
              <div className="p-6">
                {analysisResults.length > 0 ? (
                  <div className="space-y-4">
                    {analysisResults.map((result, index) => (
                      <div 
                        key={index} 
                        className={`p-5 rounded-lg border shadow-sm ${
                          result.isCorrect 
                            ? "bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border-emerald-700/30" 
                            : "bg-gradient-to-r from-red-900/20 to-red-800/10 border-red-700/30"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`h-6 w-6 rounded-full flex items-center justify-center ${
                              result.isCorrect 
                                ? "bg-emerald-500 text-white" 
                                : "bg-red-500 text-white"
                            }`}>
                              {result.isCorrect ? "✓" : "✗"}
                            </span>
                            <span className="font-medium text-lg">Fact #{index + 1}</span>
                          </div>
                          <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                            result.isCorrect 
                              ? "bg-emerald-900/20 text-emerald-400 border border-emerald-700/30" 
                              : "bg-red-900/20 text-red-400 border border-red-700/30"
                          }`}>
                            {result.isCorrect ? "Verified" : "Inaccurate"}
                          </span>
                        </div>
                        
                        <div className="mt-3 pl-8">
                          <p className="text-slate-200 text-lg">{result.statement}</p>
                          {!result.isCorrect && result.correction && (
                            <div className="mt-3 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                              <p className="text-amber-400 text-sm mb-1">Correction:</p>
                              <p className="text-white">{result.correction}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <div className="h-20 w-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                      <span className="text-3xl">📊</span>
                    </div>
                    <p className="text-lg">No results to display yet</p>
                    <p className="text-sm mt-2 text-slate-500">Upload content to see fact-check results here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}