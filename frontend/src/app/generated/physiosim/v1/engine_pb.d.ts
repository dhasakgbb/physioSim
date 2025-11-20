import * as jspb from 'google-protobuf'



export class Compound extends jspb.Message {
  getId(): string;
  setId(value: string): Compound;

  getName(): string;
  setName(value: string): Compound;

  getDosageMg(): number;
  setDosageMg(value: number): Compound;

  getEster(): EsterType;
  setEster(value: EsterType): Compound;

  getAbsorptionK(): number;
  setAbsorptionK(value: number): Compound;

  getEliminationK(): number;
  setEliminationK(value: number): Compound;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Compound.AsObject;
  static toObject(includeInstance: boolean, msg: Compound): Compound.AsObject;
  static serializeBinaryToWriter(message: Compound, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Compound;
  static deserializeBinaryFromReader(message: Compound, reader: jspb.BinaryReader): Compound;
}

export namespace Compound {
  export type AsObject = {
    id: string;
    name: string;
    dosageMg: number;
    ester: EsterType;
    absorptionK: number;
    eliminationK: number;
  };
}

export class SimulationRequest extends jspb.Message {
  getCompoundsList(): Array<Compound>;
  setCompoundsList(value: Array<Compound>): SimulationRequest;
  clearCompoundsList(): SimulationRequest;
  addCompounds(value?: Compound, index?: number): Compound;

  getDurationDays(): number;
  setDurationDays(value: number): SimulationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SimulationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SimulationRequest): SimulationRequest.AsObject;
  static serializeBinaryToWriter(message: SimulationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SimulationRequest;
  static deserializeBinaryFromReader(message: SimulationRequest, reader: jspb.BinaryReader): SimulationRequest;
}

export namespace SimulationRequest {
  export type AsObject = {
    compoundsList: Array<Compound.AsObject>;
    durationDays: number;
  };
}

export class DataPoint extends jspb.Message {
  getDay(): number;
  setDay(value: number): DataPoint;

  getSerumConcentration(): number;
  setSerumConcentration(value: number): DataPoint;

  getAnabolicScore(): number;
  setAnabolicScore(value: number): DataPoint;

  getToxicityScore(): number;
  setToxicityScore(value: number): DataPoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DataPoint.AsObject;
  static toObject(includeInstance: boolean, msg: DataPoint): DataPoint.AsObject;
  static serializeBinaryToWriter(message: DataPoint, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DataPoint;
  static deserializeBinaryFromReader(message: DataPoint, reader: jspb.BinaryReader): DataPoint;
}

export namespace DataPoint {
  export type AsObject = {
    day: number;
    serumConcentration: number;
    anabolicScore: number;
    toxicityScore: number;
  };
}

export class SimulationResponse extends jspb.Message {
  getDataPointsList(): Array<DataPoint>;
  setDataPointsList(value: Array<DataPoint>): SimulationResponse;
  clearDataPointsList(): SimulationResponse;
  addDataPoints(value?: DataPoint, index?: number): DataPoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SimulationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SimulationResponse): SimulationResponse.AsObject;
  static serializeBinaryToWriter(message: SimulationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SimulationResponse;
  static deserializeBinaryFromReader(message: SimulationResponse, reader: jspb.BinaryReader): SimulationResponse;
}

export namespace SimulationResponse {
  export type AsObject = {
    dataPointsList: Array<DataPoint.AsObject>;
  };
}

export enum EsterType {
  ESTER_TYPE_UNSPECIFIED = 0,
  ESTER_TYPE_ENANTHATE = 1,
  ESTER_TYPE_PROPIONATE = 2,
  ESTER_TYPE_CYPIONATE = 3,
  ESTER_TYPE_DECANOATE = 4,
  ESTER_TYPE_UNDECANOATE = 5,
}
