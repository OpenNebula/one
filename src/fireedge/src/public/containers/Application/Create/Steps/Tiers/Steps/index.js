import * as yup from 'yup';

import BasicConfiguration from './BasicConfiguration';
import Networks from './Networks';
import Template from './Template';
import Policies from './Policies';

const Steps = () => {
  const basic = BasicConfiguration();
  const networks = Networks();
  const template = Template();
  const policies = Policies();

  const steps = [basic, networks, template, policies];

  const resolvers = yup.object({
    [basic.id]: basic.resolver,
    [networks.id]: networks.resolver,
    [template.id]: template.resolver,
    [policies.id]: policies.resolver
  });

  const defaultValues = resolvers.default();

  return { steps, defaultValues, resolvers };
};

export default Steps;
