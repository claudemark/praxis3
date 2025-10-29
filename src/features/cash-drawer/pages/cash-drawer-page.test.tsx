import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { CashDrawerPage } from "./cash-drawer-page";

describe("CashDrawerPage", () => {
  it("renders without crashing", () => {
    const { getByText } = render(
      <MemoryRouter>
        <CashDrawerPage />
      </MemoryRouter>,
    );

    expect(getByText(/Barkasse und Barzahlungen/) ).toBeInTheDocument();
  });
});
