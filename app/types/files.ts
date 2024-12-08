export type FileCategory =
  | "Genetics"
  | "Nursery"
  | "Outplanting"
  | "Monitoring";

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
  eventCenterpoint: string;
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
  category: string;
  uploadDate: string;
  status: FileStatus;
}
