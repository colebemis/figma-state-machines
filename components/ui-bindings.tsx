import { Minus, Plus } from "@phosphor-icons/react";

import { evaluateExpression } from "@/lib/evaluate-expression";
import React from "react";
import IconButton from "./icon-button";
import { NodeIcon } from "./node-icon";
import { FigmaNode, FigmaNodeBindings } from "@/lib/types";
import clsx from "clsx";
import { Select } from "./select";

export function UIBindings({
  currentState,
  selectedNode,
  nodeBindings,
  onNodeBindingsChange,
}: {
  currentState: string;
  selectedNode: FigmaNode | null;
  nodeBindings: FigmaNodeBindings;
  onNodeBindingsChange: (value: FigmaNodeBindings) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {nodeBindings.map(({ node, bindings }) => (
        <div key={node.id} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              className={clsx(
                "flex items-center gap-2 h-6 px-2 rounded flex-grow",
                node.id === selectedNode?.id
                  ? "bg-bg-selected"
                  : "hover:bg-bg-secondary",
              )}
              onClick={() => {
                parent.postMessage(
                  {
                    pluginMessage: {
                      type: "SELECT_NODE",
                      nodeId: node.id,
                    },
                    pluginId: "*",
                  },
                  "*",
                );
              }}
            >
              <NodeIcon type={node.type} />
              <span>{node.name}</span>
            </button>
            <IconButton
              aria-label="Add binding"
              disabled={bindings.some(
                (binding) => binding.property === "visibility",
              )}
              onClick={() => {
                onNodeBindingsChange([
                  ...nodeBindings,
                  {
                    node,
                    bindings: [
                      {
                        property: "visibility",
                        expression: "state === ",
                      },
                    ],
                  },
                ]);
              }}
            >
              <Plus />
            </IconButton>
          </div>
          <div className="flex flex-col gap-2 pl-8">
            {bindings.map((binding) => (
              <div
                key={binding.property}
                className="items-start gap-2 grid grid-cols-[100px_1fr_auto]"
              >
                <Select value={binding.property} onChange={() => {}}>
                  <option value="visibility">Visibility</option>
                </Select>
                <ExpressionInput
                  expression={binding.expression}
                  scope={{ state: currentState }}
                  onExpressionChange={(expression) => {
                    // Update the node bindings when an expression changes
                    onNodeBindingsChange(
                      nodeBindings.map((b) => {
                        // Find the node that contains the binding we're updating
                        if (b.node.id === node.id) {
                          return {
                            ...b, // Keep all other node properties
                            bindings: b.bindings.map((item) => {
                              // Find the specific binding we're updating by property name
                              if (item.property === binding.property) {
                                return {
                                  ...item, // Keep all other binding properties
                                  expression, // Update the expression with the new value
                                };
                              }
                              return item; // Return other bindings unchanged
                            }),
                          };
                        }
                        return b; // Return other nodes unchanged
                      }),
                    );
                  }}
                />
                <IconButton
                  aria-label="Remove binding"
                  onClick={() => {
                    onNodeBindingsChange(
                      nodeBindings
                        .map((b) => {
                          if (b.node.id === node.id) {
                            // Keep the node but filter out the specific binding
                            return {
                              ...b,
                              bindings: b.bindings.filter(
                                (item) => item.property !== binding.property,
                              ),
                            };
                          }
                          return b; // Return other nodes unchanged
                        })
                        .filter((b) => b.bindings.length > 0), // Remove nodes with no bindings left
                    );
                  }}
                >
                  <Minus />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      ))}
      {selectedNode &&
      !nodeBindings.find((b) => b.node.id === selectedNode.id) ? (
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 h-6 px-2 rounded flex-grow bg-bg-selected">
            <NodeIcon type={selectedNode.type} />
            <span className="italic">{selectedNode.name}</span>
          </button>
          <IconButton
            aria-label="Add binding"
            onClick={() => {
              onNodeBindingsChange([
                ...nodeBindings,
                {
                  node: selectedNode,
                  bindings: [
                    {
                      property: "visibility",
                      expression: "state === ",
                    },
                  ],
                },
              ]);
            }}
          >
            <Plus />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}

function ExpressionInput({
  expression,
  scope,
  onExpressionChange,
}: {
  expression: string;
  scope: Record<string, any>;
  onExpressionChange: (expression: string) => void;
}) {
  const value = React.useMemo(() => {
    return evaluateExpression(expression, scope);
  }, [expression, scope]);

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        placeholder="Enter an expression"
        className="w-full font-mono bg-bg-secondary rounded px-2 h-6 outline-none hover:ring-1 hover:ring-inset hover:ring-border focus:ring-1 focus:ring-inset focus:ring-border-selected placeholder:text-text-secondary"
        value={expression}
        onChange={(e) => onExpressionChange(e.target.value)}
      />
      <div className="text-text-secondary text-sm font-mono">
        {value === undefined ? "undefined" : JSON.stringify(value)}
      </div>
    </div>
  );
}
