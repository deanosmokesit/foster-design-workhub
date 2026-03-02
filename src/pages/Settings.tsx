import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Download, 
  Database,
  Monitor,
  CheckCircle,
  AlertCircle,
  Info,
  Package
} from 'lucide-react';

export default function Settings() {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setExportSuccess(false);
    
    try {
      const data = await window.electronAPI.exportData();
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foster-design-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      setError('Failed to export data. Please try again.');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const serviceCategories = [
    'AI',
    'Automation',
    'IT Infrastructure',
    'Microsoft Products',
    'IT Consultancy',
    'Website Design',
    'Software Development',
  ];

  return (
    <div className="max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-500 mt-4 text-lg">Manage your app preferences</p>
      </div>

      <div className="glass-card p-14">
        <div className="flex items-center gap-8 mb-10">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl">
            <Monitor className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="section-title">Business Information</h2>
            <p className="text-lg text-slate-500">Your business details</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex justify-between py-6 border-b border-slate-100">
            <span className="text-lg text-slate-600">Business Name</span>
            <span className="font-semibold text-slate-900">Foster Design</span>
          </div>
          <div className="flex justify-between py-6 border-b border-slate-100">
            <span className="text-lg text-slate-600">App Name</span>
            <span className="font-semibold text-slate-900">DevHub</span>
          </div>
          <div className="flex justify-between py-6">
            <span className="text-lg text-slate-600">Version</span>
            <span className="font-semibold text-slate-900">1.0.0</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-14">
        <div className="flex items-center gap-8 mb-10">
          <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-3xl">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="section-title">Service Categories</h2>
            <p className="text-lg text-slate-500">Categories for your services</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-5">
          {serviceCategories.map((category) => (
            <span 
              key={category}
              className="px-6 py-3 bg-slate-100/70 text-slate-700 rounded-2xl text-lg font-medium"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-card p-14">
        <div className="flex items-center gap-8 mb-10">
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-3xl">
            <Database className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="section-title">Data Management</h2>
            <p className="text-lg text-slate-500">Export and backup your data</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-4 p-6 mb-8 bg-red-50 text-red-700 rounded-3xl">
            <AlertCircle className="w-6 h-6" />
            <span className="text-lg">{error}</span>
          </div>
        )}

        {exportSuccess && (
          <div className="flex items-center gap-4 p-6 mb-8 bg-emerald-50 text-emerald-700 rounded-3xl">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg">Data exported successfully!</span>
          </div>
        )}

        <div className="border-t border-slate-100 pt-8">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-primary"
          >
            <Download className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Export All Data'}
          </button>
          <p className="mt-5 text-base text-slate-400">
            Downloads all your clients, projects, tasks, and activity history as a JSON file.
          </p>
        </div>
      </div>

      <div className="glass-card p-14">
        <div className="flex items-center gap-8 mb-8">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl">
            <Info className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="section-title">About DevHub</h2>
          </div>
        </div>
        <p className="text-lg text-slate-600 leading-relaxed">
          DevHub is a custom-built work management application designed specifically for IT service businesses. 
          It helps you manage clients, projects, and tasks efficiently - all in one place.
        </p>
        <p className="text-lg text-slate-600 leading-relaxed mt-6">
          Built for IT professionals handling AI, Automation, IT Infrastructure, Microsoft Products, 
          IT Consultancy, Website Design, and Software Development services.
        </p>
        <div className="mt-10 pt-10 border-t border-slate-100">
          <p className="text-base text-slate-400">
            © 2026 DevHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
