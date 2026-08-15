import { Sphere } from './sphere';
import { KleinBottle } from './kleinBottle';
import { Torus } from './torus';
import { MobiusBand } from './mobiusBand';
import { Flat } from './flat';
import type { TopologyConfig, ParametrizationFunction, GlueFunction } from './types';

const Topologies: Record<string, TopologyConfig> = {
  sphere: Sphere,
  kleinBottle: KleinBottle,
  torus: Torus,
  mobiusBand: MobiusBand,
  flat: Flat,
};

type Topology = keyof typeof Topologies;

export { Topologies, type Topology, type TopologyConfig, type ParametrizationFunction, type GlueFunction };