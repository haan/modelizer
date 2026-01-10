import {
  Association,
  AssociativeAssociation,
  AssociationHelperNode,
  ReflexiveAssociation,
  Class,
} from './components/flow/index.js'

export const nodeTypes = {
  class: Class,
  umlClass: Class,
  associationHelper: AssociationHelperNode,
  associationFloatingEdgeNode: AssociationHelperNode,
}

export const edgeTypes = {
  association: Association,
  associativeAssociation: AssociativeAssociation,
  reflexiveAssociation: ReflexiveAssociation,
}
