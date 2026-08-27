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

import { STYLE_BUTTONS, T, TEXT_WEIGHTS, TEXT_VARIANTS } from '@ConstantsModule'
import { Badge, Button, Loader, Text, Tooltip } from '@ComponentsModule'
import { useClipboard } from '@HooksModule'
import { Box } from '@mui/material'
import { Cancel as CancelIcon, Copy, Refresh } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, useMemo, useState } from 'react'
import { getStyles } from '@modules/resources/VirtualMachine/Tabs/Exec/components/ExecutionResult/styles'

const EXECUTION_STATUS_COLORS = {
  EXECUTING: 'information',
  DONE: 'success',
  ERROR: 'error',
  CANCELLED: 'warning',
}

/**
 * @param {object} root0 - Props
 * @param {object} root0.execution - Last VM command execution
 * @param {boolean} root0.hasReturnCode - Whether execution has a return code
 * @param {boolean} root0.isCancelDisabled - Whether cancel action is disabled
 * @param {boolean} root0.isCheckingStatus - Whether VM data is being refreshed
 * @param {boolean} root0.isCopyDisabled - Whether copy action is disabled
 * @param {boolean} root0.isRerunDisabled - Whether re-run action is disabled
 * @param {Function} root0.onCancel - Cancel action handler
 * @param {Function} root0.onCheckStatus - Check status action handler
 * @param {Function} root0.onRerun - Re-run action handler
 * @param {string} root0.relativeExecutionTime - Relative execution time
 * @param {string} root0.relativeLastCheckedTime - Relative last checked time
 * @param {boolean} root0.showCancel - Whether cancel action is visible
 * @param {boolean} root0.showCheckStatus - Whether check status is visible
 * @param {boolean} root0.showRerun - Whether re-run action is visible
 * @param {string} root0.stderr - Decoded standard error
 * @param {string} root0.stdout - Decoded standard output
 * @returns {Component} VM execution result
 */
export const ExecutionResult = ({
  execution,
  hasReturnCode,
  isCancelDisabled,
  isCheckingStatus,
  isCopyDisabled,
  isRerunDisabled,
  onCancel,
  onCheckStatus,
  onRerun,
  relativeExecutionTime,
  relativeLastCheckedTime,
  showCancel,
  showCheckStatus,
  showRerun,
  stderr,
  stdout,
}) => {
  const output = useMemo(
    () => [stdout, stderr].filter(Boolean).join('\n'),
    [stderr, stdout]
  )
  const executionStatus =
    execution.STATUS === 'DONE' &&
    hasReturnCode &&
    Number(execution.RETURN_CODE) !== 0
      ? 'ERROR'
      : execution.STATUS
  const isFinished = ['DONE', 'ERROR', 'CANCELLED'].includes(executionStatus)
  const { copy, isCopied } = useClipboard()
  const [overflowingCommand, setOverflowingCommand] = useState()
  const isCommandOverflowing = overflowingCommand === execution.COMMAND

  const handleCommandMouseOver = ({ currentTarget }) =>
    setOverflowingCommand(
      currentTarget.scrollWidth > currentTarget.clientWidth
        ? execution.COMMAND
        : undefined
    )

  return (
    <Box
      className="exec-result"
      data-cy="vm-exec-result"
      sx={(theme) => getStyles({ theme })}
    >
      <Box className="exec-result-header">
        <Box className="exec-result-header-info">
          <Tooltip title={executionStatus} placement="top">
            <Badge
              status={EXECUTION_STATUS_COLORS[executionStatus] ?? 'default'}
              type="dot"
              aria-label={executionStatus}
              data-cy="vm-exec-status"
            />
          </Tooltip>
          <Tooltip
            title={
              isCommandOverflowing ? (
                <Box
                  component="pre"
                  sx={{
                    margin: 0,
                    maxHeight: '40vh',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {execution.COMMAND}
                </Box>
              ) : (
                ''
              )
            }
            placement="top"
          >
            <Text
              className="command"
              value={execution.COMMAND}
              noWrap
              onMouseOver={handleCommandMouseOver}
            />
          </Tooltip>
          {hasReturnCode && (
            <Text
              className="exec-return-code"
              value={T.ReturnCode}
              values={[execution.RETURN_CODE]}
            />
          )}
          {relativeExecutionTime && (
            <Text
              className="exec-time"
              value={T.ExecutionStartedTime}
              values={[relativeExecutionTime]}
            />
          )}
          {relativeLastCheckedTime && (
            <Text
              className="exec-last-checked"
              value={T.LastChecked}
              values={[relativeLastCheckedTime]}
            />
          )}
        </Box>
        <Box className="exec-result-header-actions">
          {showCheckStatus ? (
            <Button
              title={T.CheckStatus}
              startIcon={<Refresh />}
              type={STYLE_BUTTONS.TYPE.SECONDARY}
              onClick={onCheckStatus}
              isDisabled={isCheckingStatus}
              dataCy="vm-exec-check-status"
            />
          ) : (
            <Button
              title={isCopied(output) ? T.Copied : T.Copy}
              startIcon={<Copy />}
              type={STYLE_BUTTONS.TYPE.SECONDARY}
              onClick={() => copy(output)}
              isDisabled={!output || isCopyDisabled}
              dataCy="vm-exec-copy-output"
            />
          )}
          {!showCancel && showRerun && (
            <Button
              title={T.ReRun}
              startIcon={<Refresh />}
              type={STYLE_BUTTONS.TYPE.OUTLINE}
              onClick={onRerun}
              isDisabled={isRerunDisabled}
              dataCy="vm-exec-rerun"
            />
          )}
          {showCancel && (
            <Button
              title={T.Cancel}
              startIcon={<CancelIcon />}
              type={STYLE_BUTTONS.TYPE.OUTLINE}
              isDestructive
              onClick={onCancel}
              isDisabled={isCancelDisabled}
              dataCy="vm-exec-cancel"
            />
          )}
        </Box>
      </Box>

      <Box className={`exec-result-output ${output ? '' : 'no-output'}`}>
        {output ? (
          <Box component="pre" className="exec-output-text">
            {output}
          </Box>
        ) : (
          <Box className="no-output-text">
            {isFinished ? (
              executionStatus === 'CANCELLED' ? (
                <Text
                  value={T.CommandWasCancelled}
                  variant={TEXT_VARIANTS.BODY_SMALL}
                />
              ) : (
                <Text
                  value={T.CommandFinishedWithoutOutput}
                  variant={TEXT_VARIANTS.BODY_SMALL}
                />
              )
            ) : (
              <>
                <Loader
                  type="primary"
                  size="xsmall"
                  ariaLabel={T.CommandStillRunning}
                />
                <Text
                  value={T.CommandStillRunning}
                  variant={TEXT_VARIANTS.BODY_SMALL}
                  weight={TEXT_WEIGHTS.SEMIBOLD}
                />
                <Text
                  value={T.CommandStillRunningDescription}
                  variant={TEXT_VARIANTS.BODY_SMALL}
                />
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

ExecutionResult.propTypes = {
  execution: PropTypes.object,
  hasReturnCode: PropTypes.bool,
  isCancelDisabled: PropTypes.bool,
  isCheckingStatus: PropTypes.bool,
  isCopyDisabled: PropTypes.bool,
  isRerunDisabled: PropTypes.bool,
  onCancel: PropTypes.func,
  onCheckStatus: PropTypes.func,
  onRerun: PropTypes.func,
  relativeExecutionTime: PropTypes.string,
  relativeLastCheckedTime: PropTypes.string,
  showCancel: PropTypes.bool,
  showCheckStatus: PropTypes.bool,
  showRerun: PropTypes.bool,
  stderr: PropTypes.string,
  stdout: PropTypes.string,
}
