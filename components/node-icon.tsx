import {
  Circle,
  LineSegment,
  Rectangle,
  TextT,
  Square,
  BezierCurve,
} from "@phosphor-icons/react";

export function NodeIcon({ type }: { type: string }) {
  switch (type) {
    case "TEXT":
      return <TextT />;

    case "ELLIPSE":
      return <Circle />;

    case "RECTANGLE":
      return <Rectangle />;

    case "VECTOR":
      return <BezierCurve />;

    case "LINE":
      return <LineSegment />;

    default:
      return <Square />;
  }
}
