import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { EsterType } from '../../generated/physiosim/v1/engine_pb';
import { CompoundModel } from '../../core/services/simulation-client';

export interface CompoundUpdatePayload {
  id: string;
  dosageMg: number;
}

@Component({
  selector: 'app-active-mixture',
  standalone: false,
  templateUrl: './active-mixture.html',
  styleUrl: './active-mixture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveMixture {
  @Input({ required: true }) compounds: CompoundModel[] = [];
  @Input() durationDays = 21;
  @Input() loading = false;

  @Output() compoundUpdated = new EventEmitter<CompoundUpdatePayload>();
  @Output() durationChanged = new EventEmitter<number>();
  @Output() refreshRequested = new EventEmitter<void>();

  readonly durationRange = { min: 7, max: 112 };
  readonly expandedCompoundId = signal<string | null>(null);

  trackByCompound = (_: number, compound: CompoundModel) => compound.id;

  toggleCompound(id: string): void {
    this.expandedCompoundId.update(current => current === id ? null : id);
  }

  onDosageSliderChange(compoundId: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.emitDosageUpdate(compoundId, value);
  }
// ...existing code...

  onDosageInputChange(compoundId: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.emitDosageUpdate(compoundId, value);
  }

  onDurationChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const clamped = this.clamp(value, this.durationRange.min, this.durationRange.max);
    this.durationChanged.emit(clamped);
  }

  triggerRun(): void {
    if (!this.loading) {
      this.refreshRequested.emit();
    }
  }

  formatEster(ester: EsterType): string {
    switch (ester) {
      case EsterType.ESTER_TYPE_PROPIONATE:
        return 'Propionate';
      case EsterType.ESTER_TYPE_ENANTHATE:
        return 'Enanthate';
      case EsterType.ESTER_TYPE_CYPIONATE:
        return 'Cypionate';
      case EsterType.ESTER_TYPE_DECANOATE:
        return 'Decanoate';
      case EsterType.ESTER_TYPE_UNDECANOATE:
        return 'Undecanoate';
      default:
        return 'Hybrid blend';
    }
  }

  private emitDosageUpdate(compoundId: string, nextValue: number): void {
    const normalized = this.clamp(Math.round(nextValue), 0, 400);
    this.compoundUpdated.emit({ id: compoundId, dosageMg: normalized });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

}
