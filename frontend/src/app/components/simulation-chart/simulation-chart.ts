import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { DataPointModel } from '../../core/services/simulation-client';

export type ChartView = 'efficiency' | 'serum' | 'evolution';

@Component({
  selector: 'app-simulation-chart',
  standalone: false,
  templateUrl: './simulation-chart.html',
  styleUrl: './simulation-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationChart {
  @Input() dataPoints: DataPointModel[] = [];
  @Input() loading = false;
  @Input() activeTab: 'explore' | 'optimize' | 'signaling' = 'explore';

  readonly viewBox = { width: 820, height: 320, padding: 32 };

  get viewBoxAttr(): string {
    return `0 0 ${this.viewBox.width} ${this.viewBox.height}`;
  }

  get serumPath(): string {
    return this.buildPath((point) => point.serumConcentration);
  }

  get anabolicPath(): string {
    return this.buildPath((point) => point.anabolicScore);
  }

  get toxicityPath(): string {
    return this.buildAreaPath((point) => point.toxicityScore);
  }

  get maxDay(): number {
    return this.dataPoints[this.dataPoints.length - 1]?.day ?? 0;
  }

  get peakSerum(): number {
    return Math.max(...this.dataPoints.map((p) => p.serumConcentration), 0);
  }

  get peakAnabolic(): number {
    return Math.max(...this.dataPoints.map((p) => p.anabolicScore), 0);
  }

  get maxToxicity(): number {
    return Math.max(...this.dataPoints.map((p) => p.toxicityScore), 0);
  }

  get serumAUC(): number {
    if (this.dataPoints.length < 2) {
      return 0;
    }
    let total = 0;
    for (let i = 1; i < this.dataPoints.length; i++) {
      const prev = this.dataPoints[i - 1];
      const curr = this.dataPoints[i];
      total += ((prev.serumConcentration + curr.serumConcentration) / 2) * (curr.day - prev.day);
    }
    return total;
  }

  get latestPoint(): DataPointModel | null {
    return this.dataPoints[this.dataPoints.length - 1] ?? null;
  }

  private buildPath(accessor: (point: DataPointModel) => number): string {
    if (!this.dataPoints.length) {
      return '';
    }

    const valueMax = Math.max(...this.dataPoints.map(accessor), 1);
    return this.dataPoints
      .map((point, index) => {
        const { x, y } = this.project(point, accessor(point), valueMax);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }

  private buildAreaPath(accessor: (point: DataPointModel) => number): string {
    if (!this.dataPoints.length) {
      return '';
    }
    const valueMax = Math.max(...this.dataPoints.map(accessor), 1);
    const top = this.dataPoints
      .map((point, index) => {
        const { x, y } = this.project(point, accessor(point), valueMax);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
    const last = this.project(
      this.dataPoints[this.dataPoints.length - 1],
      0,
      valueMax,
    );
    const first = this.project(this.dataPoints[0], 0, valueMax);
    return `${top} L${last.x},${last.y} L${first.x},${first.y} Z`;
  }

  private project(point: DataPointModel, value: number, valueMax: number): { x: number; y: number } {
    const width = this.viewBox.width - this.viewBox.padding * 2;
    const height = this.viewBox.height - this.viewBox.padding * 2;
    const maxDay = Math.max(this.maxDay, 1);
    const normalizedX = point.day / maxDay;
    const clampedValue = valueMax === 0 ? 0 : value / valueMax;
    const x = this.viewBox.padding + normalizedX * width;
    const y = this.viewBox.height - this.viewBox.padding - clampedValue * height;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  }

}
