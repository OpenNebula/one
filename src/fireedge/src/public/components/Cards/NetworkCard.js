import React from 'react';

import {
  makeStyles,
  Card,
  Button,
  CardHeader,
  CardActions,
  Fade
} from '@material-ui/core';

import { Tr } from 'client/components/HOC';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    overflowX: 'hidden',
    flexGrow: 1
  },
  subheader: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  },
  remove: {
    backgroundColor: theme.palette.error.dark
  }
}));

const NetworkCard = React.memo(
  ({ info, handleEdit, handleClone, handleRemove }) => {
    const classes = useStyles();
    const { mandatory, name, description, type, id, extra } = info;

    return (
      <Fade in unmountOnExit={false}>
        <Card className={classes.root}>
          <CardHeader
            avatar={mandatory ? 'M' : ''}
            className={classes.header}
            classes={{ content: classes.headerContent }}
            title={name}
            titleTypographyProps={{
              variant: 'body2',
              noWrap: true,
              title: name
            }}
            subheader={description}
            subheaderTypographyProps={{
              variant: 'body2',
              noWrap: true,
              className: classes.subheader,
              title: description
            }}
          />
          <CardActions>
            <Button variant="contained" size="small" onClick={handleEdit}>
              {Tr('Edit')}
            </Button>
            <Button variant="contained" size="small" onClick={handleClone}>
              {Tr('Clone')}
            </Button>
            <Button size="small" onClick={handleRemove}>
              {Tr('Remove')}
            </Button>
          </CardActions>
        </Card>
      </Fade>
    );
  }
);

export default NetworkCard;
