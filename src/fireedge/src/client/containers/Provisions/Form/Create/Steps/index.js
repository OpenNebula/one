import * as yup from 'yup'

import Provision from './Provision'
import Provider from './Provider'
import Inputs from './Inputs'

const Steps = () => {
  const provision = Provision()
  const provider = Provider()
  const inputs = Inputs()

  const steps = [provision, provider, inputs]

  const resolvers = () => yup
    .object({
      [provision.id]: provision.resolver(),
      [provider.id]: provider.resolver(),
      [inputs.id]: inputs.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
