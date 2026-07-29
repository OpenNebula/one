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

import PropTypes from 'prop-types'
import { useMemo } from 'react'
import { Box, Dialog, Stack, Typography, useTheme } from '@mui/material'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { getStyles } from '@modules/componentsv2/composed/CreateTypeDialog/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * Dialog to choose between different creation flows.
 *
 * @param {object} root0 - Props
 * @param {boolean} root0.open - Whether the dialog is open
 * @param {*} root0.title - Dialog title
 * @param {*} root0.subtitle - Dialog subtitle
 * @param {Array} root0.options - Creation type options
 * @param {string|number|boolean} root0.selectedValue - Selected option value
 * @param {Function} root0.onChange - Selection callback
 * @param {Function} root0.onCancel - Cancel callback
 * @param {Function} root0.onConfirm - Confirm callback
 * @param {*} root0.cancelLabel - Cancel button label
 * @param {*} root0.confirmLabel - Confirm button label
 * @param {string} root0.cancelDataCy - Cypress selector for the cancel button
 * @param {string} root0.confirmDataCy - Cypress selector for the confirm button
 * @returns {*} Create type dialog
 */
export const CreateTypeDialog = ({
  open = true,
  title,
  subtitle,
  options = [],
  selectedValue,
  onChange,
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  cancelDataCy,
  confirmDataCy,
}) => {
  const { translateText } = useTranslation()
  const theme = useTheme()
  const styles = useMemo(() => getStyles({ theme }), [theme])

  return (
    <Dialog open={open} onClose={onCancel} sx={styles.root}>
      <Stack direction="column" sx={styles.header}>
        <Typography sx={styles.title}>
          {typeof title === 'string' ? translateText(title) : title}
        </Typography>
        {subtitle && (
          <Typography sx={styles.subtitle}>
            {typeof subtitle === 'string' ? translateText(subtitle) : subtitle}
          </Typography>
        )}
      </Stack>
      <Box sx={styles.cards}>
        {options.map(
          ({
            value,
            dataCy,
            icon: Icon,
            title: optionTitle,
            subtitle: optionSubtitle,
          }) => (
            <Stack
              key={String(value)}
              component="button"
              type="button"
              data-cy={dataCy}
              direction="column"
              onClick={() => onChange?.(value)}
              sx={[
                styles.card,
                selectedValue === value ? styles.cardSelected : {},
              ]}
            >
              {Icon && (
                <Box sx={styles.iconBox}>
                  <Icon />
                </Box>
              )}
              <Stack direction="column" sx={styles.cardContent}>
                <Typography sx={styles.cardTitle}>
                  {typeof optionTitle === 'string'
                    ? translateText(optionTitle)
                    : optionTitle}
                </Typography>
                {optionSubtitle && (
                  <Typography sx={styles.cardSubtitle}>
                    {typeof optionSubtitle === 'string'
                      ? translateText(optionSubtitle)
                      : optionSubtitle}
                  </Typography>
                )}
              </Stack>
            </Stack>
          )
        )}
      </Box>
      <Box sx={styles.actions}>
        {cancelLabel && (
          <Button data-cy={cancelDataCy} type="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        {confirmLabel && (
          <Button data-cy={confirmDataCy} type="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        )}
      </Box>
    </Dialog>
  )
}

CreateTypeDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool,
      ]).isRequired,
      dataCy: PropTypes.string,
      icon: PropTypes.elementType,
      title: PropTypes.node.isRequired,
      subtitle: PropTypes.node,
    })
  ),
  selectedValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
  onChange: PropTypes.func,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
  cancelLabel: PropTypes.node,
  confirmLabel: PropTypes.node,
  cancelDataCy: PropTypes.string,
  confirmDataCy: PropTypes.string,
}

CreateTypeDialog.displayName = 'CreateTypeDialog'
