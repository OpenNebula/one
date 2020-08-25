import React from 'react';
import PropTypes from 'prop-types';

import { makeStyles, CircularProgress, Button } from '@material-ui/core';

import { Translate } from 'client/components/HOC';
import * as CONSTANT from 'client/constants';

const useStyles = makeStyles(theme => ({
  button: {
    transition: 'disabled 0.5s ease',
    margin: theme.spacing(3, 0, 2)
  }
}));

const ButtonSubmit = ({ isSubmitting, label, ...rest }) => {
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
      {!isSubmitting && <Translate word={label ?? CONSTANT.default.Submit} />}
    </Button>
  );
};

ButtonSubmit.propTypes = {
  isSubmitting: PropTypes.bool,
  label: PropTypes.string
};

ButtonSubmit.defaultProps = {
  isSubmitting: false,
  label: CONSTANT.default.Submit
};

export default ButtonSubmit;
