export interface IDeviceData {
  bus: string;
  manufacturer: string;
  model: string;
  device: string;
  generic: string;
}

export interface IMountData {
  generic: string;
  location: string;
  serial: string;
}

export interface IStatusData {
  device: IDeviceData | null;
  mount: IMountData | null;
  tape: boolean;
}
