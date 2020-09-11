import React from 'react';
import PropTypes from 'prop-types';

import {
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@material-ui/core';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';

import { Tr } from 'client/components/HOC';

const DialogForm = React.memo(
  ({ open, title, values, resolver, onSubmit, onCancel, children }) => {
    const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'));

    const { handleSubmit, ...methods } = useForm({
      reValidateMode: 'onSubmit',
      defaultValues: values,
      resolver: yupResolver(resolver)
    });

    return (
      <Dialog
        fullScreen={isMobile}
        open={open}
        maxWidth="lg"
        scroll="paper"
        PaperProps={{ style: { height: '80%', minWidth: '80%' } }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <FormProvider {...methods}>{children}</FormProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="primary">
            {Tr('Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleSubmit(onSubmit)}
          >
            {Tr('Save')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

DialogForm.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.any),
    PropTypes.objectOf(PropTypes.any)
  ]),
  resolver: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

DialogForm.defaultProps = {
  open: true,
  title: 'Title dialog form',
  values: {},
  resolver: {},
  onSubmit: () => undefined,
  onCancel: () => undefined,
  children: null
};

export default DialogForm;
