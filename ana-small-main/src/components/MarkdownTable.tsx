import React, { useState, useMemo } from 'react';

interface MarkdownTableProps {
  tableContent: string;
}

const ROWS_PER_PAGE = 10;

const MarkdownTable: React.FC<MarkdownTableProps> = ({ tableContent }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Parse the markdown table content
  const parseMarkdownTable = (content: string): { headers: string[], rows: string[][] } => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 3) {
      return { headers: [], rows: [] };
    }
    
    const headerLine = lines[0].trim();
    const headers = headerLine
      .split('|')
      .filter((cell, index, array) => index > 0 && index < array.length - 1 || (index === 0 && cell.trim() !== '') || (index === array.length - 1 && cell.trim() !== ''))
      .map(cell => cell.trim());
    
    const rows = lines.slice(2).map(line => {
      const cells = line.trim()
        .split('|')
        .filter((cell, index, array) => index > 0 && index < array.length - 1 || (index === 0 && cell.trim() !== '') || (index === array.length - 1 && cell.trim() !== ''))
        .map(cell => cell.trim());
      
      while (cells.length < headers.length) {
        cells.push('');
      }
      
      return cells;
    });
    
    return { headers, rows };
  };
  
  const { headers, rows } = parseMarkdownTable(tableContent);
  
  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  
  // Get current page's rows
  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return rows.slice(start, start + ROWS_PER_PAGE);
  }, [rows, currentPage]);
  
  if (headers.length === 0) {
    return (
      <pre className="bg-gray-100 p-2 overflow-x-auto my-2 text-sm">
        {tableContent}
      </pre>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, index) => (
              <th key={index} className="border border-gray-300 px-2 py-1 text-left text-sm">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-1 text-sm">
          <div className="text-gray-600">
            {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-black disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-black disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownTable;