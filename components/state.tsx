import { parseEventValue } from "@/lib/parse-event-value";
import { StateMachine, StateValue } from "@/lib/types";
import {
  ArrowRight,
  ArrowUDownLeft,
  CursorText,
  Diamond,
  DotOutline,
  Function,
  Minus,
  WarningDiamond,
} from "@phosphor-icons/react";
import clsx from "clsx";
import React from "react";
import IconButton from "./icon-button";
import { StateEditor } from "./state-editor";

type StateProps = {
  stateName: string;
  current: boolean;
  hover: boolean;
  initial: boolean;
  unreachable: boolean;
  stateMachine: StateMachine;
  unresolvedStates: string[];
  onEventClick: (event: string) => void;
  onEventMouseEnter: (event: string) => void;
  onEventMouseLeave: (event: string) => void;
  onChange: (stateName: string, stateValue: StateValue) => void;
  onRemove: () => void;
};

export function State({
  stateName,
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
}: StateProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  const events = React.useMemo(() => {
    return stateMachine.states.find(([s]) => s === stateName)?.[1].on ?? {};
  }, [stateMachine, stateName]);

  if (isEditing) {
    return (
      <StateEditor
        stateName={stateName}
        initial={initial}
        unreachable={unreachable}
        stateMachine={stateMachine}
        onCancel={() => setIsEditing(false)}
        onSave={(stateName, stateValue) => {
          setIsEditing(false);
          onChange(stateName, stateValue);
        }}
      />
    );
  }

  return (
    <div
      key={stateName}
      className={clsx(
        "rounded relative group",
        current ? "bg-bg-selected" : "hover:bg-bg-secondary",
        hover && "bg-bg-secondary",
      )}
    >
      <div className="px-2 h-9  flex items-center gap-2 rounded">
        {unreachable ? (
          <WarningDiamond className="text-text-warning" />
        ) : (
          <div className="flex relative">
            {initial ? <DotOutline className="absolute" /> : null}
            <Diamond />
          </div>
        )}
        <span className="font-bold">{stateName}</span>
        {unreachable ? (
          <span className="text-text-secondary">Unreachable state</span>
        ) : null}
        <div className="absolute top-1.5 right-1.5 opacity-0 flex items-center gap-1 group-hover:opacity-100">
          <IconButton
            aria-label="Edit state"
            onClick={() => setIsEditing(true)}
          >
            <CursorText />
          </IconButton>
          <IconButton aria-label="Remove state" onClick={onRemove}>
            <Minus />
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
                      : "",
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
                        : "bg-bg-secondary",
                    )}
                  >
                    {event}
                  </button>
                  {parseEventValue(value).target === stateName ? (
                    <ArrowUDownLeft />
                  ) : (
                    <>
                      <ArrowRight />
                      <span className="italic">
                        {parseEventValue(value).target}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col pl-2 empty:hidden">
                  {parseEventValue(value).actions.map((action) => (
                    <span key={action} className="flex items-center gap-1 h-6">
                      <Function />
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
