import React, { useState } from 'react';
import { toast } from 'sonner';
import { IdCardIcon, ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { FileUpload } from '../../components/ui/FileUpload';
import { StatusPill } from '../../components/ui/Status';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { api, type UploadDescriptor } from '../../services/api';
import { errorMessage } from '../../services/http';
import { formatLongDay } from '../../utils/format';

const statusCopy: Record<string, string> = {
  not_submitted:
  'Submit your driving licence and a government ID. You can offer rides once they are approved.',
  pending:
  'Your driver verification is pending. You can offer rides after your documents are approved.',
  approved: 'You are verified and can publish rides.',
  rejected: 'Your documents were rejected. Read the remarks and submit again.'
};

export function DriverVerification() {
  const { refresh } = useAuth();
  const record = useAsync(() => api.drivers.verification(), []);
  const vehicles = useAsync(() => api.vehicles.list(), []);
  const [form, setForm] = useState({
  licence_number: '',
  gov_id_type: 'Aadhaar',
  gov_id_number: ''
});
  const [licenceFile, setLicenceFile] = useState<UploadDescriptor | null>(null);
  const [govFile, setGovFile] = useState<UploadDescriptor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.drivers.submit({
        ...form,
        licence_file: licenceFile as UploadDescriptor,
        gov_id_file: govFile as UploadDescriptor
      });
      toast.success('Documents submitted. Your documents are under review.');
      record.refetch();
      refresh();
      setLicenceFile(null);
      setGovFile(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (record.loading) return <LoadingState label="Loading verification status…" />;
  if (record.error) return <ErrorState message={record.error} onRetry={record.refetch} />;

  const data = record.data!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver verification"
        description="Licence, government ID and vehicle registration are checked before you can publish a ride." />
      

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink-700">
                <ShieldCheckIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">
                  Verification status
                </h2>
                <p className="mt-1 text-sm text-slate-600">{statusCopy[data.status]}</p>
              </div>
            </div>
            <StatusPill status={data.status} />
          </div>

          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Licence number
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                {data.licence_number || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Government ID
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                {data.gov_id_type || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Uploaded documents
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                {[data.licence_doc, data.gov_id_doc].filter(Boolean).join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Submitted</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                {data.submitted_at ? formatLongDay(data.submitted_at.slice(0, 10)) : '—'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Registered vehicles
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                {vehicles.data?.length ?
                vehicles.data.
                map((v) => `${v.make} ${v.model} (${v.number})`).
                join(', ') :
                'No vehicle added yet'}
              </dd>
            </div>
            {data.remarks &&
            <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Admin remarks
                </dt>
                <dd
                className={`mt-1 rounded-xl p-3 text-sm ${
                data.status === 'rejected' ?
                'bg-rose-50 text-rose-800' :
                'bg-slate-50 text-slate-700'}`
                }>
                
                  {data.remarks}
                </dd>
              </div>
            }
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Submit documents"
            description="Files are validated for type and size before upload." />
          
          <form onSubmit={submit} className="space-y-4">
            <Field label="Driving licence number" htmlFor="licence" required>
              <Input
                id="licence"
                value={form.licence_number}
                onChange={(e) => setForm({ ...form, licence_number: e.target.value })}
                placeholder="MH12 20180004321"
                required />
              
            </Field>
            <Field label="Government ID type" htmlFor="govType" required>
              <Select
                id="govType"
                value={form.gov_id_type}
                onChange={(e) => setForm({ ...form, gov_id_type: e.target.value })}>
                
                <option>Aadhaar</option>
                <option>Passport</option>
                <option>Voter ID</option>
                <option>PAN Card</option>
              </Select>
            </Field>
            <Field
  label="Government ID number"
  htmlFor="govIdNumber"
  required
>
  <Input
    id="govIdNumber"
    value={form.gov_id_number}
    onChange={(e) =>
      setForm({
        ...form,
        gov_id_number: e.target.value
      })
    }
    placeholder="Enter your government ID number"
    required
  />
</Field>
            <FileUpload
              label="Driving licence"
              value={licenceFile}
              onChange={setLicenceFile} />
            
            <FileUpload
              label="Government-issued identity proof"
              value={govFile}
              onChange={setGovFile} />
            
            <Button
              type="submit"
              block
              loading={submitting}
              disabled={!licenceFile || !govFile}
              icon={<IdCardIcon className="h-4 w-4" aria-hidden />}>
              
              Submit for review
            </Button>
          </form>
        </Card>
      </div>
    </div>);

}