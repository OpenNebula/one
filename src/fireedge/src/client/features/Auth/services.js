import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'

export const authService = ({
  login: user => RestClient.post('/api/auth', user).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data
  }),
  getUser: () => RestClient.get('/api/user/info').then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.USER ?? {}
  }),
  getSunstoneViews: () => RestClient.get('/api/sunstone/views').then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  }),
  getSunstoneConfig: () => RestClient.get('/api/user/config').then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })
})
