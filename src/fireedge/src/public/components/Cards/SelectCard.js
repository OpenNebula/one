import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import { Card, CardActionArea, Fade, makeStyles } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

import useNearScreen from 'client/hooks/useNearScreen';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  selected: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main
  },
  actionArea: {
    height: '100%',
    minHeight: 140,
    padding: theme.spacing(1)
  }
}));

const SelectCard = React.memo(
  ({ isSelected, handleSelect, handleUnselect, ID, NAME }) => {
    const classes = useStyles();
    const { isNearScreen, fromRef } = useNearScreen({
      distance: '100px'
    });

    return (
      <div ref={fromRef}>
        {isNearScreen ? (
          <Fade in={isNearScreen}>
            <Card
              className={clsx(classes.root, { [classes.selected]: isSelected })}
            >
              <CardActionArea
                className={classes.actionArea}
                onClick={() =>
                  isSelected ? handleUnselect(ID) : handleSelect(ID)
                }
              >
                <span>{`📦 ${NAME}`}</span>
              </CardActionArea>
            </Card>
          </Fade>
        ) : (
          <Skeleton variant="rect" width="100%" height={140} />
        )}
      </div>
    );
  }
);

SelectCard.propTypes = {
  isSelected: PropTypes.bool,
  handleSelect: PropTypes.func,
  handleUnselect: PropTypes.func,
  ID: PropTypes.string,
  NAME: PropTypes.string
};

SelectCard.defaultProps = {
  isSelected: false,
  handleSelect: () => undefined,
  handleUnselect: () => undefined,
  ID: undefined,
  NAME: undefined
};

export default SelectCard;
