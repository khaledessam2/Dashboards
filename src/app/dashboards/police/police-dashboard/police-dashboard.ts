import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PoliceArrivalWaves } from '../components/arrival-waves/arrival-waves';
import { PoliceEmergencyResponse } from '../components/emergency-response/emergency-response';
import { PoliceFlowChart } from '../components/flow-chart/flow-chart';
import { PoliceGatesTable } from '../components/gates-table/gates-table';
import { PoliceHeader } from '../components/header/header';
import { PoliceKpis } from '../components/kpis/kpis';
import { PoliceLiveMap } from '../components/live-map/live-map';
import { PoliceLostHelp } from '../components/lost-help/lost-help';
import { PoliceStatusStrip } from '../components/status-strip/status-strip';
import { PoliceSafetyAlerts } from '../components/safety-alerts/safety-alerts';
import { PoliceZoneOccupancy } from '../components/zone-occupancy/zone-occupancy';

@Component({
  selector: 'app-police-dashboard',
  imports: [PoliceHeader, PoliceKpis, PoliceStatusStrip, PoliceFlowChart, PoliceZoneOccupancy, PoliceArrivalWaves, PoliceLiveMap, PoliceGatesTable, PoliceSafetyAlerts, PoliceEmergencyResponse, PoliceLostHelp],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-full bg-[#f6f8fb] [font-family:IBM_Plex_Sans_Arabic,Cairo,sans-serif]' },
  templateUrl: './police-dashboard.html',
})
export class PoliceDashboard {}
