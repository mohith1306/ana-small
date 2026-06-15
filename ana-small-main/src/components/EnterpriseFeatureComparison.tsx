import React from 'react';
import { 
  Target, 
  Repeat, 
  Bot, 
  Database, 
  Search, 
  FileSpreadsheet, 
  LayoutDashboard, 
  ShieldCheck, 
  Plus, 
  Plug,
  X,
  Check,
  KeyRound,
  Home
} from 'lucide-react';

import {
  redshiftLogo,
  snowflakeLogo,
  bigqueryLogo,
} from '../constants/logo';

interface Feature {
  name: string;
  icon: React.ReactNode;
  smallSupport: React.ReactNode;
  enterpriseSupport: React.ReactNode;
  description?: string;
}

const features: Feature[] = [
  // DO NOT DELETE THIS FEATURE
  /*{
    name: 'Accuracy',
    icon: <Target className="w-4 h-4" />,
    smallSupport: <span className="text-yellow-600 font-medium">82%</span>,
    enterpriseSupport: <span className="text-green-600 font-medium">93%</span>,
    description: 'Evaluated on the Conglomerate 100-Table Benchmark'
  },*/
  {
    name: 'Consistency via Ontology',
    icon: <Repeat className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Ensure true and repeatable results over many runs'
  },
  {
    name: 'Automated Agents',
    icon: <Bot className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Schedule and trigger analysis and reporting'
  },
  {
    name: 'Data Warehouses',
    icon: <Database className="w-4 h-4" />,
    smallSupport: (
      <div className="flex items-center">
        <img 
          src={redshiftLogo}
          alt="Redshift" 
          className="w-5 h-5"
        />
      </div>
    ),
    enterpriseSupport: (
      <div className="flex items-center gap-2">
        <img 
          src={redshiftLogo}
          alt="Redshift" 
          className="w-5 h-5"
        />
        <img 
          src={snowflakeLogo}
          alt="Snowflake" 
          className="w-5 h-5"
        />
        <img 
          src={bigqueryLogo}
          alt="BigQuery" 
          className="w-5 h-5"
        />
        <Plus className="w-4 h-4 text-gray-400" />
      </div>
    ),
    description: 'Link your data securely and quickly'
  },
  {
    name: 'Web Search',
    icon: <Search className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Turbo-charge your analytics with web data'
  },
  {
    name: 'File Upload',
    icon: <FileSpreadsheet className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Upload and analyze CSV, XLSX, PDF, and more file types'
  },
  {
    name: 'Tableau Dashboard Discovery',
    icon: <LayoutDashboard className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Analyze and explore Tableau dashboards'
  },
  {
    name: 'SOC2 and HIPAA Compliant',
    icon: <ShieldCheck className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Ensure enterprise-grade security and compliance'
  },
  {
    name: 'SSO',
    icon: <KeyRound className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Employ effortless session management'
  },
  {
    name: 'On Prem',
    icon: <Home className="w-4 h-4" />,
    smallSupport: <X className="w-4 h-4 text-red-500" />,
    enterpriseSupport: <Check className="w-4 h-4 text-green-500" />,
    description: 'Enjoy single-tenant deployment'
  }
];

const EnterpriseFeatureComparison: React.FC = () => {
  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="py-3 px-6 text-left font-normal text-gray-500"></th>
            <th className="py-3 px-6 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Ana</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-sm font-medium rounded">Small</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">Free</div>
            </th>
            <th className="py-3 px-6 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Ana</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-sm font-medium rounded">Enterprise</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">Book a demo</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="py-2 px-6">
                <div className="flex items-center gap-3">
                  {feature.icon}
                  <div>
                    <div className="font-medium text-sm">{feature.name}</div>
                    {feature.description && (
                      <div className="text-xs text-gray-500">{feature.description}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-2 px-6">{feature.smallSupport}</td>
              <td className="py-2 px-6">{feature.enterpriseSupport}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnterpriseFeatureComparison;