/**
 * The standard house everyone starts with: three columns, a cellar level, two
 * living floors and an attic. Ids are fixed so sample files and docs can refer
 * to "study-desk" or "kitchen-fridge" by name.
 *
 *                 /  attic  \
 *   +-----------+------------+-----------+
 *   |  bedroom  |  bathroom  |   study   |   floor 1
 *   +-----------+------------+-----------+
 *   |  kitchen  |    hall    |  living   |   floor 0  (ground)
 *   +-----------+------------+-----------+
 *   | workshop  |    den     |  cellar   |   floor -1 (below ground)
 *   +-----------+------------+-----------+
 *  porch + mailbox on the left, bins on the right
 */
import { HOUSE_FORMAT, type House } from './types';
import { makeRoom, makeYard } from './templates';

export function defaultHouse(name = 'My house'): House {
  return {
    format: HOUSE_FORMAT,
    name,
    columns: 3,
    levels: { top: 1, bottom: -1 },
    rooms: [
      makeRoom('attic', 'attic', 0, 'attic'),
      makeRoom('bedroom', 1, 0, 'bedroom'),
      makeRoom('bathroom', 1, 1, 'bathroom'),
      makeRoom('study', 1, 2, 'study'),
      makeRoom('kitchen', 0, 0, 'kitchen'),
      makeRoom('hall', 0, 1, 'hall'),
      makeRoom('living', 0, 2, 'living'),
      makeRoom('workshop', -1, 0, 'workshop'),
      makeRoom('den', -1, 1, 'den'),
      makeRoom('cellar', -1, 2, 'cellar'),
    ],
    yard: makeYard(),
    seeded: false,
    updatedAt: Date.now(),
  };
}
