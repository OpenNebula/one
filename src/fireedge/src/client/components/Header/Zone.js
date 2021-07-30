/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
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
      'data-cy': 'header-zone-button'
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
