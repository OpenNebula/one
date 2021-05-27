import { createAction } from '@reduxjs/toolkit'

export const fixMenu = createAction('Fix menu')
export const changeZone = createAction('Change zone')
export const changeLoading = createAction('Change loading')
export const changeTitle = createAction('Change title')

export const enqueueSnackbar = createAction('Enqueue snackbar')
export const dismissSnackbar = createAction('Dismiss snackbar')
export const deleteSnackbar = createAction('Delete snackbar')
