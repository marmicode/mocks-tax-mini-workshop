import { type Config, type Exercise } from './core.ts';

const exercises: Exercise[] = [
  {
    id: '101-mock-maintenance',
    name: '101 - Mock Maintenance',
  },
  {
    id: '102-fake-maintenance',
    name: '102 - Fake Maintenance',
  },
  {
    id: '201-fake',
    name: '201 - Fake',
  },
  {
    id: '301-charted-design',
    name: '301 - Charted Design',
  },
  {
    id: '302-charted-implementation',
    name: '302 - Charted Implementation',
  },
];

export const config: Config = {
  base: 'main',
  exercises,
};
