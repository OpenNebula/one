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

import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'
import { T } from 'client/constants'

/**
 * @typedef {object} Ticket
 * @property {string} created_at -
 * @property {CustomField[]} fields -
 * @property {number} id - Id
 * @property {string} priority -
 * @property {string} status -
 * @property {string} subject -
 */

/**
 * @typedef {object} CustomField
 * @property {number} id -
 * @property {string} value -
 */

/**
 * @typedef {object} TicketComment
 * @property {number} id - Comment ID
 * @property {string} createdAt - Comment date
 * @property {string} body - Comment message
 * @property {CommentAuthor} author -
 * @property {Attachment[]} attachments - List of attachments
 */

/**
 * @typedef {object} CommentAuthor
 * @property {string} id -
 * @property {string} name -
 * @property {string} [photo] - Photo url
 */

/**
 * @typedef {object} Attachment
 * @property {string} filename -
 * @property {string} url - Attachment url
 * @property {number} size -
 */

/** @type {STATES.StateInfo[]} Support ticket states */
export const TICKET_STATES = {
  [STATES.NEW]: {
    name: STATES.NEW,
    color: COLOR.info.main,
  },
  [STATES.OPEN]: {
    name: STATES.OPEN,
    color: COLOR.info.main,
  },
  [STATES.PENDING]: {
    name: STATES.PENDING,
    color: COLOR.warning.main,
  },
  [STATES.HOLD]: {
    name: STATES.HOLD,
    color: COLOR.debug.main,
  },
  [STATES.SOLVED]: {
    name: STATES.SOLVED,
    color: COLOR.success.main,
  },
  [STATES.CLOSED]: {
    name: STATES.CLOSED,
    color: COLOR.error.main,
  },
}

export const TICKET_FIELDS = {
  391197: T.Severity,
  391130: T.Version,
  391131: T.Category,
  391161: T.Resolution,
}

export const SEVERITIES = {
  severity_1: T.Severity1,
  severity_2: T.Severity2,
  severity_3: T.Severity3,
  severity_4: T.Severity4,
}

export const CATEGORIES = {
  product_error: T.ProductError,
  integration_assistance: T.IntegrationAssistance,
  feature_enhancement: T.FeatureEnhancement,
  technical_assistance: T.TechnicalAssistance,
}

export const RESOLUTIONS = {
  fixed: T.Fixed,
  duplicate: T.Duplicate,
  works_for_me: T.WorksForMe,
  lack_of_information: T.LackOfInformation,
  wont_fix: T.WontFix,
}

export const PRIORITIES = {
  low: T.Low,
  normal: T.Normal,
  high: T.High,
  urgent: T.Urgent,
}

/** @enum {string} Support tickets actions */
export const SUPPORT_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  LOGOUT: 'logout',
}
