import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SimulationClientService } from './core/services/simulation-client';

interface CompoundUpdatePayload {
  id: string;
  dosageMg: number;
}

export type AppTab = 'explore' | 'optimize' | 'signaling';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly simulationClient = inject(SimulationClientService);
  
  readonly activeTab = signal<AppTab>('explore');

  readonly vm = computed(() => ({
    compounds: this.simulationClient.compounds(),
    dataPoints: this.simulationClient.dataPoints(),
    loading: this.simulationClient.loading(),
    durationDays: this.simulationClient.durationDays(),
    error: this.simulationClient.error(),
  }));

  ngOnInit(): void {
    void this.simulationClient.runCurrentConfiguration();
  }

  setActiveTab(tab: AppTab): void {
    this.activeTab.set(tab);
  }

  onCompoundUpdated(change: CompoundUpdatePayload): void {
    this.simulationClient.updateCompound(change.id, { dosageMg: change.dosageMg });
  }

  onDurationChanged(days: number): void {
    this.simulationClient.setDurationDays(days);
  }

  runSimulation(): void {
    void this.simulationClient.runCurrentConfiguration();
  }
}
