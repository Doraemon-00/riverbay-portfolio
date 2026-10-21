import { z } from "zod";
import type { Observation } from "./portfolio";

export const draftRequestSchema = z.object({
  entryId:z.uuid(), revision:z.number().int().min(0), rating:z.number().int().min(1).max(3).nullable(),
  observations:z.array(z.object({ id:z.uuid(), date:z.iso.date().nullable(), text:z.string().trim().min(1).max(6000) })).min(1).max(100)
    .refine(items => new Set(items.map(o => o.id)).size === items.length)
    .refine(items => JSON.stringify(items).length <= 120000),
});
export type DraftRequest = z.infer<typeof draftRequestSchema>;
export type DraftResponse = { narrative:string; clarification:string; model:string; promptVersion:string; inputRevision:number };
export function observationSnapshot(rating:number | null, observations:Observation[]) {
  return { rating, observations:observations.filter(o => o.text.trim()).map(o => ({id:o.id,date:o.date,text:o.text.trim()})) };
}
