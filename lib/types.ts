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

export const FigmaNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

export type FigmaNode = z.infer<typeof FigmaNodeSchema>;

export const FigmaNodeBindingSchema = z.object({
  node: FigmaNodeSchema,
  bindings: z.array(
    z.object({
      property: z.enum(["visibility"]),
      expression: z.string(),
    }),
  ),
});

export type FigmaNodeBinding = z.infer<typeof FigmaNodeBindingSchema>;

export const FigmaNodeBindingsSchema = z.array(FigmaNodeBindingSchema);

export type FigmaNodeBindings = z.infer<typeof FigmaNodeBindingsSchema>;
