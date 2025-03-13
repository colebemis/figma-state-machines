"use client";

import IconButton from "@/components/icon-button";
import { useVariable } from "@/lib/use-variable";
import {
  ArrowBendDownRight,
  ArrowRight,
  ArrowUDownLeft,
  CursorText,
  Function,
  Minus,
  Pencil,
  Plus,
} from "@phosphor-icons/react";
import clsx from "clsx";

type StateMachine = {
  initial: string;
  states: {
    [key: string]: {
      on?: {
        [key: string]: {
          target: string;
          actions: string[];
        };
      };
    };
  };
};

const stateMachine: StateMachine = {
  initial: "idle",
  states: {
    idle: {
      on: {
        FOCUS: {
          target: "focused",
          actions: [],
        },
        POINTER_DOWN: {
          target: "dragging",
          actions: [],
        },
      },
    },
    focused: {
      on: {
        BLUR: {
          target: "idle",
          actions: [],
        },
        ARROW_INC: {
          target: "focused",
          actions: ["increment"],
        },
        ARROW_DEC: {
          target: "focused",
          actions: ["decrement"],
        },
      },
    },
    dragging: {
      on: {
        POINTER_UP: {
          target: "focused",
          actions: [],
        },
        POINTER_MOVE: {
          target: "dragging",
          actions: [],
        },
      },
    },
  },
};

const actionDefinitions = {
  increment: (count: number) => {
    return count + 1;
  },
  decrement: (count: number) => {
    return count - 1;
  },
} as const;
// const stateMachine: StateMachine = {
//   initial: "initializing",
//   states: {
//     initializing: {
//       on: {
//         DONE: "idle",
//       },
//     },
//     empty: {
//       on: {
//         CHANGE: "validating",
//       },
//     },
//     validating: {
//       on: {
//         DONE: "idle",
//       },
//     },
//     valid: {
//       on: {
//         CHANGE: "validating",
//       },
//     },
//     invalid: {
//       on: {
//         CHANGE: "validating",
//       },
//     },
//   },
// };

export default function Plugin() {
  const [count, setCount] = useVariable("count", "FLOAT", 0);
  const [currentState, setCurrentState] = useVariable(
    "currentState",
    "STRING",
    stateMachine.initial
  );

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden h-screen">
      <div className="pl-4 pr-2 h-10 flex items-center justify-between border-b border-border">
        <span className="font-bold">States</span>
      </div>
      <div className="grid grid-rows-[1fr_auto] overflow-hidden">
        <div className="grid gap-2 p-2 overflow-y-auto">
          {Object.keys(stateMachine.states).map((state) => (
            <div
              key={state}
              className={clsx(
                "rounded ring-1 ring-border relative group",
                currentState === state &&
                  "outline outline-border-selected outline-2 -outline-offset-1"
              )}
            >
              <div className="px-2 h-8 font-bold flex items-center gap-1">
                {stateMachine.initial === state ? (
                  <ArrowBendDownRight size={16} className="-mt-1" />
                ) : null}
                {state}
              </div>
              <div className="absolute top-2 right-2 opacity-0 flex items-center gap-1 group-hover:opacity-100">
                <IconButton aria-label="Edit state">
                  <CursorText size={16} />
                </IconButton>
                <IconButton aria-label="Remove state">
                  <Minus size={16} />
                </IconButton>
              </div>
              <div className="p-2 gap-1.5 pt-1 flex flex-col">
                <span className="text-text-secondary">Events</span>
                <div className="flex flex-col gap-1.5 items-start">
                  {Object.entries(stateMachine.states[state].on ?? {}).map(
                    ([event, { target, actions }]) => (
                      <div key={event} className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={currentState !== state}
                            onClick={() => {
                              actions.forEach((action) =>
                                setCount(
                                  actionDefinitions[
                                    action as keyof typeof actionDefinitions
                                  ](count)
                                )
                              );
                              setCurrentState(target);
                            }}
                            className={clsx(
                              "px-2 h-6 flex items-center rounded-full disabled:cursor-not-allowed",
                              currentState === state
                                ? "bg-bg-brand text-text-onbrand active:bg-bg-brand-pressed"
                                : "bg-bg-secondary"
                            )}
                          >
                            {event}
                          </button>
                          {target === state ? (
                            <ArrowUDownLeft size={16} />
                          ) : (
                            <>
                              <ArrowRight size={16} />
                              <span className="italic">{target}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 pl-2">
                          {actions.map((action) => (
                            <span
                              key={action}
                              className="flex items-center gap-1"
                            >
                              <Function size={16} />
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
          <button className="px-2 h-6 hover:bg-bg-secondary rounded text-left flex items-center gap-2">
            <Plus size={16} />
            Add state
          </button>
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
