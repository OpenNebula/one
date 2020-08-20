import React from 'react';

import {
  Box,
  darken,
  lighten,
  makeStyles,
  Typography
} from '@material-ui/core';
import { Info as InfoIcon } from '@material-ui/icons';

import { Translate } from 'client/components/HOC';

const useStyles = makeStyles(theme => {
  const getColor = theme.palette.type === 'light' ? darken : lighten;
  const getBackgroundColor = theme.palette.type === 'light' ? lighten : darken;

  return {
    root: {
      color: theme.palette.error.dark,
      display: 'flex',
      alignItems: 'center'
    },
    icon: {
      fontSize: 16
    },
    text: {
      ...theme.typography.body1,
      paddingLeft: theme.spacing(1)
    }
  };
});

const ErrorHelper = ({ label = 'Error', ...rest }) => {
  const classes = useStyles();

  return (
    <Box className={classes.root} {...rest}>
      <InfoIcon className={classes.icon} />
      <Typography className={classes.text} data-cy="error-text">
        {label}
      </Typography>
    </Box>
  );
};

export default ErrorHelper;
