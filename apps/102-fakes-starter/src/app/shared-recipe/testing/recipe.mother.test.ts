import { describe, it } from 'vitest';
import { recipeMother } from './recipe.mother';

describe('recipeMother', () => {
  it('derives the id and picture from the name', () => {
    expect(
      recipeMother.withBasicInfo('Harissa-Roasted Chicken').build(),
    ).toEqual({
      id: 'harissa-roasted-chicken',
      course: 'main',
      name: 'Harissa-Roasted Chicken',
      description: null,
      pictureUri: 'https://example.com/harissa-roasted-chicken.jpg',
      ingredients: [],
      steps: [],
    });
  });

  it('takes the course and description along with the name', () => {
    expect(
      recipeMother
        .withBasicInfo({
          name: 'Hummus with Ful',
          course: 'starter',
          description: 'Creamy hummus.',
        })
        .build(),
    ).toEqual(
      expect.objectContaining({
        id: 'hummus-with-ful',
        course: 'starter',
        description: 'Creamy hummus.',
      }),
    );
  });

  it('fills in some or many ingredients and steps', () => {
    const simple = recipeMother
      .withBasicInfo('Shakshuka')
      .withSomeIngredients()
      .withSomeSteps()
      .build();
    const elaborate = recipeMother
      .withBasicInfo('Cassoulet')
      .withManyIngredients()
      .withManySteps()
      .build();

    expect(simple.ingredients).toEqual([
      { name: 'salt' },
      { name: 'pepper' },
      { name: 'olive oil' },
    ]);
    expect(simple.steps).toEqual(['Step 1.', 'Step 2.', 'Step 3.']);
    expect(elaborate.ingredients).toHaveLength(8);
    expect(elaborate.steps).toHaveLength(8);
  });

  it('does not change the recipe it was built from', () => {
    const shakshuka = recipeMother.withBasicInfo('Shakshuka');

    const elaborate = shakshuka.withManySteps().build();

    expect(shakshuka.build().steps).toEqual([]);
    expect(elaborate.steps).toHaveLength(8);
  });
});
