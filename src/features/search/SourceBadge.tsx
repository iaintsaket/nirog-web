import type { Offer } from "@/api/client";
import { sourceLabel } from "@/lib/format";

export function SourceBadge({ source }: { source: Offer["source"] }) {
  return <span className={`badge badge-${source}`}>{sourceLabel(source)}</span>;
}
