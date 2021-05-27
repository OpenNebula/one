import { Actions, Commands } from 'server/utils/constants/commands/datastore'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const datastoreService = ({
  getDatastore: ({ filter, id }) => {
    const name = Actions.DATASTORE_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    return RestClient.get(url, options).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DATASTORE ?? {}
    })
  },
  getDatastores: data => {
    const name = Actions.DATASTORE_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'DATASTORE')
  }
})
