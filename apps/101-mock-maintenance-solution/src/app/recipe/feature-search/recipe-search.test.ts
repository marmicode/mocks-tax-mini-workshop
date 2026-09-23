import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecipeSearch } from './recipe-search.ng';

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

describe(RecipeSearch.name, () => {
  it('searches all recipes on load', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('renders the recipes returned by the repository', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
    expect(search).toHaveBeenCalledOnce();
  });

  it('shows "no recipes" when the repository returns nothing', async () => {
    const { fixture, search } = await mountRecipeSearch();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found');
  });

  it('searches by keywords', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'shak');
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: 'shak',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('searches by max ingredients', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    search.mockImplementation((params) =>
      of(
        {
          [JSON.stringify({
            keywords: '',
            maxIngredientCount: null,
            maxStepCount: null,
            courses: [],
          })]: [shakshuka, cheesecake],
          [JSON.stringify({
            keywords: '',
            maxIngredientCount: 5,
            maxStepCount: null,
            courses: [],
          })]: [shakshuka],
        }[JSON.stringify(params)] ?? [],
      ),
    );
    typeInto(inputByLabel(fixture.nativeElement, 'Max Ingredients'), '5');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Shakshuka']);
  });

  it('searches by max steps', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Max Steps'), '3');
    await fixture.whenStable();

    expect(search.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "courses": [],
          "keywords": "",
          "maxIngredientCount": null,
          "maxStepCount": 3,
        },
      ]
    `);
  });

  it('searches by course', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[0]?.[0]).toHaveProperty('courses', []);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('searches by multiple courses', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    clickCourse(fixture.nativeElement, 'starter');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter', 'dessert'],
    });
  });

  it('combines keywords and course', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'lemon');
    await fixture.whenStable();
    clickCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(3);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/recipe-search-keywords-and-course.calls.json',
    );
  });

  it('combines max ingredients and max steps', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Max Ingredients'), '8');
    await fixture.whenStable();
    typeInto(inputByLabel(fixture.nativeElement, 'Max Steps'), '4');
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: 8,
      maxStepCount: 4,
      courses: [],
    });
  });

  it('searches all recipes again once keywords are cleared', async () => {
    const { fixture, search } = await mountRecipeSearch();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'shak');
    await fixture.whenStable();
    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), '');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(3);
    expect(isWholeCatalogSearch(search.mock.lastCall![0])).toBe(true);
  });

  it('shows "no recipes" when favorites only is checked without any favorite', async () => {
    const { fixture, search, userFavorites } = await mountRecipeSearch();
    vi.spyOn(userFavorites, 'favoriteIds').mockReturnValue(new Set());
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Favorites only').click();
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found');
  });

  it('shows only favorites without sending favorites to the repository', async () => {
    const { fixture, search, userFavorites } = await mountRecipeSearch();
    vi.spyOn(userFavorites, 'favoriteIds').mockReturnValue(
      new Set([cheesecake.id]),
    );
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Favorites only').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
    expect(Object.keys(search.mock.lastCall![0])).toEqual([
      'keywords',
      'maxIngredientCount',
      'maxStepCount',
      'courses',
    ]);
  });

  it('adds a recipe to favorites', async () => {
    const { fixture, search, userFavorites } = await mountRecipeSearch();
    search.mockImplementation((params) =>
      params.courses?.length ? of([]) : of([shakshuka]),
    );
    const addFavorite = vi
      .spyOn(userFavorites, 'addFavorite')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Add to favorites').click();
    await fixture.whenStable();

    expect(addFavorite).toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('removes a recipe from favorites', async () => {
    const { fixture, search, userFavorites } = await mountRecipeSearch();
    search.mockImplementation((params) =>
      params.courses.length > 0 ? of([]) : of([shakshuka]),
    );
    vi.spyOn(userFavorites, 'favoriteIds').mockReturnValue(
      new Set([shakshuka.id]),
    );
    const removeFavorite = vi
      .spyOn(userFavorites, 'removeFavorite')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Remove from favorites').click();
    await fixture.whenStable();

    expect(removeFavorite).toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { fixture, search, mealPlanStore } = await mountRecipeSearch();
    search.mockReturnValue(of([shakshuka]));
    vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(true);
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'add to meal plan').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'wednesday').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'wednesday',
      recipeId: 'shakshuka',
    });
  });

  it('disables add when the store says the recipe cannot be added', async () => {
    const { fixture, search, mealPlanStore } = await mountRecipeSearch();
    search.mockImplementation((params) =>
      isWholeCatalogSearch(params) ? of([shakshuka]) : of([]),
    );
    const canAdd = vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(false);
    await fixture.whenStable();

    expect(canAdd).toHaveBeenCalledWith({ recipeId: 'shakshuka' });
    expect(
      buttonByText(fixture.nativeElement, 'add to meal plan').disabled,
    ).toBe(true);
  });
});

async function mountRecipeSearch() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
      },
    ],
  });

  const catalog = [shakshuka, cheesecake];
  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockImplementation(({ courses }) =>
      of(
        courses.length > 0
          ? catalog.filter((recipe) => courses.includes(recipe.course))
          : catalog,
      ),
    );
  const userFavorites = TestBed.inject(UserFavorites);
  const mealPlanStore = TestBed.inject(MealPlanStore);

  const fixture = TestBed.createComponent(RecipeSearch);

  return { fixture, search, userFavorites, mealPlanStore };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function inputByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const field = [...root.querySelectorAll('mat-form-field')].find(
    (el) => el.querySelector('mat-label')?.textContent?.trim() === label,
  );
  const input = field?.querySelector('input');
  if (input == null) {
    throw new Error(`Input "${label}" not found.`);
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function clickCourse(root: HTMLElement, course: string): void {
  const toggle = [...root.querySelectorAll('mat-button-toggle')].find(
    (el) => el.textContent?.trim() === course,
  );
  const button = toggle?.querySelector('button');
  if (button == null) {
    throw new Error(`Course "${course}" not found.`);
  }
  button.click();
}

function checkboxByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const checkbox = [...root.querySelectorAll('mat-checkbox')].find(
    (el) => el.textContent?.trim() === label,
  );
  const input = checkbox?.querySelector('input');
  if (input == null) {
    throw new Error(`Checkbox "${label}" not found.`);
  }
  return input;
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

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    Object.keys(params).length === 4 &&
    Object.values(params).every(
      (value) => value === '' || value === null || isEmptyArray(value),
    )
  );
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
