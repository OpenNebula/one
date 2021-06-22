import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/image/actions'

export const useImage = () => (
  useSelector(state => state.one.images)
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
