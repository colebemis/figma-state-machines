"use client";

import IconButton from "@/components/icon-button";
import { useVariable } from "@/lib/use-variable";
import {
  ArrowRight,
  ArrowUDownLeft,
  Check,
  CursorText,
  Diamond,
  Dot,
  Function,
  Minus,
  Plus,
  Warning,
  X,
} from "@phosphor-icons/react";
import clsx from "clsx";
import React from "react";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";

type EventValue = string | { target: string; actions?: string | string[] };

type StateValue = {
  on: {
    [key: string]: EventValue;
  };
};

type StateMachine = {
  initial: string;
  states: {
    [key: string]: StateValue;
  };
};

const stateMachine: StateMachine = {
  initial: "empty",
  states: {
    empty: {
      on: {
        CHANGE: "validating",
      },
    },
    validating: {
      on: {
        VALID: "valid",

        INVALID: "invalid",
      },
    },
    valid: {
      on: {
        CHANGE: "validating",
      },
    },
    invalid: {
      on: {
        CHANGE: "validating",
      },
    },
  },
};

function parseEventValue(value: EventValue) {
  if (typeof value === "string") {
    return { target: value, actions: [] };
  }

  const { target = "", actions = [] } = value;

  return { target, actions: Array.isArray(actions) ? actions : [actions] };
}

export default function Plugin() {
  const [currentState, setCurrentState] = useVariable(
    "currentState",
    "STRING",
    stateMachine.initial
  );
  const [hoverState, setHoverState] = React.useState<string | null>(null);
  const [isAddingNewState, setIsAddingNewState] = React.useState(false);

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden h-screen">
      <div className="pl-4 pr-2 h-10 flex items-center justify-between border-b border-border">
        <span className="font-bold">States</span>
      </div>
      <div className="grid grid-rows-[1fr_auto] overflow-hidden">
        <div className="overflow-auto">
          <div className="grid gap-2 p-2">
            {Object.entries(stateMachine.states).map(
              ([state, { on: events }]) => (
                <StateBlock
                  key={state}
                  state={state}
                  events={events}
                  current={currentState === state}
                  hover={hoverState === state}
                  initial={stateMachine.initial === state}
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
                  onRemove={() => {}}
                />
              )
            )}
            {isAddingNewState ? (
              <StateEditor
                initial={false}
                onCancel={() => setIsAddingNewState(false)}
                onSave={() => setIsAddingNewState(false)}
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

type StateBlockProps = {
  state: string;
  events: {
    [key: string]: EventValue;
  };
  current: boolean;
  hover: boolean;
  initial: boolean;
  onEventClick: (event: string) => void;
  onEventMouseEnter: (event: string) => void;
  onEventMouseLeave: (event: string) => void;
  onRemove: () => void;
};

function StateBlock({
  state,
  events,
  current,
  hover,
  initial,
  onEventClick,
  onEventMouseEnter,
  onEventMouseLeave,
  onRemove,
}: StateBlockProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing) {
    return (
      <StateEditor
        state={state}
        events={events}
        initial={initial}
        onCancel={() => setIsEditing(false)}
        onSave={() => setIsEditing(false)}
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
      <div className="px-2 h-9 font-bold flex items-center gap-2 rounded">
        <div className="flex relative">
          {initial ? <Dot size={16} className="absolute" /> : null}
          <Diamond size={16} />
        </div>
        {state}
        <div className="absolute top-1.5 right-1.5 opacity-0 flex items-center gap-1 group-hover:opacity-100">
          <IconButton
            aria-label="Edit state"
            onClick={() => setIsEditing(true)}
          >
            <CursorText size={16} />
          </IconButton>
          <IconButton aria-label="Remove state">
            <Minus size={16} />
          </IconButton>
        </div>
      </div>

      <div className="px-2 pb-2.5 gap-2 pl-8 pt-0 flex flex-col">
        <span className="text-text-secondary">Events</span>
        <div className="flex flex-col gap-2 items-start">
          {Object.entries(stateMachine.states[state].on ?? {}).map(
            ([event, value]) => (
              <div key={event} className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button
                    disabled={!current}
                    onMouseEnter={() => onEventMouseEnter(event)}
                    onMouseLeave={() => onEventMouseLeave(event)}
                    onClick={() => onEventClick(event)}
                    className={clsx(
                      "px-2 h-6 flex items-center rounded-full",
                      current
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
            )
          )}
        </div>
      </div>
    </div>
  );
}

function StateEditor({
  state,
  events,
  initial,
  onCancel,
  onSave,
}: {
  state?: string;
  events?: {
    [key: string]: EventValue;
  };
  initial: boolean;
  onCancel: () => void;
  onSave: (state: string) => void;
}) {
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

  return (
    <form
      className="rounded bg-bg-secondary grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(state ?? "");
      }}
    >
      <div className="border-b border-border">
        <div className="flex relative h-9">
          <div className="flex relative left-2 top-2.5 size-4">
            {initial ? <Dot size={16} className="absolute" /> : null}
            <Diamond size={16} />
          </div>
          <input
            autoFocus
            type="text"
            name="state"
            placeholder="State name"
            defaultValue={state}
            className=" pl-8 pr-9 absolute inset-0 text-[inherit] bg-[transparent] placeholder:text-text-secondary outline-none font-bold"
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
          placeholder={placeholder}
          value={yamlStr}
          onChange={(event) => setYamlStr(event.target.value)}
          className="w-full bg-transparent outline-none resize-none bg-[transparent] placeholder:text-text-secondary"
        />
      </div>
      <div className="px-2 h-9 text-text-danger flex items-center gap-2">
        <Warning size={16} />
        Oops! Something went wrong.
      </div>
    </form>
  );
}
