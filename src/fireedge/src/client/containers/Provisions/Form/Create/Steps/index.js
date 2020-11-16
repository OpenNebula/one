import * as yup from 'yup'

import ProvisionTemplate from './ProvisionTemplate'
import Inputs from './Inputs'

const Steps = () => {
  const provisionTemplate = ProvisionTemplate()
  const inputs = Inputs()

  const steps = [provisionTemplate, inputs]

  const resolvers = () => yup
    .object({
      [provisionTemplate.id]: provisionTemplate.resolver(),
      [inputs.id]: inputs.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
