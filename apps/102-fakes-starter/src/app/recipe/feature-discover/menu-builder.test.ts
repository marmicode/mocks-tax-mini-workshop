import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import {
  provideLocalStorageFake,
  provideRandomAdapterFake,
} from '@whiskmate/shared/infra';
import { MenuBuilder } from './menu-builder.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const fritters: Recipe = {
  id: 'courgette-fritters',
  course: 'starter',
  name: 'Courgette and Herb Fritters',
  description: null,
  pictureUri: 'https://example.com/fritters.jpg',
  ingredients: [],
  steps: [],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(MenuBuilder.name, () => {
  it('shows a three-course menu', async () => {
    const { fixture } = mountMenuBuilder();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('swaps the starter', async () => {
    const { fixture } = mountMenuBuilder();
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Swap starter').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Courgette and Herb Fritters',
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('shows an empty course when the catalog has no recipe for it', async () => {
    const { fixture } = mountMenuBuilder({ recipes: [hummus, shakshuka] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="course-dessert"] [data-testid="no-recipe"]',
      )?.textContent,
    ).toContain('No dessert available.');
  });

  it('plans the main course on the picked weekday', async () => {
    const { fixture, mealPlanStore } = mountMenuBuilder();
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'add menu to meal plan').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'friday').click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().friday).toBe('shakshuka');
    expect(
      fixture.nativeElement.querySelector('[data-testid="added-message"]')
        ?.textContent,
    ).toContain('Menu planned for friday.');
  });
});

function mountMenuBuilder({
  recipes = [hummus, fritters, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRandomAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const mealPlanStore = TestBed.inject(MealPlanStore);

  const fixture = TestBed.createComponent(MenuBuilder);

  return { fixture, mealPlanStore };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function buttonByLabel(root: HTMLElement, label: string): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );
  if (button == null) {
    throw new Error(`Button "${label}" not found.`);
  }
  return button;
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim().toLowerCase() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
