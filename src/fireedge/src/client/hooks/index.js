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
import useClipboard, { CLIPBOARD_STATUS } from 'client/hooks/useClipboard'
import useDialog from 'client/hooks/useDialog'
import useFetch from 'client/hooks/useFetch'
import useFetchAll from 'client/hooks/useFetchAll'
import useList from 'client/hooks/useList'
import useListForm from 'client/hooks/useListForm'
import useNearScreen from 'client/hooks/useNearScreen'
import useSearch from 'client/hooks/useSearch'
import useSocket from 'client/hooks/useSocket'

export {
  useClipboard,
  useDialog,
  useFetch,
  useFetchAll,
  useList,
  useListForm,
  useNearScreen,
  useSearch,
  useSocket,
  CLIPBOARD_STATUS,
}
