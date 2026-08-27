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

import { STYLE_BUTTONS, T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { Button, TextArea, Text } from '@ComponentsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/VirtualMachine/Tabs/Exec/components/CommandForm/styles'

const MIN_COMMAND_ROWS = 6

/**
 * @param {object} root0 - Props
 * @param {string} root0.command - Current command
 * @param {boolean} root0.isCommandInputDisabled - Whether command input is disabled
 * @param {boolean} root0.isRunDisabled - Whether run action is disabled
 * @param {Function} root0.onCommandChange - Command change handler
 * @param {Function} root0.onRun - Run action handler
 * @returns {Component} VM command form
 */
export const CommandForm = ({
  command,
  isCommandInputDisabled,
  isRunDisabled,
  onCommandChange,
  onRun,
}) => (
  <Box
    className="exec-form"
    sx={(theme) => getStyles({ theme, minRows: MIN_COMMAND_ROWS })}
  >
    <Box className="exec-form-header">
      <Text
        component="h3"
        className="exec-form-title"
        value={T.ExecuteCommandInVM}
        variant={TEXT_VARIANTS.BODY_SMALL}
        weight={TEXT_WEIGHTS.MEDIUM}
      />

      <Text
        className="exec-form-subtitle"
        value={T.GuestContextualization}
        variant={TEXT_VARIANTS.CAPTION}
      />
    </Box>

    <TextArea
      id="exec-command-textarea"
      className="exec-command-textarea"
      label={T.Command}
      placeholder={T.EnterCommand}
      initialValue={command}
      minRows={MIN_COMMAND_ROWS}
      onChange={onCommandChange}
      inputProps={{
        disabled: isCommandInputDisabled,
        'data-cy': 'vm-exec-textarea',
      }}
    />

    <Button
      title={T.Run}
      type={STYLE_BUTTONS.TYPE.OUTLINE}
      onClick={onRun}
      isDisabled={isRunDisabled}
      dataCy="vm-exec-run"
    />
  </Box>
)

CommandForm.propTypes = {
  command: PropTypes.string,
  isCommandInputDisabled: PropTypes.bool,
  isRunDisabled: PropTypes.bool,
  onCommandChange: PropTypes.func,
  onRun: PropTypes.func,
}
