import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/vmTemplate/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useVmTemplate = () => (
  useSelector(state => state.one[RESOURCES.template])
)

export const useVmTemplateApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getVmTemplate: id => unwrapDispatch(actions.getVmTemplate({ id })),
    getVmTemplates: () => unwrapDispatch(actions.getVmTemplates())
  }
}
