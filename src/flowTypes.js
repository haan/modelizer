import { AssociationEdge } from './components/AssociationEdge.jsx'
import { AssociationFloatingEdge } from './components/AssociationFloatingEdge.jsx'
import { AssociationReflexiveEdge } from './components/AssociationReflexiveEdge.jsx'
import { UmlClassNode } from './components/UmlClassNode.jsx'

export const nodeTypes = {
  umlClass: UmlClassNode,
}

export const edgeTypes = {
  association: AssociationEdge,
  associationFloating: AssociationFloatingEdge,
  associationReflexive: AssociationReflexiveEdge,
}
