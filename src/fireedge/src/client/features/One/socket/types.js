/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

/**
 * @typedef {object} HookStateData - Event data from hook event STATE
 * @property {HookStateMessage} HOOK_MESSAGE - Hook message from OpenNebula API
 */

/**
 * @typedef {object} HookStateMessage - Hook message from OpenNebula API
 * @property {'STATE'} HOOK_TYPE - Type of event API
 * @property {('VM'|'HOST'|'IMAGE')} HOOK_OBJECT - Type name of the resource
 * @property {string} STATE - The state that triggers the hook.
 * @property {string} [LCM_STATE]
 * - The LCM state that triggers the hook (Only for VM hooks)
 * @property {string} [REMOTE_HOST]
 * - If ``yes`` the hook will be executed in the host that triggered
 * the hook (for Host hooks) or in the host where the VM is running (for VM hooks).
 * Not used for Image hooks.
 * @property {string} RESOURCE_ID - ID of resource
 * @property {object} [VM] - New data of the VM
 * @property {object} [HOST] - New data of the HOST
 * @property {object} [IMAGE] - New data of the IMAGE
 */

/**
 * @typedef {object} HookApiData - Event data from hook event API
 * @property {HookApiMessage} HOOK_MESSAGE - Hook message from OpenNebula API
 */

/**
 * Call parameter.
 *
 * @typedef {object} Parameter
 * @property {number} POSITION - Parameter position in the list
 * @property {('IN'|'OUT')} TYPE - Parameter type
 * @property {string} VALUE - Parameter value as string
 */

/**
 * @typedef {object} HookApiMessage - Event data from hook event API
 * @property {'API'} HOOK_TYPE - Type of event API
 * @property {string} CALL - Action name: 'one.resourceName.action'
 * @property {object} [CALL_INFO] - Information about result of action
 * @property {0|1} CALL_INFO.RESULT - `1` for success and `0` for error result
 * @property {Parameter[]|Parameter} [CALL_INFO.PARAMETERS]
 * - The list of IN and OUT parameters will match the API call parameters
 * @property {object} [CALL_INFO.EXTRA] - Extra information returned for API Hooks
 */
