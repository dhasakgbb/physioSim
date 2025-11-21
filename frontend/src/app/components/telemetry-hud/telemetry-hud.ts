import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DataPointModel } from '../../core/services/simulation-client';

export interface VitalMetric {
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  max: number; // For bar scaling
}

@Component({
  selector: 'app-telemetry-hud',
  standalone: false,
  templateUrl: './telemetry-hud.html',
  styleUrl: './telemetry-hud.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryHud {
  @Input() dataPoints: DataPointModel[] = [];

  get vitals(): VitalMetric[] {
    if (!this.dataPoints.length) return [];

    return [
      {
        label: 'Readiness',
        value: this.readinessScore,
        unit: '%',
        status: this.readinessScore > 80 ? 'normal' : this.readinessScore > 50 ? 'warning' : 'critical',
        max: 100
      },
      {
        label: 'Stability',
        value: this.volatilityScore,
        unit: '%',
        status: this.volatilityScore > 70 ? 'normal' : 'warning',
        max: 100
      },
      {
        label: 'Toxicity',
        value: this.toxicityLoad,
        unit: '%',
        status: this.toxicityLoad < 35 ? 'normal' : this.toxicityLoad < 60 ? 'warning' : 'critical',
        max: 100
      },
      {
        label: 'Peak Serum',
        value: this.peakSerum,
        unit: 'ng/dL',
        status: 'normal',
        max: 5000 // Arbitrary scale for visualization
      },
      {
        label: 'Anabolic Idx',
        value: this.peakAnabolic,
        unit: 'AU',
        status: 'normal',
        max: 20
      },
      {
        label: 'Drift',
        value: Math.abs(this.driftPerDay),
        unit: 'ng/d',
        status: Math.abs(this.driftPerDay) < 50 ? 'normal' : 'warning',
        max: 200
      }
    ];
  }

  get readinessScore(): number {
    if (!this.dataPoints.length) {
      return 0;
    }
    const ratio = this.peakAnabolic / Math.max(this.maxToxicity || 1, 1);
    const normalized = Math.min(1, ratio / 2.5);
    return Number((normalized * 100).toFixed(1));
  }

  get volatilityScore(): number {
    if (this.dataPoints.length < 3) {
      return 100;
    }
    const diffs: number[] = [];
    for (let i = 1; i < this.dataPoints.length; i++) {
      const prev = this.dataPoints[i - 1].serumConcentration;
      const curr = this.dataPoints[i].serumConcentration;
      diffs.push(Math.abs(curr - prev));
    }
    const avgDiff = diffs.reduce((sum, value) => sum + value, 0) / diffs.length;
    const normalized = Math.min(1, avgDiff / Math.max(this.peakSerum, 1));
    return Number(((1 - normalized) * 100).toFixed(1));
  }

  get driftPerDay(): number {
    if (this.dataPoints.length < 2) {
      return 0;
    }
    const last = this.dataPoints[this.dataPoints.length - 1].serumConcentration;
    const prev = this.dataPoints[this.dataPoints.length - 2].serumConcentration;
    return Number((last - prev).toFixed(1));
  }

  get toxicityLoad(): number {
    return Number(this.maxToxicity.toFixed(1));
  }

  private get peakSerum(): number {
    return Math.max(...this.dataPoints.map((p) => p.serumConcentration), 0);
  }

  private get peakAnabolic(): number {
    return Math.max(...this.dataPoints.map((p) => p.anabolicScore), 0);
  }

  private get maxToxicity(): number {
    return Math.max(...this.dataPoints.map((p) => p.toxicityScore), 0);
  }

  getBarWidth(value: number, max: number): string {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return `${percentage}%`;
  }
}
