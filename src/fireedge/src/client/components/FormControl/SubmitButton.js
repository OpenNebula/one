import React from 'react';
import PropTypes from 'prop-types';

import { makeStyles, CircularProgress, Button } from '@material-ui/core';

import { Submit } from 'client/constants/translates';
import { Tr } from 'client/components/HOC';

const useStyles = makeStyles(theme => ({
  button: {
    transition: 'disabled 0.5s ease',
    margin: theme.spacing(3, 0, 2)
  }
}));

const SubmitButton = ({ isSubmitting, label, ...rest }) => {
  const classes = useStyles();

  return (
    <Button
      color="primary"
      disabled={isSubmitting}
      type="submit"
      variant="contained"
      className={classes.button}
      {...rest}
    >
      {isSubmitting && <CircularProgress size={24} />}
      {!isSubmitting && (label ?? Tr(Submit))}
    </Button>
  );
};

SubmitButton.propTypes = {
  isSubmitting: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};

SubmitButton.defaultProps = {
  isSubmitting: false,
  label: undefined
};

export default SubmitButton;
