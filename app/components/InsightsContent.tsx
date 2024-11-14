"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const mockData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Coral Growth Rate (mm/year)",
      data: [12, 19, 15, 17, 14, 15],
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.5)",
    },
  ],
};

const mockBarData = {
  labels: ["Site A", "Site B", "Site C", "Site D", "Site E"],
  datasets: [
    {
      label: "Average Coral Coverage (%)",
      data: [65, 45, 78, 52, 63],
      backgroundColor: "rgba(53, 162, 235, 0.5)",
    },
  ],
};

export default function InsightsContent() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("6M");
  const [selectedMetric, setSelectedMetric] = useState("growth");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Coral Growth Insights
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Growth Trends</h2>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border rounded-md px-2 py-1"
              >
                <option value="1M">Last Month</option>
                <option value="3M">Last 3 Months</option>
                <option value="6M">Last 6 Months</option>
                <option value="1Y">Last Year</option>
              </select>
            </div>
            <div className="h-[300px]">
              <Line
                data={mockData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Site Comparison</h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border rounded-md px-2 py-1"
              >
                <option value="growth">Growth Rate</option>
                <option value="coverage">Coverage</option>
                <option value="health">Health Index</option>
              </select>
            </div>
            <div className="h-[300px]">
              <Bar
                data={mockBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Average Growth Rate</div>
              <div className="text-2xl font-bold">15.3 mm/year</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Healthy Colonies</div>
              <div className="text-2xl font-bold">87%</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600">Total Sites</div>
              <div className="text-2xl font-bold">24</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600">Data Points</div>
              <div className="text-2xl font-bold">1,432</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Query Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select className="border rounded-md px-3 py-2">
              <option value="">Select Site</option>
              <option value="site-a">Site A</option>
              <option value="site-b">Site B</option>
              <option value="site-c">Site C</option>
            </select>
            <select className="border rounded-md px-3 py-2">
              <option value="">Select Species</option>
              <option value="acropora">Acropora</option>
              <option value="porites">Porites</option>
              <option value="pocillopora">Pocillopora</option>
            </select>
            <select className="border rounded-md px-3 py-2">
              <option value="">Select Time Period</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Run Query
          </button>
        </div>
      </div>
    </div>
  );
}
