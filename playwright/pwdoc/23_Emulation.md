# Chapter 23: Advanced Emulation & Clock (Complete Guide)

## The Concept of Emulation & Time Control

The world of devices is fragmented. Your users access your app from different screen sizes, geolocations, and timezones. Furthermore, testing time-based features (like a "Daily Deal" banner) can be slow. **Emulation** allows you to simulate these environments, while the **Clock API** lets you manipulate time itself.

**Purpose**: This chapter teaches you how to test responsive designs, location-based features, and time-sensitive logic without waiting for the real clock to tick.

**Why is it required?**
1. **Responsive Testing**: To ensure your application is usable on mobile devices, tablets, and desktops using specific device descriptors.
2. **Localization**: To verify that the app shows the correct currency, language, and date format for users in different regions.
3. **Deterministic Testing**: To test features that only appear after a specific amount of time (e.g., an idle timeout or a scheduled event) instantly.

## Why Emulation Matters

Your users aren't all on MacBook Pros. They use iPhones, Androids, Dark Mode, German Locales, and weird Timezones. Playwright can pretend to be all of these.

## Device Emulation (Mobile)

Playwright doesn't just resize the window; it changes the **User Agent**, **Pixel Ratio** (DPR), and **Touch Events**.

```typescript
import { test, devices } from '@playwright/test';

// Configuration for this file
test.use({ ...devices['iPhone 13'] });

test('mobile drawer menu', async ({ page }) => {
  await page.goto('/');
  await page.tap('.hamburger'); // Tap (touch), not click
  await expect(page.locator('.drawer')).toBeVisible();
});
```

---

## Locale & Timezone

Testing `Intl` API formatting (Dates, Currencies).

```typescript
test.use({
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin', 
});

test('German currency format', async ({ page }) => {
  await page.goto('/pricing');
  // In Berlin, it should show € 1.000,00
  await expect(page.locator('.price')).toContainText('€'); 
});
```

---

## Permissions & Geolocation

Test "Near Me" features.

```typescript
test.use({
  geolocation: { longitude: 12.4924, latitude: 41.8902 }, // Colosseum, Rome
  permissions: ['geolocation'], // Auto-accept the browser popup
});

test('find nearby stores', async ({ page }) => {
  await page.goto('/stores');
  await page.getByRole('button', { name: 'Locate Me' }).click();
  
  await expect(page.locator('.store-list')).toContainText('Roma Centro');
});
```

---

## Dark Mode & Media

```typescript
test.use({ colorScheme: 'dark' });

test('dark theme matches', async ({ page }) => {
  await page.goto('/');
  // Check CSS variable or class
  await expect(page.locator('html')).toHaveClass(/dark-theme/);
});
```

---

## Mastering Time (Clock API)

The `Clock` API lets you control `Date.now()`, `setTimeout`, and `setInterval`.

**Scenario**: A banner appears after 10 minutes. 
**Bad Way**: `waitForTimeout(600000)`. (Test takes 10 mins).
**Good Way**: Clock API. (Test takes 10ms).

```typescript
test('banner appears after 10m', async ({ page }) => {
  // 1. Freeze time at specific date
  await page.clock.install({ time: new Date('2024-03-01T10:00:00') });
  
  await page.goto('/');
  
  // 2. Fast forward 10 mins
  await page.clock.fastForward('10:00');
  
  // 3. Assert
  await expect(page.getByText('Special Offer')).toBeVisible();
});
```

**Scenario**: Debounced Search (Search triggers 500ms after user stops typing).

```typescript
await page.getByPlaceholder('Search').pressSequentially(' Playwright');
await page.clock.fastForward(500); // Trigger debounce
await expect(page.locator('.results')).toBeVisible();
```

---

## Best Practices

| Tip | Detail |
|-----|--------|
| **Use Presets** | Prefer `devices['iPhone 12']` over manually setting viewport/DPR. It's more accurate. |
| **Clock vs Wait** | Always use Clock for logical time delays. Use `waitFor` for network/IO. |
| **Permissions** | Be explicit. If a test needs Camera, grant it in `test.use`. Don't rely on defaults. |
| **Mobile Tests** | Separate Mobile tests from Desktop tests via **Projects** in config, or use separate spec files. Don't mix them randomly. |

**Summary**: You've mastered how to emulate different geographical locations, timezones, and devices, and how to manipulate time itself using the Clock API. The next chapter brings everything together by exploring industry-standard best practices for building sustainable automation.
