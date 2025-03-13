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

export type StateMachine = {
  initial: string;
  states: Array<[string, StateValue]>;
};
