import React from 'react';
import { VisualizationResult } from '../../types';
import ChartRenderer from './ChartRenderer';
import PlotlyRenderer from './PlotlyRenderer';

interface VisualizationContainerProps {
  visualizations: VisualizationResult[];
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({ visualizations }) => {
  if (!visualizations || visualizations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 my-4">
      {visualizations.map((viz) => (
        <div key={viz.id} className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-2 font-medium border-b border-gray-300">
            {viz.type === 'chart' ? 'Chart.js Visualization' : 'Plotly Visualization'}
            {viz.data.data?.datasets?.[0]?.label && <span className="ml-2 text-gray-600">- {viz.data.data.datasets[0].label}</span>}
            {viz.data.layout?.title && <span className="ml-2 text-gray-600">- {viz.data.layout.title}</span>}
          </div>
          <div className="p-2">
            {viz.type === 'chart' ? (
              <ChartRenderer visualization={viz} />
            ) : viz.type === 'plotly' ? (
              <PlotlyRenderer visualization={viz} />
            ) : (
              <div className="p-4 text-red-500">Unknown visualization type: {viz.type}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VisualizationContainer;