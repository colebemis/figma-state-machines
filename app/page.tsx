"use client";

import IconButton from "@/components/icon-button";
import { State } from "@/components/state";
import { StateEditor } from "@/components/state-editor";
import { UnresolvedState } from "@/components/unresolved-state";
import { parseEventValue } from "@/lib/parse-event-value";
import { StateMachine, StateValue } from "@/lib/types";
import { useVariable } from "@/lib/use-variable";
import { ArrowUUpLeft, CaretDown, Plus } from "@phosphor-icons/react";
import React from "react";

const DEMO_STATE_MACHINE: StateMachine = {
  initial: "empty",
  states: [
    [
      "empty",
      {
        on: {
          CHANGE: "validating",
        },
      },
    ],
    [
      "validating",
      {
        on: {
          VALID: "valid",
          INVALID: "invalid",
        },
      },
    ],
    [
      "valid",
      {
        on: {
          CHANGE: "validating",
        },
      },
    ],
    [
      "invalid",
      {
        on: {
          CHANGE: "validating",
        },
      },
    ],
  ],
};

export default function Plugin() {
  const [stateMachine, setStateMachine] =
    React.useState<StateMachine>(DEMO_STATE_MACHINE);
  const [currentState, setCurrentState] = useVariable(
    "currentState",
    "STRING",
    stateMachine.initial
  );
  const [hoverState, setHoverState] = React.useState<string | null>(null);
  const [isAddingNewState, setIsAddingNewState] = React.useState(false);

  // Calculate unreachable states
  const unreachableStates = React.useMemo(() => {
    const reachable = new Set<string>();
    const queue = [stateMachine.initial];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);

      const state = stateMachine.states.find(([s]) => s === current)?.[1];
      if (!state) continue;

      Object.values(state.on).forEach((event) => {
        const { target } = parseEventValue(event);
        if (!reachable.has(target)) {
          queue.push(target);
        }
      });
    }

    return stateMachine.states
      .map(([state]) => state)
      .filter((state) => !reachable.has(state));
  }, [stateMachine]);

  // Calculate unresolved states (referenced but undefined)
  const unresolvedStates = React.useMemo(() => {
    const definedStates = new Set(stateMachine.states.map(([state]) => state));
    const referenced = new Set<string>();

    // Collect all referenced states from events
    stateMachine.states.forEach(([_, stateValue]) => {
      Object.values(stateValue.on).forEach((event) => {
        const { target } = parseEventValue(event);
        if (!definedStates.has(target)) {
          referenced.add(target);
        }
      });
    });

    return Array.from(referenced);
  }, [stateMachine]);

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden h-screen">
      <div className="pl-4 pr-2 h-10 flex items-center justify-between border-b border-border">
        <span className="font-bold">States</span>
      </div>
      <div className="grid grid-rows-[1fr_auto] overflow-hidden">
        <div className="overflow-auto">
          <div className="grid gap-2 p-2">
            <div className="flex flex-col gap-1 p-2 pr-0">
              <label htmlFor="initial-state" className="text-text-secondary">
                Initial state
              </label>
              <div className="flex items-center gap-2 w-full">
                <div className="w-full relative">
                  <select
                    id="initial-state"
                    value={stateMachine.initial}
                    onChange={(e) => {
                      setStateMachine((prev) => ({
                        ...prev,
                        initial: e.target.value,
                      }));
                    }}
                    className="bg-[transparent] ring-1 ring-inset ring-border rounded pl-2 pr-6 py-1 outline-none focus:ring-border-selected appearance-none w-full"
                  >
                    {stateMachine.states.map(([state]) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <CaretDown size={12} className="absolute right-1.5 top-1.5" />
                </div>
                <IconButton
                  aria-label="Reset state machine"
                  onClick={() => setCurrentState(stateMachine.initial)}
                >
                  <ArrowUUpLeft size={16} />
                </IconButton>
              </div>
            </div>
            {stateMachine.states.map(([state, { on: events }]) => (
              <State
                key={state}
                stateName={state}
                current={currentState === state}
                hover={hoverState === state}
                initial={stateMachine.initial === state}
                unreachable={unreachableStates.includes(state)}
                stateMachine={stateMachine}
                unresolvedStates={unresolvedStates}
                onEventMouseEnter={(event) =>
                  setHoverState(parseEventValue(events[event]).target)
                }
                onEventMouseLeave={() => setHoverState(null)}
                onEventClick={(event) => {
                  setHoverState(null);

                  const { target, actions } = parseEventValue(events[event]);

                  if (target) {
                    setCurrentState(target);
                  }

                  console.log(actions);
                }}
                onChange={(newStateName, newStateValue) => {
                  setStateMachine((prev) => {
                    // Create a new state machine with updated state and events
                    const updatedStates: Array<[string, StateValue]> =
                      prev.states.map(([s, stateValue]) => {
                        if (s === state) {
                          return [newStateName, newStateValue];
                        }
                        return [s, stateValue];
                      });

                    // If the state name changed, we need to update references
                    if (newStateName !== state) {
                      // Update target references in other states' events
                      const newStates: Array<[string, StateValue]> =
                        updatedStates.map(([s, stateValue]) => {
                          const updatedEvents = { ...stateValue.on };
                          Object.keys(updatedEvents).forEach((eventName) => {
                            const eventValue = parseEventValue(
                              updatedEvents[eventName]
                            );
                            if (eventValue.target === state) {
                              // Use shorthand if there are no actions
                              if (eventValue.actions.length === 0) {
                                updatedEvents[eventName] = newStateName;
                              } else {
                                updatedEvents[eventName] = {
                                  target: newStateName,
                                  actions: eventValue.actions,
                                };
                              }
                            }
                          });
                          return [s, { on: updatedEvents }];
                        });

                      // Update initial state if needed
                      const newInitial =
                        prev.initial === state ? newStateName : prev.initial;

                      return {
                        ...prev,
                        states: newStates,
                        initial: newInitial,
                      };
                    }

                    return {
                      ...prev,
                      states: updatedStates,
                    };
                  });

                  // Update current state if it was the renamed state
                  if (currentState === state && newStateName !== state) {
                    setCurrentState(newStateName);
                  }
                }}
                onRemove={() => {
                  // Remove the state from the state machine
                  setStateMachine((prev) => {
                    // Remove the state and keep the rest
                    const remainingStates: Array<[string, StateValue]> =
                      prev.states.filter(([s]) => s !== state);

                    // Determine if we need a new initial state
                    const needsNewInitial =
                      prev.initial === state && remainingStates.length > 0;

                    return {
                      ...prev,
                      states: remainingStates,
                      // Set a new initial state if needed
                      ...(needsNewInitial
                        ? { initial: remainingStates[0][0] }
                        : {}),
                    };
                  });

                  // Update current state if it was the removed state
                  if (currentState === state) {
                    const newCurrentState =
                      stateMachine.states.find(([s]) => s !== state)?.[0] || "";
                    setCurrentState(newCurrentState);
                  }
                }}
              />
            ))}
            {unresolvedStates.length > 0 &&
              unresolvedStates.map((state) => (
                <UnresolvedState
                  key={state}
                  stateName={state}
                  stateMachine={stateMachine}
                  onCreate={(stateName, stateValue) => {
                    setStateMachine((prev) => ({
                      ...prev,
                      states: [...prev.states, [stateName, stateValue]],
                    }));
                  }}
                />
              ))}
            {isAddingNewState ? (
              <StateEditor
                initial={false}
                onCancel={() => setIsAddingNewState(false)}
                stateMachine={stateMachine}
                unreachable={false}
                onSave={(stateName, stateValue) => {
                  setStateMachine((prev) => {
                    const isFirstState = prev.states.length === 0;
                    return {
                      ...prev,
                      states: [
                        ...prev.states,
                        [stateName, stateValue] as [string, StateValue],
                      ],
                      // Make it the initial state if it's the first one
                      ...(isFirstState ? { initial: stateName } : {}),
                    };
                  });

                  // Set as current state if it's the first one
                  if (stateMachine.states.length === 0) {
                    setCurrentState(stateName);
                  }

                  setIsAddingNewState(false);
                }}
              />
            ) : (
              <button
                className="px-2 h-9 hover:bg-bg-secondary rounded text-left flex items-center gap-2"
                onClick={() => setIsAddingNewState(true)}
              >
                <Plus size={16} />
                Add state
              </button>
            )}
          </div>
        </div>
        <div className="border-t border-border">
          <div className="pl-4 pr-2 h-10 flex items-center justify-between text-text-secondary">
            <span className="font-bold">Context</span>
            <IconButton aria-label="Add context value">
              <Plus size={16} />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
