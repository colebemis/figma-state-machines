import { EventValue } from "./types";

export function parseEventValue(value: EventValue) {
  if (typeof value === "string") {
    return { target: value, actions: [] };
  }

  const { target = "", actions = [] } = value;

  return { target, actions: Array.isArray(actions) ? actions : [actions] };
}
