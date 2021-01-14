import * as yup from 'yup'

import Template from './Template'
import Provider from './Provider'
import BasicConfiguration from './BasicConfiguration'
import Inputs from './Inputs'

const Steps = () => {
  const template = Template()
  const provider = Provider()
  const configuration = BasicConfiguration()
  const inputs = Inputs()

  const steps = [template, provider, configuration, inputs]

  const resolvers = () => yup
    .object({
      [template.id]: template.resolver(),
      [provider.id]: provider.resolver(),
      [configuration.id]: configuration.resolver(),
      [inputs.id]: inputs.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
