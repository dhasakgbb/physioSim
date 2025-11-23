import type { Context, Dispatch, FC, ReactNode, SetStateAction } from "react";

export interface StackContextValue {
  stack: Array<any>;
  setStack: (next: any) => void;
  userProfile: any;
  setUserProfile: Dispatch<SetStateAction<any>>;
  inspectedCompound: any;
  setInspectedCompound: Dispatch<SetStateAction<any>>;
  viewMode: string;
  setViewMode: (mode: string) => void;
  metrics: any;
  handleAddCompound: (compoundKey: string) => void;
  handleDoseChange: (compoundKey: string, newDose: number) => void;
  handleRemove: (compoundKey: string) => void;
  handleEsterChange: (compoundKey: string, newEster: string) => void;
  handleFrequencyChange: (compoundKey: string, newFrequency: number) => void;
  handleSetCompoundOpen: (compoundKey: string, isOpen: boolean) => void;
  toggleSupportProtocol: (protocolKey: string) => void;
}

export declare const useStack: () => StackContextValue;
export declare const StackProvider: FC<{ children: ReactNode }>;
export declare const StackContext: Context<StackContextValue | null>;
