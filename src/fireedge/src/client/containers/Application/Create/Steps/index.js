import * as yup from 'yup';

import BasicConfiguration from './BasicConfiguration';
import Clusters from './Clusters';
import Networking from './Networking';
import Tiers from './Tiers';

const Steps = () => {
  const basic = BasicConfiguration();
  const clusters = Clusters();
  const networking = Networking();
  const tiers = Tiers();

  const steps = [basic, clusters, networking, tiers];

  const resolvers = yup.object({
    [basic.id]: basic.resolver,
    [clusters.id]: clusters.resolver,
    [networking.id]: networking.resolver,
    [tiers.id]: tiers.resolver
  });

  const defaultValues = resolvers.default();

  return { steps, defaultValues, resolvers };
};

export default Steps;
