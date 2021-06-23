import { createAction } from '@reduxjs/toolkit'

export const updateResourceFromFetch = createAction(
  'update-resource-from-fetch',
  ({ data, resource }) => {
    return { payload: { type: resource, data } }
  }
)
