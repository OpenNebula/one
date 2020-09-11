import * as yup from 'yup';

import BasicConfiguration from './BasicConfiguration';
import Networks from './Networks';
import Roles from './Roles';
import Clusters from './Clusters';

const Steps = () => {
  const basic = BasicConfiguration();
  const networks = Networks();
  const roles = Roles();
  const clusters = Clusters();

  const steps = [basic, networks, roles, clusters];

  const resolvers = yup.object({
    [basic.id]: basic.resolver,
    [networks.id]: networks.resolver,
    [roles.id]: roles.resolver,
    [clusters.id]: clusters.resolver
  });

  const defaultValues = resolvers.default();

  return { steps, defaultValues, resolvers };
};

export default Steps;
