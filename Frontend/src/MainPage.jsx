import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import VideoAnalyzer from "./VideoAnalyzer";
import TextAnalyzer from "./TextAnalyzer";

const sampleData = [
  { name: "Category A", value: 40 },
  { name: "Category B", value: 30 },
  { name: "Category C", value: 20 },
  { name: "Category D", value: 10 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function Dashboard() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (event, type) => {
    const files = Array.from(event.target.files).map(file => ({ file, type }));
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  return (
    <div className="min-w-screen bg-gray-900 text-white p-12 flex gap-6">
      {/* Left Section - Upload Space */}
      <div className="w-1/3 bg-gray-800 shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">Upload Content</h2>
        <div className="grid grid-cols-1 gap-4">
          {/* {[ 
            { label: "Video", color: "bg-blue-600", hover: "hover:bg-blue-900 hover:text-black", type: "video" },
            { label: "Live Video", color: "bg-green-600", hover: "hover:bg-green-900 hover:text-black", type: "live-video" },
            { label: "Audio", color: "bg-yellow-600", hover: "hover:bg-yellow-900 hover:text-black", type: "audio" },
            { label: "Text", color: "bg-purple-600", hover: "hover:bg-purple-900 hover:text-black", type: "text" },
          ].map(({ label, color, hover, type }) => (
            <label key={type} className={`${color} ${hover} text-white p-3 rounded-lg w-full text-center cursor-pointer transition duration-300`}> 
              {label}
              <input 
                type="file" 
                className="hidden" 
                onChange={(event) => handleFileUpload(event, type)} 
              />
            </label>
          ))} */}

          <VideoAnalyzer />
          <TextAnalyzer />
        </div>
      </div>

      {/* Right Section - Analysis */}
      <div className="w-2/3 flex flex-col gap-6">
        {/* Top Right - Pie Charts */}
        <div className="bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Analysis</h2>
          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="w-full h-40 bg-gray-700 flex items-center justify-center rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sampleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} fill="#8884d8" label>
                      {sampleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom Right - Empty Section */}
        <div className="bg-gray-800 shadow-lg rounded-xl p-6 h-40"></div>
      </div>
    </div>
  );
}