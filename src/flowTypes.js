import {
  AssociationEdge,
  AssociationFloatingEdge,
  AssociationReflexiveEdge,
  UmlClassNode,
} from './components/flow/index.js'

export const nodeTypes = {
  umlClass: UmlClassNode,
}

export const edgeTypes = {
  association: AssociationEdge,
  associationFloating: AssociationFloatingEdge,
  associationReflexive: AssociationReflexiveEdge,
}
