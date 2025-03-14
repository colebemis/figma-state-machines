"use client";

import IconButton from "@/components/icon-button";
import { Select } from "@/components/select";
import { State } from "@/components/state";
import { StateEditor } from "@/components/state-editor";
import { UnresolvedState } from "@/components/unresolved-state";
import { evaluateExpression } from "@/lib/evaluate-expression";
import { figmaAPI } from "@/lib/figma-api";
import { parseEventValue } from "@/lib/parse-event-value";
import {
  FigmaNode,
  FigmaNodeBindings,
  FigmaNodeBindingsSchema,
  StateMachine,
  StateMachineSchema,
  StateValue,
} from "@/lib/types";
import { useRootPluginData } from "@/lib/use-plugin-data";
import { useVariable } from "@/lib/use-variable";
import {
  ArrowUUpLeft,
  CaretRight,
  IconContext,
  Minus,
  Plus,
} from "@phosphor-icons/react";
import { z } from "zod";
// import * as Tabs from "@radix-ui/react-tabs";
import { NodeIcon } from "@/components/node-icon";
import clsx from "clsx";
import React from "react";
import { UIBindings } from "@/components/ui-bindings";

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

// function TabTrigger(props: Tabs.TabsTriggerProps) {
//   return (
//     <Tabs.Trigger
//       {...props}
//       className="h-6 px-2 rounded font-bold data-[state=inactive]:text-text-secondary data-[state=active]:bg-bg-secondary hover:bg-bg-secondary"
//     />
//   );
// }

export default function Plugin() {
  const [stateMachine, setStateMachine] = useRootPluginData({
    key: "stateMachine",
    schema: StateMachineSchema,
    defaultValue: DEMO_STATE_MACHINE,
  });
  const [nodeBindings, setNodeBindings] = useRootPluginData({
    key: "nodeBindings",
    schema: FigmaNodeBindingsSchema,
    defaultValue: [],
  });
  const [currentState, setCurrentState] = useRootPluginData({
    key: "currentState",
    schema: z.string(),
    defaultValue: stateMachine.initial,
  });
  const [isUISectionExpanded, setIsUISectionExpanded] = useRootPluginData({
    key: "isUISectionExpanded",
    schema: z.boolean(),
    defaultValue: true,
  });

  const [nextState, setNextState] = React.useState<string | null>(null);
  const [isAddingNewState, setIsAddingNewState] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<FigmaNode | null>(
    null,
  );

  React.useEffect(() => {
    for (const nodeBinding of nodeBindings) {
      for (const binding of nodeBinding.bindings) {
        const value = evaluateExpression(binding.expression, {
          state: currentState,
        });

        // Skip if the expression is undefined
        if (value === undefined) continue;

        console.log(nodeBinding.node.id, binding.property, value);
        switch (binding.property) {
          case "visibility":
            if (typeof value !== "boolean") continue;

            figmaAPI.run(
              async (figma, { nodeId, visible }) => {
                const node = figma.getNodeById(nodeId);
                if (node && node.type !== "DOCUMENT" && node.type !== "PAGE") {
                  node.visible = visible;
                }
              },
              { nodeId: nodeBinding.node.id, visible: value },
            );
        }
      }
    }
  }, [nodeBindings, currentState]);

  React.useEffect(() => {
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (message.type === "SELECTED_NODE") {
        setSelectedNode(message.node);

        // If we have a selected node and it exists in our node bindings, update its name
        if (message.node) {
          setNodeBindings((prev) => {
            return prev.map((binding) => {
              if (binding.node.id === message.node.id) {
                return {
                  ...binding,
                  node: {
                    ...binding.node,
                    name: message.node.name,
                  },
                };
              }
              return binding;
            });
          });
        }
      }
    };

    // Send UI_READY message when component mounts
    parent.postMessage(
      {
        pluginMessage: {
          type: "UI_READY",
        },
        pluginId: "*",
      },
      "*",
    );
  }, []);

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
      <div className="grid grid-rows-[auto_1fr] overflow-hidden h-screen">
        <div className="h-10 pl-4 pr-2 items-center flex justify-between">
          <span className="font-bold">States</span>
          {stateMachine.states.length > 0 && (
            <IconButton
              aria-label="Reset state machine"
              onClick={() => setCurrentState(stateMachine.initial)}
            >
              <ArrowUUpLeft />
            </IconButton>
          )}
        </div>
        <div className="overflow-auto">
          <div className="grid gap-2 p-2 pt-0">
            {stateMachine.states.length > 0 && (
              <div className="flex flex-col gap-1 p-2">
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
                </div>
              </div>
            )}
            {stateMachine.states.map(([state, { on: events }]) => (
              <State
                key={state}
                stateName={state}
                current={currentState === state}
                hover={nextState === state}
                initial={stateMachine.initial === state}
                unreachable={unreachableStates.includes(state)}
                stateMachine={stateMachine}
                unresolvedStates={unresolvedStates}
                onEventMouseEnter={(event) =>
                  setNextState(parseEventValue(events[event]).target)
                }
                onEventMouseLeave={() => setNextState(null)}
                onEventClick={(event) => {
                  setNextState(null);

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
                              updatedEvents[eventName],
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
        <div className="border-t border-border max-h-[50vh] grid grid-rows-[auto_1fr]">
          <button
            disabled={nodeBindings.length === 0 && !selectedNode}
            className={clsx(
              "pl-4 pr-2 h-10 flex items-center justify-between group disabled:pointer-events-none",
              {
                "text-text-secondary":
                  nodeBindings.length === 0 && !selectedNode,
              },
            )}
            onClick={() => setIsUISectionExpanded(!isUISectionExpanded)}
          >
            <CaretRight
              size={8}
              weight="bold"
              className={clsx(
                "absolute left-1 text-text-secondary group-hover:text-text-primary",
                isUISectionExpanded &&
                  "group-hover:opacity-100 opacity-0 rotate-90",
              )}
            />
            <span className="font-bold">UI</span>
          </button>

          {isUISectionExpanded && (nodeBindings.length > 0 || selectedNode) ? (
            <div className="overflow-auto">
              <div className="p-2 pt-0">
                <UIBindings
                  currentState={currentState}
                  selectedNode={selectedNode}
                  nodeBindings={nodeBindings}
                  onNodeBindingsChange={setNodeBindings}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </IconContext.Provider>
  );
}
