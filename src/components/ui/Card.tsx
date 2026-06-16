import { HTMLAttributes, forwardRef } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { padded?: boolean };

export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { className = "", padded = true, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "bg-bg-card border-[0.5px] border-line-subtle rounded-xl",
        padded ? "p-5" : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
});
