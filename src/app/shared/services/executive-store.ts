import { Injectable, computed, signal } from '@angular/core';
import { INCIDENTS, Incident, SECTOR_DRAWERS } from '../../dashboards/executive/executive.data';

/** UI state shared by the executive dashboard components (incidents, directives, drawer, toast). */
@Injectable({ providedIn: 'root' })
export class ExecutiveStore {
  readonly incidents = signal<Incident[]>(INCIDENTS);
  readonly focusId = signal('inc1');
  readonly focus = computed(() => this.incidents().find((i) => i.id === this.focusId()) ?? this.incidents()[0]);

  readonly dirDone = signal(11);
  readonly dirProg = signal(2);
  readonly dirLate = signal(1);
  readonly dirTotal = computed(() => this.dirDone() + this.dirProg() + this.dirLate());

  readonly drawerKey = signal<string | null>(null);
  readonly drawerIncident = computed(() => this.incidents().find((i) => i.id === this.drawerKey()) ?? null);
  readonly drawerSector = computed(() => {
    const k = this.drawerKey();
    return k ? SECTOR_DRAWERS[k] ?? null : null;
  });

  readonly toast = signal<string | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  openDrawer(key: string): void {
    if (this.incidents().some((i) => i.id === key)) this.focusId.set(key);
    this.drawerKey.set(key);
  }

  closeDrawer(): void {
    this.drawerKey.set(null);
  }

  approve(id: string): void {
    const inc = this.incidents().find((i) => i.id === id);
    if (!inc || inc.approved) return;
    this.incidents.update((l) =>
      l.map((i) => (i.id === id ? { ...i, approved: true, trendText: 'يتحسن ↘', trendGood: true, dossier: { ...i.dossier, nextStep: 'تم اعتماد التوجيه من القيادة وتعميمه على الجهات المعنية.' } } : i)),
    );
    this.dirProg.update((v) => v + 1);
    this.showToast(`تم اعتماد التوجيه وتعميمه على (${inc.agency})`);
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
