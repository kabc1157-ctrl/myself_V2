import { test, expect } from "@playwright/test";

test("2.0 shell renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("기록에서 나를 찾다.")).toBeVisible();
});

test("onboarding is protected for signed-out users", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("auth pages load the branded stylesheet", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  for (const path of ["/auth/login", "/auth/signup", "/auth/reset"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("button").first()).toHaveCSS("background-color", "rgb(255, 190, 70)");
  }
  expect(errors.filter((error) => /stylesheet|css|chunk/i.test(error))).toEqual([]);
});

test("authenticated home renders without a server-to-client handler error", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  test.skip(!email || !password, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD for the completed test account.");

  await page.goto("/auth/login");
  await page.locator('input[name="email"]').fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: "안녕하세요." })).toBeVisible();
  await expect(page.getByText("Event handlers cannot be passed to Client Component props.")).toHaveCount(0);

  const calendar = page.getByLabel("날짜 선택");
  await calendar.fill("2026-11-12");
  await expect(calendar).toHaveValue("2026-11-12");
  await expect(page).toHaveURL(/\/home$/);

  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});
