"use client";

import IconButton from "@/components/icon-button";
import { useVariable } from "@/lib/use-variable";
import {
  ArrowRight,
  ArrowUDownLeft,
  ArrowUUpLeft,
  CaretDown,
  CaretUpDown,
  Check,
  CursorText,
  Diamond,
  Dot,
  Function,
  Minus,
  Plus,
  Warning,
  WarningDiamond,
  X,
} from "@phosphor-icons/react";
import clsx from "clsx";
import React from "react";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";
import { z } from "zod";

const EventValueSchema = z.union([
  z.string(),
  z.object({
    target: z.string(),
    actions: z.union([z.string(), z.array(z.string())]).optional(),
  }),
]);

type EventValue = z.infer<typeof EventValueSchema>;

const StateValueSchema = z.object({
  on: z.record(z.string(), EventValueSchema),
});

type StateValue = z.infer<typeof StateValueSchema>;

type StateMachine = {
  initial: string;
  states: Array<[string, StateValue]>;
};

const demoStateMachine: StateMachine = {
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

function parseEventValue(value: EventValue) {
  if (typeof value === "string") {
    return { target: value, actions: [] };
  }

  const { target = "", actions = [] } = value;

  return { target, actions: Array.isArray(actions) ? actions : [actions] };
}

export default function Plugin() {
  const [stateMachine, setStateMachine] =
    React.useState<StateMachine>(demoStateMachine);
  const [currentState, setCurrentState] = useVariable(
    "currentState",
    "STRING",
    stateMachine.initial
  );
  const [hoverState, setHoverState] = React.useState<string | null>(null);
  const [isAddingNewState, setIsAddingNewState] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  // Calculate referenced but undefined states
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
            {stateMachine.states.length > 0 && (
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
                    <CaretDown
                      size={12}
                      className="absolute right-1.5 top-1.5"
                    />
                  </div>
                  <IconButton
                    aria-label="Reset state machine"
                    onClick={() => setCurrentState(stateMachine.initial)}
                  >
                    <ArrowUUpLeft size={16} />
                  </IconButton>
                </div>
              </div>
            )}
            {stateMachine.states.map(([state, { on: events }]) => (
              <StateBlock
                key={state}
                state={state}
                events={events}
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
                onChange={({ state: newState, events: newEvents }) => {
                  setStateMachine((prev) => {
                    // Create a new state machine with updated state and events
                    const updatedStates: Array<[string, StateValue]> =
                      prev.states.map(([s, stateValue]) => {
                        if (s === state) {
                          return [newState, { on: newEvents }];
                        }
                        return [s, stateValue];
                      });

                    // If the state name changed, we need to update references
                    if (newState !== state) {
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
                                updatedEvents[eventName] = newState;
                              } else {
                                updatedEvents[eventName] = {
                                  target: newState,
                                  actions: eventValue.actions,
                                };
                              }
                            }
                          });
                          return [s, { on: updatedEvents }];
                        });

                      // Update initial state if needed
                      const newInitial =
                        prev.initial === state ? newState : prev.initial;

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
                  if (currentState === state && newState !== state) {
                    setCurrentState(newState);
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
                  state={state}
                  stateMachine={stateMachine}
                  onCreate={({ state, events }) => {
                    setStateMachine((prev) => ({
                      ...prev,
                      states: [...prev.states, [state, { on: events }]],
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
                onSave={({ state, events }) => {
                  setStateMachine((prev) => {
                    const isFirstState = prev.states.length === 0;
                    return {
                      ...prev,
                      states: [
                        ...prev.states,
                        [state, { on: events }] as [string, StateValue],
                      ],
                      // Make it the initial state if it's the first one
                      ...(isFirstState ? { initial: state } : {}),
                    };
                  });

                  // Set as current state if it's the first one
                  if (stateMachine.states.length === 0) {
                    setCurrentState(state);
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

function UnresolvedState({
  state,
  stateMachine,
  onCreate,
}: {
  state: string;
  stateMachine: StateMachine;
  onCreate: ({
    state,
    events,
  }: {
    state: string;
    events: { [key: string]: EventValue };
  }) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing) {
    return (
      <StateEditor
        state={state}
        events={{}}
        initial={false}
        unreachable={false}
        stateMachine={stateMachine}
        onCancel={() => setIsEditing(false)}
        onSave={onCreate}
      />
    );
  }

  return (
    <button
      className="px-2 h-9 hover:bg-bg-secondary rounded text-left flex items-center gap-2 text-text-secondary relative after:absolute after:inset-0 after:border after:border-border after:border-dashed after:rounded after:pointer-events-none font-bold"
      onClick={() => setIsEditing(true)}
    >
      <Diamond size={16} />
      {state}
    </button>
  );
}
type StateBlockProps = {
  state: string;
  events: {
    [key: string]: EventValue;
  };
  current: boolean;
  hover: boolean;
  initial: boolean;
  unreachable: boolean;
  stateMachine: StateMachine;
  unresolvedStates: string[];
  onEventClick: (event: string) => void;
  onEventMouseEnter: (event: string) => void;
  onEventMouseLeave: (event: string) => void;
  onChange: ({
    state,
    events,
  }: {
    state: string;
    events: { [key: string]: EventValue };
  }) => void;
  onRemove: () => void;
};

function StateBlock({
  state,
  events,
  current,
  hover,
  initial,
  unreachable,
  unresolvedStates,
  onEventClick,
  onEventMouseEnter,
  onEventMouseLeave,
  onChange,
  onRemove,
  stateMachine,
}: StateBlockProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing) {
    return (
      <StateEditor
        state={state}
        events={events}
        initial={initial}
        unreachable={unreachable}
        stateMachine={stateMachine}
        onCancel={() => setIsEditing(false)}
        onSave={(value) => {
          setIsEditing(false);
          onChange(value);
        }}
      />
    );
  }

  return (
    <div
      key={state}
      className={clsx(
        "rounded relative group",
        current ? "bg-bg-selected" : "hover:bg-bg-secondary",
        hover && "bg-bg-secondary"
      )}
    >
      <div className="px-2 h-9  flex items-center gap-2 rounded">
        {unreachable ? (
          <WarningDiamond size={16} className="text-text-warning" />
        ) : (
          <div className="flex relative">
            {initial ? <Dot size={16} className="absolute" /> : null}
            <Diamond size={16} />
          </div>
        )}
        <span className="font-bold">{state}</span>
        {unreachable ? (
          <span className="text-text-secondary">Unreachable state</span>
        ) : null}
        <div className="absolute top-1.5 right-1.5 opacity-0 flex items-center gap-1 group-hover:opacity-100">
          <IconButton
            aria-label="Edit state"
            onClick={() => setIsEditing(true)}
          >
            <CursorText size={16} />
          </IconButton>
          <IconButton aria-label="Remove state" onClick={onRemove}>
            <Minus size={16} />
          </IconButton>
        </div>
      </div>

      {Object.keys(events).length ? (
        <div className="px-2 pb-2.5 gap-2 pl-8 pt-0 flex flex-col">
          <span className="text-text-secondary">Events</span>
          <div className="flex flex-col gap-2 items-start">
            {Object.entries(events).map(([event, value]) => (
              <div key={event} className="flex flex-col gap-1">
                <div
                  className={clsx(
                    "flex items-center gap-1",
                    unresolvedStates.includes(parseEventValue(value).target)
                      ? "text-text-secondary"
                      : ""
                  )}
                >
                  <button
                    disabled={
                      !current ||
                      unresolvedStates.includes(parseEventValue(value).target)
                    }
                    onMouseEnter={() => onEventMouseEnter(event)}
                    onMouseLeave={() => onEventMouseLeave(event)}
                    onClick={() => onEventClick(event)}
                    className={clsx(
                      "px-2 h-6 flex items-center rounded-full relative disabled:cursor-not-allowed",
                      unresolvedStates.includes(parseEventValue(value).target)
                        ? "after:absolute after:inset-0 after:border after:border-dashed after:border-border after:rounded-full after:pointer-events-none"
                        : current
                        ? "bg-bg-brand text-text-onbrand active:bg-bg-brand-pressed hover:ring-1 hover:ring-border-selected-strong hover:ring-inset"
                        : "bg-bg-secondary"
                    )}
                  >
                    {event}
                  </button>
                  {parseEventValue(value).target === state ? (
                    <ArrowUDownLeft size={16} />
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      <span className="italic">
                        {parseEventValue(value).target}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col pl-2 empty:hidden">
                  {parseEventValue(value).actions.map((action) => (
                    <span key={action} className="flex items-center gap-1 h-6">
                      <Function size={16} />
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StateEditor({
  state,
  events,
  initial,
  unreachable,
  onCancel,
  onSave,
  stateMachine,
}: {
  state?: string;
  events?: {
    [key: string]: EventValue;
  };
  initial: boolean;
  unreachable: boolean;
  onCancel: () => void;
  onSave: ({
    state,
    events,
  }: {
    state: string;
    events: { [key: string]: EventValue };
  }) => void;
  stateMachine: StateMachine;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [yamlStr, setYamlStr] = React.useState(() =>
    // Convert object to yaml string
    events
      ? yamlStringify({
          on: events,
        })
      : ""
  );

  const placeholder = `on:
  CLICK:
    target: active
    actions: [activate]`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const stateName = formData.get("stateName") as string;
    const yamlStr = formData.get("yamlStr") as string;

    // Validate state name
    if (
      stateName !== state &&
      stateMachine.states.some(([s]) => s === stateName)
    ) {
      setError("A state with this name already exists.");
      return;
    }

    try {
      if (!yamlStr) {
        onSave({ state: stateName, events: {} });
        return;
      }

      // First try to parse the YAML
      const parsed = yamlParse(yamlStr);

      // Then validate the structure
      const stateValue = StateValueSchema.parse(parsed);
      onSave({ state: stateName, events: stateValue.on });
    } catch (error) {
      if (error instanceof Error) {
        // Handle YAML parsing errors
        if (error.message.includes("YAML")) {
          setError("Invalid YAML format. Please check your syntax.");
        } else {
          // Handle Zod validation errors
          setError(error.message);
        }
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <form className="rounded bg-bg-secondary grid" onSubmit={handleSubmit}>
      <div className="border-b border-border">
        <div className="flex relative h-9">
          {unreachable ? (
            <WarningDiamond
              size={16}
              className="text-text-warning absolute left-2 top-2.5"
            />
          ) : (
            <div className="flex relative left-2 top-2.5 size-4">
              {initial ? <Dot size={16} className="absolute" /> : null}
              <Diamond size={16} />
            </div>
          )}
          <input
            autoFocus
            type="text"
            name="stateName"
            placeholder="State name"
            defaultValue={state}
            onChange={(event) => {
              setError(null);
            }}
            className="pl-8 pr-9 absolute inset-0 text-[inherit] bg-[transparent] placeholder:text-text-secondary outline-none font-bold"
          />

          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 ">
            <IconButton aria-label="Save changes" type="submit">
              <Check size={16} />
            </IconButton>
            <IconButton
              aria-label="Cancel changes"
              type="button"
              onClick={onCancel}
            >
              <X size={16} />
            </IconButton>
          </div>
        </div>
      </div>
      <div
        className="grow-wrap relative font-mono min-h-[100px]"
        data-replicated-value={yamlStr || placeholder}
        style={
          {
            "--padding": "8px 8px 8px 32px",
          } as React.CSSProperties
        }
      >
        <div className="absolute left-0 w-8 text-right pr-2.5 pt-2 text-text-secondary select-none">
          {yamlStr.split("\n").map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          name="yamlStr"
          placeholder={placeholder}
          value={yamlStr}
          onChange={(event) => {
            setYamlStr(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            // Submit the form when Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) is pressed
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              const form = event.currentTarget.form;
              if (form)
                form.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true })
                );
            }
          }}
          className="w-full bg-transparent outline-none resize-none bg-[transparent] placeholder:text-text-secondary"
        />
      </div>
      {error ? (
        <div className="p-2 text-text-danger flex items-start gap-2">
          <Warning size={16} className="flex-shrink-0" />
          <div className="whitespace-pre-wrap  font-mono">{error}</div>
        </div>
      ) : null}
    </form>
  );
}
