const { createIntercept, waitIntercept } = require('../../../support/utils')
const testType = 'Provision'

const reloadProvisionComponent = () => {
  // for reload the provision react-component this update the provider list
  cy.navigateMenu('dashboard')
}

const interceptProviderList = {
  method: 'GET',
  url: '/provider/list'
}
const interceptList = {
  method: 'GET',
  url: '/provision/list'
}
const interceptCreate = {
  method: 'POST',
  url: '/provision/create'
}
const interceptConfigure = {
  method: 'PUT',
  url: '/provision/configure'
}
const interceptDelete = {
  method: 'DELETE',
  url: '/provision/delete'
}
let defaultSettings = {}

context(testType, () => {
  before(() => {
    // fill settings
    cy.fixture('defaults').then(defaults => {
      defaultSettings = defaults.provision
    })

    //go to index app
    cy.visit('/')
    cy.login()
  })

  after(() => {
    cy.logout()
  })

  it('Create', () => {
    cy.navigateMenu(`${testType}s`, () => {
      cy.get('[data-cy=create-provision]').click({ force: true }).then(() => {
        waitIntercept(createIntercept(interceptProviderList), () => {
          cy.get('[data-cy=select-provision-type]').select(defaultSettings.provision || '')
          cy.get('[data-cy=select-provider-type]').select(defaultSettings.provider || '')
          let brkProvisionTemplate = true
          let brkProvider = true

          // expect test
          const validateTest = request => {
            expect(request).to.be.a('object')
            expect(request).to.nested.include({ 'response.body.id': 202 })
          }

          // fill form "Configure inputs" tab
          const fillFormConfigureInputs = () => {
            cy.get('[data-cy=stepper-next-button]').then($button => {
              cy.get('[data-cy=form-provision-number_hosts]').clear().type(defaultSettings.numberInstances || '')
              const intercept = createIntercept(interceptCreate)
              cy.wrap($button).click({ force: true })
              waitIntercept(intercept, validateTest)
            })
          }

          // fill form "Provider overview" tab
          const fillFormProvision = () => {
            cy.get('[data-cy=stepper-next-button]').then($button => {
              cy.get('[data-cy=form-provision-name]').clear().type(defaultSettings.nameProvision || '')
              cy.get('[data-cy=form-provision-description]').clear().type(defaultSettings.descriptionProvision || '')
              cy.wrap($button).click({ force: true })
              fillFormConfigureInputs()
            })
          }

          // find provider in "Provider" tab
          const selectProvider = $el => {
            brkProvider = false
            cy.wrap($el).find('>button').click({ force: true }).then(() => {
              cy.get('[data-cy=stepper-next-button]').then($button => {
                cy.wrap($button).click({ force: true })
                fillFormProvision()
              })
            })
          }

          // find provider in "Provider" tab
          const findProvider = () => {
            cy.get('[data-cy=stepper-next-button]').then($button => {
              cy.wrap($button).click({ force: true })
              cy.get('[data-cy=providers]').find('[data-cy=provider-card]').each($el => {
                if (defaultSettings && defaultSettings.nameProvision && $el.find('[data-cy=provider-card-title]').text().includes(defaultSettings.nameProvider)) {
                  selectProvider($el)
                }
                return brkProvider
              })
            })
          }

          // select provision template in "Provision template" tab
          const selectProvisionTemplate = $el => {
            brkProvisionTemplate = false
            cy.wrap($el).find('>button').click({ force: true }).then(findProvider)
          }

          // find provision template in "Provision template" tab
          cy.get('[data-cy=provisions-templates]').find('[data-cy=provision-template-card]').each($el => {
            if (defaultSettings && defaultSettings.nameProvision && $el.find('[data-cy=provision-template-card-title]').text() === defaultSettings.nameProvision) {
              selectProvisionTemplate($el)
            }
            return brkProvisionTemplate
          })
        })
      })
    })
  })

  it('Check information', () => {
    reloadProvisionComponent()
    cy.navigateMenu(`${testType}s`, () => {
      waitIntercept(createIntercept(interceptList), () => {
        let brk = true

        //select provider
        const selectProvider = $el => {
          brk = false
          cy.wrap($el).find('>button').click({ force: true }).then(() => {
            waitIntercept(createIntercept(interceptList), info => {
              cy.get('[data-cy=provision-name]').should('have.text', defaultSettings.nameProvision)
              cy.get('[data-cy=provision-description]').should('have.text', defaultSettings.descriptionProvision)
              cy.get('[data-cy=provider-provider-name]').should('have.text', defaultSettings.nameProvider)
              cy.get('[data-cy=provider-cluster]').should('contain', defaultSettings.nameProvision)
            })
          })
        }

        //find provider
        cy.get('[data-cy=provisions]').find('[data-cy=provision-card]').each($el => {
          if (defaultSettings && defaultSettings.nameProvider && $el.find('[data-cy=provision-card-title]').text() === defaultSettings.nameProvision) {
            selectProvider($el)
          }
          return brk
        })
      })
    })
  })

  it('Configure', () => {
    reloadProvisionComponent()
    cy.navigateMenu(`${testType}s`, () => {
      waitIntercept(createIntercept(interceptList), () => {
        let brk = true

        // expect test
        const validateTest = request => {
          expect(request).to.be.a('object')
          expect(request).to.nested.include({ 'response.body.id': 202})
        }

        // select provider
        const selectProvider = $el => {
          brk = false
          cy.wrap($el).find('[data-cy=provision-configure]').click({ force: true }).then(() => {
            waitIntercept(createIntercept(interceptConfigure), validateTest)
          })
        }

        // find provider
        cy.get('[data-cy=provisions]').find('[data-cy=provision-card]').each($el => {
          if (defaultSettings && defaultSettings.nameProvision && $el.find('[data-cy=provision-card-title]').text() === defaultSettings.nameProvision) {
            selectProvider($el)
          }
          return brk
        })
      })
    })
  })

  it('Delete', () => {
    reloadProvisionComponent()
    cy.navigateMenu(`${testType}s`, () => {
      waitIntercept(createIntercept(interceptList), () => {
        let brk = true

        // expect test
        const validateTest = request => {
          expect(request).to.be.a('object')
          expect(request).to.nested.include({ 'response.body.id': 202})
        }

        // select provider
        const selectProvider = $el => {
          brk = false
          cy.wrap($el).find('[data-cy=provision-delete]').click({ force: true }).then(() => {
            waitIntercept(createIntercept(interceptList), ()=>{
              const intercept = createIntercept(interceptDelete)
              cy.get('[data-cy=dg-accept-button]').click({force:true}).then(()=>{
                waitIntercept(intercept, validateTest)
              })
            })
          })
        }

        // find provider
        cy.get('[data-cy=provisions]').find('[data-cy=provision-card]').each($el => {
          if (defaultSettings && defaultSettings.nameProvision && $el.find('[data-cy=provision-card-title]').text() === defaultSettings.nameProvision) {
            selectProvider($el)
          }
          return brk
        })
      })
    })
  })

})
