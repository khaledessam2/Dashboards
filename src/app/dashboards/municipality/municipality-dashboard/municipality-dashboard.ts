import { FlashOnChange } from '../../../shared/directives/flash-on-change';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MuniServices } from '../components/muni-services/muni-services';
import { MuniEnv } from '../components/muni-env/muni-env';
import { MuniEnergyZone } from '../components/muni-energy-zone/muni-energy-zone';
import { KpiCard, KpiDef } from '../../../shared/components/kpi-card/kpi-card';
import { MunicipalityStore } from '../../../shared/services/municipality-store';
import { ALERT_KEYS, ALERT_META, MODE_KEYS, MODE_META, STATUS_META } from '../../../shared/models/municipality.model';
import { MuniLampsView } from '../components/lamps-view/lamps-view';
import { MuniVisuiteIndicators } from '../components/visuite-indicators/visuite-indicators';

const MODE_COLOR = '#00bcd4';

@Component({
  selector: 'app-municipality-dashboard',
  imports: [FlashOnChange, KpiCard, MuniLampsView, MuniVisuiteIndicators, MuniServices, MuniEnv, MuniEnergyZone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'box-border flex flex-col gap-4 px-6 pt-4 pb-8 max-[900px]:p-4 max-[480px]:gap-3 max-[480px]:p-3' },
  templateUrl: './municipality-dashboard.html',
})
export class MunicipalityDashboard {
  private readonly store = inject(MunicipalityStore);
  private readonly now = signal(Date.now());
  protected readonly lastUpdate = this.store.lastUpdate;

  constructor() {
    const id = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  protected readonly dateText = computed(() => {
    const d = new Date(this.now());
    const date = new Intl.DateTimeFormat('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    const time = d.toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} | ${time}`;
  });

  protected readonly updatedText = computed(() => {
    const mins = Math.floor((this.now() - this.lastUpdate()) / 60000);
    return mins < 1 ? 'قبل دقيقة' : `قبل ${mins} دقيقة`;
  });

  protected fullscreen(): void {
    void document.documentElement.requestFullscreen?.();
  }

  protected readonly kpiCards = computed<KpiDef[]>(() => {
    const s = this.store.statusCounts();
    const fmt = (n: number) => n.toLocaleString('en-US');
    const c = this.store.kpiChange();
    return [
      { id: 'kpi-lamps', ar: 'حالة وحدات الإنارة', icon: 'lightbulb', value: fmt(s.total) },
      { id: 'kpi-energy', ar: 'استهلاك الطاقة (kWh)', icon: 'bolt', value: fmt(this.store.energyKwh()), change: { pct: c.energy, upIsBad: true } },
      { id: 'kpi-power', ar: 'القدرة الحالية (kW)', icon: 'electric_bolt', value: `${this.store.powerKw()}` },
      { id: 'kpi-savings', ar: 'التوفير في الطاقة', icon: 'energy_savings_leaf', value: `${this.store.savingsPct()}%`, change: { pct: c.savings } },
      { id: 'kpi-faults', ar: 'الأعطال النشطة', icon: 'build', value: fmt(s.faults), status: 'crit', change: { pct: c.faults, upIsBad: true } },
      { id: 'kpi-control', ar: 'نجاح أوامر التحكم', icon: 'settings_remote', value: `${this.store.controlSuccessPct()}%` },
    ];
  });

  protected readonly statuses = computed(() => {
    const s = this.store.statusCounts();
    return [
      { id: 'st-on', ar: 'تعمل', icon: 'lightbulb', color: STATUS_META.on.color, value: s.on },
      { id: 'st-off', ar: 'مطفأة', icon: 'light_off', color: STATUS_META.off.color, value: s.off },
      { id: 'st-nodata', ar: 'بدون بيانات', icon: 'wifi_off', color: STATUS_META.nodata.color, value: s.nodata },
    ];
  });

  protected readonly alerts = computed(() => {
    const c = this.store.alertCounts();
    return ALERT_KEYS.map((k) => ({ id: `al-${k}`, ar: ALERT_META[k].ar, color: ALERT_META[k].color, value: c[k] }));
  });

  protected readonly modes = computed(() => {
    const c = this.store.modeCounts();
    return MODE_KEYS.map((k) => ({ id: `mode-${k}`, ar: MODE_META[k].ar, color: MODE_COLOR, value: c[k] }));
  });
}
