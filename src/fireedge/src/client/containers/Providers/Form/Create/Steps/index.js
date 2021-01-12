import * as yup from 'yup'

import Template from './Template'
import Connection from './Connection'
import Inputs from './Inputs'

const Steps = ({ isUpdate }) => {
  const template = Template()
  const connection = Connection()
  const inputs = Inputs()

  const steps = [connection, inputs]
  !isUpdate && steps.unshift(template)

  const resolvers = () => yup
    .object({
      [template.id]: template.resolver(),
      [connection.id]: connection.resolver(),
      [inputs.id]: inputs.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
