import { StateMachine, StateValue } from "@/lib/types";
import { Diamond } from "@phosphor-icons/react";
import React from "react";
import { StateEditor } from "./state-editor";

export function UnresolvedState({
  stateName,
  stateMachine,
  onCreate,
}: {
  stateName: string;
  stateMachine: StateMachine;
  onCreate: (stateName: string, stateValue: StateValue) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing) {
    return (
      <StateEditor
        stateName={stateName}
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
      {stateName}
    </button>
  );
}
