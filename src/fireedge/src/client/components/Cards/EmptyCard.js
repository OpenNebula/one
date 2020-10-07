import React from 'react';
import PropTypes from 'prop-types';

import { Card, CardHeader, Fade, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  content: {
    height: '100%',
    minHeight: 140,
    padding: theme.spacing(1),
    textAlign: 'center'
  }
}));

const EmptyCard = React.memo(({ name }) => {
  const classes = useStyles();

  return (
    <Fade in unmountOnExit>
      <Card className={classes.root} variant="outlined">
        <CardHeader
          subheader={`Your ${name} list is empty`}
          className={classes.content}
        />
      </Card>
    </Fade>
  );
});

EmptyCard.propTypes = {
  name: PropTypes.string
};

EmptyCard.defaultProps = {
  name: undefined
};

export default EmptyCard;
