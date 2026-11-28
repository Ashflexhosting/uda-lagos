import { z } from "zod";

export const accountQuestionSchema = z.object({
  question: z.string().trim().min(1).max(1000),
}).strict();

export type AccountAnswer =
  | { answer: string; asOf: string; error: null }
  | { answer: null; asOf: null; error: string };