import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';

import {
  withStyles,
  Badge,
  Typography,
  ListItem,
  ListItemText,
  useMediaQuery
} from '@material-ui/core';

import useGeneral from 'client/hooks/useGeneral';

const StyledBadge = withStyles(() => ({
  badge: {
    right: -25,
    top: 13,
    fontSize: '0.7rem'
  }
}))(Badge);

const SidebarLink = ({ label, path, devMode }) => {
  const history = useHistory();
  const isDesktop = useMediaQuery(theme => theme.breakpoints.up('sm'));
  const { openMenu } = useGeneral();

  const handleClick = () => {
    history.push(path);
    !isDesktop && openMenu(false);
  };

  return (
    <ListItem button onClick={handleClick}>
      <ListItemText
        primary={
          devMode ? (
            <StyledBadge badgeContent="DEV" color="primary">
              <Typography>{label}</Typography>
            </StyledBadge>
          ) : (
            label
          )
        }
      />
    </ListItem>
  );
};

SidebarLink.propTypes = {
  label: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  devMode: PropTypes.bool
};

SidebarLink.defaultProps = {
  label: '',
  path: '/',
  devMode: false
};

export default SidebarLink;
