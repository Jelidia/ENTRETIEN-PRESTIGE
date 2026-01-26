import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TopBar from "@/components/TopBar";

describe("TopBar", () => {
  it("renders the logo and title", () => {
    render(<TopBar title="Dashboard" subtitle="Overview" />);

    const logo = document.querySelector("img.brand-logo") as HTMLImageElement | null;
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute("src")).toBe("/logo.png");
    if (logo) {
      fireEvent.error(logo);
    }
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders action content when provided", () => {
    render(<TopBar title="Settings" actions={<button type="button">Save</button>} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
