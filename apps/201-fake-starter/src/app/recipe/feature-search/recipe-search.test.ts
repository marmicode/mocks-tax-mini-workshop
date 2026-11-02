import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { RecipeSearch } from './recipe-search.ng';

describe(RecipeSearch.name, () => {
  it.todo('filters recipes by keywords', () => {
    const { getRecipePreviewHeadings } = mountRecipeSearch();

    getRecipePreviewHeadings();
  });

  function mountRecipeSearch() {
    TestBed.createComponent(RecipeSearch);

    return {
      getRecipePreviewHeadings() {
        return page.getByRole('heading', { level: 2 });
      },
    };
  }
});
