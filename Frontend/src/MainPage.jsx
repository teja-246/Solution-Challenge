import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import VideoAnalyzer from "./VideoAnalyzer";
import TextAnalyzer from "./TextAnalyzer";

const COLORS = ["#00C49F", "#FF4444"]; // Green for Correct, Red for Incorrect

export default function Dashboard() {
  const [factCheckData, setFactCheckData] = useState({ correct: 0, incorrect: 0 });

  // Function to update fact-check results
  const handleFactCheckResults = (correct, incorrect) => {
    setFactCheckData({ correct, incorrect });
  };

  // Data for Pie Chart
  const pieData = [
    { name: "Correct", value: factCheckData.correct },
    { name: "Incorrect", value: factCheckData.incorrect },
  ];

  return (
    <div className="min-w-screen bg-gray-900 text-white p-12 flex gap-6">
      {/* Left Section - Video & Text Analysis */}
      <div className="w-1/3 bg-gray-800 shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Upload Content</h2>
        <VideoAnalyzer onFactCheck={handleFactCheckResults} />
        <TextAnalyzer onFactCheck={handleFactCheckResults} />
      </div>

      {/* Right Section - Pie Chart Analysis */}
      <div className="w-2/3 flex flex-col gap-6">
        <div className="bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Fact-Check Analysis</h2>

          {/* Pie Chart */}
          <div className="w-full h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
