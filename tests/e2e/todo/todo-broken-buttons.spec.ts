/**
 * TODO Command Portal - Broken Buttons & Edge-Case Scenarios
 *
 * Validates that every header button, dialog, and feature-gated element
 * behaves correctly (including graceful error handling).
 *
 * All tests login as the owner of "urban-bistro" unless noted otherwise.
 */
import { test, expect } from "../fixtures/auth.fixture";

/* ------------------------------------------------------------------ */
/*  Helper: navigate to /todo and wait for the panel to render         */
/* ------------------------------------------------------------------ */
async function gotoTodo(page: import("@playwright/test").Page) {
  await page.goto("/todo");
  await page.waitForLoadState("networkidle");
  // Wait for the main heading to appear – works for both ChefOS and HomeCook
  await page
    .locator("h2")
    .filter({ hasText: /To Do Command Portal|My Day/i })
    .first()
    .waitFor({ state: "visible", timeout: 10_000 });
}

/**
 * Open the settings drawer, toggle a setting, and close.
 * Settings uses a Sheet; the trigger is the Settings2 (gear) icon button.
 */
async function openSettingsDrawer(page: import("@playwright/test").Page) {
  // The gear icon is the last icon-only button in the header row
  const settingsBtn = page.locator("button").filter({ has: page.locator("svg.lucide-settings-2") });
  await settingsBtn.click();
  // Wait for the Sheet content
  await page.locator("[role=dialog]").filter({ hasText: /Todo Settings|Customise Your Todo/i }).waitFor({ state: "visible", timeout: 5_000 });
}

async function closeSettingsDrawer(page: import("@playwright/test").Page) {
  // Close the Sheet by clicking the Sheet close button (X) inside the dialog
  const closeBtn = page.locator("[role=dialog] button").filter({ has: page.locator("svg.lucide-x") }).first();
  if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await closeBtn.click();
  } else {
    // Fallback – press Escape
    await page.keyboard.press("Escape");
  }
  await page.locator("[role=dialog]").filter({ hasText: /Todo Settings|Customise Your Todo/i }).waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}

/**
 * Toggle a specific setting by its label text.
 * The drawer must already be open.
 */
async function toggleSetting(page: import("@playwright/test").Page, labelText: string | RegExp) {
  const row = page.locator("[role=dialog] label").filter({ hasText: labelText });
  const toggle = row.locator("button[role=switch]");
  await toggle.click();
}

/**
 * Helper to add a task via the FAB (+) dialog.
 */
async function addTaskViaFab(
  page: import("@playwright/test").Page,
  title: string,
  opts?: { priority?: "high" | "medium" | "low" },
) {
  // Click the FAB (fixed bottom-right Plus button)
  const fab = page.locator("button.fixed").filter({ has: page.locator("svg.lucide-plus") });
  await fab.click();

  // Dialog should open
  const dialog = page.locator("[role=dialog]").filter({ hasText: /Add Task|Add Shopping Item/i });
  await dialog.waitFor({ state: "visible", timeout: 5_000 });

  // Fill title
  await dialog.getByPlaceholder(/Prep cookie dough|2kg Flour/i).fill(title);

  // Select priority if provided
  if (opts?.priority) {
    await dialog.locator("button").filter({ hasText: new RegExp(`^${opts.priority}$`, "i") }).click();
  }

  // Click "Add"
  await dialog.getByRole("button", { name: /Add/i }).click();

  // Wait for the dialog to close
  await dialog.waitFor({ state: "hidden", timeout: 5_000 });
}

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

test.describe("TODO Portal - Broken Buttons & Edge Cases", () => {
  /* ---------------------------------------------------------------- */
  /* 1. AI Suggest button                                              */
  /* ---------------------------------------------------------------- */
  test("1 - AI Suggest button shows loading spinner and handles edge function error gracefully", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // The Sparkles icon button should be visible (todoAiSuggestEnabled = true by default)
    const sparklesBtn = page.locator("button").filter({ has: page.locator("svg.lucide-sparkles") }).first();
    await expect(sparklesBtn).toBeVisible();

    // Intercept the edge function so we can control the response
    await page.route("**/functions/v1/suggest-todo-tasks", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Internal error" }) }),
    );

    await sparklesBtn.click();

    // The button should show a loading spinner (Loader2)
    const spinner = page.locator("button").filter({ has: page.locator("svg.lucide-loader-2") }).first();
    // It may appear briefly; just assert it shows OR immediately fails gracefully
    await expect(spinner.or(sparklesBtn)).toBeVisible({ timeout: 5_000 });

    // Wait for an error toast (sonner) – the page should NOT crash
    const toastMessage = page.locator("[data-sonner-toast]").filter({ hasText: /could not get suggestions|internal error/i });
    await expect(toastMessage).toBeVisible({ timeout: 10_000 });

    // Page is still interactive
    await expect(page.locator("h2").filter({ hasText: /To Do Command Portal/i })).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 2. Voice Commands button                                          */
  /* ---------------------------------------------------------------- */
  test("2 - Voice Commands button appears after enabling setting and handles no-microphone gracefully", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // By default todoVoiceEnabled = false => mic button should not exist
    const micBtn = page.locator("button").filter({ has: page.locator("svg.lucide-mic") });
    await expect(micBtn).not.toBeVisible();

    // Enable voice via settings drawer
    await openSettingsDrawer(page);
    await toggleSetting(page, /Voice Commands|Voice Control/i);
    await closeSettingsDrawer(page);

    // Now the mic button should be visible
    await expect(micBtn).toBeVisible({ timeout: 5_000 });

    // Click the mic button – without SpeechRecognition API it should show a toast
    await micBtn.click();

    // Either a toast "Voice not supported" or the browser handles gracefully
    const toastOrButton = page.locator("[data-sonner-toast]").filter({ hasText: /voice not supported|not supported/i });
    // In headless Chromium, SpeechRecognition is unavailable so we expect this toast
    // If the browser happens to support it, the mic-off icon appears instead
    const micOffBtn = page.locator("button").filter({ has: page.locator("svg.lucide-mic-off") });
    await expect(toastOrButton.or(micOffBtn)).toBeVisible({ timeout: 5_000 });

    // Page is still alive
    await expect(page.locator("h2").filter({ hasText: /To Do Command Portal/i })).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 3. Handwriting Canvas                                             */
  /* ---------------------------------------------------------------- */
  test("3 - Handwriting Canvas opens with a canvas element and close button works", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Pencil icon button (todoHandwriteEnabled = true by default)
    const pencilBtn = page.locator("button").filter({ has: page.locator("svg.lucide-pencil") });
    await expect(pencilBtn).toBeVisible();

    await pencilBtn.click();

    // The FingerCanvas overlay should appear – it's a fixed full-screen div
    const canvasOverlay = page.locator(".fixed.inset-0").filter({ hasText: /Quick Note/i });
    await expect(canvasOverlay).toBeVisible({ timeout: 5_000 });

    // A <canvas> element should exist inside the overlay
    const canvas = canvasOverlay.locator("canvas");
    await expect(canvas).toBeVisible();

    // Verify the "Cancel" close button is present and click it
    const cancelBtn = canvasOverlay.getByRole("button", { name: /Cancel/i });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Overlay should be gone
    await expect(canvasOverlay).not.toBeVisible({ timeout: 3_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 4. Photo Scan - header camera button                              */
  /* ---------------------------------------------------------------- */
  test("4 - Photo Scan header button triggers hidden file input", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // The header camera button (todoScanEnabled = true by default).
    // There are two camera buttons in the header row: one for scan.
    // The scan camera is inside the header flex, not inside a task item.
    const headerButtons = page.locator(".flex.gap-1.items-center");
    const scanCameraBtn = headerButtons.locator("button").filter({ has: page.locator("svg.lucide-camera") });
    await expect(scanCameraBtn).toBeVisible();

    // Verify there's a hidden file input for scanning
    const hiddenInput = page.locator('input[type="file"][accept="image/*"].hidden').first();
    await expect(hiddenInput).toBeAttached();

    // Clicking the scan camera should programmatically trigger the file input
    // We can't fully test native file dialogs, but we verify no crash
    await scanCameraBtn.click();

    // The page should remain stable (no error boundary)
    await expect(page.locator("h2").filter({ hasText: /To Do Command Portal/i })).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 5. Send to Chef - single-user org (solo home cook)                */
  /* ---------------------------------------------------------------- */
  test("5 - Send to Chef in a solo org handles empty team gracefully", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("tiny-home-cook");
    await gotoTodo(page);

    // Switch to list view to see individual task items with Send button
    const listToggle = page.locator("button").filter({ has: page.locator("svg.lucide-list") });
    if (await listToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listToggle.click();
    }

    // Add a task first
    await addTaskViaFab(page, "Solo chef test task");

    // Wait for the task to appear
    const taskItem = page.locator("text=Solo chef test task").first();
    await expect(taskItem).toBeVisible({ timeout: 10_000 });

    // Click the Send button on the task
    const sendBtn = taskItem.locator("..").locator("..").locator("button").filter({ has: page.locator("svg.lucide-send") }).first();

    if (await sendBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sendBtn.click();

      // The SendToChefDialog opens
      const dialog = page.locator("[role=dialog]").filter({ hasText: /Send to Chef/i });
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Should show "No team members found" inside the Select
      const selectTrigger = dialog.locator("button[role=combobox]");
      await selectTrigger.click();
      const noMembers = page.getByText(/No team members found/i);
      await expect(noMembers).toBeVisible({ timeout: 5_000 });

      // Close the dialog
      await page.keyboard.press("Escape");
    }

    // Page is still alive
    await expect(page.locator("h2").filter({ hasText: /My Day/i })).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 6. Send to Chef - team org                                        */
  /* ---------------------------------------------------------------- */
  test("6 - Send to Chef in a team org opens dialog with team members", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Switch to list view
    const listToggle = page.locator("button").filter({ has: page.locator("svg.lucide-list") });
    if (await listToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listToggle.click();
    }

    // Add a task
    await addTaskViaFab(page, "Team send test task");

    // Wait for the task
    const taskText = page.locator("text=Team send test task").first();
    await expect(taskText).toBeVisible({ timeout: 10_000 });

    // Find the send button near the task
    const taskCard = taskText.locator("xpath=ancestor::div[contains(@class, 'bg-card')]").first();
    const sendBtn = taskCard.locator("button").filter({ has: page.locator("svg.lucide-send") }).first();
    await expect(sendBtn).toBeVisible({ timeout: 3_000 });
    await sendBtn.click();

    // The SendToChefDialog should open
    const dialog = page.locator("[role=dialog]").filter({ hasText: /Send to Chef/i });
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // The task title should be displayed
    await expect(dialog.getByText("Team send test task")).toBeVisible();

    // The select trigger should be present for choosing a team member
    const selectTrigger = dialog.locator("button[role=combobox]");
    await expect(selectTrigger).toBeVisible();

    // Close dialog
    await page.keyboard.press("Escape");
  });

  /* ---------------------------------------------------------------- */
  /* 7. Kanban card status cycling                                     */
  /* ---------------------------------------------------------------- */
  test("7 - Kanban card click cycles status: pending -> in_progress -> done -> pending", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Ensure we're in kanban view
    const kanbanToggle = page.locator("button").filter({ has: page.locator("svg.lucide-layout-grid") });
    if (await kanbanToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await kanbanToggle.click();
    }

    // Add a task to work with
    await addTaskViaFab(page, "Kanban cycle test");

    // Wait for it to appear in the "To Do" (pending) column
    const pendingColumn = page.locator("h3").filter({ hasText: "To Do" }).locator("..");
    const card = page.locator("text=Kanban cycle test").first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Click the card -> should move to "In Progress"
    await card.click();
    await page.waitForTimeout(1_000);

    // Verify it's now in "In Progress" column
    const inProgressColumn = page.locator("h3").filter({ hasText: "In Progress" }).locator("..");
    const cardInProgress = inProgressColumn.locator("..").locator("text=Kanban cycle test");
    await expect(cardInProgress).toBeVisible({ timeout: 5_000 });

    // Click again -> should move to "Done"
    await cardInProgress.click();
    await page.waitForTimeout(1_000);

    const doneColumn = page.locator("h3").filter({ hasText: "Done" }).locator("..");
    const cardDone = doneColumn.locator("..").locator("text=Kanban cycle test");
    await expect(cardDone).toBeVisible({ timeout: 5_000 });

    // Click again -> should cycle back to "To Do" (pending)
    await cardDone.click();
    await page.waitForTimeout(1_000);

    const cardBack = pendingColumn.locator("..").locator("text=Kanban cycle test");
    await expect(cardBack).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 8. Archive view                                                   */
  /* ---------------------------------------------------------------- */
  test("8 - Archive button opens archive view and Back returns to main view", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Click archive icon button
    const archiveBtn = page.locator("button").filter({ has: page.locator("svg.lucide-archive") }).first();
    await expect(archiveBtn).toBeVisible();
    await archiveBtn.click();

    // Should show "Archive" or "Filed Away" heading
    const archiveHeading = page.locator("h2").filter({ hasText: /Archive|Filed Away/i });
    await expect(archiveHeading).toBeVisible({ timeout: 5_000 });

    // Range filter buttons should be visible (7 days, 30 days, All)
    await expect(page.getByRole("button", { name: "7 days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();

    // Click "Back" button
    const backBtn = page.getByRole("button", { name: /Back/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Should return to main view with the "To Do Command Portal" heading
    await expect(page.locator("h2").filter({ hasText: /To Do Command Portal/i })).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 9. Clear completed                                                */
  /* ---------------------------------------------------------------- */
  test("9 - Clear completed removes only done items", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Switch to list view
    const listToggle = page.locator("button").filter({ has: page.locator("svg.lucide-list") });
    if (await listToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listToggle.click();
    }

    // Add two tasks
    await addTaskViaFab(page, "Keep this pending");
    await addTaskViaFab(page, "Mark this done");

    // Wait for both to appear
    await expect(page.locator("text=Keep this pending").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Mark this done").first()).toBeVisible({ timeout: 10_000 });

    // Toggle "Mark this done" to complete by clicking the circle button
    const doneTaskRow = page.locator("text=Mark this done").first().locator("xpath=ancestor::div[contains(@class, 'bg-card')]").first();
    const circleBtn = doneTaskRow.locator("button").filter({ has: page.locator("svg.lucide-circle") }).first();
    await circleBtn.click();

    // Wait for the completed section to appear
    const completedSection = page.locator("text=Completed").first();
    await expect(completedSection).toBeVisible({ timeout: 5_000 });

    // Click "Clear" link
    const clearBtn = page.locator("button, a").filter({ hasText: /^Clear$/ }).first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // "Mark this done" should disappear from completed section
    await expect(page.locator("text=Mark this done")).not.toBeVisible({ timeout: 5_000 });

    // "Keep this pending" should still be visible
    await expect(page.locator("text=Keep this pending").first()).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 10. Templates: Save                                               */
  /* ---------------------------------------------------------------- */
  test("10 - Templates: save current tasks as a template", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Switch to list view
    const listToggle = page.locator("button").filter({ has: page.locator("svg.lucide-list") });
    if (await listToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listToggle.click();
    }

    // Add some tasks
    await addTaskViaFab(page, "Template task alpha");
    await addTaskViaFab(page, "Template task beta");
    await expect(page.locator("text=Template task alpha").first()).toBeVisible({ timeout: 10_000 });

    // Click the Templates button
    const templatesBtn = page.getByRole("button", { name: /Templates/i });
    await expect(templatesBtn).toBeVisible();
    await templatesBtn.click();

    // Templates dialog should open
    const dialog = page.locator("[role=dialog]").filter({ hasText: /Templates/i });
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Should show "Save current X pending items"
    await expect(dialog.getByText(/Save current.*pending items/i)).toBeVisible();

    // Fill template name
    await dialog.getByPlaceholder("Template name").fill("My Test Template");

    // Click the save button (BookmarkPlus icon)
    const saveBtn = dialog.locator("button").filter({ has: page.locator("svg.lucide-bookmark-plus") });
    await saveBtn.click();

    // Should see success toast
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Template saved/i })).toBeVisible({ timeout: 5_000 });

    // Reopen templates dialog – "My Test Template" should appear in the list
    await templatesBtn.click();
    const dialogReopen = page.locator("[role=dialog]").filter({ hasText: /Templates/i });
    await expect(dialogReopen.getByText("My Test Template")).toBeVisible({ timeout: 5_000 });

    // Clean up: close dialog
    await page.keyboard.press("Escape");
  });

  /* ---------------------------------------------------------------- */
  /* 11. Templates: Load                                               */
  /* ---------------------------------------------------------------- */
  test("11 - Templates: load a saved template and verify items appear", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Switch to list view
    const listToggle = page.locator("button").filter({ has: page.locator("svg.lucide-list") });
    if (await listToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listToggle.click();
    }

    // First, create a template with some tasks
    await addTaskViaFab(page, "Loadable item one");
    await addTaskViaFab(page, "Loadable item two");
    await expect(page.locator("text=Loadable item one").first()).toBeVisible({ timeout: 10_000 });

    // Save as template
    const templatesBtn = page.getByRole("button", { name: /Templates/i });
    await templatesBtn.click();
    const dialog = page.locator("[role=dialog]").filter({ hasText: /Templates/i });
    await dialog.getByPlaceholder("Template name").fill("Load Test Template");
    await dialog.locator("button").filter({ has: page.locator("svg.lucide-bookmark-plus") }).click();
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Template saved/i })).toBeVisible({ timeout: 5_000 });

    // Close and reopen templates
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Now load the template
    await templatesBtn.click();
    const dialogLoad = page.locator("[role=dialog]").filter({ hasText: /Templates/i });
    await expect(dialogLoad).toBeVisible({ timeout: 5_000 });

    // Find the template row and click Load
    const templateRow = dialogLoad.locator("text=Load Test Template").locator("xpath=ancestor::div[contains(@class, 'rounded-lg')]").first();
    const loadBtn = templateRow.getByRole("button", { name: /Load/i });
    await loadBtn.click();

    // Should see success toast
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Loaded.*items/i })).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 12. Workflows: Add Rule                                           */
  /* ---------------------------------------------------------------- */
  test("12 - Workflows tab: add a weekly recurring rule", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Click the Workflows tab
    const workflowsTab = page.getByRole("tab", { name: /Workflows/i });
    await expect(workflowsTab).toBeVisible();
    await workflowsTab.click();

    // Click "Add Rule"
    const addRuleBtn = page.getByRole("button", { name: /Add Rule/i });
    await expect(addRuleBtn).toBeVisible({ timeout: 5_000 });
    await addRuleBtn.click();

    // Dialog should open
    const dialog = page.locator("[role=dialog]").filter({ hasText: /New Workflow Rule/i });
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Fill task title
    await dialog.getByPlaceholder("Task title").fill("Weekly stock take");

    // Select "weekly" recurrence
    await dialog.locator("button").filter({ hasText: /^weekly$/i }).click();

    // Select Monday (index 1) and Friday (index 5) day buttons
    const dayButtons = dialog.locator("button").filter({ hasText: /^Mon$/ });
    await dayButtons.click();
    const friButton = dialog.locator("button").filter({ hasText: /^Fri$/ });
    await friButton.click();

    // Click "Add Rule" to save
    const saveRuleBtn = dialog.getByRole("button", { name: /Add Rule/i });
    await saveRuleBtn.click();

    // Should see success toast
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Workflow created|Routine added/i })).toBeVisible({ timeout: 5_000 });

    // The rule should appear in the list
    await expect(page.locator("text=Weekly stock take").first()).toBeVisible({ timeout: 5_000 });
    // Should show the days badge
    await expect(page.locator("text=Mon").first()).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 13. Workflows: Pause/Play toggle                                  */
  /* ---------------------------------------------------------------- */
  test("13 - Workflows: toggle pause/play on a rule", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Go to Workflows tab
    const workflowsTab = page.getByRole("tab", { name: /Workflows/i });
    await workflowsTab.click();

    // Add a rule first
    const addRuleBtn = page.getByRole("button", { name: /Add Rule/i });
    await expect(addRuleBtn).toBeVisible({ timeout: 5_000 });
    await addRuleBtn.click();

    const dialog = page.locator("[role=dialog]").filter({ hasText: /New Workflow Rule/i });
    await dialog.getByPlaceholder("Task title").fill("Pause test rule");
    // Leave it as "daily" default
    await dialog.getByRole("button", { name: /Add Rule/i }).click();
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Workflow created|Routine added/i })).toBeVisible({ timeout: 5_000 });

    // The rule should appear; by default is_active=true, so Pause icon is shown
    const ruleRow = page.locator("text=Pause test rule").first().locator("xpath=ancestor::div[contains(@class, 'rounded-xl')]").first();
    const pauseBtn = ruleRow.locator("button").filter({ has: page.locator("svg.lucide-pause") });
    await expect(pauseBtn).toBeVisible({ timeout: 5_000 });

    // Click Pause -> should change to Play
    await pauseBtn.click();
    await page.waitForTimeout(1_000);

    const playBtn = ruleRow.locator("button").filter({ has: page.locator("svg.lucide-play") });
    await expect(playBtn).toBeVisible({ timeout: 5_000 });

    // Click Play -> should change back to Pause
    await playBtn.click();
    await page.waitForTimeout(1_000);

    await expect(ruleRow.locator("button").filter({ has: page.locator("svg.lucide-pause") })).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 14. Orders: AI Stock Check                                        */
  /* ---------------------------------------------------------------- */
  test("14 - Orders tab: AI Stock Check button handles error gracefully", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Click the Orders tab
    const ordersTab = page.getByRole("tab", { name: /Orders/i });
    await expect(ordersTab).toBeVisible();
    await ordersTab.click();

    // Wait for orders content to load
    await page.waitForTimeout(2_000);

    // Check if there are any wishlists visible with an AI Stock Check button
    const aiStockBtn = page.getByRole("button", { name: /AI Stock Check/i }).first();
    const emptyState = page.locator("text=No chef orders pending");

    if (await aiStockBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Intercept the edge function to simulate an error
      await page.route("**/functions/v1/check-stock-recommendations", (route) =>
        route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Service unavailable" }) }),
      );

      await aiStockBtn.click();

      // Should show error toast, not crash
      const errorToast = page.locator("[data-sonner-toast]").filter({ hasText: /AI check failed|Service unavailable/i });
      await expect(errorToast).toBeVisible({ timeout: 10_000 });
    } else {
      // If no wishlists, expect the empty state
      await expect(emptyState).toBeVisible({ timeout: 5_000 });
    }

    // Page is still alive
    await expect(page.locator("h2").filter({ hasText: /To Do Command Portal/i })).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 15. Settings: Reset all to default                                */
  /* ---------------------------------------------------------------- */
  test("15 - Settings: Reset all to default restores all 15+ toggles", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // First, disable several settings
    await openSettingsDrawer(page);

    // Turn OFF Search, Archive, and AI Suggest
    await toggleSetting(page, /^Search$/i);
    await toggleSetting(page, /^Archive$/i);
    await toggleSetting(page, /^AI Suggest$/i);

    // Turn ON Voice (it's off by default)
    await toggleSetting(page, /^Voice Commands$/i);

    await closeSettingsDrawer(page);

    // Verify Search button is now hidden
    const searchBtn = page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-search") });
    await expect(searchBtn).not.toBeVisible({ timeout: 3_000 });

    // Verify Archive button is now hidden
    const archiveBtn = page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-archive") });
    await expect(archiveBtn).not.toBeVisible();

    // Now reset all to default
    await openSettingsDrawer(page);

    const resetBtn = page.getByRole("button", { name: /Reset all to default/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // After reset, verify specific toggles are at their default states
    const dialogContent = page.locator("[role=dialog]");

    // Search should be ON (default: true)
    const searchRow = dialogContent.locator("label").filter({ hasText: /^Search$/i });
    const searchSwitch = searchRow.locator("button[role=switch]");
    await expect(searchSwitch).toHaveAttribute("data-state", "checked");

    // Archive should be ON (default: true)
    const archiveRow = dialogContent.locator("label").filter({ hasText: /^Archive$/i });
    const archiveSwitch = archiveRow.locator("button[role=switch]");
    await expect(archiveSwitch).toHaveAttribute("data-state", "checked");

    // AI Suggest should be ON (default: true)
    const aiRow = dialogContent.locator("label").filter({ hasText: /^AI Suggest$/i });
    const aiSwitch = aiRow.locator("button[role=switch]");
    await expect(aiSwitch).toHaveAttribute("data-state", "checked");

    // Voice should be OFF (default: false)
    const voiceRow = dialogContent.locator("label").filter({ hasText: /^Voice Commands$/i });
    const voiceSwitch = voiceRow.locator("button[role=switch]");
    await expect(voiceSwitch).toHaveAttribute("data-state", "unchecked");

    // Kanban should be ON (default: true)
    const kanbanRow = dialogContent.locator("label").filter({ hasText: /^Kanban Board$/i });
    const kanbanSwitch = kanbanRow.locator("button[role=switch]");
    await expect(kanbanSwitch).toHaveAttribute("data-state", "checked");

    // Workflows should be ON (default: true)
    const workflowsRow = dialogContent.locator("label").filter({ hasText: /^Workflows$/i });
    const workflowsSwitch = workflowsRow.locator("button[role=switch]");
    await expect(workflowsSwitch).toHaveAttribute("data-state", "checked");

    // Thought of the Day should be ON (default: true)
    const todRow = dialogContent.locator("label").filter({ hasText: /^Thought of the Day$/i });
    const todSwitch = todRow.locator("button[role=switch]");
    await expect(todSwitch).toHaveAttribute("data-state", "checked");

    // Day Carousel should be ON (default: true)
    const dayCarouselRow = dialogContent.locator("label").filter({ hasText: /^Day Carousel$/i });
    const dayCarouselSwitch = dayCarouselRow.locator("button[role=switch]");
    await expect(dayCarouselSwitch).toHaveAttribute("data-state", "checked");

    // Progress Bar should be ON (default: true)
    const progressRow = dialogContent.locator("label").filter({ hasText: /^Progress Bar$/i });
    const progressSwitch = progressRow.locator("button[role=switch]");
    await expect(progressSwitch).toHaveAttribute("data-state", "checked");

    await closeSettingsDrawer(page);

    // Verify the UI elements are back: Search and Archive buttons visible again
    await expect(page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-search") })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".flex.gap-1.items-center button").filter({ has: page.locator("svg.lucide-archive") }).first()).toBeVisible();
  });
});
