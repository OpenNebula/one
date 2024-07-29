/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
/** @enum {string} Base path for Open Nebula documentation */
export const DOCS_BASE_PATH = 'https://docs.opennebula.io'

export const RESTRICTED_ATTRIBUTES_TYPE = {
  VM: 'VM_RESTRICTED_ATTR',
  IMAGE: 'IMAGE_RESTRICTED_ATTR',
  VNET: 'VNET_RESTRICTED_ATTR',
}

export const FEDERATION_TYPE = {
  STANDALONE: 'STANDALONE',
  MASTER: 'MASTER',
  SLAVE: 'SLAVE',
}
