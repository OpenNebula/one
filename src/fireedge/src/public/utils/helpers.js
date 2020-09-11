export const fakeDelay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const getValidationFromFields = schema =>
  schema.reduce(
    (validation, field) => ({
      ...validation,
      [field?.name]: field?.validation
    }),
    {}
  );
