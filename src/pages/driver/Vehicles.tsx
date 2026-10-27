import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  CarFrontIcon,
  PencilIcon,
  Trash2Icon
} from 'lucide-react';
import type { Vehicle } from '../../types';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { FileUpload } from '../../components/ui/FileUpload';
import { Modal } from '../../components/ui/Modal';
import {
  EmptyState,
  ErrorState,
  LoadingState
} from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import {
  api,
  type UploadDescriptor
} from '../../services/api';
import { errorMessage } from '../../services/http';

const emptyForm = {
  make: '',
  model: '',
  manufacturing_year: String(new Date().getFullYear()),
  number: '',
  color: '',
  seats: '4'
};

export function Vehicles() {
  const vehicles = useAsync(() => api.vehicles.list(), []);

  const [form, setForm] = useState(emptyForm);

  const [file, setFile] =
    useState<UploadDescriptor | null>(null);

  const [editing, setEditing] =
    useState<Vehicle | null>(null);

  const [removeTarget, setRemoveTarget] =
    useState<Vehicle | null>(null);

  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        await api.vehicles.update(editing.id, form);
        toast.success('Vehicle updated.');
      } else {
        await api.vehicles.create({
          ...form,
          registration_file: file
        });

        toast.success('Vehicle added.');
      }

      setForm(emptyForm);
      setFile(null);
      setEditing(null);
      vehicles.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!removeTarget) {
      return;
    }

    try {
      await api.vehicles.remove(removeTarget.id);
      toast.success('Vehicle removed.');
      vehicles.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRemoveTarget(null);
    }
  }

  function startEdit(vehicle: Vehicle) {
    setEditing(vehicle);

    setForm({
      make: vehicle.make,
      model: vehicle.model,
      manufacturing_year: String(
        vehicle.manufacturing_year
      ),
      number: vehicle.number,
      color: vehicle.color,
      seats: String(vehicle.seats)
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle management"
        description="Rides are published against a registered vehicle, so keep these details current."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="Your vehicles" />

          {vehicles.loading ? (
            <LoadingState label="Loading vehicles…" />
          ) : vehicles.error ? (
            <ErrorState
              message={vehicles.error}
              onRetry={vehicles.refetch}
            />
          ) : (vehicles.data ?? []).length === 0 ? (
            <EmptyState
              icon={
                <CarFrontIcon
                  className="h-5 w-5"
                  aria-hidden
                />
              }
              title="No vehicle added yet"
              description="Add the car you drive so you can publish rides against it."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {vehicles.data!.map((vehicle) => (
                <li
                  key={vehicle.id}
                  className="flex flex-col rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-bold text-ink-900">
                        {vehicle.make} {vehicle.model}
                      </p>

                      <p className="text-sm text-slate-500">
                        {vehicle.number}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {vehicle.seats} seats
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <dt>Manufacturing year</dt>

                      <dd className="font-medium text-ink-900">
                        {vehicle.manufacturing_year}
                      </dd>
                    </div>

                    <div className="flex justify-between">
                      <dt>Colour</dt>

                      <dd className="font-medium text-ink-900">
                        {vehicle.color}
                      </dd>
                    </div>

                    <div className="flex justify-between">
                      <dt>Registration</dt>

                      <dd className="truncate font-medium text-ink-900">
                        {vehicle.registration_doc}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex gap-2 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={
                        <PencilIcon
                          className="h-4 w-4"
                          aria-hidden
                        />
                      }
                      onClick={() => startEdit(vehicle)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-signal-red hover:bg-rose-50"
                      icon={
                        <Trash2Icon
                          className="h-4 w-4"
                          aria-hidden
                        />
                      }
                      onClick={() =>
                        setRemoveTarget(vehicle)
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={
              editing
                ? `Edit ${editing.make} ${editing.model}`
                : 'Add a vehicle'
            }
            action={
              editing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </Button>
              ) : null
            }
          />

          <form
            onSubmit={save}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Make"
                htmlFor="make"
                required
              >
                <Input
                  id="make"
                  value={form.make}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      make: event.target.value
                    })
                  }
                  placeholder="Maruti Suzuki"
                  required
                />
              </Field>

              <Field
                label="Model"
                htmlFor="model"
                required
              >
                <Input
                  id="model"
                  value={form.model}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      model: event.target.value
                    })
                  }
                  placeholder="Baleno"
                  required
                />
              </Field>
            </div>

            <Field
              label="Manufacturing year"
              htmlFor="manufacturingYear"
              required
            >
              <Input
                id="manufacturingYear"
                type="number"
                min={2000}
                max={new Date().getFullYear() + 1}
                value={form.manufacturing_year}
                onChange={(event) =>
                  setForm({
                    ...form,
                    manufacturing_year:
                      event.target.value
                  })
                }
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Vehicle number"
                htmlFor="number"
                required
              >
                <Input
                  id="number"
                  value={form.number}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      number: event.target.value
                    })
                  }
                  placeholder="MH 12 KJ 4409"
                  required
                />
              </Field>

              <Field
                label="Colour"
                htmlFor="color"
                required
              >
                <Input
                  id="color"
                  value={form.color}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      color: event.target.value
                    })
                  }
                  placeholder="Pearl White"
                  required
                />
              </Field>
            </div>

            <Field
              label="Seating capacity"
              htmlFor="seats"
              hint="Excluding the driver"
              required
            >
              <Input
                id="seats"
                type="number"
                min={1}
                max={7}
                value={form.seats}
                onChange={(event) =>
                  setForm({
                    ...form,
                    seats: event.target.value
                  })
                }
                required
              />
            </Field>

            {!editing && (
              <FileUpload
                label="Registration document"
                value={file}
                onChange={setFile}
              />
            )}

            <Button
              type="submit"
              block
              loading={saving}
              disabled={!editing && !file}
            >
              {editing
                ? 'Save changes'
                : 'Add vehicle'}
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove this vehicle?"
        description={
          removeTarget
            ? `${removeTarget.make} ${removeTarget.model} (${removeTarget.number}) will no longer be available when publishing rides.`
            : ''
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemoveTarget(null)}
            >
              Keep vehicle
            </Button>

            <Button
              variant="danger"
              onClick={remove}
            >
              Remove
            </Button>
          </>
        }
      />
    </div>
  );
}