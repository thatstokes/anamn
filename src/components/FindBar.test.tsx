import { render, screen, fireEvent } from "@testing-library/react";
import { FindBar } from "./FindBar.js";

describe("FindBar", () => {
  const defaultProps = {
    findQuery: "",
    setFindQuery: vi.fn(),
    findMatches: [] as number[],
    currentMatchIndex: 0,
    findNext: vi.fn(),
    findPrevious: vi.fn(),
    closeFindBar: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the find input", () => {
    render(<FindBar {...defaultProps} />);

    expect(screen.getByPlaceholderText("Find in note...")).toBeInTheDocument();
  });

  it("should call setFindQuery when typing", () => {
    render(<FindBar {...defaultProps} />);

    const input = screen.getByPlaceholderText("Find in note...");
    fireEvent.change(input, { target: { value: "search term" } });

    expect(defaultProps.setFindQuery).toHaveBeenCalledWith("search term");
  });

  it("should show match count when there are matches", () => {
    render(
      <FindBar
        {...defaultProps}
        findQuery="test"
        findMatches={[0, 5, 10]}
        currentMatchIndex={1}
      />
    );

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("should show 'No matches' when query exists but no matches found", () => {
    render(
      <FindBar {...defaultProps} findQuery="test" findMatches={[]} />
    );

    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("should call findNext when pressing Enter", () => {
    render(<FindBar {...defaultProps} findQuery="test" />);

    const input = screen.getByPlaceholderText("Find in note...");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(defaultProps.findNext).toHaveBeenCalled();
  });

  it("should call findPrevious when pressing Shift+Enter", () => {
    render(<FindBar {...defaultProps} findQuery="test" />);

    const input = screen.getByPlaceholderText("Find in note...");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(defaultProps.findPrevious).toHaveBeenCalled();
  });

  it("should call closeFindBar when pressing Escape", () => {
    render(<FindBar {...defaultProps} />);

    const input = screen.getByPlaceholderText("Find in note...");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(defaultProps.closeFindBar).toHaveBeenCalled();
  });

  it("should call findNext when clicking next button", () => {
    render(<FindBar {...defaultProps} />);

    const nextButton = screen.getByTitle("Next (Enter)");
    fireEvent.click(nextButton);

    expect(defaultProps.findNext).toHaveBeenCalled();
  });

  it("should call findPrevious when clicking previous button", () => {
    render(<FindBar {...defaultProps} />);

    const prevButton = screen.getByTitle("Previous (Shift+Enter)");
    fireEvent.click(prevButton);

    expect(defaultProps.findPrevious).toHaveBeenCalled();
  });

  it("should call closeFindBar when clicking close button", () => {
    render(<FindBar {...defaultProps} />);

    const closeButton = screen.getByTitle("Close (Escape)");
    fireEvent.click(closeButton);

    expect(defaultProps.closeFindBar).toHaveBeenCalled();
  });
});
