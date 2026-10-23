import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

describe(SimilarRecipes.name, () => {
  it('shows only recipes of the same course', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken, cheesecake],
    });
    await fixture.whenStable();

    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
    ]);
  });

  it('excludes the current recipe', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken],
    });
    await fixture.whenStable();

    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
    ]);
  });

  it('shows at most three similar recipes', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken, lambKofte, cauliflowerCake, filoPie],
    });
    await fixture.whenStable();

    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
      'Lamb Kofte',
      'Cauliflower Cake',
    ]);
  });

  it('links to the similar recipe', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken],
    });
    await fixture.whenStable();

    expect(similarLinks(fixture.nativeElement)[0]?.getAttribute('href')).toBe(
      `/recipes/${harissaChicken.id}`,
    );
  });

  it('renders nothing when the recipe is the only one of its course', async () => {
    const { fixture } = mountSimilarRecipes(cheesecake, {
      recipes: [shakshuka, cheesecake],
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
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

  const fixture = TestBed.createComponent(SimilarRecipes);
  fixture.componentRef.setInput('recipe', recipe);

  return { fixture };
}

function similarLinks(root: HTMLElement): HTMLAnchorElement[] {
  return [
    ...root.querySelectorAll<HTMLAnchorElement>(
      '[data-testid="similar-recipe"]',
    ),
  ];
}

function similarNames(root: HTMLElement): string[] {
  return similarLinks(root).map((link) => link.textContent?.trim() ?? '');
}
