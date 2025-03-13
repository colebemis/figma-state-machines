"use client";

import { useVariable } from "@/lib/use-variable";
import React from "react";
import {
  ArrowRight,
  ArrowUDownLeft,
  ArrowElbowDownRight,
  ArrowBendDownRight,
  Function,
} from "@phosphor-icons/react";

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
};
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
    <div>
      <div className="flex flex-col gap-2 p-4">
        {Object.keys(stateMachine.states).map((state) => (
          <div
            key={state}
            data-current={currentState === state}
            className="rounded border border-[#e6e6e6] data-[current=true]:outline data-[current=true]:outline-[#0d99ff] data-[current=true]:outline-2 data-[current=true]:-outline-offset-2"
          >
            <div className="px-2 py-1.5 font-bold flex items-center gap-1">
              {stateMachine.initial === state ? (
                <ArrowBendDownRight size={16} className="-mt-1" />
              ) : null}
              {state}
            </div>
            <div className="p-2 gap-1.5 flex flex-col">
              <span className="text-black/50">Events</span>
              <div className="flex flex-col gap-1.5 items-start">
                {Object.entries(stateMachine.states[state].on).map(
                  ([event, { target, actions }]) => (
                    <div key={event} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCurrentState(target);
                            actions.forEach((action) =>
                              setCount(actionDefinitions[action](count))
                            );
                          }}
                          className="px-2 bg-[#f5f5f5] h-6 flex items-center rounded-full [[data-current=true]_&]:bg-[#0d99ff] [[data-current=true]_&]:text-white"
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
      </div>
      {/* <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <div>{count}</div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <div>{message}</div> */}
    </div>
  );
}
