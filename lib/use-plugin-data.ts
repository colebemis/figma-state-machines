import React from "react";
import { z } from "zod";
import { figmaAPI } from "./figma-api";

export function useRootPluginData<T>({
  key,
  schema,
  defaultValue,
}: {
  key: string;
  schema: z.ZodSchema<T>;
  defaultValue: T;
}) {
  const [value, _setValue] = React.useState<T>(defaultValue);

  React.useEffect(() => {
    async function init() {
      const storedValue = await figmaAPI.run(
        async (figma, { key }) => {
          return figma.root.getPluginData(key);
        },
        { key }
      );

      if (!storedValue) {
        return defaultValue;
      }

      const parsedValue = schema.safeParse(JSON.parse(storedValue));
      if (parsedValue.success) {
        _setValue(parsedValue.data);
      }
    }

    init();
  }, [key, defaultValue]);

  const setValue = React.useCallback(
    (newValueOrUpdater: T | ((prev: T) => T)) => {
      const newValue =
        typeof newValueOrUpdater === "function"
          ? (newValueOrUpdater as (prev: T) => T)(value)
          : newValueOrUpdater;

      _setValue(newValue);

      // Save plugin data
      figmaAPI.run(
        async (figma, { key, value }) => {
          figma.root.setPluginData(key, JSON.stringify(value));
        },
        { key, value: newValue }
      );
    },
    [key, value]
  );

  return [value, setValue] as const;
}
