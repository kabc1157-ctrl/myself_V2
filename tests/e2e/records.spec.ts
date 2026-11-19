import { test, expect, type Page } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const enabled = Boolean(email && password && process.env.E2E_RECORDS_TEST === "1");

async function login(page: Page) {
  await page.goto("/auth/login");
  await page.locator('input[name="email"]').fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/home$/);
}

test("authenticated diary CRUD and same-day multiple entries", async ({ page }) => {
  test.skip(!enabled, "Set E2E_TEST_EMAIL, E2E_TEST_PASSWORD, and E2E_RECORDS_TEST=1; otherwise this remains unverified.");
  await login(page);
  await page.goto("/diary");
  const title = `E2E 일기 ${Date.now()}`;
  await page.getByPlaceholder("제목").fill(title);
  await page.getByPlaceholder("오늘의 마음을 적어 보세요.").fill("첫 번째 테스트\n줄바꿈");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(title)).toBeVisible();
  await page.getByPlaceholder("제목").fill(`${title} 2`);
  await page.getByPlaceholder("오늘의 마음을 적어 보세요.").fill("두 번째 테스트");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText(`${title} 2`)).toBeVisible();
});

test("authenticated routine completion and trash UI", async ({ page }) => {
  test.skip(!enabled, "Set E2E_TEST_EMAIL, E2E_TEST_PASSWORD, and E2E_RECORDS_TEST=1; otherwise this remains unverified.");
  await login(page);
  await page.goto("/routine");
  const title = `E2E 루틴 ${Date.now()}`;
  await page.getByPlaceholder("예: 아침 산책").fill(title);
  await page.getByRole("button", { name: "루틴 추가" }).click();
  const routine = page.getByText(title);
  await expect(routine).toBeVisible();
  await routine.locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]").getByRole("button", { name: "휴지통" }).click();
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText("루틴 휴지통")).toBeVisible();
});
