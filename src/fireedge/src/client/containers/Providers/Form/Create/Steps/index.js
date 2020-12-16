import * as yup from 'yup'

import Provider from './Provider'
import Connection from './Connection'
import Locations from './Locations'

const Steps = ({ isUpdate }) => {
  const provider = Provider()
  const connection = Connection()
  const locations = Locations()

  const steps = [connection, locations]
  !isUpdate && steps.unshift(provider)

  const resolvers = () => yup
    .object({
      [provider.id]: provider.resolver(),
      [connection.id]: connection.resolver(),
      [locations.id]: locations.resolver()
    })

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
