import { httpCodes } from 'server/utils/constants'
import { JWT_NAME } from 'client/constants'
import { requestData, removeStoreData } from 'client/utils'

export const login = user =>
  requestData('/api/auth/', {
    data: user,
    method: 'POST',
    authenticate: false,
    error: err => {
      removeStoreData(JWT_NAME)
      return err?.message
    }
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data
  })

export const getUser = () =>
  requestData('/api/user/info', {
    error: err => {
      removeStoreData(JWT_NAME)
      return err?.message
    }
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.USER ?? {}
  })

export default {
  login,
  getUser
}
