const CHANGE_ZONE = 'CHANGE_ZONE';
const DISPLAY_LOADING = 'DISPLAY_LOADING';
const TOGGLE_MENU = 'TOGGLE_MENU';
const FIX_MENU = 'FIX_MENU';

const ENQUEUE_SNACKBAR = 'ENQUEUE_SNACKBAR';
const CLOSE_SNACKBAR = 'CLOSE_SNACKBAR';
const REMOVE_SNACKBAR = 'REMOVE_SNACKBAR';

const Actions = {
  CHANGE_ZONE,
  DISPLAY_LOADING,
  TOGGLE_MENU,
  FIX_MENU,
  ENQUEUE_SNACKBAR,
  CLOSE_SNACKBAR,
  REMOVE_SNACKBAR
};

module.exports = {
  Actions,
  changeZone: zone => ({
    type: CHANGE_ZONE,
    payload: { zone }
  }),
  changeLoading: isLoading => ({
    type: DISPLAY_LOADING,
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
    const key = notification.options && notification.options.key;

    return {
      type: ENQUEUE_SNACKBAR,
      notification: {
        ...notification,
        key: key || new Date().getTime() + Math.random()
      }
    };
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
  closeSnackbar: key => ({
    type: CLOSE_SNACKBAR,
    dismissAll: !key, // dismiss all if no key has been defined
    key
  }),
  removeSnackbar: key => ({
    type: REMOVE_SNACKBAR,
    key
  })
};
