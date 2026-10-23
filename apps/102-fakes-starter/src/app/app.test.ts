import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { App } from './app';
import { appRoutes } from './app.routes';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

const cassoulet = recipeMother
  .withBasicInfo('Cassoulet')
  .withManyIngredients()
  .build();

const beefWellington = recipeMother
  .withBasicInfo('Beef Wellington')
  .withManySteps()
  .build();

describe(App.name, () => {
  it('redirects to the search page and searches all recipes', async () => {
    const { fixture, router } = await mountApp({
      recipes: [shakshuka, cheesecake, cassoulet, beefWellington],
    });

    await router.navigateByUrl('/');
    await fixture.whenStable();

    expect(router.url).toBe('/search');
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
      'Cassoulet',
      'Beef Wellington',
    ]);
  });

  it('searches all recipes again when coming back to the search page', async () => {
    const { fixture, router, recipeRepositoryFake } = await mountApp();

    await router.navigateByUrl('/search');
    await fixture.whenStable();
    recipeRepositoryFake.setRecipes([shakshuka, cheesecake]);
    await router.navigateByUrl('/meal-plan');
    await fixture.whenStable();
    await router.navigateByUrl('/search');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Shakshuka');
    expect(fixture.nativeElement.textContent).toContain(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('shows the planned recipes on the meal plan page', async () => {
    const { fixture, router, mealPlanStore } = await mountApp();
    mealPlanStore.assign({ weekday: 'monday', recipeId: shakshuka.id });

    await router.navigateByUrl('/meal-plan');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Shakshuka');
  });

  it('navigates from the meal plan to the search page through the navbar', async () => {
    const { fixture, router } = await mountApp({
      recipes: [shakshuka, cheesecake, cassoulet, beefWellington],
    });

    await router.navigateByUrl('/meal-plan');
    await fixture.whenStable();
    linkByText(fixture.nativeElement, 'Search').click();
    await fixture.whenStable();

    expect(router.url).toBe('/search');
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
      'Cassoulet',
      'Beef Wellington',
    ]);
  });

  it('shows the admin link once signed in', async () => {
    const { fixture, router } = await mountApp();

    await router.navigateByUrl('/search');
    await fixture.whenStable();
    expect(navLabels(fixture.nativeElement)).not.toContain('Admin');

    buttonByText(fixture.nativeElement, 'Sign in').click();
    await fixture.whenStable();

    expect(navLabels(fixture.nativeElement)).toEqual([
      'Search',
      'Discover',
      'Meal plan',
      'Shopping list',
      'Admin',
    ]);
  });
});

async function mountApp({
  recipes = [shakshuka],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  const router = TestBed.inject(Router);

  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();

  return { fixture, router, recipeRepositoryFake, mealPlanStore };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function linkByText(root: HTMLElement, text: string): HTMLAnchorElement {
  const link = [...root.querySelectorAll('a')].find(
    (el) => el.querySelector('.label')?.textContent?.trim() === text,
  );
  if (link == null) {
    throw new Error(`Link "${text}" not found.`);
  }
  return link;
}

function navLabels(root: HTMLElement): string[] {
  return [...root.querySelectorAll('wm-navbar .nav-item .label')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.querySelector('.label')?.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
