export type FileCategory =
  | "Genetics"
  | "Nursery"
  | "Outplanting"
  | "Monitoring"
  | "GeneticsMapping";

export interface BaseFileMetadata {
  id: string;
  fileName: string;
  uploadDate: string;
  category: FileCategory;
  uploaderName: string;
  uploaderEmail: string;
  fileUrl: string;
}

export interface GeneticsFile extends BaseFileMetadata {
  category: "Genetics";
}

export interface NurseryFile extends BaseFileMetadata {
  category: "Nursery";
  organization: string;
}

export interface OutplantingFile extends BaseFileMetadata {
  category: "Outplanting";
  reefName: string;
  latitude: string;
  longitude: string;
  siteName: string;
  eventName: string;
}

export interface MonitoringFile extends BaseFileMetadata {
  category: "Monitoring";
  coordinates: string;
  eventId: string;
}

export type FileStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "DELETED";

export interface FileData {
  id: string;
  fileName: string;
  category: FileCategory;
  uploadDate: string;
  status: FileStatus;
}

export type GeneticDetails = {
  notes?: string;
  location?: string;
  source?: string;
  dateCollected?: string;
  [key: string]: string | undefined;
};

export interface OutplantResponse {
  id: string;
  coordinates: string;
  contact: string;
  date: string;
  reefName: string;
  siteName: string;
  eventName: string;
  genetics: {
    genotype: string;
    uniqueGenotype: string;
    quantity: number;
    assessionId: string;
    grouping: string;
    localId: string;
    species: string;
    geneticDetails?: GeneticDetails;
  }[];
}

export interface PopupInfoWithMultipleEvents extends OutplantResponse {
  hasMultipleEvents: boolean;
  allOutplants: OutplantResponse[];
}

export interface Genetic {
  genotype: string;
  uniqueGenotype?: string;
  quantity: number;
  accessionNumber?: string;
  assessionId?: string;
  localId?: string;
  grouping?: string;
  species?: string;
}
