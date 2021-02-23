const START_AUTH = 'START_AUTH'
const SELECT_FILTER_GROUP = 'SELECT_FILTER_GROUP'
const CHANGE_SETTINGS = 'CHANGE_SETTINGS'
const SUCCESS_AUTH = 'SUCCESS_AUTH'
const FAILURE_AUTH = 'FAILURE_AUTH'
const LOGOUT = 'LOGOUT'

const Actions = {
  START_AUTH,
  SELECT_FILTER_GROUP,
  CHANGE_SETTINGS,
  SUCCESS_AUTH,
  FAILURE_AUTH,
  LOGOUT
}

module.exports = {
  Actions,
  startAuth: () => ({
    type: START_AUTH
  }),
  updateSetting: (dispatch, getState) => {
    const current = getState()

    const userSetting = current.Authenticated?.user?.TEMPLATE?.FIREEDGE

    if (!userSetting) return

    const mapSetting = Object.entries(userSetting)
      .reduce((res, [key, value]) =>
        ({ ...res, [String(key).toLowerCase()]: value })
      , {})

    dispatch(({
      type: CHANGE_SETTINGS,
      payload: mapSetting
    }))
  },
  selectFilterGroup: payload => ({
    type: SELECT_FILTER_GROUP,
    payload
  }),
  successAuth: payload => ({
    type: SUCCESS_AUTH,
    payload
  }),
  failureAuth: payload => ({
    type: FAILURE_AUTH,
    payload
  }),
  logout: () => ({
    type: LOGOUT
  })
}
