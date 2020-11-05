import * as yup from 'yup'

import Provider from './Provider'
import Connection from './Connection'
import Locations from './Locations'

const Steps = () => {
  const provider = Provider()
  const connection = Connection()
  const locations = Locations()

  const steps = [provider, connection, locations]

  const resolvers = () => yup
    .object({
      [provider.id]: provider.resolver(),
      [connection.id]: connection.resolver(),
      [locations.id]: locations.resolver()
    })
    // .from(provider.id, 'provider')

  const defaultValues = resolvers().default()

  return { steps, defaultValues, resolvers }
}

export default Steps
