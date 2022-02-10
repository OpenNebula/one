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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/host/actions'
import { name, RESOURCES } from 'client/features/One/slice'

export const useHost = () =>
  useSelector((state) => state[name]?.[RESOURCES.host])

export const useHostApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    (action) => dispatch(action).then(unwrapResult),
    [dispatch]
  )

  return {
    getHost: (id) => unwrapDispatch(actions.getHost({ id })),
    getHosts: (options) => unwrapDispatch(actions.getHosts(options)),
    allocate: (data) => unwrapDispatch(actions.allocate(data)),
    remove: (id) => unwrapDispatch(actions.remove({ id })),
    enable: (id) => unwrapDispatch(actions.enable({ id })),
    disable: (id) => unwrapDispatch(actions.disable({ id })),
    offline: (id) => unwrapDispatch(actions.offline({ id })),
    update: (id, template, replace) =>
      unwrapDispatch(actions.update({ id, template, replace })),
    rename: (id, newName) =>
      unwrapDispatch(actions.rename({ id, name: newName })),
    getMonitoring: (id) => unwrapDispatch(actions.monitoring({ id })),
    getMonitoringPool: (seconds) =>
      unwrapDispatch(actions.monitoringPool({ seconds })),
  }
}
