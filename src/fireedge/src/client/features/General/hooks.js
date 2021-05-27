import { useDispatch, useSelector } from 'react-redux'

import * as actions from 'client/features/General/actions'

const generateKey = () => new Date().getTime() + Math.random()

export const useGeneral = () => (
  useSelector(state => state.general)
)

export const useGeneralApi = () => {
  const dispatch = useDispatch()

  return {
    fixMenu: isFixed => dispatch(actions.fixMenu(isFixed)),
    changeLoading: isLoading => dispatch(actions.changeLoading(isLoading)),
    changeTitle: title => dispatch(actions.changeTitle(title)),
    changeZone: zone => dispatch(actions.changeZone(zone)),

    enqueueSnackbar: notification => {
      const key = notification.options && notification.options.key

      return dispatch(actions.enqueueSnackbar({
        key: key || generateKey(),
        message: String(notification.message) || '',
        options: notification.options || {}
      }))
    },
    // dismiss all if no key has been defined
    dismissSnackbar: key => dispatch(
      actions.dismissSnackbar({ key, dismissAll: !key })
    ),
    deleteSnackbar: key => dispatch(
      actions.deleteSnackbar({ key })
    ),

    enqueueSuccess: message => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options: { variant: 'success' }
      })
    ),
    enqueueError: message => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options: { variant: 'success' }
      })
    ),
    enqueueInfo: message => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options: { variant: 'success' }
      })
    )
  }
}
