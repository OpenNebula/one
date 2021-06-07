import { useDispatch, useSelector } from 'react-redux'

import * as actions from 'client/features/General/actions'
import { generateKey } from 'client/utils'

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

    // dismiss all if no key has been defined
    dismissSnackbar: key => dispatch(
      actions.dismissSnackbar({ key, dismissAll: !key })
    ),
    deleteSnackbar: key => dispatch(
      actions.deleteSnackbar({ key })
    ),

    enqueueSnackbar: ({ message, options = {} } = {}) => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options
      })
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
        options: { variant: 'error' }
      })
    ),
    enqueueInfo: message => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options: { variant: 'info' }
      })
    )
  }
}
