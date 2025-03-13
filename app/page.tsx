"use client";

import IconButton from "@/components/icon-button";
import { State } from "@/components/state";
import { StateEditor } from "@/components/state-editor";
import { UnresolvedState } from "@/components/unresolved-state";
import { parseEventValue } from "@/lib/parse-event-value";
import { StateMachine, StateMachineSchema, StateValue } from "@/lib/types";
import { useRootPluginData } from "@/lib/use-plugin-data";
import { useVariable } from "@/lib/use-variable";
import {
  ArrowUUpLeft,
  CaretDown,
  Eye,
  IconContext,
  Minus,
  Plus,
  Square,
} from "@phosphor-icons/react";
import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Select } from "@/components/select";

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

function TabTrigger(props: Tabs.TabsTriggerProps) {
  return (
    <Tabs.Trigger
      {...props}
      className="h-6 px-2 rounded font-bold data-[state=inactive]:text-text-secondary data-[state=active]:bg-bg-secondary hover:bg-bg-secondary"
    />
  );
}

export default function Plugin() {
  const [stateMachine, setStateMachine] = useRootPluginData({
    key: "stateMachine",
    schema: StateMachineSchema,
    defaultValue: DEMO_STATE_MACHINE,
  });
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
    <IconContext.Provider value={{ size: 16 }}>
      <Tabs.Root
        defaultValue="states"
        className="grid grid-rows-[auto_1fr] overflow-hidden h-screen"
      >
        <Tabs.List className="p-2 flex items-center gap-1 border-b border-border">
          <TabTrigger value="states">States</TabTrigger>
          <TabTrigger value="ui">UI</TabTrigger>
        </Tabs.List>
        <Tabs.Content
          value="states"
          className="data-[state=active]:grid grid-rows-[1fr_auto] overflow-hidden"
        >
          <div className="overflow-auto">
            <div className="grid gap-2 p-2">
              <div className="flex flex-col gap-1 p-2 pr-0">
                <label htmlFor="initial-state" className="text-text-secondary">
                  Initial state
                </label>
                <div className="flex items-center gap-2 w-full">
                  <Select
                    id="initial-state"
                    value={stateMachine.initial}
                    onChange={(e) => {
                      setStateMachine((prev) => ({
                        ...prev,
                        initial: e.target.value,
                      }));
                    }}
                  >
                    {stateMachine.states.map(([state]) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </Select>
                  <IconButton
                    aria-label="Reset state machine"
                    onClick={() => setCurrentState(stateMachine.initial)}
                  >
                    <ArrowUUpLeft />
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
                        stateMachine.states.find(([s]) => s !== state)?.[0] ||
                        "";
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
                  <Plus />
                  Add state
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-border">
            <div className="pl-4 pr-2 h-10 flex items-center justify-between text-text-secondary">
              <span className="font-bold">Context</span>
              <IconButton aria-label="Add context value">
                <Plus />
              </IconButton>
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content value="ui">
          <div className="p-2">
            <UIBindings currentState={currentState} />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </IconContext.Provider>
  );
}

type NodeBinding = {
  nodeId: string;
  nodeName: string;
  bindings: Array<{
    property: "visibility";
    expression: string;
  }>;
};

function UIBindings({ currentState }: { currentState: string }) {
  const [nodeBindings, setNodeBindings] = React.useState<Array<NodeBinding>>([
    {
      nodeId: "1",
      nodeName: "Frame",
      bindings: [
        {
          property: "visibility",
          expression: "currentState === 'valid'",
        },
      ],
    },
  ]);

  return (
    <div>
      {nodeBindings.map((nodeBinding) => (
        <div key={nodeBinding.nodeId} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 h-6 px-2 hover:bg-bg-secondary rounded flex-grow">
              <Square />
              <span className="font-bold">{nodeBinding.nodeName}</span>
            </button>
            <IconButton aria-label="Add binding">
              <Plus />
            </IconButton>
          </div>
          <div className="flex flex-col gap-2 pl-8">
            {nodeBinding.bindings.map((binding) => (
              <div
                key={binding.property}
                className=" items-center gap-2 grid grid-cols-[100px_1fr_auto]"
              >
                <Select value={binding.property} onChange={() => {}}>
                  <option value="visibility">Visibility</option>
                </Select>
                <ExpressionInput
                  defaultExpression={binding.expression}
                  scope={{ currentState }}
                />
                <IconButton aria-label="Remove binding">
                  <Minus />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function evaluateExpression(expression: string, scope: Record<string, any>) {
  try {
    const fn = new Function(...Object.keys(scope), `return ${expression}`);
    return fn(...Object.values(scope));
  } catch (error) {
    console.warn(error);
    return undefined;
  }
}

function ExpressionInput({
  defaultExpression,
  scope,
}: {
  defaultExpression: string;
  scope: Record<string, any>;
}) {
  const [expression, setExpression] = React.useState(defaultExpression);

  const value = React.useMemo(() => {
    return evaluateExpression(expression, scope);
  }, [expression, scope]);

  return (
    <div className="flex relative">
      <input
        type="text"
        placeholder="Enter an expression"
        className="w-full font-mono bg-bg-secondary rounded px-2 h-6 outline-none hover:ring-1 hover:ring-inset hover:ring-border focus:ring-1 focus:ring-inset focus:ring-border-selected placeholder:text-text-secondary"
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
      />
      <div className="text-text-secondary font-mono absolute right-2 top-1/2 -translate-y-1/2">
        {JSON.stringify(value)}
      </div>
    </div>
  );
}
