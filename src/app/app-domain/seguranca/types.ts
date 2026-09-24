export type SegMobKind = "guarda" | "ocorrencia" | "infracao" | "registro";

export type SegMobItem = {
  id: string;
  kind: SegMobKind;
  code: string;
  title: string;
  type: string;
  status: string;
  isActive: boolean;
  location?: string | null;
  district?: string | null;
  responsible?: string | null;
  priority?: string | null;
  date?: Date | string | null;
  description?: string | null;
  plate?: string | null;
  value?: number | null;
  category?: string | null;
  relatedModule?: string | null;
  relatedId?: string | null;
};

export type SegMobFormData = {
  code: string;
  title: string;
  type: string;
  status: string;
  isActive: boolean;
  location?: string;
  district?: string;
  responsible?: string;
  priority?: string;
  date?: string;
  description?: string;
  plate?: string;
  value?: number;
  category?: string;
  relatedModule?: string;
  relatedId?: string;
};

export type SegMobPageConfig = {
  title: string;
  description: string;
  newLabel: string;
  kind: SegMobKind;
  categories?: string[];
  typeOptions: string[];
  statusOptions: string[];
  priorityOptions?: string[];
  codeLabel: string;
  titleLabel: string;
  typeLabel?: string;
  locationLabel?: string;
  showDate?: boolean;
  showPlate?: boolean;
  showValue?: boolean;
  showResponsible?: boolean;
  showPriority?: boolean;
  showCategory?: boolean;
  accentClass: string;
};