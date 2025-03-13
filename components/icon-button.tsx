import { clsx } from "clsx";

export default function IconButton(
  props: React.ComponentPropsWithoutRef<"button"> & {
    "aria-label": string;
  }
) {
  return (
    <button
      className={clsx(
        "h-6 px-1 rounded hover:bg-bg-secondary",
        props.className
      )}
      {...props}
    />
  );
}
