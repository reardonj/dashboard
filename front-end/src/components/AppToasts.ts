import { Position, Toaster } from "@blueprintjs/core";

export const AppToasts = Toaster.create({
  className: "recipe-toaster",
  position: Position.BOTTOM,
});