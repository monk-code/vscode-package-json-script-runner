#### **Goal: Improve the clarity and usability of the recent commands feature.**

1.  **Refine Recent Command Item Display**
    *   **User Story:** As a user, I want to see recent commands presented cleanly, with the package name and execution time clearly visible without distracting icons.
    *   **Implementation (`src/recent-commands/create-recent-quick-pick-items.ts`):**
        *   Remove the icon from each item.
        *   Display the package name in the `description` field.
        *   Move the relative timestamp to the `detail` field.
    *   **TDD Cycle:**
        *   **Red:** In `.../create-recent-quick-pick-items.spec.ts` and `.../visual-accessibility.spec.ts`, write failing tests that assert the new item structure (no icon, correct description/detail).
        *   **Green:** Implement the changes to make the tests pass.
        *   **Refactor:** Clean up the implementation.

2.  **Introduce "Recent Commands" Separator**
    *   **User Story:** As a user, I want a clear visual separation between my recent commands and the full list of scripts so I can quickly distinguish between the two sections.
    *   **Implementation (`src/recent-commands/create-recent-quick-pick-items.ts`):**
        *   Add a labeled separator (`QuickPickItemKind.Separator`) with the text "Recent Commands" above the list.
        *   The separator should only appear if recent commands exist.
    *   **TDD Cycle:**
        *   **Red:** In `.../create-recent-quick-pick-items.spec.ts`, write failing tests to verify the separator is present only when recent commands exist and that its label is correct. Add a test to ensure the separator behaves correctly during filtering.
        *   **Green:** Implement the separator logic to make the tests pass.
        *   **Refactor:** Clean up the implementation.

3.  **Final Validation**
    *   Run all project checks to ensure quality and consistency:
        *   `pnpm validate`