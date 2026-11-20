import { FlashOnChange } from '../../../../shared/directives/flash-on-change';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MunicipalityStore } from '../../../../shared/services/municipality-store';

interface Tile { id: string; ar: string; icon: string; color: string; value: string; sub: string }

const fmt = (n: number) => n.toLocaleString('en-US');

/** Bottom strip: municipal services + visual-analytics tiles. */
@Component({
  selector: 'app-muni-services',
  imports: [FlashOnChange],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 min-[700px]:grid-cols-[repeat(4,minmax(0,1fr))] min-[1500px]:grid-cols-[repeat(6,minmax(0,1fr))]' },
  templateUrl: './muni-services.html',
})
export class MuniServices {
  private readonly store = inject(MunicipalityStore);

  protected readonly tiles = computed<Tile[]>(() => {
    const v = this.store.visual();
    const s = this.store.services();
    return [
      { id: 'vis-violations', ar: 'التشوه البصري والمخالفات', icon: 'visibility', color: '#e74c3c', value: fmt(v.violations), sub: 'حالة مكتشفة' },
      { id: 'vis-pedestrians', ar: 'كثافة حركة المشاة', icon: 'directions_walk', color: '#0b5cff', value: fmt(v.pedestrians), sub: 'People Counting' },
      { id: 'vis-vehicles', ar: 'كثافة حركة المركبات', icon: 'directions_car', color: '#5b6abf', value: fmt(v.vehicles), sub: 'Vehicle Classification' },
      { id: 'svc-940', ar: 'بلاغات 940 ذات الأولوية', icon: 'support_agent', color: '#e74c3c', value: fmt(s.reports940.total), sub: `${s.reports940.open} مفتوحة · ${s.reports940.overdue} متأخرة` },
      { id: 'svc-orders', ar: 'أوامر الصيانة ومواعيد الإصلاح', icon: 'assignment', color: '#5b6abf', value: fmt(s.workOrders.total), sub: `${s.workOrders.completed} منجزة · ${s.workOrders.overdue} تجاوزت الموعد` },
      { id: 'svc-containers', ar: 'الحاويات وجمع النفايات', icon: 'delete', color: '#f5a623', value: `${s.containers.fullPct}%`, sub: `متوسط الامتلاء · ${s.containers.lateCollection} متأخرة` },
      { id: 'svc-cleaning', ar: 'فرق النظافة والحمولات', icon: 'cleaning_services', color: '#00a651', value: fmt(s.cleaning.teams), sub: `${fmt(s.cleaning.loads)} حمولة · ${s.cleaning.lateZones} مناطق متأخرة` },
      { id: 'svc-flood', ar: 'تجمع المياه وجاهزية التصريف', icon: 'flood', color: '#00bcd4', value: `${s.flooding.alerts}`, sub: `تنبيهات · جاهزية ${s.flooding.ready}%` },
      { id: 'svc-leaks', ar: 'كسور وتسربات المياه', icon: 'water_damage', color: '#0b5cff', value: fmt(s.waterLeaks.total), sub: `${s.waterLeaks.repairing} قيد الإصلاح · ${s.waterLeaks.resolved} تم إصلاحها` },
      { id: 'svc-proximity', ar: 'قرب الخدمات وسهولة الوصول', icon: 'near_me', color: '#00a651', value: `${s.proximity.minutes} د`, sub: `متوسط الوصول · ${s.proximity.lowCoverage} مناطق أقل تغطية` },
      { id: 'svc-water', ar: 'توفر مياه الشرب', icon: 'water_drop', color: '#0b5cff', value: `${s.drinkingWater.ready}/${s.drinkingWater.points}`, sub: `نقاط جاهزة · ${s.drinkingWater.outOfStock} نفد مخزونها` },
    ];
  });
}
