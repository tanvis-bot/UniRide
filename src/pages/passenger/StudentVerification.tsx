import React, { useState } from 'react';
import { toast } from 'sonner';
import { GraduationCapIcon } from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { FileUpload } from '../../components/ui/FileUpload';
import { StatusPill } from '../../components/ui/Status';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { api, type UploadDescriptor } from '../../services/api';
import { errorMessage } from '../../services/http';
import { formatLongDay } from '../../utils/format';

const statusCopy: Record<string, {title: string;body: string;}> = {
  not_submitted: {
    title: 'Not submitted',
    body: 'Upload your college or university ID to claim the student fare.'
  },
  pending: {
    title: 'Your documents are under review',
    body: 'Verification usually completes within one working day. You can still book rides at the standard fare meanwhile.'
  },
  approved: {
    title: 'Student verification approved',
    body: 'The 15% student discount is applied automatically to every booking.'
  },
  rejected: {
    title: 'Verification rejected',
    body: 'Review the remarks below and submit a current, readable copy of your ID.'
  }
};

export function StudentVerification() {
  const { refresh } = useAuth();
  const record = useAsync(() => api.students.me(), []);
  const [form, setForm] = useState({ college_name: '', enrollment_no: '' });
  const [file, setFile] = useState<UploadDescriptor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.students.submit({ ...form, file: file as UploadDescriptor });
      toast.success('Document submitted. Your documents are under review.');
      record.refetch();
      refresh();
      setFile(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (record.loading) return <LoadingState label="Loading verification status…" />;
  if (record.error) return <ErrorState message={record.error} onRetry={record.refetch} />;

  const data = record.data!;
  const copy = statusCopy[data.status];
  const canResubmit = data.status === 'not_submitted' || data.status === 'rejected';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student verification"
        description="An approved college ID unlocks the student discount and marks you as part of the campus community." />
      

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink-700">
                <GraduationCapIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">
                  {copy.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{copy.body}</p>
              </div>
            </div>
            <StatusPill status={data.status} />
          </div>

          {data.status !== 'not_submitted' &&
          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">College</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                  {data.college_name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Enrolment number
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                  {data.enrollment_no || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Submitted document
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                  {data.document_name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Submission date
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink-900">
                  {data.submitted_at ?
                formatLongDay(data.submitted_at.slice(0, 10)) :
                '—'}
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
              {data.document_url &&
            <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Document preview
                  </dt>
                  <dd className="mt-2">
                    <img
                  src={data.document_url}
                  alt="Submitted college ID"
                  className="h-40 w-auto rounded-xl border border-slate-200 object-cover" />
                
                  </dd>
                </div>
            }
            </dl>
          }
        </Card>

        <Card>
          <CardHeader
            title={canResubmit ? 'Submit your college ID' : 'Update your document'}
            description="Uploads are validated for type and size before they reach the server." />
          
          <form onSubmit={submit} className="space-y-4">
            <Field label="College / University name" htmlFor="college" required>
              <Input
                id="college"
                value={form.college_name}
                onChange={(e) => setForm({ ...form, college_name: e.target.value })}
                placeholder="City Institute of Technology"
                required />
              
            </Field>
            <Field label="Enrolment number" htmlFor="enrollment" required>
              <Input
                id="enrollment"
                value={form.enrollment_no}
                onChange={(e) => setForm({ ...form, enrollment_no: e.target.value })}
                placeholder="CIT2023CS041"
                required />
              
            </Field>
            <FileUpload label="College / University ID" value={file} onChange={setFile} />
            <Button type="submit" block loading={submitting} disabled={!file}>
              {submitting ? 'Uploading…' : 'Submit for review'}
            </Button>
            {data.status === 'pending' &&
            <p className="text-xs text-slate-500">
                Submitting again replaces your current pending document.
              </p>
            }
          </form>
        </Card>
      </div>
    </div>);

}