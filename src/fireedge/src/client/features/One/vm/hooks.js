import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/vm/actions'

export const useVm = () => (
  useSelector(state => state.one.vms)
)

export const useVmApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getVm: id => unwrapDispatch(actions.getVm({ id })),
    getVms: options => unwrapDispatch(actions.getVms(options)),
    terminateVm: id => unwrapDispatch(actions.terminateVm({ id }))
  }
}
