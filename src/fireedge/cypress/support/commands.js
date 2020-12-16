Cypress.Commands.add('login', () => {
  cy.fixture('defaults').then(defaults => {
    cy.get('[data-cy=login-username]').type(defaults.auth.username);
    cy.get('[data-cy=login-password]').type(defaults.auth.password);
  });

  cy.get('[data-cy=login-button]').click();
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=header-user-button]').click();
  cy.get('[data-cy=header-logout-button]').click();
  // cy.fixture('defaults').then(defaults => {
  //   cy.window()
  //     .its('sessionStorage')
  //     .invoke('removeItem', defaults.auth.jwtName);
  // });
});

//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
