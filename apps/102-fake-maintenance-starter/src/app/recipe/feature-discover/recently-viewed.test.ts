import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { RecentlyViewed } from '@whiskmate/recipe/domain';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecentlyViewedPage } from './recently-viewed.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

describe(RecentlyViewedPage, () => {
  it('shows a message when no recipe was viewed', async () => {
    mountRecentlyViewedPage({ viewedIds: [] });

    await expect
      .element(page.getByTestId('empty-message'))
      .toMatchTextContent("You haven't viewed any recipe yet.");
  });

  it('shows only the recently viewed recipes', async () => {
    mountRecentlyViewedPage({
      viewedIds: [shakshuka.id, hummus.id],
      recipes: [shakshuka, hummus, cheesecake],
    });

    await expect.poll(recipeNames).toEqual(['Hummus with Ful', 'Shakshuka']);
  });

  it('lists recipes in the recently viewed order', async () => {
    mountRecentlyViewedPage({
      viewedIds: [shakshuka.id, hummus.id],
    });

    await expect.poll(recipeNames).toEqual(['Hummus with Ful', 'Shakshuka']);
  });

  it('links to the recipe detail', async () => {
    mountRecentlyViewedPage({ viewedIds: [shakshuka.id] });

    await expect
      .element(page.getByRole('link', { name: 'Shakshuka' }))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByRole('link', { name: 'Shakshuka' }))
      .toHaveAttribute('href', `/recipes/${shakshuka.id}`);
  });

  it('skips recipes that no longer exist', async () => {
    mountRecentlyViewedPage({
      viewedIds: [shakshuka.id, 'deleted-recipe'],
    });

    await expect.poll(recipeNames).toEqual(['Shakshuka']);
  });
});

/**
 * `viewedIds` are tracked in order: the last one is the most recent.
 */
function mountRecentlyViewedPage({
  viewedIds,
  recipes = [shakshuka, hummus],
}: {
  viewedIds: string[];
  recipes?: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const recentlyViewed = TestBed.inject(RecentlyViewed);
  for (const id of viewedIds) {
    recentlyViewed.track(id);
  }

  TestBed.createComponent(RecentlyViewedPage);
}

function recipeNames() {
  return page
    .getByTestId('recently-viewed-recipe')
    .getByRole('link')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
