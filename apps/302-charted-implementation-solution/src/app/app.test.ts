import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { App } from './app';
import { appRoutes } from './app.routes';
import { WIP_STORAGE_KEY } from './authz/wip.guard';
import { LocalStorage } from './shared/local-storage';

class MemoryStorage implements LocalStorage {
  private readonly items = signal(new Map<string, string>());

  setItem(key: string, value: string): void {
    this.items.update((items) => new Map(items).set(key, value));
  }

  getItem(key: string): string | null {
    return this.items().get(key) ?? null;
  }
}

describe(App, () => {
  it('hides the meal plan link unless wip is set', async () => {
    const { storage } = mountApp();

    await expect
      .element(page.getByRole('link', { name: 'MEAL PLAN' }))
      .toBeVisible();

    storage.setItem(WIP_STORAGE_KEY, 'true');

    await expect.poll(linkLabels).toEqual(['search', 'meal plan', 'admin']);
    await expect
      .element(page.getByRole('link', { name: 'MEAL PLAN' }))
      .toHaveAttribute('href', '/meal-plan');
  });
});

function mountApp() {
  TestBed.resetTestingModule();
  const storage = new MemoryStorage();
  TestBed.overrideProvider(LocalStorage, { useValue: storage });
  TestBed.configureTestingModule({
    providers: [provideRouter(appRoutes)],
  });

  TestBed.createComponent(App);

  return { storage };
}

function linkLabels() {
  return page
    .getByRole('link')
    .elements()
    .map((link) => link.textContent?.trim().toLowerCase() ?? '');
}
