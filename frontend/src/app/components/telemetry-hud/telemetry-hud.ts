import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DataPointModel } from '../../core/services/simulation-client';

@Component({
  selector: 'app-telemetry-hud',
  standalone: false,
  templateUrl: './telemetry-hud.html',
  styleUrl: './telemetry-hud.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryHud {
  @Input() dataPoints: DataPointModel[] = [];

  get readinessScore(): number {
    if (!this.dataPoints.length) {
      return 0;
    }
    const ratio = this.peakAnabolic / Math.max(this.maxToxicity || 1, 1);
    const normalized = Math.min(1, ratio / 2.5);
    return Number((normalized * 100).toFixed(1));
  }

  get readinessGradient(): string {
    const angle = (this.readinessScore / 100) * 360;
    return `conic-gradient(var(--neon-cyan) 0deg ${angle}deg, rgba(255,255,255,0.15) ${angle}deg 360deg)`;
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

  get steadyStateDay(): number | null {
    if (!this.dataPoints.length) {
      return null;
    }
    const target = this.peakSerum * 0.9;
    const point = this.dataPoints.find((p) => p.serumConcentration >= target);
    return point?.day ?? null;
  }

  get toxicityLoad(): number {
    return Number(this.maxToxicity.toFixed(1));
  }

  get metricCards(): Array<{ label: string; value: string; caption: string }> {
    return [
      {
        label: 'Steady state',
        value: this.steadyStateDay ? `${this.steadyStateDay} d` : '—',
        caption: 'Day crossing 90% of peak serum',
      },
      {
        label: 'Drift / day',
        value: `${this.driftPerDay > 0 ? '+' : ''}${this.driftPerDay} ng/dL`,
        caption: 'Delta between last two solves',
      },
      {
        label: 'Toxic load',
        value: `${this.toxicityLoad}%`,
        caption: 'Max modeled hepatic stress',
      },
      {
        label: 'Anabolic / tox',
        value: this.maxToxicity ? (this.peakAnabolic / this.maxToxicity).toFixed(2) : '—',
        caption: 'Bigger is better for lean gain bias',
      },
    ];
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

}
