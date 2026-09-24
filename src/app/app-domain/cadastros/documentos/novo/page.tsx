import { File, Save, ArrowLeft, Building, User, Info, Upload } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import type { Prisma } from "@prisma/client";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function NovoDocumentoPage() {
  const { prisma } = await getTenantContextForModule("CADASTROS");
  const persons = await prisma.person.findMany({
    select: { id: true, fullName: true, cpf: true }
  });
  
  const companies = await prisma.company.findMany({
    select: { id: true, corporateName: true, cnpj: true }
  });

  async function createDocument(formData: FormData) {
    "use server";
    const { prisma } = await getTenantContextForModuleOperation("CADASTROS", "create");
    
    const title = formData.get("title") as string;
    const documentType = formData.get("documentType") as string;
    const validUntilStr = formData.get("validUntil") as string;
    const notes = formData.get("notes") as string;
    
    const personId = formData.get("personId") as string;
    const companyId = formData.get("companyId") as string;

    // Simulate file upload URL if a file was provided (normally would upload to S3/Blob)
    const file = formData.get("file") as File;
    let fileUrl = "/uploads/simulated-document.pdf";
    if (file && file.size > 0) {
      fileUrl = "/uploads/simulated-" + file.name;
    }

    const data: Prisma.DocumentUncheckedCreateInput = {
      title,
      documentType,
      notes: notes || null,
      fileUrl,
    };

    if (validUntilStr) data.validUntil = new Date(validUntilStr);

    if (personId) data.personId = personId;
    else if (companyId) data.companyId = companyId;

    await prisma.document.create({
      data
    });

    redirect("/cadastros/documentos");
  }

  return (
    <PageFrame className="max-w-4xl space-y-2">
      <PageHeader title="Novo Documento / Anexo" icon={<File className="size-4 shrink-0 text-rose-600" />} action={<Link href="/cadastros/documentos" className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />

      <form action={createDocument} className="space-y-2">
        <div className="rounded border border-slate-300 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-rose-700">
            <User className="size-4" />
            Vínculo (Obrigatório escolher um)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="personId" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Pessoa Física</label>
              <select id="personId" name="personId" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600">
                <option value="">Selecione a Pessoa Física...</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} - CPF: {p.cpf}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Building className="w-4 h-4 text-slate-400" /> Pessoa Jurídica</label>
              <select id="companyId" name="companyId" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600">
                <option value="">Selecione a Empresa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.corporateName} - CNPJ: {c.cnpj}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded border border-slate-300 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-rose-700">
            <File className="size-4" />
            Dados do Documento
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Título / Identificação *</label>
              <input type="text" id="title" name="title" required placeholder="Ex: CNH do Representante" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" />
            </div>

            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento *</label>
              <select id="documentType" name="documentType" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600">
                <option value="">Selecione...</option>
                <option value="RG">RG</option>
                <option value="CNH">CNH</option>
                <option value="Comprovante de Residência">Comprovante de Residência</option>
                <option value="Contrato Social">Contrato Social</option>
                <option value="Alvará">Alvará</option>
                <option value="Certidão Negativa">Certidão Negativa</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-slate-700 mb-1">Data de Validade</label>
              <input type="date" id="validUntil" name="validUntil" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Observações (Notes)</label>
              <textarea id="notes" name="notes" rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600"></textarea>
            </div>
          </div>
        </div>

        <div className="rounded border border-slate-300 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-rose-700">
            <Upload className="size-4" />
            Upload de Arquivo
          </div>
          
          <div className="cursor-pointer rounded border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition-colors hover:bg-slate-100">
            <input type="file" id="file" name="file" className="hidden" />
            <label htmlFor="file" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <span className="text-sm font-medium text-slate-700">Clique para selecionar ou arraste o arquivo aqui</span>
              <span className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Max 5MB)</span>
            </label>
          </div>
        </div>

        <div className="flex h-10 justify-end gap-2 rounded border border-slate-200 bg-slate-50 px-3">
          <Link href="/cadastros/documentos" className="inline-flex h-7 items-center self-center rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Cancelar
          </Link>
          <button type="submit" className="inline-flex h-7 items-center gap-1.5 self-center rounded bg-rose-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-800">
            <Save className="size-3.5" />
            Salvar Documento
          </button>
        </div>
      </form>
    </PageFrame>
  );
}
