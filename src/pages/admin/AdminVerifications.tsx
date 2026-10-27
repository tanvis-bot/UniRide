import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileBadgeIcon } from 'lucide-react';
import type { DriverVerification, StudentVerification } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { StatusPill } from '../../components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api, type VerificationRow } from '../../services/api';
import { errorMessage } from '../../services/http';
import { formatDay } from '../../utils/format';

interface Props {
  type: 'student' | 'driver';
}

function isDriverRecord(
record: StudentVerification | DriverVerification)
: record is DriverVerification {
  return 'licence_number' in record;
}

export function AdminVerifications({ type }: Props) {
  const [status, setStatus] = useState('pending');
  const rows = useAsync(() => api.admin.verifications({ type, status }), [type, status]);
  const [target, setTarget] = useState<{row: VerificationRow;decision: 'approve' | 'reject';} | null>(
    null
  );
  const [remarks, setRemarks] = useState('');
  const [working, setWorking] = useState(false);

  async function review() {
    if (!target) return;
    setWorking(true);
    try {
      await api.admin.review(target.row.record.id, {
        type,
        decision: target.decision,
        remarks
      });
      toast.success(
        target.decision === 'approve' ?
        'Verification approved and the user has been notified.' :
        'Verification rejected and the user has been notified.'
      );
      setTarget(null);
      setRemarks('');
      rows.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={type === 'student' ? 'Student verification' : 'Driver verification'}
        description={
        type === 'student' ?
        'Review college IDs before granting the student discount.' :
        'Review licences, government IDs and vehicle documents before a driver can publish rides.'
        }
        action={
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="w-44">
          
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </Select>
        } />
      

      {rows.loading ?
      <LoadingState label="Loading verification queue…" /> :
      rows.error ?
      <ErrorState message={rows.error} onRetry={rows.refetch} /> :
      (rows.data ?? []).length === 0 ?
      <EmptyState
        icon={<FileBadgeIcon className="h-5 w-5" aria-hidden />}
        title="Nothing to review"
        description="This queue is empty. New submissions appear here immediately." /> :


      <ul className="space-y-4">
          {rows.data!.map((row) => {
          const record = row.record;
          return (
            <li key={record.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.user.full_name} src={row.user.avatar_url} />
                      <div>
                        <p className="font-display text-base font-bold text-ink-900">
                          {row.user.full_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {row.user.email} · {row.user.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={record.status} />
                      <span className="text-xs text-slate-500">
                        {record.submitted_at ?
                      `Submitted ${formatDay(record.submitted_at.slice(0, 10))}` :
                      'Not submitted'}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                    {isDriverRecord(record) ?
                  <>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Driving licence
                          </dt>
                          <dd className="mt-0.5 font-semibold text-ink-900">
                            {record.licence_number || '—'}
                          </dd>
                          <dd className="text-xs text-slate-500">{record.licence_doc}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Government ID
                          </dt>
                          <dd className="mt-0.5 font-semibold text-ink-900">
                            {record.gov_id_type || '—'}
                          </dd>
                          <dd className="text-xs text-slate-500">{record.gov_id_doc}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Vehicle documents
                          </dt>
                          <dd className="mt-0.5 font-semibold text-ink-900">
                            {row.vehicles.length ?
                        row.vehicles.
                        map((v) => `${v.make} ${v.model} (${v.number})`).
                        join(', ') :
                        'No vehicle registered'}
                          </dd>
                          <dd className="text-xs text-slate-500">
                            {row.vehicles.map((v) => v.registration_doc).join(', ')}
                          </dd>
                        </div>
                      </> :

                  <>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            College
                          </dt>
                          <dd className="mt-0.5 font-semibold text-ink-900">
                            {record.college_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Enrolment number
                          </dt>
                          <dd className="mt-0.5 font-semibold text-ink-900">
                            {record.enrollment_no}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">
                            Student ID document
                          </dt>
                          <dd className="mt-0.5 font-semibold text-ink-900">
                            {record.document_name}
                          </dd>
                        </div>
                      </>
                  }
                  </dl>

                  {!isDriverRecord(record) && record.document_url &&
                <img
                  src={record.document_url}
                  alt={`Submitted document for ${row.user.full_name}`}
                  className="mt-4 h-32 w-auto rounded-xl border border-slate-200 object-cover" />

                }

                  {record.remarks &&
                <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <span className="font-semibold">Remarks:</span> {record.remarks}
                    </p>
                }

                  {record.status === 'pending' &&
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <Button
                    size="sm"
                    onClick={() => {
                      setRemarks('');
                      setTarget({ row, decision: 'approve' });
                    }}>
                    
                        Approve
                      </Button>
                      <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setRemarks('');
                      setTarget({ row, decision: 'reject' });
                    }}>
                    
                        Reject
                      </Button>
                    </div>
                }
                </Card>
              </li>);

        })}
        </ul>
      }

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={
        target?.decision === 'approve' ? 'Approve verification' : 'Reject verification'
        }
        description={
        target?.decision === 'approve' ?
        'The user is notified immediately and gains the associated permissions.' :
        'Give a clear reason — the user sees this message on their verification page.'
        }
        footer={
        <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
            variant={target?.decision === 'approve' ? 'primary' : 'danger'}
            loading={working}
            onClick={review}>
            
              {target?.decision === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }>
        
        <Field
          label={target?.decision === 'approve' ? 'Remarks (optional)' : 'Reason for rejection'}
          htmlFor="remarks"
          required={target?.decision === 'reject'}>
          
          <Textarea
            id="remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={
            target?.decision === 'approve' ?
            'Documents verified.' :
            'Document expired. Please upload a current-year ID card.'
            } />
          
        </Field>
      </Modal>
    </div>);

}