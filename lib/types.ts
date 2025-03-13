import { z } from "zod";

export const EventValueSchema = z.union([
  z.string(),
  z.object({
    target: z.string(),
    actions: z.union([z.string(), z.array(z.string())]).optional(),
  }),
]);

export type EventValue = z.infer<typeof EventValueSchema>;

export const StateValueSchema = z.object({
  on: z.record(z.string(), EventValueSchema),
});

export type StateValue = z.infer<typeof StateValueSchema>;

export const StateMachineSchema = z.object({
  initial: z.string(),
  states: z.array(z.tuple([z.string(), StateValueSchema])),
});

export type StateMachine = z.infer<typeof StateMachineSchema>;
