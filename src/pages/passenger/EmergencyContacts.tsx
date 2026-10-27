import React, { useState } from 'react';
import { toast } from 'sonner';
import { PhoneCallIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';

export function EmergencyContacts() {
  const contacts = useAsync(() => api.emergency.list(), []);
  const [form, setForm] = useState({ name: '', relationship: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.emergency.add(form);
      toast.success('Emergency contact added.');
      setForm({ name: '', relationship: '', phone: '' });
      contacts.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!removeId) return;
    try {
      await api.emergency.remove(removeId);
      toast.success('Contact removed.');
      contacts.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRemoveId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency contacts"
        description="These people appear on the active ride screen for one-tap calling, and are alerted when you raise an SOS." />
      

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Saved contacts" />
          {contacts.loading ?
          <LoadingState label="Loading contacts…" /> :
          contacts.error ?
          <ErrorState message={contacts.error} onRetry={contacts.refetch} /> :
          (contacts.data ?? []).length === 0 ?
          <EmptyState
            icon={<PhoneCallIcon className="h-5 w-5" aria-hidden />}
            title="No emergency contacts yet"
            description="Add at least one person we can reach if something goes wrong during a trip." /> :


          <ul className="divide-y divide-slate-100">
              {contacts.data!.map((contact) =>
            <li
              key={contact.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              
                  <div>
                    <p className="font-semibold text-ink-900">{contact.name}</p>
                    <p className="text-sm text-slate-500">
                      {contact.relationship} · {contact.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                      <Button
                    variant="secondary"
                    size="sm"
                    icon={<PhoneCallIcon className="h-4 w-4" aria-hidden />}>
                    
                        Call
                      </Button>
                    </a>
                    <Button
                  variant="ghost"
                  size="sm"
                  className="text-signal-red hover:bg-rose-50"
                  icon={<Trash2Icon className="h-4 w-4" aria-hidden />}
                  onClick={() => setRemoveId(contact.id)}>
                  
                      Remove
                    </Button>
                  </div>
                </li>
            )}
            </ul>
          }
        </Card>

        <Card>
          <CardHeader title="Add a contact" />
          <form onSubmit={add} className="space-y-4">
            <Field label="Contact name" htmlFor="name" required>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Meera Nair"
                required />
              
            </Field>
            <Field label="Relationship" htmlFor="relationship" required>
              <Input
                id="relationship"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                placeholder="Mother"
                required />
              
            </Field>
            <Field label="Phone number" htmlFor="phone" required>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98111 22334"
                required />
              
            </Field>
            <Button type="submit" block loading={saving}>
              Add contact
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        title="Remove this contact?"
        description="They will no longer be listed on your active ride screen."
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setRemoveId(null)}>
              Keep contact
            </Button>
            <Button variant="danger" onClick={remove}>
              Remove
            </Button>
          </>
        } />
      
    </div>);

}