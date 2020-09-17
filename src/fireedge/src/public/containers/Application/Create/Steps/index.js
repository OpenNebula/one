import * as yup from 'yup';

import BasicConfiguration from './BasicConfiguration';
import Clusters from './Clusters';
import Networking from './Networking';
import Roles from './Roles';

const Steps = () => {
  const basic = BasicConfiguration();
  const clusters = Clusters();
  const networking = Networking();
  const roles = Roles();

  const steps = [basic, clusters, networking, roles];

  const resolvers = yup.object({
    [basic.id]: basic.resolver,
    [clusters.id]: clusters.resolver,
    [networking.id]: networking.resolver,
    [roles.id]: roles.resolver
  });

  const defaultValues = resolvers.default();

  return { steps, defaultValues, resolvers };
};

export default Steps;
