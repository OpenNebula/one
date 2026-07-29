/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { createElement, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Drawer, Stack, Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/DetailsDrawer/Documentation/Default/styles'
import { T } from '@ConstantsModule'
import { generateDocLink } from '@UtilsModule'
import { ArrowTrSquare, Cancel } from 'iconoir-react'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'

/**
 * DocumentationDrawer component.
 *
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Whether the drawer is open
 * @param {object} root0.content - Drawer content
 * @param {string} root0.version - Documentation version
 * @param {string} root0.link - Documentation path
 * @param {Function} root0.onClose - Callback to close the drawer
 * @returns {object} - DetailsDrawer component
 */
export const DocumentationDrawer = forwardRef(
  (
    { isOpen = false, title, content, version = 'stable', link, onClose },
    ref
  ) => {
    const drawerContent = Array.isArray(content)
      ? content.map((paragraph, idx) => (
          <Box key={idx} className="documentationdrawer-paragraph">
            {paragraph}
          </Box>
        ))
      : typeof content === 'function'
      ? createElement(content)
      : content

    const handleOpenDocumentation = () => {
      const docLink = generateDocLink(version, link)

      docLink && window.open(docLink, '_blank', 'noopener,noreferrer')
    }

    return (
      <Drawer
        anchor={'right'}
        sx={(theme) => getStyles({ theme })}
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          className: 'documentationdrawer-paper',
        }}
        ref={ref}
      >
        <Stack className="documentationdrawer-container">
          <Stack className="documentationdrawer-header">
            <Box className="documentationdrawer-guides">Guides</Box>
            <Button
              data-cy="documentationdrawer-close"
              type={'transparent'}
              iconOnly={<Cancel />}
              onClick={onClose}
            />
          </Stack>
          <Box className="documentationdrawer-title">{title}</Box>
          <Box className="documentationdrawer-paragraph">{drawerContent}</Box>
        </Stack>
        <Button
          className="documentationdrawer-link"
          data-cy="documentationdrawer-link"
          title={T.LearnMore}
          type={'outline'}
          onClick={handleOpenDocumentation}
          endIcon={<ArrowTrSquare />}
        />
      </Drawer>
    )
  }
)

DocumentationDrawer.propTypes = {
  isOpen: PropTypes.bool,
  title: PropTypes.node,
  content: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.node,
    PropTypes.elementType,
  ]),
  version: PropTypes.string,
  link: PropTypes.string,
  onClose: PropTypes.func,
}

DocumentationDrawer.displayName = 'DocumentationDrawer'
