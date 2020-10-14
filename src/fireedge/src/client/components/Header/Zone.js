import React from 'react'

import { MenuItem, MenuList } from '@material-ui/core'
import LanguageIcon from '@material-ui/icons/Language'

import { Tr } from 'client/components/HOC'
import HeaderPopover from 'client/components/Header/Popover'

const Zone = React.memo(() => (
  <HeaderPopover
    id="zone-menu"
    icon={<LanguageIcon />}
    IconProps={{ 'data-cy': 'header-zone-button' }}
    disablePadding
  >
    {({ handleClose }) => (
      <MenuList>
        <MenuItem onClick={handleClose}>{Tr('Zone')}</MenuItem>
      </MenuList>
    )}
  </HeaderPopover>
))

Zone.displayName = 'ZoneHeaderComponent'

export default Zone
