import React, { useState, useEffect } from 'react';
import { X, User, Mail, Briefcase, Trash2 } from 'lucide-react';
import type { Employee } from '../types';

interface AddEditInternModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; role: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialEmployee?: Employee | null;
}

export const AddEditInternModal: React.FC<AddEditInternModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEmployee
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Frontend Intern');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialEmployee);

  useEffect(() => {
    if (initialEmployee) {
      setName(initialEmployee.name);
      setEmail(initialEmployee.email);
      setRole(initialEmployee.role);
    } else {
      setName('');
      setEmail('');
      setRole('Frontend Intern');
    }
    setError(null);
  }, [initialEmployee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the intern full name');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid Gmail address');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        email: cleanEmail,
        role: role.trim() || 'Intern'
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save intern';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialEmployee || !onDelete) return;
    if (!confirm(`Are you sure you want to remove ${initialEmployee.name} from the monitored intern roster?`)) {
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await onDelete(initialEmployee.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove intern';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-black/80 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-white m-0">
              {isEditing ? 'Update Intern & Gmail' : 'Add New Intern'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditing
                ? 'Modify intern name, role, or active submission Gmail address'
                : 'Register a new intern to monitor their daily task update emails'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="intern-name" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Intern Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="intern-name"
                name="internName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Ananya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Gmail Address */}
          <div>
            <label htmlFor="intern-email" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Gmail Address (Sending Updates From) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="intern-email"
                name="internEmail"
                type="email"
                autoComplete="email"
                placeholder="e.g. ananya.intern@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                required
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              The system will search for emails received from this Gmail address.
            </p>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="intern-role" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Role / Department
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="intern-role"
                name="internRole"
                type="text"
                autoComplete="organization-title"
                placeholder="e.g. Frontend Intern, AI Intern, QA Intern"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800 gap-3">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Intern'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
