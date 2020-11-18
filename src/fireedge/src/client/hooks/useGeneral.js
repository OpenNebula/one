import { useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import * as actions from 'client/actions/general'

export default function useGeneral () {
  const { isLoading, isOpenMenu, isFixMenu } = useSelector(
    state => state?.General,
    shallowEqual
  )
  const dispatch = useDispatch()

  const fixMenu = useCallback(isFixed => dispatch(actions.fixMenu(isFixed)), [
    dispatch
  ])

  const openMenu = useCallback(isOpen => dispatch(actions.openMenu(isOpen)), [
    dispatch
  ])

  const changeZone = useCallback(zone => dispatch(actions.changeZone(zone)), [
    dispatch
  ])

  const changeLoading = useCallback(
    loading => dispatch(actions.changeLoading(loading)),
    [dispatch]
  )

  const showSuccess = useCallback(
    ({ message }) => dispatch(actions.enqueueSuccess(message)),
    [dispatch]
  )

  const showError = useCallback(
    ({ message }) => dispatch(actions.enqueueError(message)),
    [dispatch]
  )

  return {
    isLoading,
    isOpenMenu,
    isFixMenu,
    changeZone,
    openMenu,
    fixMenu,
    changeLoading,
    showSuccess,
    showError
  }
}
