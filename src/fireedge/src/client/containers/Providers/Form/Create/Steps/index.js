import * as yup from 'yup'

import Template from './Template'
import BasicConfiguration from './BasicConfiguration'
import Connection from './Connection'

const Steps = ({ isUpdate }) => {
  const template = Template()
  const configuration = BasicConfiguration({ isUpdate })
  const connection = Connection()

  const steps = [configuration, connection]
  !isUpdate && steps.unshift(template)

  const resolvers = () => yup
    .object({
      [template.id]: template.resolver(),
      [configuration.id]: configuration.resolver(),
      [connection.id]: connection.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
