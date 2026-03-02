import { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Mail,
  Phone,
  Globe,
  Building2,
  User,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import type { Client } from '../types';

const SERVICE_CATEGORIES = [
  'AI',
  'Automation',
  'IT Infrastructure',
  'Microsoft Products',
  'IT Consultancy',
  'Website Design',
  'Software Development',
];

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Active: { bg: 'bg-emerald-100/70', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Inactive: { bg: 'bg-slate-100/70', text: 'text-slate-600', dot: 'bg-slate-400' },
  Prospect: { bg: 'bg-blue-100/70', text: 'text-blue-700', dot: 'bg-blue-500' },
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState<{
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    industry: string;
    status: string;
    service_categories: string;
    notes: string;
  }>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    status: 'Active',
    service_categories: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await window.electronAPI.getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clientData = {
        ...formData,
        status: formData.status as 'Active' | 'Inactive' | 'Prospect'
      };
      if (editingClient) {
        await window.electronAPI.updateClient({ ...clientData, id: editingClient.id });
      } else {
        await window.electronAPI.createClient(clientData);
      }
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Failed to save client:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.deleteClient(id);
      setShowDeleteConfirm(null);
      loadClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name,
      contact_name: client.contact_name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      website: client.website || '',
      industry: client.industry || '',
      status: client.status,
      service_categories: client.service_categories || '',
      notes: client.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      industry: '',
      status: 'Active',
      service_categories: '',
      notes: '',
    });
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="relative">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        <div>
          <h1 className="page-title">Organisations</h1>
          <p className="text-slate-500 mt-4 text-lg">Manage your client relationships</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingClient(null);
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Organisation
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search organisations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-14"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto min-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Prospect">Prospect</option>
        </select>
      </div>

      {filteredClients.length > 0 ? (
        <div className="grid gap-8">
          {filteredClients.map((client) => {
            const statusStyle = STATUS_STYLES[client.status] || { bg: 'bg-slate-100/70', text: 'text-slate-600', dot: 'bg-slate-400' };
            const initials = client.company_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            
            return (
              <div
                key={client.id}
                className="glass-card p-10 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-3xl flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg group-hover:scale-105 transition-transform">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-slate-900">{client.company_name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot}`} />
                          <span className={`badge ${statusStyle.bg} ${statusStyle.text}`}>
                            {client.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-base text-slate-500">
                        <User className="w-5 h-5" />
                        {client.contact_name}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4 text-base text-slate-500">
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            {client.phone}
                          </div>
                        )}
                        {client.website && (
                          <a 
                            href={client.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                          >
                            <Globe className="w-5 h-5" />
                            {client.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {client.service_categories && (
                        <div className="flex flex-wrap gap-3 mt-5">
                          {JSON.parse(client.service_categories || '[]').map((cat: string) => (
                            <span key={cat} className="px-4 py-2 bg-slate-100/60 text-slate-600 rounded-xl text-base font-medium">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-4 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-2xl transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(client.id!)}
                      className="p-4 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-2xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {client.notes && (
                  <p className="mt-6 pt-6 border-t border-slate-100/50 text-base text-slate-500 line-clamp-2">
                    {client.notes}
                  </p>
                )}
                <p className="mt-5 text-sm text-slate-400">
                  Added {format(new Date(client.created_at || ''), 'MMM d, yyyy')}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-xl text-slate-500">No organisations found</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-6 text-blue-500 hover:text-blue-600 text-lg font-medium"
          >
            Add your first organisation
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-6">
          <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <h2 className="text-2xl font-semibold text-slate-900">
                {editingClient ? 'Edit Organisation' : 'Add New Organisation'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingClient(null);
                  resetForm();
                }}
                className="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Organisation Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-slate-600 mb-3">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Prospect">Prospect</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-slate-600 mb-3">
                  Service Categories
                </label>
                <div className="flex flex-wrap gap-4">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(JSON.parse(formData.service_categories || '[]') as string[]).includes(cat)}
                        onChange={(e) => {
                          const current = JSON.parse(formData.service_categories || '[]') as string[];
                          const updated = e.target.checked
                            ? [...current, cat]
                            : current.filter((c) => c !== cat);
                          setFormData({ ...formData, service_categories: JSON.stringify(updated) });
                        }}
                        className="w-5 h-5 text-blue-500 rounded border-slate-300 focus:ring-blue-500/30"
                      />
                      <span className="text-base text-slate-600">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-slate-600 mb-3">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="input resize-none"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingClient ? 'Save Changes' : 'Add Organisation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-6">
          <div className="modal-content p-10 w-full max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Delete Organisation</h3>
            <p className="text-base text-slate-500 mb-8">
              Are you sure you want to delete this organisation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="btn text-white bg-red-500 hover:bg-red-600"
              >
                Delete
              </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
