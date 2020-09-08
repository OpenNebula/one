import React from 'react';

import {
  makeStyles,
  Card,
  Button,
  CardHeader,
  CardActions,
  Badge,
  Fade
} from '@material-ui/core';
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';

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

const RoleCard = React.memo(
  ({ info, handleEdit, handleClone, handleRemove }) => {
    const classes = useStyles();
    const {
      name = 'Role name',
      cardinality,
      vm_template = 0,
      elasticity_policies,
      scheduled_policies
    } = info;

    return (
      <Fade in unmountOnExit={false}>
        <Card className={classes.root}>
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
            subheader={`Template id: ${vm_template}`}
            subheaderTypographyProps={{
              variant: 'body2',
              noWrap: true,
              title: `Template id: ${vm_template}`
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

export default RoleCard;
