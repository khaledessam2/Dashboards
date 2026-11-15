import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Metric {
  ar: string;
  value: string;
  icon: string;
  status?: 'warn' | 'crit';
}

/** KPI-Documentation §4.3 — Power & Cooling (static / mock until BMS integration). */
@Component({
  selector: 'app-dc-power-cooling',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'power-cooling', class: 'card' },
  templateUrl: './dc-power-cooling.html',
})
export class DcPowerCooling {
  protected readonly metrics: Metric[] = [
    { ar: 'بطاريات UPS', value: '40%', icon: 'battery_charging_full', status: 'warn' },
    { ar: 'المولدات', value: 'جاهز', icon: 'electric_bolt' },
    { ar: 'كفاءة PUE', value: '1.35', icon: 'energy_savings_leaf' },
    { ar: 'الحرارة', value: '45°C', icon: 'device_thermostat', status: 'crit' },
    { ar: 'الرطوبة', value: '45%', icon: 'humidity_percentage' },
    { ar: 'استهلاك الطاقة', value: '72%', icon: 'bolt' },
  ];
}
