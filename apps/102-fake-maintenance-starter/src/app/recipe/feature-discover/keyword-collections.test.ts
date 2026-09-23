import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { KeywordCollections } from './keyword-collections.ng';

const soup = recipeMother.withBasicInfo('Red Lentil Soup').build();

const cake = recipeMother.withBasicInfo('Orange Polenta Cake').build();

const salad = recipeMother.withBasicInfo('Fattoush Salad').build();

describe(KeywordCollections.name, () => {
  it('searches soups by default', async () => {
    const { fixture } = mountKeywordCollections();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Red Lentil Soup']);
  });

  it('shows the recipes of the collection', async () => {
    const { fixture } = mountKeywordCollections({ recipes: [soup] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Red Lentil Soup']);
  });

  it('searches salads when the salads collection is chosen', async () => {
    const { fixture } = mountKeywordCollections({
      recipes: [soup, cake, salad],
    });
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Salads');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Fattoush Salad']);
  });

  it('shows cakes when the cakes collection is chosen', async () => {
    const { fixture } = mountKeywordCollections();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Cakes');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Orange Polenta Cake']);
  });

  it('shows a message when the collection is empty', async () => {
    const { fixture } = mountKeywordCollections();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Salads');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('Nothing in this collection yet');
  });
});

function mountKeywordCollections({
  recipes = [soup, cake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(KeywordCollections);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function clickToggle(root: HTMLElement, label: string): void {
  const toggle = [...root.querySelectorAll('mat-button-toggle')].find(
    (el) => el.textContent?.trim() === label,
  );
  const button = toggle?.querySelector('button');
  if (button == null) {
    throw new Error(`Toggle "${label}" not found.`);
  }
  button.click();
}
