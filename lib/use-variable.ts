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

      // Store the variable collection id and variable id
      variableCollectionIdRef.current = variableCollectionId;
      variableIdRef.current = variableId;

      // Initialize the value if it exists
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
      // Update React state and Figma variable value at the same time
      _setValue(value);
      setVariableValue(value);

      // NOTE: If the user changes the variable value in Figma while the plugin is open,
      // the React state will not update until the plugin is refreshed.
      // There is currently no way to listen for changes to the variable value in Figma.
    },
    [_setValue, setVariableValue]
  );

  return [value, setValue] as const;
}

/** Initializes a variable collection in Figma or retrieves an existing one */
async function initVariableCollection({
  collectionName,
}: {
  collectionName: string;
}) {
  return await figmaAPI.run(
    async (figma, { collectionName }) => {
      // Retrieve the previous variable collection id from storage
      const variableCollectionId = figma.root.getPluginData(
        "variable_collection_id"
      );

      if (variableCollectionId) {
        try {
          // Check if the variable collection still exists
          const variableCollection =
            await figma.variables.getVariableCollectionByIdAsync(
              variableCollectionId
            );

          // If the collection exists and has the name we expect, return the ID
          if (variableCollection?.name === collectionName) {
            return { variableCollectionId };
          }
        } catch (error) {
          // If an error occurs, the variable collection does not exist
        }
      }

      // If there's no existing collection, create a new one
      const newVariableCollection =
        figma.variables.createVariableCollection(collectionName);

      // Store the variable collection ID
      figma.root.setPluginData(
        "variable_collection_id",
        newVariableCollection.id
      );

      // Return the new variable collection ID
      return { variableCollectionId: newVariableCollection.id };
    },
    { collectionName }
  );
}

/** Initializes a variable in Figma or retrieves an existing one */
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
      // Get the variable collection by ID
      const variableCollection =
        figma.variables.getVariableCollectionById(variableCollectionId);

      // If the collection doesn't exist, return null values
      if (!variableCollection) {
        return { variableId: null, variableValue: null };
      }

      // Get all local variables and find the one that matches our criteria
      const variables = figma.variables.getLocalVariables();
      const variable = variables.find(
        (variable) =>
          variable.variableCollectionId === variableCollectionId &&
          variable.name === variableName
      );

      // If the variable already exists, return its ID and current value
      if (variable) {
        return {
          variableId: variable.id,
          variableValue: variable.valuesByMode[
            variableCollection.defaultModeId
          ] as VariableTypeMap[T],
        };
      }

      // If the variable doesn't exist, create a new one
      const newVariable = figma.variables.createVariable(
        variableName,
        variableCollectionId,
        variableType
      );

      // Set the default value for the variable in the default mode
      newVariable.setValueForMode(
        variableCollection.defaultModeId,
        defaultValue as any // Safe because we've constrained T to VariableResolvedDataType
      );

      // Return the new variable's ID and value
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
