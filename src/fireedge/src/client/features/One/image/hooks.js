import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/image/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useImage = () => (
  useSelector(state => state.one[RESOURCES.image])
)

export const useImageApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getImage: id => unwrapDispatch(actions.getImage({ id })),
    getImages: () => unwrapDispatch(actions.getImages())
  }
}
