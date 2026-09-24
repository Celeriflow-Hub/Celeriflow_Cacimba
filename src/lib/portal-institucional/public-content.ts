import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type InstitutionalContact = {
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
};

export type PublicPortalNews = {
  title: string;
  subtitle: string | null;
  slug: string;
  content: string;
  publishedAt: Date;
};

export type PublicPortalPage = {
  title: string;
  slug: string;
  content: string;
};

type PortalNewsRecord = Omit<PublicPortalNews, "publishedAt"> & { publishedAt: Date | null };

const demonstrationInstitution: InstitutionalContact = {
  name: "Prefeitura Municipal de Divino São Lourenço",
  address: null,
  city: "Divino São Lourenço",
  state: "ES",
  phone: null,
  email: null,
  website: null,
};

function isUnavailablePortalSchema(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ["P2021", "P2022"].includes(error.code);
}

async function publishedDataOrFallback<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (isUnavailablePortalSchema(error)) return fallback;
    throw error;
  }
}

function publishedNewsWhere(now: Date) {
  return {
    status: "Publicado",
    publishedAt: { lte: now },
  };
}

function toPublicNews(record: PortalNewsRecord): PublicPortalNews | null {
  return record.publishedAt ? { ...record, publishedAt: record.publishedAt } : null;
}

export async function getInstitutionalPortalHome() {
  const now = new Date();
  const [institution, latestNews, pages] = await Promise.all([
    publishedDataOrFallback(
      () => prisma.institution.findFirst({
        select: {
          name: true,
          address: true,
          city: true,
          state: true,
          phone: true,
          email: true,
          website: true,
        },
      }),
      null,
    ),
    publishedDataOrFallback<PublicPortalNews[]>(
      async () => {
        const records = await prisma.portalNews.findMany({
          where: publishedNewsWhere(now),
          select: { title: true, subtitle: true, slug: true, content: true, publishedAt: true },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 3,
        });
        return records.flatMap((record) => {
          const news = toPublicNews(record);
          return news ? [news] : [];
        });
      },
      [],
    ),
    publishedDataOrFallback(
      () => prisma.portalPage.findMany({
        where: { status: "Publicado" },
        select: { title: true, slug: true, content: true },
        orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
        take: 6,
      }),
      [] as PublicPortalPage[],
    ),
  ]);

  return {
    institution: institution ?? demonstrationInstitution,
    latestNews,
    pages,
  };
}

export async function getPublishedNewsPage(requestedPage: number, pageSize = 12) {
  const now = new Date();
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = publishedNewsWhere(now);
  const result = await publishedDataOrFallback<{ items: PublicPortalNews[]; total: number; currentPage: number; totalPages: number }>(
    async () => {
      const total = await prisma.portalNews.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const currentPage = Math.min(page, totalPages);
      const records = await prisma.portalNews.findMany({
        where,
        select: { title: true, subtitle: true, slug: true, content: true, publishedAt: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      });
      const items = records.flatMap((record) => {
        const news = toPublicNews(record);
        return news ? [news] : [];
      });
      return { items, total, currentPage, totalPages };
    },
    { items: [] as PublicPortalNews[], total: 0, currentPage: 1, totalPages: 1 },
  );

  return result;
}

export async function getPublishedNewsBySlug(slug: string) {
  return publishedDataOrFallback<PublicPortalNews | null>(
    async () => {
      const record = await prisma.portalNews.findFirst({
        where: {
          slug,
          status: "Publicado",
          publishedAt: { lte: new Date() },
        },
        select: { title: true, subtitle: true, slug: true, content: true, publishedAt: true },
      });
      return record ? toPublicNews(record) : null;
    },
    null,
  );
}

export async function getPublishedPortalPageBySlug(slug: string) {
  return publishedDataOrFallback(
    () => prisma.portalPage.findFirst({
      where: { slug, status: "Publicado" },
      select: { title: true, slug: true, content: true },
    }),
    null,
  );
}

export function formatPortalDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(value);
}

export function contentExcerpt(content: string, maximumLength = 156) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximumLength) return normalized;
  return `${normalized.slice(0, maximumLength).trimEnd()}…`;
}

export function safeExternalUrl(value: string | null) {
  if (!value?.trim()) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
