import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { VisualizationResult } from '../../types';

// Register Chart.js components
Chart.register(...registerables);

interface ChartRendererProps {
  visualization: VisualizationResult;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ visualization }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      try {
        chartInstance.current = new Chart(ctx, {
          type: visualization.data.type || 'bar',
          data: visualization.data.data || {},
          options: visualization.options || visualization.data.options || {}
        });
      } catch (error) {
        console.error('Error creating chart:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [visualization]);

  return (
    <div className="w-full h-full min-h-[300px] p-2">
      <canvas ref={chartRef} />
    </div>
  );
};

export default ChartRenderer;