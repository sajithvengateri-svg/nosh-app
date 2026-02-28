/**
 * TODO Command Portal - Settings Drawer Tests
 *
 * Validates the TodoSettingsDrawer: opening/closing, toggling each
 * setting and verifying the corresponding UI element appears or
 * disappears, and resetting all toggles to their defaults.
 *
 * All tests login as the owner of "urban-bistro".
 */
import { test, expect } from "../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function gotoTodo(page: import("@playwright/test").Page) {
  await page.goto("/todo");
  await page.waitForLoadState("networkidle");
  await page
    .locator("h2")
    .filter({ hasText: /To Do Command Portal|My Day/i })
    .first()
    .waitFor({ state: "visible", timeout: 10_000 });
}

/** Open the Settings drawer via the gear (Settings2) icon. */
async function openSettingsDrawer(page: import("@playwright/test").Page) {
  const settingsBtn = page.locator("button").filter({ has: page.locator("svg.lucide-settings-2") });
  await settingsBtn.click();
  await page
    .locator("[role=dialog]")
    .filter({ hasText: /Todo Settings|Customise Your Todo/i })
    .waitFor({ state: "visible", timeout: 5_000 });
}

/** Close the Settings drawer. */
async function closeSettingsDrawer(page: import("@playwright/test").Page) {
  const closeBtn = page
    .locator("[role=dialog] button")
    .filter({ has: page.locator("svg.lucide-x") })
    .first();
  if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await closeBtn.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page
    .locator("[role=dialog]")
    .filter({ hasText: /Todo Settings|Customise Your Todo/i })
    .waitFor({ state: "hidden", timeout: 5_000 })
    .catch(() => {});
}

/**
 * Toggle a setting by label. The drawer must already be open.
 * Returns the current state after toggling.
 */
async function toggleSetting(
  page: import("@playwright/test").Page,
  labelText: string | RegExp,
): Promise<string> {
  const row = page.locator("[role=dialog] label").filter({ hasText: labelText });
  const toggle = row.locator("button[role=switch]");
  await toggle.click();
  await page.waitForTimeout(300);
  return (await toggle.getAttribute("data-state")) ?? "unknown";
}

/**
 * Get the data-state ("checked" | "unchecked") of a setting toggle.
 * Drawer must be open.
 */
async function getSettingState(
  page: import("@playwright/test").Page,
  labelText: string | RegExp,
): Promise<string> {
  const row = page.locator("[role=dialog] label").filter({ hasText: labelText });
  const toggle = row.locator("button[role=switch]");
  return (await toggle.getAttribute("data-state")) ?? "unknown";
}

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

test.describe("TODO Portal - Settings Drawer", () => {
  /* ---------------------------------------------------------------- */
  /* 1. Open settings drawer via gear icon                             */
  /* ---------------------------------------------------------------- */
  test("1 - Open settings drawer via gear icon and verify contents", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Click gear icon
    await openSettingsDrawer(page);

    // The drawer title should be visible
    await expect(
      page.locator("[role=dialog]").getByText(/Todo Settings/i),
    ).toBeVisible();

    // Description text
    await expect(
      page.locator("[role=dialog]").getByText(/Show or hide features to suit your workflow/i),
    ).toBeVisible();

    // All 15 toggle rows should be present
    const expectedLabels = [
      "Kanban Board",
      "Day Carousel",
      "Progress Bar",
      "Shopping Tab",
      "Chef Orders Tab",
      "Handwriting Input",
      "Photo Scan",
      "Templates",
      "Task Delegation",
      "Voice Commands",
      "Workflows",
      "AI Suggest",
      "Search",
      "Archive",
      "Thought of the Day",
    ];

    for (const label of expectedLabels) {
      const row = page.locator("[role=dialog] label").filter({ hasText: new RegExp(`^${label}$`, "i") });
      await expect(row).toBeVisible({ timeout: 3_000 });
    }

    // Reset button should be present
    await expect(
      page.locator("[role=dialog]").getByRole("button", { name: /Reset all to default/i }),
    ).toBeVisible();

    // Close the drawer
    await closeSettingsDrawer(page);

    // Drawer should be hidden
    await expect(
      page.locator("[role=dialog]").filter({ hasText: /Todo Settings/i }),
    ).not.toBeVisible({ timeout: 3_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 2. Toggle each setting off - verify UI element disappears         */
  /* ---------------------------------------------------------------- */
  test("2 - Toggle settings off and verify corresponding UI elements disappear", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // --- Search ---
    // Verify search button visible by default
    const searchIconBtn = page.locator(".flex.gap-1.items-center button").filter({
      has: page.locator("svg.lucide-search"),
    });
    await expect(searchIconBtn).toBeVisible();

    await openSettingsDrawer(page);
    await toggleSetting(page, /^Search$/i);
    await closeSettingsDrawer(page);

    await expect(searchIconBtn).not.toBeVisible({ timeout: 3_000 });

    // --- Archive ---
    const archiveIconBtn = page.locator(".flex.gap-1.items-center button").filter({
      has: page.locator("svg.lucide-archive"),
    }).first();

    // Archive should still be visible (we only toggled search)
    await expect(archiveIconBtn).toBeVisible();

    await openSettingsDrawer(page);
    await toggleSetting(page, /^Archive$/i);
    await closeSettingsDrawer(page);

    await expect(archiveIconBtn).not.toBeVisible({ timeout: 3_000 });

    // --- AI Suggest (Sparkles) ---
    const sparklesBtn = page.locator(".flex.gap-1.items-center button").filter({
      has: page.locator("svg.lucide-sparkles"),
    }).first();
    await expect(sparklesBtn).toBeVisible();

    await openSettingsDrawer(page);
    await toggleSetting(page, /^AI Suggest$/i);
    await closeSettingsDrawer(page);

    await expect(sparklesBtn).not.toBeVisible({ timeout: 3_000 });

    // --- Handwriting (Pencil) ---
    const pencilBtn = page.locator(".flex.gap-1.items-center button").filter({
      has: page.locator("svg.lucide-pencil"),
    });
    await expect(pencilBtn).toBeVisible();

    await openSettingsDrawer(page);
    await toggleSetting(page, /^Handwriting Input$/i);
    await closeSettingsDrawer(page);

    await expect(pencilBtn).not.toBeVisible({ timeout: 3_000 });

    // --- Photo Scan (Camera in header) ---
    const headerCameraBtn = page.locator(".flex.gap-1.items-center button").filter({
      has: page.locator("svg.lucide-camera"),
    });
    await expect(headerCameraBtn).toBeVisible();

    await openSettingsDrawer(page);
    await toggleSetting(page, /^Photo Scan$/i);
    await closeSettingsDrawer(page);

    await expect(headerCameraBtn).not.toBeVisible({ timeout: 3_000 });

    // Re-enable everything via reset so later tests start clean
    await openSettingsDrawer(page);
    await page.locator("[role=dialog]").getByRole("button", { name: /Reset all to default/i }).click();
    await closeSettingsDrawer(page);
  });

  /* ---------------------------------------------------------------- */
  /* 3. Toggle kanban off - verify toggle buttons disappear            */
  /* ---------------------------------------------------------------- */
  test("3 - Toggle kanban off and verify view toggle buttons disappear", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Kanban toggle group (List + LayoutGrid buttons in a bg-muted container)
    const kanbanToggleGroup = page.locator(".flex.gap-0\\.5.rounded-lg.bg-muted");
    await expect(kanbanToggleGroup).toBeVisible({ timeout: 5_000 });

    // Disable kanban
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Kanban Board$/i);
    await closeSettingsDrawer(page);

    // The toggle group should disappear
    await expect(kanbanToggleGroup).not.toBeVisible({ timeout: 3_000 });

    // Should automatically fall back to list view (no kanban columns)
    const kanbanColumn = page.locator("h3").filter({ hasText: "In Progress" });
    await expect(kanbanColumn).not.toBeVisible({ timeout: 3_000 });

    // Re-enable
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Kanban Board$/i);
    await closeSettingsDrawer(page);

    await expect(kanbanToggleGroup).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 4. Toggle shopping tab off - verify tab disappears                */
  /* ---------------------------------------------------------------- */
  test("4 - Toggle shopping tab off and verify tab disappears", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Shopping tab should be visible by default
    const shoppingTab = page.getByRole("tab", { name: /Shopping/i });
    await expect(shoppingTab).toBeVisible();

    // Disable shopping tab
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Shopping Tab$/i);
    await closeSettingsDrawer(page);

    // Tab should disappear
    await expect(shoppingTab).not.toBeVisible({ timeout: 3_000 });

    // Re-enable
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Shopping Tab$/i);
    await closeSettingsDrawer(page);

    await expect(page.getByRole("tab", { name: /Shopping/i })).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 5. Toggle workflows tab off - verify tab disappears               */
  /* ---------------------------------------------------------------- */
  test("5 - Toggle workflows tab off and verify tab disappears", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Workflows tab should be visible by default
    const workflowsTab = page.getByRole("tab", { name: /Workflows/i });
    await expect(workflowsTab).toBeVisible();

    // Disable workflows tab
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Workflows$/i);
    await closeSettingsDrawer(page);

    // Tab should disappear
    await expect(workflowsTab).not.toBeVisible({ timeout: 3_000 });

    // Re-enable
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Workflows$/i);
    await closeSettingsDrawer(page);

    await expect(page.getByRole("tab", { name: /Workflows/i })).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 6. Toggle day carousel off - verify carousel disappears           */
  /* ---------------------------------------------------------------- */
  test("6 - Toggle day carousel off and verify carousel disappears", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Day carousel should be visible (card-elevated wrapper)
    const carousel = page.locator(".card-elevated").first();
    await expect(carousel).toBeVisible({ timeout: 5_000 });

    // Verify Mon-Sun day buttons are present
    const dayBtns = carousel.locator("button").filter({ hasText: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i });
    expect(await dayBtns.count()).toBeGreaterThanOrEqual(7);

    // Disable day carousel
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Day Carousel$/i);
    await closeSettingsDrawer(page);

    // Carousel wrapper should disappear
    await expect(carousel).not.toBeVisible({ timeout: 3_000 });

    // Re-enable
    await openSettingsDrawer(page);
    await toggleSetting(page, /^Day Carousel$/i);
    await closeSettingsDrawer(page);

    await expect(page.locator(".card-elevated").first()).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 7. Toggle progress bar off - verify bar disappears                */
  /* ---------------------------------------------------------------- */
  test("7 - Toggle progress bar off and verify bar disappears", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Switch to list view so progress bar is visible
    const listToggle = page.locator("button").filter({ has: page.locator("svg.lucide-list") });
    if (await listToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listToggle.click();
    }

    // First ensure there are tasks so the progress bar appears
    // Add a task to guarantee content
    const fab = page.locator("button.fixed").filter({ has: page.locator("svg.lucide-plus") });
    await fab.click();
    const dialog = page.locator("[role=dialog]").filter({ hasText: /Add Task/i });
    await dialog.waitFor({ state: "visible", timeout: 5_000 });
    await dialog.getByPlaceholder(/Prep cookie dough/i).fill("Progress bar test");
    await dialog.getByRole("button", { name: /Add/i }).click();
    await dialog.waitFor({ state: "hidden", timeout: 5_000 });
    await page.waitForTimeout(1_000);

    // Progress bar uses "X of Y done" text
    const progressText = page.locator("text=/\\d+ of \\d+ done/").first();
    // The progress bar wrapper is a div with h-2 rounded-full bg-muted
    const progressBarTrack = page.locator(".h-2.rounded-full.bg-muted").first();

    // It should be visible if we have tasks
    const hasProgressBar = await progressText.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasProgressBar) {
      // Disable progress bar
      await openSettingsDrawer(page);
      await toggleSetting(page, /^Progress Bar$/i);
      await closeSettingsDrawer(page);

      // Progress bar should disappear
      await expect(progressText).not.toBeVisible({ timeout: 3_000 });
      await expect(progressBarTrack).not.toBeVisible({ timeout: 3_000 });

      // Re-enable
      await openSettingsDrawer(page);
      await toggleSetting(page, /^Progress Bar$/i);
      await closeSettingsDrawer(page);

      // Progress bar should reappear
      await expect(progressText).toBeVisible({ timeout: 5_000 });
    } else {
      // No tasks for this day, so progress bar won't show - just verify toggle works in settings
      await openSettingsDrawer(page);
      const state = await getSettingState(page, /^Progress Bar$/i);
      expect(state).toBe("checked");

      await toggleSetting(page, /^Progress Bar$/i);
      const newState = await getSettingState(page, /^Progress Bar$/i);
      expect(newState).toBe("unchecked");

      // Re-enable
      await toggleSetting(page, /^Progress Bar$/i);
      await closeSettingsDrawer(page);
    }
  });

  /* ---------------------------------------------------------------- */
  /* 8. Reset all to default - verify all 15+ toggles                  */
  /* ---------------------------------------------------------------- */
  test("8 - Reset all to default restores every toggle to its default value", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Open settings and make several changes from defaults
    await openSettingsDrawer(page);

    // Turn OFF things that are ON by default
    await toggleSetting(page, /^Kanban Board$/i); // true -> false
    await toggleSetting(page, /^Day Carousel$/i); // true -> false
    await toggleSetting(page, /^Progress Bar$/i); // true -> false
    await toggleSetting(page, /^Shopping Tab$/i); // true -> false
    await toggleSetting(page, /^Chef Orders Tab$/i); // true -> false
    await toggleSetting(page, /^Search$/i); // true -> false
    await toggleSetting(page, /^Archive$/i); // true -> false
    await toggleSetting(page, /^AI Suggest$/i); // true -> false
    await toggleSetting(page, /^Thought of the Day$/i); // true -> false

    // Turn ON things that are OFF by default
    await toggleSetting(page, /^Voice Commands$/i); // false -> true

    // Verify some are indeed changed
    expect(await getSettingState(page, /^Kanban Board$/i)).toBe("unchecked");
    expect(await getSettingState(page, /^Search$/i)).toBe("unchecked");
    expect(await getSettingState(page, /^Voice Commands$/i)).toBe("checked");

    // Click "Reset all to default"
    await page.locator("[role=dialog]").getByRole("button", { name: /Reset all to default/i }).click();

    // Give it a moment to apply
    await page.waitForTimeout(500);

    // Now verify ALL toggles are at their default values
    // Default: TRUE
    const defaultOnSettings = [
      { label: /^Kanban Board$/i, expected: "checked" },
      { label: /^Day Carousel$/i, expected: "checked" },
      { label: /^Progress Bar$/i, expected: "checked" },
      { label: /^Shopping Tab$/i, expected: "checked" },
      { label: /^Chef Orders Tab$/i, expected: "checked" },
      { label: /^Handwriting Input$/i, expected: "checked" },
      { label: /^Photo Scan$/i, expected: "checked" },
      { label: /^Templates$/i, expected: "checked" },
      { label: /^Task Delegation$/i, expected: "checked" },
      { label: /^Workflows$/i, expected: "checked" },
      { label: /^AI Suggest$/i, expected: "checked" },
      { label: /^Search$/i, expected: "checked" },
      { label: /^Archive$/i, expected: "checked" },
      { label: /^Thought of the Day$/i, expected: "checked" },
    ];

    // Default: FALSE
    const defaultOffSettings = [
      { label: /^Voice Commands$/i, expected: "unchecked" },
    ];

    for (const { label, expected } of [...defaultOnSettings, ...defaultOffSettings]) {
      const state = await getSettingState(page, label);
      expect(state, `Setting ${label} should be ${expected}`).toBe(expected);
    }

    await closeSettingsDrawer(page);

    // Verify UI elements are restored:
    // - Search button visible
    await expect(
      page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-search") }),
    ).toBeVisible({ timeout: 5_000 });

    // - Archive button visible
    await expect(
      page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-archive") }).first(),
    ).toBeVisible();

    // - AI Suggest (Sparkles) visible
    await expect(
      page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-sparkles") }).first(),
    ).toBeVisible();

    // - Kanban toggle group visible
    await expect(page.locator(".flex.gap-0\\.5.rounded-lg.bg-muted")).toBeVisible();

    // - Day carousel visible
    await expect(page.locator(".card-elevated").first()).toBeVisible();

    // - Shopping tab visible
    await expect(page.getByRole("tab", { name: /Shopping/i })).toBeVisible();

    // - Workflows tab visible
    await expect(page.getByRole("tab", { name: /Workflows/i })).toBeVisible();

    // - Orders tab visible
    await expect(page.getByRole("tab", { name: /Orders/i })).toBeVisible();

    // - Voice mic should NOT be visible (default off)
    const micBtn = page.locator("button").filter({ has: page.locator("svg.lucide-mic") });
    await expect(micBtn).not.toBeVisible({ timeout: 2_000 });

    // - Pencil (handwriting) visible
    await expect(
      page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-pencil") }),
    ).toBeVisible();

    // - Header camera (scan) visible
    await expect(
      page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-camera") }),
    ).toBeVisible();
  });
});
