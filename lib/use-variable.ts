import React from "react";
import { figmaAPI } from "./figma-api";

const VARIABLE_COLLECTION_NAME = "State machine";

type RGB = { r: number; g: number; b: number };
type RGBA = RGB & { a: number };

type VariableTypeMap = {
  BOOLEAN: boolean;
  COLOR: RGB | RGBA;
  FLOAT: number;
  STRING: string;
};

type VariableResolvedDataType = keyof VariableTypeMap;

export function useVariable<T extends VariableResolvedDataType>(
  variableName: string,
  variableType: T,
  defaultValue: VariableTypeMap[T]
) {
  const variableCollectionIdRef = React.useRef<string | null>(null);
  const variableIdRef = React.useRef<string | null>(null);
  const [value, _setValue] = React.useState<VariableTypeMap[T]>(defaultValue);

  React.useEffect(() => {
    async function init() {
      const { variableCollectionId } = await initVariableCollection({
        collectionName: VARIABLE_COLLECTION_NAME,
      });

      const { variableId, variableValue } = await initVariable({
        variableName,
        variableCollectionId,
        variableType,
        defaultValue,
      });

      variableCollectionIdRef.current = variableCollectionId;
      variableIdRef.current = variableId;

      if (variableValue !== null) {
        _setValue(variableValue as VariableTypeMap[T]);
      }
    }

    init();
  }, [variableName, variableType, _setValue, defaultValue]);

  const setVariableValue = React.useCallback((value: VariableTypeMap[T]) => {
    figmaAPI.run(
      async (figma, { variableCollectionId, variableId, value }) => {
        if (!variableCollectionId || !variableId) {
          return;
        }

        const variableCollection =
          figma.variables.getVariableCollectionById(variableCollectionId);
        const variable = figma.variables.getVariableById(variableId);

        if (!variableCollection || !variable) {
          return;
        }

        variable.setValueForMode(variableCollection.defaultModeId, value);
      },
      {
        variableCollectionId: variableCollectionIdRef.current,
        variableId: variableIdRef.current,
        value,
      }
    );
  }, []);

  const setValue = React.useCallback(
    (value: VariableTypeMap[T]) => {
      _setValue(value);
      setVariableValue(value);
    },
    [_setValue, setVariableValue]
  );

  return [value, setValue] as const;
}

async function initVariableCollection({
  collectionName,
}: {
  collectionName: string;
}) {
  return await figmaAPI.run(
    async (figma, { collectionName }) => {
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
            return { variableCollectionId };
          }
        } catch (error) {
          // The variable collection does not exist
        }
      }

      const newVariableCollection =
        figma.variables.createVariableCollection(collectionName);

      figma.root.setPluginData(
        "variable_collection_id",
        newVariableCollection.id
      );

      return { variableCollectionId: newVariableCollection.id };
    },
    { collectionName }
  );
}

async function initVariable<T extends VariableResolvedDataType>({
  variableName,
  variableCollectionId,
  variableType,
  defaultValue,
}: {
  variableName: string;
  variableCollectionId: string;
  variableType: T;
  defaultValue: VariableTypeMap[T];
}): Promise<{
  variableId: string | null;
  variableValue: VariableTypeMap[T] | null;
}> {
  return await figmaAPI.run(
    (
      figma,
      { variableName, variableCollectionId, variableType, defaultValue }
    ) => {
      const variableCollection =
        figma.variables.getVariableCollectionById(variableCollectionId);

      if (!variableCollection) {
        return { variableId: null, variableValue: null };
      }

      const variables = figma.variables.getLocalVariables();
      const variable = variables.find(
        (variable) =>
          variable.variableCollectionId === variableCollectionId &&
          variable.name === variableName
      );

      if (variable) {
        return {
          variableId: variable.id,
          variableValue: variable.valuesByMode[
            variableCollection.defaultModeId
          ] as VariableTypeMap[T],
        };
      }

      const newVariable = figma.variables.createVariable(
        variableName,
        variableCollectionId,
        variableType
      );

      newVariable.setValueForMode(
        variableCollection.defaultModeId,
        defaultValue as any // Safe because we've constrained T to VariableResolvedDataType
      );

      return {
        variableId: newVariable.id,
        variableValue: newVariable.valuesByMode[
          variableCollection.defaultModeId
        ] as VariableTypeMap[T],
      };
    },
    { variableName, variableCollectionId, variableType, defaultValue }
  );
}
