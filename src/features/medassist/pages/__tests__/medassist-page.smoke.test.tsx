import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { MedAssistPage } from "@/features/medassist/pages/medassist-page";

class FakeMediaRecorder {
  public state: "inactive" | "recording" | "paused" = "inactive";
  public readonly stream: MediaStream;
  public ondataavailable: ((event: BlobEvent) => void) | null = null;

  constructor(stream: MediaStream) {
    this.stream = stream;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
  }

  addEventListener() {
    void this.stream;
  }

  removeEventListener() {
    void this.stream;
  }
}

declare global {
  interface Window {
    MediaRecorder: typeof FakeMediaRecorder;
  }
}

describe("MedAssistPage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      writable: true,
      value: FakeMediaRecorder,
    });

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn(() => Promise.resolve(new MediaStream())),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    render(<MedAssistPage />);
    expect(screen.getByText("AI MedAssist")).toBeInTheDocument();
    expect(screen.getByText("Live-Diktat")).toBeInTheDocument();
  });
});
