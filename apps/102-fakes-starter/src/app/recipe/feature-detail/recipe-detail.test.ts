import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecipeDetail } from './recipe-detail.ng';

const shakshuka = recipeMother
  .withBasicInfo({
    name: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato sauce.',
  })
  .withIngredients([
    { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
    { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
    { name: 'fresh coriander, to serve' },
  ])
  .withSteps(['Heat the olive oil.', 'Crack the eggs into the sauce.'])
  .build();

const harissaChicken = recipeMother
  .withBasicInfo('Harissa-Roasted Chicken')
  .build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(RecipeDetail.name, () => {
  it('shows the recipe with the given id', async () => {
    const { fixture } = mountRecipeDetail(harissaChicken.id);
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'recipe-name')).toBe(
      'Harissa-Roasted Chicken',
    );
  });

  it('shows the recipe name, course, description and picture', async () => {
    const { fixture } = mountRecipeDetail(shakshuka.id);
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
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
    const { fixture } = mountRecipeDetail(shakshuka.id);
    await fixture.whenStable();

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
    const { fixture } = mountRecipeDetail(shakshuka.id);
    await fixture.whenStable();

    expect(
      linkByText(fixture.nativeElement, 'Start cooking').getAttribute('href'),
    ).toBe(`/recipes/${shakshuka.id}/cook`);
    expect(
      linkByText(fixture.nativeElement, 'Scale servings').getAttribute('href'),
    ).toBe(`/recipes/${shakshuka.id}/scale`);
  });

  it('shows similar recipes of the same course', async () => {
    const { fixture } = mountRecipeDetail(shakshuka.id);
    await fixture.whenStable();

    expect(textsOf(fixture.nativeElement, 'similar-recipe')).toEqual([
      'Harissa-Roasted Chicken',
    ]);
  });

  it('adds the recipe to favorites', async () => {
    const { fixture, userFavorites } = mountRecipeDetail(shakshuka.id);
    await fixture.whenStable();

    buttonByLabel(fixture.nativeElement, 'Add to favorites').click();
    await fixture.whenStable();

    expect(userFavorites.favoriteIds()).toEqual(new Set([shakshuka.id]));
  });

  it('shows a message when the recipe does not exist', async () => {
    const { fixture } = mountRecipeDetail('missing');
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'recipe-not-found')).toBe(
      'This recipe does not exist.',
    );
    expect(textsOf(fixture.nativeElement, 'similar-recipe')).toEqual([]);
  });
});

function mountRecipeDetail(
  recipeId: string,
  {
    recipes = [shakshuka, harissaChicken, cheesecake],
  }: { recipes?: Recipe[] } = {},
) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const userFavorites = TestBed.inject(UserFavorites);

  const fixture = TestBed.createComponent(RecipeDetail);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture, userFavorites };
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
