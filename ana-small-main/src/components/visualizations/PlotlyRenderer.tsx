import React from 'react';
import Plot from 'react-plotly.js';
import { VisualizationResult } from '../../types';

interface PlotlyRendererProps {
  visualization: VisualizationResult;
}

const PlotlyRenderer: React.FC<PlotlyRendererProps> = ({ visualization }) => {
  // Extract data and layout from the visualization
  const data = visualization.data.data || [];
  const layout = visualization.data.layout || { autosize: true };

  return (
    <div className="w-full h-full min-h-[400px]">
      <Plot
        data={data}
        layout={layout}
        config={{ responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default PlotlyRenderer;