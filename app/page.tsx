"use client";

import { figmaAPI } from "@/lib/figma-api";
import React from "react";

async function initVariableCollection({
  collectionName,
}: {
  collectionName: string;
}) {
  return await figmaAPI.run(
    async (figma, { collectionName }) => {
      console.log("initVariableCollection");

      const variableCollectionId = figma.root.getPluginData(
        "variable_collection_id"
      );

      if (variableCollectionId) {
        try {
          // Check if the variable collection exists
          const variableCollection =
            await figma.variables.getVariableCollectionByIdAsync(
              variableCollectionId
            );

          if (variableCollection?.name === collectionName) {
            return variableCollectionId;
          }
        } catch (error) {
          // The variable collection does not exist
        }
      }

      console.log("createVariableCollection");

      const newVariableCollection =
        figma.variables.createVariableCollection(collectionName);

      figma.root.setPluginData(
        "variable_collection_id",
        newVariableCollection.id
      );

      return newVariableCollection.id;
    },
    { collectionName }
  );
}

async function initVariable({
  variableName,
  variableCollectionId,
  variableType,
}: {
  variableName: string;
  variableCollectionId: string;
  variableType: VariableResolvedDataType;
}) {
  return await figmaAPI.run(
    (figma, { variableName, variableCollectionId, variableType }) => {
      const variables = figma.variables.getLocalVariables();

      const variable = variables.find(
        (variable) =>
          variable.variableCollectionId === variableCollectionId &&
          variable.name === variableName
      );

      if (variable) {
        return variable.id;
      }

      const newVariable = figma.variables.createVariable(
        variableName,
        variableCollectionId,
        variableType
      );

      return newVariable.id;
    },
    { variableName, variableCollectionId, variableType }
  );
}

export default function Plugin() {
  const variableCollectionIdRef = React.useRef<string | null>(null);
  const countVariableIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    async function initVariables() {
      const variableCollectionId = await initVariableCollection({
        collectionName: "State machine",
      });

      console.log(variableCollectionId);

      const countVariableId = await initVariable({
        variableName: "count",
        variableCollectionId,
        variableType: "FLOAT",
      });

      variableCollectionIdRef.current = variableCollectionId;
      countVariableIdRef.current = countVariableId;
    }

    initVariables();
  }, []);

  const add = React.useCallback((num: number) => {
    figmaAPI.run(
      async (figma, { variableCollectionId, countVariableId, num }) => {
        if (!variableCollectionId || !countVariableId) {
          return;
        }

        const variableCollection =
          figma.variables.getVariableCollectionById(variableCollectionId);
        const countVariable = figma.variables.getVariableById(countVariableId);

        if (!variableCollection || !countVariable) {
          return;
        }

        const modeId = variableCollection.defaultModeId;
        const value = countVariable.valuesByMode[modeId] as number;
        countVariable.setValueForMode(modeId, value + num);
      },
      {
        variableCollectionId: variableCollectionIdRef.current,
        countVariableId: countVariableIdRef.current,
        num,
      }
    );
  }, []);

  const increment = React.useCallback(() => {
    add(1);
  }, [add]);

  const decrement = React.useCallback(() => {
    add(-1);
  }, [add]);

  return (
    <div>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
}
