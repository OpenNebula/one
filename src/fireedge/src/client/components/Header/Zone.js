import React, { memo } from 'react'

import { MenuItem, MenuList } from '@material-ui/core'
import { Language as ZoneIcon } from 'iconoir-react'

import HeaderPopover from 'client/components/Header/Popover'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const Zone = memo(() => (
  <HeaderPopover
    id='zone-menu'
    icon={<ZoneIcon />}
    buttonProps={{
      'data-cy': 'header-zone-button',
      variant: 'outlined'
    }}
    disablePadding
  >
    {({ handleClose }) => (
      <MenuList>
        <MenuItem onClick={handleClose}>
          {Tr(T.Zone)}
        </MenuItem>
      </MenuList>
    )}
  </HeaderPopover>
))

Zone.displayName = 'ZoneHeaderComponent'

export default Zone
