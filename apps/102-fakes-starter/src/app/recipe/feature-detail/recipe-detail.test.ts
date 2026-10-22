import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecipeDetail } from './recipe-detail.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
    { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
    { name: 'fresh coriander, to serve' },
  ],
  steps: ['Heat the olive oil.', 'Crack the eggs into the sauce.'],
};

const harissaChicken: Recipe = {
  id: 'harissa-chicken',
  course: 'main',
  name: 'Harissa-Roasted Chicken',
  description: null,
  pictureUri: 'https://example.com/harissa-chicken.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeDetail.name, () => {
  it('fetches the recipe by id', async () => {
    const { fixture, findById } = mountRecipeDetail('shakshuka');
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('shows the recipe name, course, description and picture', async () => {
    const { fixture, findById } = mountRecipeDetail('shakshuka');
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(findById).toHaveBeenCalledWith({ id: 'shakshuka' });
    expect(textOf(root, 'recipe-name')).toBe('Shakshuka');
    expect(textOf(root, 'recipe-course')).toBe('main');
    expect(textOf(root, 'recipe-description')).toBe(
      'Eggs poached in a spiced tomato sauce.',
    );
    expect(root.querySelector('img')?.getAttribute('src')).toBe(
      'https://example.com/shakshuka.jpg',
    );
  });

  it('shows ingredients with their quantities and steps', async () => {
    const { fixture, findById } = mountRecipeDetail('shakshuka');
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledWith({ id: 'shakshuka' });
    expect(textsOf(fixture.nativeElement, 'ingredient')).toEqual([
      '3 tbsp olive oil',
      '6 large eggs',
      'fresh coriander, to serve',
    ]);
    expect(textsOf(fixture.nativeElement, 'step')).toEqual([
      'Heat the olive oil.',
      'Crack the eggs into the sauce.',
    ]);
  });

  it('links to cooking mode and scaler', async () => {
    const { fixture } = mountRecipeDetail('shakshuka');
    await fixture.whenStable();

    expect(
      linkByText(fixture.nativeElement, 'Start cooking').getAttribute('href'),
    ).toBe('/recipes/shakshuka/cook');
    expect(
      linkByText(fixture.nativeElement, 'Scale servings').getAttribute('href'),
    ).toBe('/recipes/shakshuka/scale');
  });

  it('shows similar recipes of the same course', async () => {
    const { fixture, findById, search } = mountRecipeDetail('shakshuka');
    search.mockReturnValue(of([shakshuka, harissaChicken]));
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(textsOf(fixture.nativeElement, 'similar-recipe')).toEqual([
      'Harissa-Roasted Chicken',
    ]);
  });

  it('adds the recipe to favorites', async () => {
    const { fixture, userFavorites } = mountRecipeDetail('shakshuka');
    const addFavorite = vi
      .spyOn(userFavorites, 'addFavorite')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Add to favorites').click();
    await fixture.whenStable();

    expect(addFavorite).toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('shows a message when the recipe does not exist', async () => {
    const { fixture, findById, search } = mountRecipeDetail('missing');
    findById.mockReturnValue(of(undefined));
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(search).not.toHaveBeenCalled();
    expect(textOf(fixture.nativeElement, 'recipe-not-found')).toBe(
      'This recipe does not exist.',
    );
  });
});

function mountRecipeDetail(recipeId: string) {
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

  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(shakshuka));
  const search = vi.spyOn(recipeRepository, 'search').mockReturnValue(of([]));
  const userFavorites = TestBed.inject(UserFavorites);

  const fixture = TestBed.createComponent(RecipeDetail);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture, findById, search, userFavorites };
}

function textOf(root: HTMLElement, testId: string): string | undefined {
  return root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
}

function textsOf(root: HTMLElement, testId: string): string[] {
  return [...root.querySelectorAll(`[data-testid="${testId}"]`)].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function linkByText(root: HTMLElement, text: string): HTMLAnchorElement {
  const link = [...root.querySelectorAll('a')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (link == null) {
    throw new Error(`Link "${text}" not found.`);
  }
  return link;
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
