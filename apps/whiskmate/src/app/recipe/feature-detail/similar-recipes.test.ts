import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { SimilarRecipes } from './similar-recipes.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
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

const lambKofte: Recipe = {
  id: 'lamb-kofte',
  course: 'main',
  name: 'Lamb Kofte',
  description: null,
  pictureUri: 'https://example.com/lamb-kofte.jpg',
  ingredients: [],
  steps: [],
};

const cauliflowerCake: Recipe = {
  id: 'cauliflower-cake',
  course: 'main',
  name: 'Cauliflower Cake',
  description: null,
  pictureUri: 'https://example.com/cauliflower-cake.jpg',
  ingredients: [],
  steps: [],
};

const filoPie: Recipe = {
  id: 'sweet-potato-filo-pie',
  course: 'main',
  name: 'Sweet Potato and Feta Filo Pie',
  description: null,
  pictureUri: 'https://example.com/filo-pie.jpg',
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

describe(SimilarRecipes, () => {
  it('searches recipes of the same course', async () => {
    const { search } = mountSimilarRecipes(shakshuka);

    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: ['main'],
      });
  });

  it('excludes the current recipe', async () => {
    const { search, similarNames } = mountSimilarRecipes(shakshuka);
    search.mockReturnValue(of([shakshuka, harissaChicken]));

    await expect
      .poll(() => similarNames())
      .toEqual(['Harissa-Roasted Chicken']);
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('shows at most three similar recipes', async () => {
    const { search, similarNames } = mountSimilarRecipes(shakshuka);
    search.mockReturnValue(
      of([shakshuka, harissaChicken, lambKofte, cauliflowerCake, filoPie]),
    );

    await expect
      .poll(() => similarNames())
      .toEqual(['Harissa-Roasted Chicken', 'Lamb Kofte', 'Cauliflower Cake']);
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('links to the similar recipe', async () => {
    const { search } = mountSimilarRecipes(shakshuka);
    search.mockReturnValue(of([harissaChicken]));

    await expect
      .element(page.getByRole('link', { name: 'Harissa-Roasted Chicken' }))
      .toHaveAttribute('href', '/recipes/harissa-chicken');
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('renders nothing when the recipe is the only one of its course', async () => {
    const { search, similarNames } = mountSimilarRecipes(cheesecake);
    search.mockReturnValue(of([cheesecake]));

    await expect
      .poll(() => search)
      .toHaveBeenCalledWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: ['dessert'],
      });
    await expect.poll(() => similarNames()).toEqual([]);
    await expect
      .element(
        page.getByRole('heading', { name: 'More desserts you might like' }),
      )
      .not.toBeInTheDocument();
  });
});

function mountSimilarRecipes(recipe: Recipe) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(SimilarRecipes, {
    bindings: [inputBinding('recipe', () => recipe)],
  });

  return {
    search,
    similarNames: () =>
      page
        .getByRole('link')
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
  };
}
