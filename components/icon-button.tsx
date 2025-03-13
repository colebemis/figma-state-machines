import { clsx } from "clsx";

export default function IconButton(
  props: React.ComponentPropsWithoutRef<"button"> & {
    "aria-label": string;
  }
) {
  return (
    <button
      className={clsx(
        "h-6 px-1 rounded enabled:hover:bg-bg-secondary disabled:cursor-not-allowed",
        props.className
      )}
      {...props}
    />
  );
}
