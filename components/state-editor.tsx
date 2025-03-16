import { StateMachine, StateValue, StateValueSchema } from "@/lib/types";
import React from "react";
import {
  Check,
  Diamond,
  DotOutline,
  Warning,
  WarningDiamond,
  X,
} from "@phosphor-icons/react";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";
import IconButton from "./icon-button";

export function StateEditor({
  stateName,
  initial,
  unreachable,
  onCancel,
  onSave,
  stateMachine,
}: {
  stateName?: string;
  initial: boolean;
  unreachable: boolean;
  onCancel: () => void;
  onSave: (state: string, stateValue: StateValue) => void;
  stateMachine: StateMachine;
}) {
  const events = React.useMemo(() => {
    return stateMachine.states.find(([s]) => s === stateName)?.[1].on ?? {};
  }, [stateMachine, stateName]);

  const [error, setError] = React.useState<string | null>(null);
  const [yamlStr, setYamlStr] = React.useState(() =>
    // Convert object to yaml string
    events.length
      ? yamlStringify({
          on: events,
        })
      : "",
  );

  const placeholder = `on:
  EVENT: target`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newStateName = formData.get("stateName") as string;
    const yamlStr = formData.get("yamlStr") as string;

    // Validate state name
    if (
      newStateName !== stateName &&
      stateMachine.states.some(([s]) => s === newStateName)
    ) {
      setError("A state with this name already exists.");
      return;
    }

    try {
      if (!yamlStr) {
        onSave(newStateName, { on: {} });
        return;
      }

      // Parse and validate the state value
      const stateValue = StateValueSchema.parse(yamlParse(yamlStr));

      onSave(newStateName, stateValue);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    }
  };

  return (
    <form className="rounded bg-bg-secondary grid" onSubmit={handleSubmit}>
      <div className="border-b border-border">
        <div className="flex relative h-9">
          {unreachable ? (
            <WarningDiamond className="text-text-danger absolute left-2 top-2.5" />
          ) : (
            <div className="flex relative left-2 top-2.5 size-4">
              {initial ? <DotOutline className="absolute" /> : null}
              <Diamond />
            </div>
          )}
          <input
            autoFocus
            type="text"
            name="stateName"
            placeholder="State name"
            defaultValue={stateName}
            onChange={() => setError(null)}
            className="pl-8 pr-9 absolute inset-0 text-[inherit] bg-[transparent] placeholder:text-text-secondary outline-none font-bold"
          />

          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 ">
            <IconButton aria-label="Save changes" type="submit">
              <Check />
            </IconButton>
            <IconButton
              aria-label="Cancel changes"
              type="button"
              onClick={onCancel}
            >
              <X />
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
                  new Event("submit", { cancelable: true, bubbles: true }),
                );
            }
          }}
          className="w-full bg-transparent outline-none resize-none bg-[transparent] placeholder:text-text-secondary"
        />
      </div>
      {error ? (
        <div className="p-2 text-text-danger flex items-start gap-2">
          <Warning className="flex-shrink-0" />
          <div className="whitespace-pre-wrap  font-mono">{error}</div>
        </div>
      ) : null}
    </form>
  );
}
