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

const STATUS_STYLES: Record<string, string> = {
  Active: 'badge-success',
  Inactive: 'badge-default',
  Prospect: 'badge-info',
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
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Organisations</h1>
            <p className="page-subtitle">Manage your client relationships</p>
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

        <div className="filter-bar">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search organisations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Prospect">Prospect</option>
          </select>
        </div>

        {filteredClients.length > 0 ? (
          <div className="content-section">
            {filteredClients.map((client) => {
              const badgeClass = STATUS_STYLES[client.status] || 'badge-default';
              const initials = client.company_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              
              return (
                <div key={client.id} className="list-item-card">
                  <div className="list-item-avatar">
                    {initials}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-header">
                      <span className="list-item-title">{client.company_name}</span>
                      <span className={`badge ${badgeClass}`}>
                        {client.status}
                      </span>
                    </div>
                    <div className="list-item-meta">
                      <div className="list-item-meta-row">
                        <User className="w-4 h-4" />
                        {client.contact_name}
                      </div>
                      <div className="list-item-meta-row">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="list-item-meta-row">
                          <Phone className="w-4 h-4" />
                          {client.phone}
                        </div>
                      )}
                      {client.website && (
                        <div className="list-item-meta-row">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={client.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                          >
                            {client.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                    {client.service_categories && (
                      <div className="list-item-tags">
                        {JSON.parse(client.service_categories || '[]').map((cat: string) => (
                          <span key={cat} className="tag">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="list-item-actions">
                    <button
                      onClick={() => openEditModal(client)}
                      className="icon-button"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(client.id!)}
                      className="icon-button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <p className="empty-state-title">No organisations found</p>
            <p className="empty-state-description">Add your first organisation to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn btn-primary mt-6"
            >
              <Plus className="w-5 h-5" />
              Add Organisation
            </button>
          </div>
        )}
      </div>

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
        )}
      </>
    );
  }
}
