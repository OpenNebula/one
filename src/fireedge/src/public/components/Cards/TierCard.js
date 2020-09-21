import React from 'react';

import {
  makeStyles,
  Card,
  Button,
  CardHeader,
  CardActions,
  Badge
} from '@material-ui/core';
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';

import { Tr } from 'client/components/HOC';

const useStyles = makeStyles(() => ({
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
  headerContent: {},
  title: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  }
}));

const TierCard = React.memo(
  ({ values, handleEdit, handleClone, handleRemove, cardProps }) => {
    const classes = useStyles();
    const { name = 'Tier name', cardinality } = values;

    return (
      <Card className={classes.root} {...cardProps}>
        <CardHeader
          avatar={
            <Badge
              badgeContent={cardinality}
              color="primary"
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left'
              }}
            >
              <DesktopWindowsIcon />
            </Badge>
          }
          className={classes.header}
          classes={{ content: classes.headerContent }}
          title={name}
          titleTypographyProps={{
            variant: 'body2',
            noWrap: true,
            className: classes.title,
            title: name
          }}
        />
        <CardActions>
          {handleEdit && (
            <Button variant="contained" size="small" onClick={handleEdit}>
              {Tr('Edit')}
            </Button>
          )}
          {handleClone && (
            <Button variant="contained" size="small" onClick={handleClone}>
              {Tr('Clone')}
            </Button>
          )}
          {handleRemove && (
            <Button size="small" onClick={handleRemove}>
              {Tr('Remove')}
            </Button>
          )}
        </CardActions>
      </Card>
    );
  }
);

export default TierCard;
