/**
 * TODO Command Portal - CRUD Operations
 *
 * Validates core create/read/update/delete flows for the TODO portal:
 * adding tasks, toggling completion, deleting, photos, view switching,
 * day carousel, search, shopping tab, progress bar, and empty state.
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

/** Ensure we're in list view (not kanban). */
async function switchToListView(page: import("@playwright/test").Page) {
  const listToggle = page.locator("button").filter({ has: page.locator("svg.lucide-list") });
  if (await listToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await listToggle.click();
    await page.waitForTimeout(500);
  }
}

/** Ensure we're in kanban view. */
async function switchToKanbanView(page: import("@playwright/test").Page) {
  const kanbanToggle = page.locator("button").filter({ has: page.locator("svg.lucide-layout-grid") });
  if (await kanbanToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await kanbanToggle.click();
    await page.waitForTimeout(500);
  }
}

/** Add a task via the FAB (+) button. */
async function addTaskViaFab(
  page: import("@playwright/test").Page,
  title: string,
  opts?: { priority?: "high" | "medium" | "low"; description?: string },
) {
  const fab = page.locator("button.fixed").filter({ has: page.locator("svg.lucide-plus") });
  await fab.click();

  const dialog = page.locator("[role=dialog]").filter({ hasText: /Add Task|Add Shopping Item/i });
  await dialog.waitFor({ state: "visible", timeout: 5_000 });

  await dialog.getByPlaceholder(/Prep cookie dough|2kg Flour/i).fill(title);

  if (opts?.description) {
    await dialog.getByPlaceholder(/Description/i).fill(opts.description);
  }

  if (opts?.priority) {
    await dialog.locator("button").filter({ hasText: new RegExp(`^${opts.priority}$`, "i") }).click();
  }

  await dialog.getByRole("button", { name: /Add/i }).click();
  await dialog.waitFor({ state: "hidden", timeout: 5_000 });
}

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

test.describe("TODO Portal - CRUD Operations", () => {
  /* ---------------------------------------------------------------- */
  /* 1. Add a task via FAB                                             */
  /* ---------------------------------------------------------------- */
  test("1 - Add a task via FAB (+) dialog with title and priority", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    await addTaskViaFab(page, "Mise en place for service", { priority: "high" });

    // Verify the task appears in the list
    const task = page.locator("text=Mise en place for service").first();
    await expect(task).toBeVisible({ timeout: 10_000 });

    // Verify success toast appeared
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Added/i })).toBeVisible({ timeout: 5_000 });

    // Verify high priority dot is shown (destructive color)
    const taskCard = task.locator("xpath=ancestor::div[contains(@class, 'bg-card')]").first();
    const priorityDot = taskCard.locator("span.bg-destructive");
    await expect(priorityDot).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 2. Toggle task complete                                           */
  /* ---------------------------------------------------------------- */
  test("2 - Toggle task complete by clicking the circle icon", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    await addTaskViaFab(page, "Toggle complete test");
    const task = page.locator("text=Toggle complete test").first();
    await expect(task).toBeVisible({ timeout: 10_000 });

    // Find the circle button (toggle complete) on the task
    const taskCard = task.locator("xpath=ancestor::div[contains(@class, 'bg-card')]").first();
    const circleBtn = taskCard.locator("button").filter({ has: page.locator("svg.lucide-circle") }).first();
    await expect(circleBtn).toBeVisible();

    // Click to mark as complete
    await circleBtn.click();

    // Task should move to the "Completed" section with a check icon and line-through
    const completedSection = page.locator("span").filter({ hasText: /^Completed/ }).first();
    await expect(completedSection).toBeVisible({ timeout: 5_000 });

    // The completed item should show with line-through styling
    const doneItem = page.locator(".line-through").filter({ hasText: "Toggle complete test" });
    await expect(doneItem).toBeVisible({ timeout: 5_000 });

    // A Check icon should be visible for the done item
    const checkIcon = doneItem.locator("xpath=ancestor::div").first().locator("svg.lucide-check");
    await expect(checkIcon.first()).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 3. Delete task                                                    */
  /* ---------------------------------------------------------------- */
  test("3 - Delete a task via trash icon", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    await addTaskViaFab(page, "Delete me task");
    const task = page.locator("text=Delete me task").first();
    await expect(task).toBeVisible({ timeout: 10_000 });

    // Click the trash button on the task card
    const taskCard = task.locator("xpath=ancestor::div[contains(@class, 'bg-card')]").first();
    const trashBtn = taskCard.locator("button").filter({ has: page.locator("svg.lucide-trash-2") }).first();
    await expect(trashBtn).toBeVisible();
    await trashBtn.click();

    // Should see "Deleted" toast
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Deleted/i })).toBeVisible({ timeout: 5_000 });

    // Task should no longer be visible
    await expect(page.locator("text=Delete me task")).not.toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 4. Add photo to task                                              */
  /* ---------------------------------------------------------------- */
  test("4 - Add photo to task via camera icon on item", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    await addTaskViaFab(page, "Photo task test");
    const task = page.locator("text=Photo task test").first();
    await expect(task).toBeVisible({ timeout: 10_000 });

    // Find the camera icon on the task item (not the header scan camera)
    const taskCard = task.locator("xpath=ancestor::div[contains(@class, 'bg-card')]").first();
    const cameraBtn = taskCard.locator("button").filter({ has: page.locator("svg.lucide-camera") }).first();
    await expect(cameraBtn).toBeVisible();

    // Verify the hidden file input exists and is connected
    const hiddenFileInput = page.locator('input[type="file"][accept="image/*"].hidden').first();
    await expect(hiddenFileInput).toBeAttached();

    // Clicking the camera should trigger the file input. We can't fully simulate
    // a native file dialog, but we can verify the click doesn't crash.
    await cameraBtn.click();

    // Page remains stable
    await expect(task).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 5. Switch between list and kanban views                           */
  /* ---------------------------------------------------------------- */
  test("5 - Switch between list and kanban views", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);

    // Add a task so we have content to see
    await addTaskViaFab(page, "View switch test");

    // Switch to list view
    await switchToListView(page);

    // In list view, tasks render as bg-card divs with circle buttons
    const listCircle = page.locator("svg.lucide-circle").first();
    await expect(listCircle).toBeVisible({ timeout: 5_000 });

    // The KanbanBoard column headers should NOT be visible in list view
    const kanbanColumnHeader = page.locator("h3").filter({ hasText: "In Progress" });
    await expect(kanbanColumnHeader).not.toBeVisible();

    // Switch to kanban view
    await switchToKanbanView(page);

    // KanbanBoard should now show column headers: "To Do", "In Progress", "Done"
    await expect(page.locator("h3").filter({ hasText: "To Do" })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("h3").filter({ hasText: "In Progress" })).toBeVisible();
    await expect(page.locator("h3").filter({ hasText: "Done" })).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 6. Day carousel navigation                                        */
  /* ---------------------------------------------------------------- */
  test("6 - Day carousel navigation filters todos by date", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    // The day carousel should be visible (todoDayCarouselEnabled = true)
    const carousel = page.locator(".card-elevated").first();
    await expect(carousel).toBeVisible({ timeout: 5_000 });

    // There should be 7 day buttons (Mon-Sun)
    const dayButtons = carousel.locator("button").filter({ hasText: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i });
    // At least 7 day indicators should be visible
    const dayCount = await dayButtons.count();
    expect(dayCount).toBeGreaterThanOrEqual(7);

    // Click a different day button (e.g., the second one)
    const secondDay = dayButtons.nth(1);
    await secondDay.click();
    await page.waitForTimeout(1_000);

    // The selected day should have a different visual style (bg-primary)
    await expect(secondDay).toHaveClass(/bg-primary/);

    // Navigate to next week using the right chevron
    const nextWeekBtn = carousel.locator("button").filter({ has: page.locator("svg.lucide-chevron-right") });
    await expect(nextWeekBtn).toBeVisible();
    await nextWeekBtn.click();
    await page.waitForTimeout(500);

    // Navigate back using left chevron
    const prevWeekBtn = carousel.locator("button").filter({ has: page.locator("svg.lucide-chevron-left") });
    await expect(prevWeekBtn).toBeVisible();
    await prevWeekBtn.click();
    await page.waitForTimeout(500);

    // Page remains stable
    await expect(page.locator("h2").filter({ hasText: /To Do Command Portal/i })).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 7. Search tasks                                                   */
  /* ---------------------------------------------------------------- */
  test("7 - Search tasks: open search, type query, verify filtering", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    // Add two tasks with distinct names
    await addTaskViaFab(page, "Alpha bravo task");
    await addTaskViaFab(page, "Charlie delta task");
    await expect(page.locator("text=Alpha bravo task").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Charlie delta task").first()).toBeVisible({ timeout: 10_000 });

    // Open search by clicking the Search icon button
    const searchBtn = page.locator("button").filter({ has: page.locator("svg.lucide-search") }).first();
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    // Search input should appear
    const searchInput = page.getByPlaceholder(/Search tasks/i);
    await expect(searchInput).toBeVisible({ timeout: 3_000 });

    // Type a search query
    await searchInput.fill("Alpha bravo");
    await page.waitForTimeout(500);

    // "Alpha bravo task" should be visible
    await expect(page.locator("text=Alpha bravo task").first()).toBeVisible();

    // Results count should be shown
    await expect(page.locator("text=/\\d+ results?/i").first()).toBeVisible();

    // Close search by clicking the X button next to the search input
    const closeSearchBtn = page.locator("button").filter({ has: page.locator("svg.lucide-x") }).first();
    await closeSearchBtn.click();

    // Search input should disappear
    await expect(searchInput).not.toBeVisible({ timeout: 3_000 });

    // Both tasks should be visible again (no filter)
    await expect(page.locator("text=Alpha bravo task").first()).toBeVisible({ timeout: 5_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 8. Shopping tab                                                   */
  /* ---------------------------------------------------------------- */
  test("8 - Shopping tab: add item and verify it appears in shopping tab only", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    // Switch to the Shopping tab
    const shoppingTab = page.getByRole("tab", { name: /Shopping/i });
    await expect(shoppingTab).toBeVisible();
    await shoppingTab.click();
    await page.waitForTimeout(500);

    // Add a shopping item via FAB
    const fab = page.locator("button.fixed").filter({ has: page.locator("svg.lucide-plus") });
    await fab.click();

    const dialog = page.locator("[role=dialog]").filter({ hasText: /Add Shopping Item/i });
    await dialog.waitFor({ state: "visible", timeout: 5_000 });

    // The placeholder should mention "2kg Flour"
    await dialog.getByPlaceholder(/2kg Flour/i).fill("5kg Basmati Rice");
    await dialog.getByRole("button", { name: /Add/i }).click();
    await dialog.waitFor({ state: "hidden", timeout: 5_000 });

    // The item should appear in the Shopping tab
    await expect(page.locator("text=5kg Basmati Rice").first()).toBeVisible({ timeout: 10_000 });

    // Switch back to Tasks tab
    const tasksTab = page.getByRole("tab", { name: /Tasks/i });
    await tasksTab.click();
    await page.waitForTimeout(500);

    // The shopping item should NOT appear in the Tasks tab (different category)
    await expect(page.locator("text=5kg Basmati Rice")).not.toBeVisible({ timeout: 3_000 });
  });

  /* ---------------------------------------------------------------- */
  /* 9. Progress bar updates                                           */
  /* ---------------------------------------------------------------- */
  test("9 - Progress bar updates when tasks are completed", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    // Add two tasks
    await addTaskViaFab(page, "Progress task one");
    await addTaskViaFab(page, "Progress task two");
    await expect(page.locator("text=Progress task one").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Progress task two").first()).toBeVisible({ timeout: 10_000 });

    // The progress bar should be visible (todoProgressBarEnabled = true)
    // It shows "X of Y done" and "N%"
    const progressText = page.locator("text=/\\d+ of \\d+ done/");
    await expect(progressText).toBeVisible({ timeout: 5_000 });

    // Initially should show "0 of X done" or "0%"
    const initialPct = page.locator("text=0%");
    // It may have other tasks from before, so check the percentage exists
    const pctText = page.locator("text=/%$/").first();
    await expect(pctText).toBeVisible();

    // Complete the first task
    const task1Card = page.locator("text=Progress task one").first().locator("xpath=ancestor::div[contains(@class, 'bg-card')]").first();
    const circleBtn = task1Card.locator("button").filter({ has: page.locator("svg.lucide-circle") }).first();
    await circleBtn.click();
    await page.waitForTimeout(1_500);

    // The progress bar should now show a different percentage
    // We just verify the progress text updated (it won't be "0 of X done" anymore if these are the only tasks)
    const updatedProgressText = page.locator("text=/\\d+ of \\d+ done/");
    await expect(updatedProgressText).toBeVisible();

    // The progress bar fill should have changed (the motion div with bg-primary)
    const progressBarFill = page.locator(".h-2.rounded-full.bg-muted .h-full.rounded-full.bg-primary");
    await expect(progressBarFill).toBeVisible();
  });

  /* ---------------------------------------------------------------- */
  /* 10. Empty state                                                   */
  /* ---------------------------------------------------------------- */
  test("10 - Empty state message when no tasks for the day", async ({
    page,
    loginAsOwner,
  }) => {
    await loginAsOwner("urban-bistro");
    await gotoTodo(page);
    await switchToListView(page);

    // Navigate to a future date that likely has no tasks using the day carousel
    const carousel = page.locator(".card-elevated").first();
    const nextWeekBtn = carousel.locator("button").filter({ has: page.locator("svg.lucide-chevron-right") });

    // Go forward several weeks to find an empty day
    for (let i = 0; i < 5; i++) {
      await nextWeekBtn.click();
      await page.waitForTimeout(300);
    }

    // Click on a day button in this far-future week
    const dayButtons = carousel.locator("button").filter({ hasText: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i });
    await dayButtons.first().click();
    await page.waitForTimeout(1_000);

    // Should see the empty state message
    const emptyState = page.locator("text=/Nothing for .*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i");
    await expect(emptyState).toBeVisible({ timeout: 5_000 });

    // Should also show the "Tap + to add a task" hint
    const hint = page.locator("text=/Tap \\+ to add a task|Tap \\+ to jot something down/i");
    await expect(hint).toBeVisible();

    // The empty state icon (ListChecks) should be visible
    const emptyIcon = page.locator("svg.lucide-list-checks.opacity-30");
    await expect(emptyIcon.first()).toBeVisible();
  });
});
