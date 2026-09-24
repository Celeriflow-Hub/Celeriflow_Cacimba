import { OmbudsmanDetailView } from "../../../atendimento/ouvidoria/[id]/page";

export const dynamic = "force-dynamic";

export default async function OmbudsmanProtocolosDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const { id } = await params;
  const requestedReturnTo = searchParams ? await searchParams : {};
  const rawReturnTo = Array.isArray(requestedReturnTo.returnTo) ? requestedReturnTo.returnTo[0] : requestedReturnTo.returnTo;
  const returnTo = rawReturnTo?.startsWith("/protocolos/ouvidoria") ? rawReturnTo : undefined;
  return <OmbudsmanDetailView id={id} origin="protocolos" returnTo={returnTo} />;
}
