import React, { useState } from 'react';
import { toast } from 'sonner';
import { SirenIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import { errorMessage } from '../../services/http';
import { getCurrentPosition } from '../../server/socket';

export function SosButton({ rideId }: {rideId: string | null;}) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [raised, setRaised] = useState<string | null>(null);

  async function trigger() {
    setWorking(true);
    try {
      const location = await getCurrentPosition();
      const incident = await api.sos.trigger({ ride_id: rideId, location });
      setRaised(incident.id);
      toast.error('SOS raised. The response desk has been alerted.', {
        description: location ?
        'Your current location was attached to the incident.' :
        'Location permission was unavailable, so no coordinates were attached.'
      });
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <Button
        variant="danger"
        block
        size="lg"
        icon={<SirenIcon className="h-5 w-5" aria-hidden />}
        onClick={() => setOpen(true)}>
        
        SOS
      </Button>
      {raised &&
      <p className="mt-2 text-center text-xs font-semibold text-signal-red">
          Incident {raised} is open — help is being coordinated.
        </p>
      }
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Are you sure you want to trigger SOS?"
        description="This raises an emergency incident with your identity, this ride, the current time and your location if permission is granted. Only use it in a genuine emergency."
        size="sm"
        footer={
        <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={working} onClick={trigger}>
              Yes, trigger SOS
            </Button>
          </>
        } />
      
    </>);

}