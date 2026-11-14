import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { POLICE_EVENT_META } from '../../../../shared/constants/police.constants';
import { PoliceStore } from '../../../../shared/services/police-store';

const pad = (n: number) => String(n).padStart(2, '0');

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds} ث`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} د`;
  return `${Math.floor(seconds / 3600)} س`;
}

@Component({
  selector: 'app-police-live-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'live-events', class: 'card' },
  templateUrl: './live-events.html',
})
export class PoliceLiveEvents {
  private readonly store = inject(PoliceStore);

  protected readonly items = computed(() => {
    const fresh = this.store.freshEventIds();
    return this.store.events().map((e) => {
      const meta = POLICE_EVENT_META[e.event_name];
      return {
        id: e.id,
        ar: meta.ar,
        icon: meta.icon,
        severity: meta.severity,
        camera: e.camera_name,
        time: formatTime(e.event_time),
        fresh: fresh.has(e.id),
      };
    });
  });

  /** "Last event age" — #last-event-age. */
  protected readonly lastAge = computed(() => {
    const latest = this.store.events()[0];
    if (!latest) return null;
    return formatAge(Math.max(0, Math.floor((this.store.now() - latest.event_time) / 1000)));
  });
}
