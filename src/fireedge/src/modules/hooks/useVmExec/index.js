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

import { STATES, T } from '@ConstantsModule'
import { VmAPI, useGeneralApi } from '@FeaturesModule'
import { getVirtualMachineState } from '@ModelsModule'
import { useTranslation } from '@ProvidersModule'
import { decodeBase64, getElapsedTime } from '@UtilsModule'
import { useEffect, useMemo, useState } from 'react'
import {
  formatRelativeTime,
  getLatestExecutionHistory,
} from '@modules/hooks/useVmExec/utils'

const LAST_CHECKED_EXECUTIONS = new Map()

const getExecutionKey = ({ execution, history, vmId }) => {
  if (!execution?.COMMAND || vmId === undefined || vmId === null) return

  const sequence = Number(history?.SEQ)
  const identifier = Number.isFinite(sequence)
    ? sequence
    : `${history?.STIME ?? ''}:${execution.COMMAND}`

  return `${vmId}:${identifier}`
}

const getOrCreateLastCheckedAt = ({ executionKey, vmId }) => {
  if (!executionKey) return

  const storedExecution = LAST_CHECKED_EXECUTIONS.get(vmId)

  if (storedExecution?.executionKey === executionKey) {
    return storedExecution.lastCheckedAt
  }

  const lastCheckedAt = Date.now()

  LAST_CHECKED_EXECUTIONS.set(vmId, { executionKey, lastCheckedAt })

  return lastCheckedAt
}

/**
 * Manages VM command execution state and actions.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - VM Exec tab data
 * @param {object} root0.config - Tab view configuration
 * @returns {object} VM execution state and handlers
 */
export const useVmExec = ({ data, config }) => {
  const [command, setCommand] = useState('')
  const [lastCheckedExecution, setLastCheckedExecution] = useState()
  const [execVm, { isLoading: isStartingExecution }] = VmAPI.useExecVmMutation()
  const [retryExecVm, { isLoading: isRetrying }] =
    VmAPI.useRetryExecVmMutation()
  const [cancelExecVm, { isLoading: isCancelling }] =
    VmAPI.useCancelExecVmMutation()
  const { enqueueSuccess } = useGeneralApi()
  const { locale, translate } = useTranslation()

  const { selectedVm, extendedVmData, isLoadingExtended, refreshVm } =
    data || {}
  const vmId = selectedVm?.ID
  const hasVmId = vmId !== undefined && vmId !== null
  const vm = extendedVmData?.ID === vmId ? extendedVmData : selectedVm
  const execution = vm?.TEMPLATE?.QEMU_GA_EXEC
  const latestExecutionHistory = useMemo(
    () => getLatestExecutionHistory(vm),
    [vm]
  )
  const isExecuting = execution?.STATUS === 'EXECUTING'
  const executionKey = getExecutionKey({
    execution,
    history: latestExecutionHistory,
    vmId,
  })
  const storedLastCheckedAt = isExecuting
    ? getOrCreateLastCheckedAt({ executionKey, vmId })
    : undefined
  const lastCheckedAt =
    isExecuting && lastCheckedExecution?.executionKey === executionKey
      ? lastCheckedExecution.lastCheckedAt
      : storedLastCheckedAt
  const executionTimestamp = Number(latestExecutionHistory?.ETIME ?? 0)
  const elapsedExecutionTime = executionTimestamp
    ? getElapsedTime(executionTimestamp * 1_000, Date.now())
    : undefined
  const relativeExecutionTime = formatRelativeTime({
    elapsedTime: elapsedExecutionTime,
    locale,
    translate,
  })
  const elapsedLastCheckedTime =
    isExecuting && lastCheckedAt
      ? getElapsedTime(lastCheckedAt, Date.now())
      : undefined
  const relativeLastCheckedTime = formatRelativeTime({
    elapsedTime: elapsedLastCheckedTime,
    locale,
    translate,
  })
  const encodedStdout = execution?.STDOUT ?? ''
  const encodedStderr = execution?.STDERR ?? ''
  const [stdout, stderr] = useMemo(
    () => [decodeBase64(encodedStdout, ''), decodeBase64(encodedStderr, '')],
    [encodedStderr, encodedStdout]
  )
  const hasExecution = Boolean(execution?.COMMAND)
  const hasReturnCode =
    execution?.RETURN_CODE !== undefined &&
    execution?.RETURN_CODE !== null &&
    execution?.RETURN_CODE !== ''
  const isRunning = getVirtualMachineState(vm)?.name === STATES.RUNNING
  const isExecActionEnabled = config?.actions?.exec === true
  const isRetryActionEnabled = config?.actions?.['exec-retry'] === true
  const isCancelActionEnabled = config?.actions?.['exec-cancel'] === true

  useEffect(() => {
    setCommand('')
    setLastCheckedExecution(undefined)
  }, [vmId])

  const isExecutionBusy =
    isStartingExecution || isRetrying || isCancelling || isExecuting
  const isExecutionActionDisabled = !hasVmId || !isRunning || isExecutionBusy
  const isRunDisabled =
    !command.trim() || !isExecActionEnabled || isExecutionActionDisabled
  const isRerunDisabled =
    !hasExecution || !isRetryActionEnabled || isExecutionActionDisabled
  const isCancelDisabled =
    !hasVmId ||
    !isRunning ||
    !isCancelActionEnabled ||
    isLoadingExtended ||
    isStartingExecution ||
    isRetrying ||
    isCancelling ||
    !isExecuting

  const showCancel = isCancelActionEnabled && isExecuting

  const startExecution = async (execute, params) => {
    const result = await execute(params)

    if (result?.error) return

    LAST_CHECKED_EXECUTIONS.delete(vmId)
    setLastCheckedExecution(undefined)
    enqueueSuccess(T.CommandExecutionStarted, [vmId])
  }

  const handleRun = async () => {
    if (isRunDisabled) return

    await startExecution(execVm, {
      id: vmId,
      cmd: command,
      cmd_stdin: '',
    })
  }

  const handleRerun = async () => {
    if (isRerunDisabled) return

    await startExecution(retryExecVm, { id: vmId })
  }

  const refreshExecutionStatus = async () => {
    if (!hasVmId || isLoadingExtended || !refreshVm) return

    const result = await refreshVm()

    if (result?.error) return

    const refreshedVm = result?.data
    const refreshedExecution = refreshedVm?.TEMPLATE?.QEMU_GA_EXEC

    const refreshedExecutionKey = getExecutionKey({
      execution: refreshedExecution,
      history: getLatestExecutionHistory(refreshedVm),
      vmId,
    })

    if (!refreshedExecutionKey) {
      LAST_CHECKED_EXECUTIONS.delete(vmId)
      setLastCheckedExecution(undefined)

      return
    }

    if (refreshedExecution?.STATUS !== 'EXECUTING') {
      LAST_CHECKED_EXECUTIONS.delete(vmId)
      setLastCheckedExecution(undefined)

      return
    }

    const refreshedLastCheckedAt = Date.now()

    LAST_CHECKED_EXECUTIONS.set(vmId, {
      executionKey: refreshedExecutionKey,
      lastCheckedAt: refreshedLastCheckedAt,
    })
    setLastCheckedExecution({
      executionKey: refreshedExecutionKey,
      lastCheckedAt: refreshedLastCheckedAt,
    })
  }

  const handleCancel = async () => {
    if (isCancelDisabled) return

    const result = await cancelExecVm({ id: vmId })

    await refreshExecutionStatus()

    if (result?.error) return

    enqueueSuccess(T.CommandExecutionCancellationRequested, [vmId])
  }

  const handleCheckStatus = async () => {
    await refreshExecutionStatus()
  }

  return {
    command,
    execution,
    hasExecution,
    hasReturnCode,
    isCancelDisabled,
    isCommandInputDisabled: isExecutionBusy,
    isCheckingStatus: isLoadingExtended,
    isCopyDisabled: isExecutionBusy,
    isRerunDisabled,
    isRunDisabled,
    relativeExecutionTime,
    relativeLastCheckedTime,
    showRerun: isRetryActionEnabled,
    showCancel,
    showCheckStatus: isExecuting,
    showRun: isExecActionEnabled,
    stderr,
    stdout,
    handleCancel,
    handleCheckStatus,
    handleCommandChange: setCommand,
    handleRerun,
    handleRun,
  }
}
