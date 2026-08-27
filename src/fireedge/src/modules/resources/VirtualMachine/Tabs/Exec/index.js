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

import { T } from '@ConstantsModule'
import { useVmExec } from '@HooksModule'
import { getStyles } from '@modules/resources/VirtualMachine/Tabs/Exec/styles'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import {
  CommandForm,
  ExecutionResult,
} from '@modules/resources/VirtualMachine/Tabs/Exec/components'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances exec tab
 */
export const Exec = ({ data, config }) => {
  const {
    command,
    execution,
    hasExecution,
    hasReturnCode,
    isCancelDisabled,
    isCheckingStatus,
    isCommandInputDisabled,
    isCopyDisabled,
    isRerunDisabled,
    isRunDisabled,
    relativeExecutionTime,
    relativeLastCheckedTime,
    showCancel,
    showCheckStatus,
    showRerun,
    showRun,
    stderr,
    stdout,
    handleCancel,
    handleCheckStatus,
    handleCommandChange,
    handleRerun,
    handleRun,
  } = useVmExec({ data, config })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      {showRun && (
        <CommandForm
          command={command}
          isCommandInputDisabled={isCommandInputDisabled}
          isRunDisabled={isRunDisabled}
          onCommandChange={handleCommandChange}
          onRun={handleRun}
        />
      )}
      {hasExecution && (
        <ExecutionResult
          execution={execution}
          hasReturnCode={hasReturnCode}
          isCancelDisabled={isCancelDisabled}
          isCheckingStatus={isCheckingStatus}
          isCopyDisabled={isCopyDisabled}
          isRerunDisabled={isRerunDisabled}
          onCancel={handleCancel}
          onCheckStatus={handleCheckStatus}
          onRerun={handleRerun}
          relativeExecutionTime={relativeExecutionTime}
          relativeLastCheckedTime={relativeLastCheckedTime}
          showRerun={showRerun}
          showCancel={showCancel}
          showCheckStatus={showCheckStatus}
          stderr={stderr}
          stdout={stdout}
        />
      )}
    </Box>
  )
}

Exec.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Exec.id = 'exec'
Exec.title = T.Exec
