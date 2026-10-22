import { type Config, type Exercise } from './core.ts';

const exercises: Exercise[] = [
  {
    id: '101-mocks',
    name: '101 - Mocks',
  },
];

export const config: Config = {
  base: 'mocks-vs-fakes',
  exercises,
};
