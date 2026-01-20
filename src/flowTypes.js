import {
  Association,
  AssociativeAssociation,
  AssociationHelperNode,
  ReflexiveAssociation,
  Relationship,
  Class,
  Composition,
  Note,
  Area,
} from './components/flow/index.js'

export const nodeTypes = {
  class: Class,
  umlClass: Class,
  associationHelper: AssociationHelperNode,
  associationFloatingEdgeNode: AssociationHelperNode,
  note: Note,
  area: Area,
}

export const edgeTypes = {
  association: Association,
  composition: Composition,
  associativeAssociation: AssociativeAssociation,
  reflexiveAssociation: ReflexiveAssociation,
  relationship: Relationship,
}
