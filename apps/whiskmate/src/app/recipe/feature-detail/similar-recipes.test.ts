import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { SimilarRecipes } from './similar-recipes.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();
const harissaChicken = recipeMother
  .withBasicInfo('Harissa-Roasted Chicken')
  .build();
const lambKofte = recipeMother.withBasicInfo('Lamb Kofte').build();
const cauliflowerCake = recipeMother.withBasicInfo('Cauliflower Cake').build();
const filoPie = recipeMother
  .withBasicInfo('Sweet Potato and Feta Filo Pie')
  .build();
const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(SimilarRecipes, () => {
  it('searches recipes of the same course', async () => {
    mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken, cheesecake],
    });

    await expect.poll(similarNames).toEqual(['Harissa-Roasted Chicken']);
  });

  it('excludes the current recipe', async () => {
    mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken],
    });

    await expect.poll(similarNames).toEqual(['Harissa-Roasted Chicken']);
  });

  it('shows at most three similar recipes', async () => {
    mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken, lambKofte, cauliflowerCake, filoPie],
    });

    await expect
      .poll(similarNames)
      .toEqual(['Harissa-Roasted Chicken', 'Lamb Kofte', 'Cauliflower Cake']);
  });

  it('links to the similar recipe', async () => {
    mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken],
    });

    await expect
      .element(page.getByRole('link', { name: 'Harissa-Roasted Chicken' }))
      .toHaveTextContent('Harissa-Roasted Chicken');
    await expect
      .element(page.getByTestId('similar-recipe'))
      .toHaveAttribute('href', `/recipes/${harissaChicken.id}`);
  });

  it('renders nothing when the recipe is the only one of its course', async () => {
    mountSimilarRecipes(cheesecake, {
      recipes: [shakshuka, cheesecake],
    });

    await expect.poll(similarNames).toEqual([]);
    await expect
      .element(
        page.getByRole('heading', { name: 'More desserts you might like' }),
      )
      .not.toBeInTheDocument();
  });
});

function mountSimilarRecipes(
  recipe: Recipe,
  { recipes }: { recipes: Recipe[] },
) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(SimilarRecipes, {
    bindings: [inputBinding('recipe', () => recipe)],
  });
}

function similarNames() {
  return page
    .getByTestId('similar-recipe')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
