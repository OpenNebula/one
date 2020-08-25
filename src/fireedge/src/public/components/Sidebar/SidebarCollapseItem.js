import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { List, Collapse, ListItem, ListItemText } from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import SidebarLink from 'client/components/Sidebar/SidebarLink';

const SidebarCollapseItem = ({ label, routes }) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => setExpanded(!expanded);

  return (
    <>
      <ListItem button onClick={handleExpand}>
        <ListItemText primary={label} />
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      {routes?.map((subItem, index) => (
        <Collapse
          key={`subitem-${index}`}
          in={expanded}
          timeout="auto"
          unmountOnExit
        >
          <List component="div" disablePadding>
            <SidebarLink {...subItem} />
          </List>
        </Collapse>
      ))}
    </>
  );
};

SidebarCollapseItem.propTypes = {
  label: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      path: PropTypes.string
    })
  )
};

SidebarCollapseItem.defaultProps = {
  label: '',
  routes: []
};

export default SidebarCollapseItem;
