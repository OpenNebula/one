import * as yup from 'yup';

import BasicConfiguration from './BasicConfiguration';
import Clusters from './Clusters';
import Networks from './Networks';
import Roles from './Roles';

const Steps = () => {
  const basic = BasicConfiguration();
  const clusters = Clusters();
  const networks = Networks();
  const roles = Roles();

  const steps = [basic, clusters, networks, roles];

  const resolvers = yup.object({
    [basic.id]: basic.resolver,
    [clusters.id]: clusters.resolver,
    [networks.id]: networks.resolver,
    [roles.id]: roles.resolver
  });

  const defaultValues = resolvers.default();

  return { steps, defaultValues, resolvers };
};

export default Steps;
