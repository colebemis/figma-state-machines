import { CaretDown } from "@phosphor-icons/react";
import clsx from "clsx";

export function Select({
  icon,
  ...props
}: React.ComponentPropsWithoutRef<"select"> & { icon?: React.ReactNode }) {
  return (
    <div className="w-full relative">
      {icon ? (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none">
          {icon}
        </span>
      ) : null}
      <select
        id="initial-state"
        {...props}
        className={clsx(
          "bg-[transparent] ring-1 ring-inset ring-border rounded pr-6 py-1 outline-none focus:ring-border-selected appearance-none w-full",
          icon ? "pl-6" : "pl-2",
        )}
      />
      <CaretDown
        size={8}
        weight="bold"
        className="absolute right-2 top-2 pointer-events-none"
      />
    </div>
  );
}
