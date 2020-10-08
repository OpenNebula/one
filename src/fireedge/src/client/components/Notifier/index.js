import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { removeSnackbar } from 'client/actions/general';

let displayed = [];

const Notifier = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(store => store.General.notifications || []);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const storeDisplayed = id => {
    displayed = [...displayed, id];
  };

  const removeDisplayed = id => {
    displayed = [...displayed.filter(key => id !== key)];
  };

  useEffect(() => {
    notifications.forEach(
      ({ key, message, options = {}, dismissed = false }) => {
        if (dismissed) {
          closeSnackbar(key);
          return;
        }

        if (displayed.includes(key)) return;

        enqueueSnackbar(message, {
          key,
          ...options,
          action: () => (
            <IconButton onClick={() => closeSnackbar(key)} component="span">
              <CloseIcon fontSize="small" />
            </IconButton>
          ),
          onClose: (event, reason, myKey) => {
            if (options.onClose) {
              options.onClose(event, reason, myKey);
            }
          },
          onExited: (_, myKey) => {
            dispatch(removeSnackbar(myKey));
            removeDisplayed(myKey);
          }
        });

        // keep track of snackbars that we've displayed
        storeDisplayed(key);
      }
    );
  }, [notifications, closeSnackbar, enqueueSnackbar, dispatch]);

  return null;
};

export default Notifier;
