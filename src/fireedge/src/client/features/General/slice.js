import { createSlice } from '@reduxjs/toolkit'

import * as actions from 'client/features/General/actions'
import { generateKey } from 'client/utils'

const initial = {
  zone: 0,
  title: null,
  isLoading: false,
  isFixMenu: false,

  notifications: []
}

const { reducer } = createSlice({
  name: 'general',
  initialState: initial,
  extraReducers: builder => {
    builder
      .addCase('logout', ({ title }) => ({ ...initial, title }))

      /* UI ACTIONS */
      .addCase(actions.fixMenu, (state, { payload }) => {
        return { ...state, isFixMenu: !!payload }
      })
      .addCase(actions.changeLoading, (state, { payload }) => {
        return { ...state, isLoading: !!payload }
      })
      .addCase(actions.changeTitle, (state, { payload }) => {
        return { ...state, title: payload }
      })
      .addCase(actions.changeZone, (state, { payload }) => {
        return { ...state, zone: payload }
      })

      /* NOTIFICATION ACTIONS */
      .addCase(actions.enqueueSnackbar, (state, { payload }) => {
        const { key, options, message } = payload

        return {
          ...state,
          notifications: [
            ...state.notifications,
            { key, options, message }
          ]
        }
      })
      .addCase(actions.dismissSnackbar, (state, { payload }) => {
        const { key, dismissAll } = payload

        return {
          ...state,
          notifications: state.notifications.map(notification =>
            dismissAll || notification.key !== key
              ? { ...notification, dismissed: true }
              : { ...notification }
          )
        }
      })
      .addCase(actions.deleteSnackbar, (state, { payload }) => {
        const { key } = payload

        return {
          ...state,
          notifications: state.notifications.filter(
            notification => notification.key !== key
          )
        }
      })

      /*  REQUESTS API MATCHES */
      .addMatcher(
        ({ type }) => type.endsWith('/pending') && !type.includes('auth'),
        state => ({ ...state, isLoading: true })
      )
      .addMatcher(
        ({ type }) => type.endsWith('/fulfilled') && !type.includes('auth'),
        state => ({ ...state, isLoading: false })
      )
      .addMatcher(
        ({ type, meta }) =>
          !meta?.aborted && type.endsWith('/rejected') && !type.includes('auth'),
        (state, { payload }) => ({
          ...state,
          isLoading: false,
          notifications: [
            ...state.notifications,
            (payload?.length > 0 && {
              key: generateKey(),
              message: payload,
              options: { variant: 'error' }
            })
          ].filter(Boolean)
        })
      )
  }
})

export { reducer }
