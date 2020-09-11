import * as yup from 'yup';

import BasicConfiguration from './BasicConfiguration';
import Template from './Template';
// import Policies from './Policies';

const Steps = () => {
  const basic = BasicConfiguration();
  const template = Template();
  // const policies = Policies();

  const steps = [basic, template];

  const resolvers = yup.object({
    [basic.id]: basic.resolver,
    [template.id]: template.resolver
    // [policies.id]: policies.resolver
  });

  const defaultValues = resolvers.default();

  return { steps, defaultValues, resolvers };
};

export default Steps;
