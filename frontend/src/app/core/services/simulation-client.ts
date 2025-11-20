import { Injectable, computed, signal } from '@angular/core';
import { SimulationEngineClient } from '../../generated/physiosim/v1/EngineServiceClientPb';
import {
  Compound,
  DataPoint,
  EsterType,
  SimulationRequest,
} from '../../generated/physiosim/v1/engine_pb';
import { environment } from '../../../environments/environment';

export type CompoundModel = Compound.AsObject;
export type DataPointModel = DataPoint.AsObject;
export type SimulationRequestModel = SimulationRequest.AsObject;

@Injectable({ providedIn: 'root' })
export class SimulationClientService {
  private readonly client = new SimulationEngineClient(environment.grpcWebGatewayUrl);
  private readonly defaultCompounds: CompoundModel[] = [
    {
      id: 't-prop',
      name: 'Testosterone Propionate',
      dosageMg: 75,
      ester: EsterType.ESTER_TYPE_PROPIONATE,
      absorptionK: 1.35,
      eliminationK: 0.42,
    },
    {
      id: 'npp',
      name: 'Nandrolone Phenylpropionate',
      dosageMg: 100,
      ester: EsterType.ESTER_TYPE_PROPIONATE,
      absorptionK: 0.92,
      eliminationK: 0.31,
    },
    {
      id: 'mast-e',
      name: 'Drostanolone Enanthate',
      dosageMg: 80,
      ester: EsterType.ESTER_TYPE_ENANTHATE,
      absorptionK: 0.74,
      eliminationK: 0.24,
    },
  ];

  private readonly _compounds = signal<CompoundModel[]>(this.cloneCompounds(this.defaultCompounds));
  private readonly _durationDays = signal(21);
  private readonly _dataPoints = signal<DataPointModel[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly compounds = computed(() => this._compounds());
  readonly dataPoints = computed(() => this._dataPoints());
  readonly durationDays = computed(() => this._durationDays());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async runCurrentConfiguration(): Promise<void> {
    return this.runSimulation({
      compoundsList: this._compounds().map((compound) => ({ ...compound })),
      durationDays: this._durationDays(),
    });
  }

  async runSimulation(request: SimulationRequestModel): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const response = await this.client.runSimulation(this.buildRequest(request));
      this._dataPoints.set(
        response.getDataPointsList().map((point: DataPoint) => point.toObject()),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Simulation failed';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  updateCompound(id: string, changes: Partial<CompoundModel>): void {
    this._compounds.update((list) =>
      list.map((compound) =>
        compound.id === id ? { ...compound, ...changes } : compound,
      ),
    );
  }

  setDurationDays(days: number): void {
    const normalized = Math.max(1, Math.min(112, Math.round(days)));
    this._durationDays.set(normalized);
  }

  resetToDefaults(): void {
    this._compounds.set(this.cloneCompounds(this.defaultCompounds));
    this._durationDays.set(21);
  }

  private buildRequest(request: SimulationRequestModel): SimulationRequest {
    const req = new SimulationRequest();
    req.setDurationDays(request.durationDays);
    const compounds = request.compoundsList.map((source: CompoundModel) => {
      const compound = new Compound();
      compound.setId(source.id);
      compound.setName(source.name);
      compound.setDosageMg(source.dosageMg);
      compound.setEster(source.ester);
      compound.setAbsorptionK(source.absorptionK);
      compound.setEliminationK(source.eliminationK);
      return compound;
    });
    req.setCompoundsList(compounds);
    return req;
  }

  private cloneCompounds(compounds: CompoundModel[]): CompoundModel[] {
    return compounds.map((compound) => ({ ...compound }));
  }
}
