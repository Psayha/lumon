import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Bot, 
  Check, 
  X,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  system_prompt: string;
  temperature: number;
  is_active: boolean;
  is_default: boolean;
  is_public: boolean;
  quick_commands: { label: string; prompt: string; icon: string }[];
  created_at: string;
}

export function AgentsTab() {
  const [agents, setAgents] = useState<Agent[]>([]);
  // const [isLoading, setIsLoading] = useState(true); // Unused
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  // const [showApiKeyModal, setShowApiKeyModal] = useState(false); // Unused

  // Form state
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    description: '',
    model: 'gpt-4-turbo-preview',
    system_prompt: '',
    temperature: 0.7,
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/agents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      } else {
        toast.error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Error fetching agents');
    } finally {
      // setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    
    try {
      const url = selectedAgent 
        ? `/api/admin/agents/${selectedAgent.id}`
        : '/api/admin/agents';
        
      const method = selectedAgent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(selectedAgent ? 'Agent updated' : 'Agent created');
        setIsEditing(false);
        setSelectedAgent(null);
        fetchAgents();
      } else {
        toast.error('Failed to save agent');
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('Error saving agent');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/agents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Agent deleted');
        fetchAgents();
      } else {
        toast.error('Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Error deleting agent');
    }
  };

  const startEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData(agent);
    setIsEditing(true);
  };

  const startCreate = () => {
    setSelectedAgent(null);
    setFormData({
      name: '',
      description: '',
      model: 'gpt-4-turbo-preview',
      system_prompt: 'You are a helpful AI assistant.',
      temperature: 0.7,
      is_active: true,
      is_default: false,
      is_public: true,
      quick_commands: [],
    });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedAgent ? 'Edit Agent' : 'Create New Agent'}
          </h2>
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Support Bot"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Model
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              >
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                placeholder="Brief description of the agent's purpose"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                System Prompt
              </label>
              <textarea
                required
                rows={10}
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                placeholder="You are a helpful assistant..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Temperature ({formData.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Precise (0.0)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                />
                <label htmlFor="is_default" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Agent (Used for new chats)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visible on Assistant Page
                </label>
              </div>
            </div>

            {/* Knowledge Base Section */}
            <div className="col-span-2 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Knowledge Base</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select documents this agent can access.</p>
                {/* TODO: Implement Multi-select for Knowledge Bases */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 italic">Knowledge Base linking coming soon...</p>
                </div>
            </div>

            {/* Quick Commands Section */}
            <div className="col-span-2 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Commands</h3>
                <div className="space-y-3">
                    {formData.quick_commands?.map((cmd, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                            <input
                                type="text"
                                placeholder="Label"
                                value={cmd.label}
                                onChange={(e) => {
                                    const newCmds = [...(formData.quick_commands || [])];
                                    newCmds[idx].label = e.target.value;
                                    setFormData({ ...formData, quick_commands: newCmds });
                                }}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Prompt"
                                value={cmd.prompt}
                                onChange={(e) => {
                                    const newCmds = [...(formData.quick_commands || [])];
                                    newCmds[idx].prompt = e.target.value;
                                    setFormData({ ...formData, quick_commands: newCmds });
                                }}
                                className="flex-[2] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const newCmds = formData.quick_commands?.filter((_, i) => i !== idx);
                                    setFormData({ ...formData, quick_commands: newCmds });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFormData({
                            ...formData,
                            quick_commands: [...(formData.quick_commands || []), { label: '', prompt: '', icon: 'Zap' }]
                        })}
                        className="flex items-center text-sm text-violet-600 hover:text-violet-700"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Command
                    </button>
                </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Agent
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage AI agents and their personalities</p>
        </div>
        <div className="flex space-x-3">
            <button
                onClick={() => toast.info('API Key management coming soon')}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <Key className="w-4 h-4 mr-2" />
                API Keys
            </button>
            <button
                onClick={startCreate}
                className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
              agent.is_default 
                ? 'border-violet-500 shadow-lg shadow-violet-500/10' 
                : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${agent.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{agent.model}</p>
                  </div>
                </div>
                {agent.is_default && (
                  <span className="px-2 py-1 text-xs font-medium bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-full">
                    Default
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {agent.description || 'No description provided'}
              </p>

              <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(agent)}
                    className="p-2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                    Temp: {agent.temperature}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
