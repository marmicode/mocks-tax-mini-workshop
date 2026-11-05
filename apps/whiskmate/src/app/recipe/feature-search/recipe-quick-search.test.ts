import { Component } from '@angular/core';
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
import { RecipeQuickSearch } from './recipe-quick-search.ng';

const burntAubergine = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .build();

const roastedAubergine = recipeMother
  .withBasicInfo('Roasted Aubergine with Tahini and Pine Nuts')
  .build();

describe(RecipeQuickSearch, () => {
  it('suggests nothing with less than 2 characters', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('a');

    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('a');
    await expect.poll(suggestionNames).toEqual([]);
    await expect
      .element(page.getByTestId('quick-search-empty'))
      .not.toBeInTheDocument();
  });

  it('searches by keywords', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');

    await expect
      .poll(suggestionNames)
      .toEqual([
        'Burnt Aubergine with Tahini and Pomegranate',
        'Roasted Aubergine with Tahini and Pine Nuts',
      ]);
  });

  it('shows at most 5 suggestions', async () => {
    mountQuickSearch({
      recipes: Array.from({ length: 7 }, (_, index) =>
        recipeMother.withBasicInfo(`Aubergine ${index}`).build(),
      ),
    });

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');

    await expect.poll(suggestionNames).toHaveLength(5);
  });

  it('links suggestions to the recipe detail page', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');

    await expect
      .element(
        page.getByRole('link', {
          name: 'Burnt Aubergine with Tahini and Pomegranate',
        }),
      )
      .toHaveTextContent('Burnt Aubergine with Tahini and Pomegranate');
    await expect
      .element(page.getByTestId('quick-search-suggestion').first())
      .toHaveAttribute('href', `/recipes/${burntAubergine.id}`);
  });

  it('says when nothing matches', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('xyz');

    await expect
      .element(page.getByTestId('quick-search-empty'))
      .toMatchTextContent('No recipes found');
  });

  it('clears the search once a suggestion is picked', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');
    await page
      .getByRole('link', {
        name: 'Burnt Aubergine with Tahini and Pomegranate',
      })
      .click();

    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('');
    await expect.poll(suggestionNames).toEqual([]);
  });

  it('trims keywords before searching', async () => {
    mountQuickSearch();

    await page
      .getByRole('searchbox', { name: 'Quick search' })
      .fill('  tahini  ');

    await expect
      .poll(suggestionNames)
      .toEqual([
        'Burnt Aubergine with Tahini and Pomegranate',
        'Roasted Aubergine with Tahini and Pine Nuts',
      ]);
  });

  it('waits for 2 non-blank characters before searching', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('a ');
    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('a ');
    await expect.poll(suggestionNames).toEqual([]);

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('au');

    await expect
      .poll(suggestionNames)
      .toEqual([
        'Burnt Aubergine with Tahini and Pomegranate',
        'Roasted Aubergine with Tahini and Pine Nuts',
      ]);
  });

  it('refines suggestions while typing', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');
    await expect
      .poll(suggestionNames)
      .toEqual([
        'Burnt Aubergine with Tahini and Pomegranate',
        'Roasted Aubergine with Tahini and Pine Nuts',
      ]);

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('pine');

    await expect
      .poll(suggestionNames)
      .toEqual(['Roasted Aubergine with Tahini and Pine Nuts']);
  });

  it('hides suggestions once keywords become too short again', async () => {
    mountQuickSearch();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('aub');
    await expect
      .element(
        page.getByRole('link', {
          name: 'Burnt Aubergine with Tahini and Pomegranate',
        }),
      )
      .toBeVisible();

    await page.getByRole('searchbox', { name: 'Quick search' }).fill('a');

    await expect
      .element(page.getByRole('searchbox', { name: 'Quick search' }))
      .toHaveValue('a');
    await expect.poll(suggestionNames).toEqual([]);
    await expect
      .element(page.getByTestId('quick-search-empty'))
      .not.toBeInTheDocument();
  });
});

@Component({ template: '' })
class Blank {}

function mountQuickSearch({
  recipes = [burntAubergine, roastedAubergine],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(RecipeQuickSearch);
}

function suggestionNames() {
  return page
    .getByTestId('quick-search-suggestion')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
