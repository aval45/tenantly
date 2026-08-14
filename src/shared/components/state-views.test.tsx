import { render, screen } from "@testing-library/react-native";

import { LoadingSkeleton } from "./state-views";

describe("LoadingSkeleton", () => {
  it("announces the loading state instead of rendering a blank screen", () => {
    render(<LoadingSkeleton />);
    expect(screen.getByLabelText("Loading dashboard")).toBeTruthy();
  });
});
