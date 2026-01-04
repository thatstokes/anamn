import { render, screen, fireEvent } from "@testing-library/react";
import { NewNoteInput } from "./NewNoteInput.js";

describe("NewNoteInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onCreate: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render input with placeholder", () => {
    render(<NewNoteInput {...defaultProps} />);

    expect(screen.getByPlaceholderText("Note title...")).toBeInTheDocument();
  });

  it("should display the current value", () => {
    render(<NewNoteInput {...defaultProps} value="My Note" />);

    expect(screen.getByDisplayValue("My Note")).toBeInTheDocument();
  });

  it("should call onChange when typing", () => {
    render(<NewNoteInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Note title...");
    fireEvent.change(input, { target: { value: "New Note" } });

    expect(defaultProps.onChange).toHaveBeenCalledWith("New Note");
  });

  it("should call onCreate when pressing Enter", () => {
    render(<NewNoteInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Note title...");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(defaultProps.onCreate).toHaveBeenCalled();
  });

  it("should call onCancel when pressing Escape", () => {
    render(<NewNoteInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Note title...");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("should auto-focus the input", () => {
    render(<NewNoteInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Note title...");
    expect(document.activeElement).toBe(input);
  });
});
