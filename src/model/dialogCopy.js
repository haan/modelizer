export const DIALOG_COPY = {
  discardChanges: {
    title: 'Discard changes?',
    description: 'Your unsaved changes will be lost.',
  },
  delete: {
    class: {
      title: 'Delete class?',
      description:
        'This removes the class and any connected associations. This action cannot be undone.',
    },
    association: {
      title: 'Delete association?',
      description: 'This removes the association. This action cannot be undone.',
    },
    relationship: {
      title: 'Delete relationship?',
      description:
        'This removes the relationship. This action cannot be undone.',
    },
    attribute: {
      title: 'Delete attribute?',
      description:
        'This removes the attribute from the class. This action cannot be undone.',
    },
    note: {
      title: 'Delete note?',
      description: 'This removes the note. This action cannot be undone.',
    },
    area: {
      title: 'Delete area?',
      description: 'This removes the area. This action cannot be undone.',
    },
    selection: {
      title: 'Delete selected items?',
      description:
        'This removes the selected items. This action cannot be undone.',
    },
    fallback: {
      title: 'Delete item?',
      description: 'This action cannot be undone.',
    },
  },
  duplicate: {
    relationship: {
      title: 'Duplicate relationship',
      description:
        'A relationship between these attributes already exists. Remove the existing relationship before creating another.',
    },
    associative: {
      title: 'Duplicate associative association',
      description:
        'An associative association between this class and the association already exists. Remove the existing associative association before creating another.',
    },
    reflexive: {
      title: 'Duplicate reflexive association',
      description:
        'Two reflexive associations on the same class are not supported. Remove the existing reflexive association before creating another.',
    },
    association: {
      title: 'Duplicate association',
      description:
        'An association between these class handles already exists. Remove the existing association before creating another.',
    },
    fallback: {
      title: 'Duplicate connection',
      description:
        'A connection already exists. Remove the existing connection before creating another.',
    },
  },
  importWarnings: {
    title: 'Unrecognized attribute types',
    description: (count) =>
      `${count} attribute ${count === 1 ? 'type was' : 'types were'} set to Undefined because the Java Modelizer data type could not be matched.`,
  },
}
