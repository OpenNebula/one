
const { v4 } = require('uuid')

const createIntercept = (data = {}) => {
  const uuidv4 = v4()
  cy.intercept({
    method: data.method || 'GET',
    url: data.url || ''
  }).as(uuidv4)
  return uuidv4
}

const waitIntercept = (intercept = '', callback = () => undefined) => {
  if (intercept) {
    cy.wait(`@${intercept}`).then(interception => {
      if (interception && interception.state && interception.state === 'Complete' && typeof callback === 'function') {
        callback(interception)
      }
    })
  }
}

const internalLog = (command = '', message = '') => {
  Cypress.log({
    name: command,
    displayName: command,
    consoleProps: () => {
      return {
        error: message
      }
    }
  })
}

const utils = {
  internalLog,
  createIntercept,
  waitIntercept
}

module.exports = utils
