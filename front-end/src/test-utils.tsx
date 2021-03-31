import * as React from "react"
import { render, RenderOptions } from "@testing-library/react"

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { ...options })

export { customRender as render }