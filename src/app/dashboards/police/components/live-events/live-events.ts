import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CAMERA_PLACES, POLICE_EVENT_META, camId } from '../../../../shared/constants/police.constants';
import { PoliceStore } from '../../../../shared/services/police-store';
import { formatTime12 } from '../../../../shared/utils/time.utils';

const SHOWN = 5;

/** الأحداث الأمنية المباشرة (#11): latest events with type, time, camera and severity. */
@Component({
  selector: 'app-police-live-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'live-events', class: 'pcard !p-0' },
  templateUrl: './live-events.html',
})
export class PoliceLiveEvents {
  private readonly store = inject(PoliceStore);
  protected readonly total = this.store.totalAll;

  protected readonly items = computed(() => {
    const fresh = this.store.freshEventIds();
    return this.store.events().slice(0, SHOWN).map((e) => {
      const meta = POLICE_EVENT_META[e.event_name];
      return {
        id: e.id,
        ar: meta.ar,
        critical: meta.severity === 'critical',
        place: CAMERA_PLACES[e.camera_id] ?? '',
        camera: camId(e.camera_name),
        time: formatTime12(e.event_time).replace(/ [صم]$/, ''),
        fresh: fresh.has(e.id),
      };
    });
  });
}
