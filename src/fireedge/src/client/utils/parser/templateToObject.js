const SINGLE_VARIABLE_REG = /^\s*(?<key>[\w\d_-]+)\s*=\s*(?<value>[^[\],]+?)(?:#.*)?$/gm;
const ARRAY_VARIABLE_REG = /\s*(?<masterKey>[\w\d_-]+)\s*=\s*\[(?<pieces>.*?)\]/gm;

const sanitizeKey = key => key?.trim().toLowerCase();

const sanitizeValue = value => value?.trim().replaceAll(/[\\"]/g, '');

const parseTemplateToObject = template => {
  const stringWithoutNewLines = JSON.stringify(template).replaceAll(/\\n/g, '');

  return {
    ...Array.from(template.matchAll(SINGLE_VARIABLE_REG)).reduce(
      (result, match) => {
        const key = sanitizeKey(match.groups.key);
        const value = sanitizeValue(match.groups.value);

        return { ...result, [key]: value };
      },
      {}
    ),
    ...Array.from(stringWithoutNewLines.matchAll(ARRAY_VARIABLE_REG)).reduce(
      (result, match) => {
        const masterKey = sanitizeKey(match.groups.masterKey);
        const pieces = match.groups.pieces.split(',');

        const vars = pieces.reduce((vrs, piece) => {
          const [key, value] = piece.split('=');
          return { ...vrs, [sanitizeKey(key)]: sanitizeValue(value) };
        }, {});

        return {
          ...result,
          [masterKey]: [...(result[masterKey] ?? []), vars]
        };
      },
      {}
    )
  };
};

export default parseTemplateToObject;
