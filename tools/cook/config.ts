import { type Config, type Exercise } from './core.ts';

const exercises: Exercise[] = [
  {
    id: '101-mock-maintenance',
    name: '101 - Mock Maintenance',
  },
];

export const config: Config = {
  base: 'mocks-vs-fakes',
  exercises,
};
