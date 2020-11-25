import * as yup from 'yup'

import Provision from './Provision'
import Inputs from './Inputs'

const Steps = () => {
  const provision = Provision()
  const inputs = Inputs()

  const steps = [provision, inputs]

  const resolvers = () => yup
    .object({
      [provision.id]: provision.resolver(),
      [inputs.id]: inputs.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
