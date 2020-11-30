import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const DialogForm = memo(
  ({
    open,
    title,
    values,
    resolver,
    onSubmit,
    onCancel,
    submitButtonProps,
    children
  }) => {
    const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

    const methods = useForm({
      mode: 'onBlur',
      reValidateMode: 'onSubmit',
      defaultValues: values,
      resolver: yupResolver(resolver())
    })

    return (
      <Dialog
        fullScreen={isMobile}
        open={open}
        maxWidth="lg"
        scroll="paper"
        PaperProps={{
          style: {
            height: isMobile ? '100%' : '80%',
            width: isMobile ? '100%' : '80%'
          }
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <FormProvider {...methods}>{children}</FormProvider>
        </DialogContent>
        {(onCancel || onSubmit) && (
          <DialogActions>
            {onCancel && (
              <Button onClick={onCancel} color="primary">
                {Tr(T.Cancel)}
              </Button>
            )}
            {onSubmit && (
              <SubmitButton
                data-cy="dg-form-submit-button"
                isSubmitting={methods.formState.isSubmitting}
                onClick={methods.handleSubmit(onSubmit)}
                label={Tr(T.Save)}
                {...submitButtonProps}
              />
            )}
          </DialogActions>
        )}
      </Dialog>
    )
  }
)

DialogForm.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.any),
    PropTypes.objectOf(PropTypes.any)
  ]),
  resolver: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  submitButtonProps: PropTypes.objectOf(PropTypes.any),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
}

DialogForm.defaultProps = {
  open: true,
  title: 'Title dialog form',
  values: {},
  resolver: {},
  onSubmit: undefined,
  onCancel: undefined,
  submitButtonProps: undefined,
  children: null
}

export default DialogForm
