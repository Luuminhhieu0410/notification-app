interface ImportDataset {
  dataset?: { id?: unknown };
  defaults?: Record<string, unknown>;
  items?: unknown[];
}

interface MappedContent {
  contentType: string;
}

declare const contract: {
  validateDataset(data: ImportDataset): void;
  countByContentType(items: MappedContent[]): Record<string, number>;
};

export = contract;
