export type SupplierEvidence = {
  title: string;
  documentType: string;
  status: string;
  validUntil: string | null;
};

export type SupplierListItem = {
  id: string;
  category: string | null;
  businessBranch: string | null;
  bankData: string | null;
  certificationsValidUntil: string | null;
  notes: string | null;
  status: string;
  person: {
    fullName: string;
    cpf: string;
    documents: SupplierEvidence[];
  } | null;
  company: {
    corporateName: string;
    tradeName: string | null;
    cnpj: string;
    companyType: string | null;
    primaryCnae: string | null;
    secondaryCnaes: string | null;
    documents: SupplierEvidence[];
  } | null;
};
