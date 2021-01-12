import * as yup from 'yup'

import Template from './Template'
import Provider from './Provider'
import Inputs from './Inputs'

const Steps = () => {
  const template = Template()
  const provider = Provider()
  const inputs = Inputs()

  const steps = [template, provider, inputs]

  const resolvers = () => yup
    .object({
      [template.id]: template.resolver(),
      [provider.id]: provider.resolver(),
      [inputs.id]: inputs.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
