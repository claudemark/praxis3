import { beforeAll, describe, it } from "vitest";
import { render } from "@testing-library/react";
import { InventoryPage } from "@/features/inventory/pages/inventory-page";
import { ThemeProvider } from "@/app/providers/theme-provider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeAll(() => {
  window.matchMedia = window.matchMedia ||
    function matchMedia(query: string): MediaQueryList {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    };
});

describe("InventoryPage", () => {
  it("renders without crashing", () => {
    render(
      <Wrapper>
        <InventoryPage />
      </Wrapper>,
    );
  });
});
