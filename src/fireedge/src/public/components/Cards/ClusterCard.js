import React from 'react';
import clsx from 'clsx';

import {
  makeStyles,
  Card,
  CardHeader,
  Fade,
  CardActionArea,
  CardContent,
  Badge,
  Box
} from '@material-ui/core';
import StorageIcon from '@material-ui/icons/Storage';
import VideogameAssetIcon from '@material-ui/icons/VideogameAsset';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';

import { Tr } from 'client/components/HOC';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    flexDirection: 'column'
  },
  selected: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    '& $badge': {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.common.white
    }
  },
  actionArea: {
    height: '100%'
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
  badgesWrapper: {
    display: 'flex',
    gap: theme.typography.pxToRem(12)
  },
  badge: {},
  icon: {}
}));

const ClusterCard = React.memo(
  ({ value, isSelected, handleSelect, handleUnselect }) => {
    const classes = useStyles();
    const { ID, NAME, HOSTS, VNETS, DATASTORES } = value;

    const hosts = [HOSTS?.ID ?? []].flat();
    const vnets = [VNETS?.ID ?? []].flat();
    const datastores = [DATASTORES?.ID ?? []].flat();

    const badgePosition = { vertical: 'top', horizontal: 'right' };

    return (
      <Fade in unmountOnExit={false}>
        <Card
          className={clsx(classes.root, { [classes.selected]: isSelected })}
        >
          <CardActionArea
            className={classes.actionArea}
            onClick={() => (isSelected ? handleUnselect(ID) : handleSelect(ID))}
          >
            <CardHeader
              avatar={<StorageIcon />}
              className={classes.header}
              classes={{ content: classes.headerContent }}
              title={NAME}
              titleTypographyProps={{
                variant: 'body2',
                noWrap: true,
                title: NAME
              }}
            />
            <CardContent>
              <Box className={classes.badgesWrapper}>
                <Badge
                  showZero
                  title={Tr('Hosts')}
                  classes={{ badge: classes.badge }}
                  color="primary"
                  badgeContent={hosts.length}
                  anchorOrigin={badgePosition}
                >
                  <VideogameAssetIcon />
                </Badge>
                <Badge
                  showZero
                  title={Tr('Virtual networks')}
                  classes={{ badge: classes.badge }}
                  color="primary"
                  badgeContent={vnets.length}
                  anchorOrigin={badgePosition}
                >
                  <AccountTreeIcon />
                </Badge>
                <Badge
                  showZero
                  title={Tr('Datastores')}
                  classes={{ badge: classes.badge }}
                  color="primary"
                  badgeContent={datastores.length}
                  anchorOrigin={badgePosition}
                >
                  <FolderOpenIcon />
                </Badge>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Fade>
    );
  }
);

export default ClusterCard;
