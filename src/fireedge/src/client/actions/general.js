const { Setting: { SCHEMES } } = require('client/constants')

const CHANGE_ZONE = 'CHANGE_ZONE'
const CHANGE_SCHEME = 'CHANGE_SCHEME'
const CHANGE_LOADING = 'CHANGE_LOADING'
const TOGGLE_MENU = 'TOGGLE_MENU'
const FIX_MENU = 'FIX_MENU'

const ENQUEUE_SNACKBAR = 'ENQUEUE_SNACKBAR'
const CLOSE_SNACKBAR = 'CLOSE_SNACKBAR'
const REMOVE_SNACKBAR = 'REMOVE_SNACKBAR'

const Actions = {
  CHANGE_ZONE,
  CHANGE_SCHEME,
  CHANGE_LOADING,
  TOGGLE_MENU,
  FIX_MENU,
  ENQUEUE_SNACKBAR,
  CLOSE_SNACKBAR,
  REMOVE_SNACKBAR
}

module.exports = {
  Actions,
  changeZone: zone => ({
    type: CHANGE_ZONE,
    payload: { zone }
  }),
  updateScheme: (dispatch, getState) => {
    const current = getState()
    const currentTheme = current.Authenticated?.theme
    const userScheme = current.Authenticated?.user?.TEMPLATE?.FIREEDGE?.SCHEME

    if (Object.values(SCHEMES).includes(userScheme) && currentTheme !== userScheme) {
      dispatch(({ type: CHANGE_SCHEME, payload: { scheme: userScheme } }))
    }
  },
  changeLoading: isLoading => ({
    type: CHANGE_LOADING,
    payload: { isLoading }
  }),
  openMenu: isOpen => ({
    type: TOGGLE_MENU,
    isOpen
  }),
  fixMenu: isFixed => ({
    type: FIX_MENU,
    isFixed
  }),
  enqueueSnackbar: notification => {
    const key = notification.options && notification.options.key

    return {
      type: ENQUEUE_SNACKBAR,
      notification: {
        ...notification,
        key: key || new Date().getTime() + Math.random()
      }
    }
  },
  enqueueError: message => ({
    type: ENQUEUE_SNACKBAR,
    notification: {
      key: new Date().getTime() + Math.random(),
      message,
      options: { variant: 'error' }
    }
  }),
  enqueueSuccess: message => ({
    type: ENQUEUE_SNACKBAR,
    notification: {
      key: new Date().getTime() + Math.random(),
      message,
      options: { variant: 'success' }
    }
  }),
  enqueueInfo: message => ({
    type: ENQUEUE_SNACKBAR,
    notification: {
      key: new Date().getTime() + Math.random(),
      message,
      options: { variant: 'info' }
    }
  }),
  closeSnackbar: key => ({
    type: CLOSE_SNACKBAR,
    dismissAll: !key, // dismiss all if no key has been defined
    key
  }),
  removeSnackbar: key => ({
    type: REMOVE_SNACKBAR,
    key
  })
}
