import React from 'react'

import { makeStyles, CircularProgress, Button } from '@material-ui/core';

import { Translate } from '../HOC'
import * as CONSTANT from '../../constants'

const useStyles = makeStyles(theme => ({
  button: {
    transition: 'disabled 0.5s ease',
  },
}));


export default function ButtonSubmit({ isSubmitting }) {
  const classes = useStyles();

  return (
    <Button
      color="primary"
      disabled={isSubmitting}
      type="submit"
      variant="contained"
      className={classes.button}
    >
      {isSubmitting && <CircularProgress size={24} />}
      {!isSubmitting && <Translate word={CONSTANT.default.Submit} />}
    </Button>
  )
}
