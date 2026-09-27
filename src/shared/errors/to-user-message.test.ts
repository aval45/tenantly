import { z } from "zod";
import { toUserMessage } from "./to-user-message";

describe("toUserMessage", () => {
  it("maps database codes without exposing backend text", () => {
    expect(toUserMessage(new Error("P0001: payment_proof_required"))).toBe(
      "Add a payment proof image for this payment method.",
    );
    expect(
      toUserMessage(new Error("P0001: cannot_archive_occupied_room")),
    ).toBe(
      "Cannot archive an occupied room. Transfer or vacate residents first.",
    );
    expect(toUserMessage(new Error("P0001: manager_properties_required"))).toBe(
      "Managers must be assigned to at least one property.",
    );
  });

  it("maps storage upload error codes", () => {
    expect(toUserMessage(new Error("image_too_large"))).toBe(
      "The image file exceeds the 10 MB limit.",
    );
    expect(toUserMessage(new Error("unsupported_document_type"))).toBe(
      "Unsupported document format. Please upload a PDF, PNG, or JPEG file.",
    );
    expect(toUserMessage(new Error("selected_file_unreadable"))).toBe(
      "Could not read the selected file. Please choose another file.",
    );
  });

  it("maps auth and network error codes", () => {
    expect(toUserMessage(new Error("Invalid login credentials"))).toBe(
      "Incorrect email or password.",
    );
    expect(toUserMessage(new Error("User already registered"))).toBe(
      "An account with this email address already exists.",
    );
    expect(toUserMessage(new Error("Network request failed"))).toBe(
      "Network connection error. Please check your internet connection.",
    );
  });

  it("translates ZodError instances", () => {
    const testSchema = z.object({
      title: z.string().min(3, "Title must be at least 3 characters."),
    });
    try {
      testSchema.parse({ title: "hi" });
    } catch (err) {
      expect(toUserMessage(err)).toBe("Title must be at least 3 characters.");
    }
  });

  it("translates stringified Zod issues", () => {
    const stringifiedZod = JSON.stringify([
      { code: "too_small", minimum: 5, message: "Description is too short." },
    ]);
    expect(toUserMessage(new Error(stringifiedZod))).toBe(
      "Description is too short.",
    );
  });

  it("handles plain Supabase/PostgREST error objects", () => {
    expect(
      toUserMessage({ code: "23505", message: "duplicate key value" }),
    ).toBe("A record with these details already exists.");
    expect(
      toUserMessage({ message: "P0001: room_at_capacity", code: "P0001" }),
    ).toBe("This room is already at its maximum bed capacity.");
  });

  it("uses a safe fallback for unknown technical failures", () => {
    expect(
      toUserMessage(
        new Error(
          "database host internals SQLSTATE[XX000] column x does not exist",
        ),
        "Try again later.",
      ),
    ).toBe("Try again later.");
  });
});
