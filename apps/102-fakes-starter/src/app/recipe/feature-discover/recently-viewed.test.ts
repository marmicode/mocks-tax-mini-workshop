import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

describe(RecentlyViewedPage.name, () => {
  it('shows a message when no recipe was viewed', async () => {
    const { fixture } = mountRecentlyViewedPage({ viewedIds: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="empty-message"]')
        ?.textContent,
    ).toContain("You haven't viewed any recipe yet.");
  });

  it('lists recipes in the recently viewed order', async () => {
    const { fixture } = mountRecentlyViewedPage({
      viewedIds: [shakshuka.id, hummus.id],
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
    ]);
  });

  it('links to the recipe detail', async () => {
    const { fixture } = mountRecentlyViewedPage({ viewedIds: [shakshuka.id] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('li a')?.getAttribute('href'),
    ).toBe(`/recipes/${shakshuka.id}`);
  });

  it('skips recipes that no longer exist', async () => {
    const { fixture } = mountRecentlyViewedPage({
      viewedIds: [shakshuka.id, 'deleted-recipe'],
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Shakshuka']);
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

  const fixture = TestBed.createComponent(RecentlyViewedPage);

  return { fixture, recentlyViewed };
}

function recipeNames(root: HTMLElement): string[] {
  return [
    ...root.querySelectorAll('[data-testid="recently-viewed-recipe"] a'),
  ].map((el) => el.textContent?.trim() ?? '');
}
