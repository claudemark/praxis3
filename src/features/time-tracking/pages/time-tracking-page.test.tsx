import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { TimeTrackingPage } from "./time-tracking-page";

// simple smoke test to surface runtime render issues

describe("TimeTrackingPage", () => {
  it("renders without crashing", () => {
    const { getByRole } = render(
      <MemoryRouter>
        <TimeTrackingPage />
      </MemoryRouter>,
    );

    expect(getByRole("heading", { name: /Zeiterfassung .*Dienstplan/i })).toBeInTheDocument();
  });
});
