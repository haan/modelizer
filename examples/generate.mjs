// Reproducible conceptual smoke fixtures. Run: node examples/generate.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizeAttributes } from '../src/attributes.js'
import { normalizeEdges } from '../src/model/edgeUtils.js'
import { normalizeAnnotations } from '../src/hooks/useAnnotations.js'
import { parseModelFile } from '../src/model/modelOpening.js'

const directory = fileURLToPath(new URL('.', import.meta.url))
mkdirSync(directory, { recursive: true })
const visibility = { conceptual: true, logical: false, physical: false }
const colors = ['#009688', '#2196f3', '#ffc107', '#9c27b0', '#ff5722', '#607d8b']
const views = value => Object.fromEntries(['conceptual', 'logical', 'physical'].map(view => [view, { ...value }]))
const attributeNames = ['identifier', 'displayName', 'status', 'createdAt', 'updatedAt', 'effectiveFrom', 'effectiveUntil', 'referenceCode', 'description', 'revision', 'sourceSystem', 'retentionPolicy', 'classification', 'verifiedAt', 'externalReference', 'jurisdiction', 'lastReviewedBy', 'reviewDueAt']
const manifests = []

function model(name) {
  const result = { version: 2, modelName: name, nodes: [], edges: [], annotations: { conceptual: { items: [] }, logical: { items: [] }, physical: { items: [] } } }
  let counter = 0
  const next = prefix => `${prefix}-${String(++counter).padStart(4, '0')}`
  function base(id, type, x, y, data) {
    const position = { x, y }
    const node = { id, type, position, selected: false, data: { ...data, visibility: { ...visibility }, viewPositions: views(position) } }
    result.nodes.push(node)
    return id
  }
  const api = {
    result,
    cls(id, label, x, y, attrs = [], color = colors[0]) {
      const names = typeof attrs === 'number' ? attributeNames.slice(0, attrs) : attrs
      return base(id, 'class', x, y, { label, logicalName: '', color,
        attributes: normalizeAttributes(id, names).map(a => ({ ...a, visibility: { ...visibility } })) })
    },
    area(label, x, y, width, height, color = colors[0]) {
      const id = base(next('area'), 'area', x, y, { label, color, viewSizes: views({ width, height }) })
      Object.assign(result.nodes.at(-1), { width, height, style: { width, height }, zIndex: -1 })
      return id
    },
    note(label, text, x, y) { return base(next('note'), 'note', x, y, { label, text }) },
    edge(source, target, name, options = {}) {
      const { id = next('edge'), type = 'association', ...data } = options
      if (source === target && type !== 'reflexiveAssociation') throw new Error(`Use a reflexive edge for ${source}`)
      const entry = { id, source, target, sourceHandle: 'right-source', targetHandle: 'left-target',
        type, selected: false, interactionWidth: 20,
        data: { name, type: type === 'composition' ? 'composition' : 'association',
          roleA: 'owner', roleB: 'member', multiplicityA: '1..1', multiplicityB: '0..*',
          lineStyle: 'orthogonal', controlPoints: [], ...data } }
      result.edges.push(entry)
      return id
    },
    loop(source, name, index, long = false) {
      return api.edge(source, source, name, { type: 'reflexiveAssociation',
        reflexiveSide: ['left', 'right', 'lower-right', 'lower-left'][index % 4],
        reflexiveIndex: index, loopWidth: (long ? 190 : 85) + Math.floor(index / 4) * 150,
        loopHeight: (long ? 210 : 125) + Math.floor(index / 4) * 140,
        roleA: long ? 'previouslyAuthorisedResponsibleParty' : 'parent',
        roleB: long ? 'subsequentlyDelegatedResponsibleParty' : 'child', multiplicityA: '0..1' })
    },
    associative(id, baseId, x, y, attrs = ['effectiveFrom', 'effectiveUntil']) {
      const association = result.edges.find(e => e.id === baseId)
      api.cls(id, association.data.name, x, y, attrs, colors[3])
      result.edges.push({ id: next('associative'), source: id, target: `assoc-edge-${baseId}`,
        sourceHandle: 'top-source', targetHandle: 'association-target', type: 'associativeAssociation',
        selected: false, interactionWidth: 20, data: { name: association.data.name, type: 'associative', autoName: true } })
    },
    text(text, x, y, options = {}) {
      result.annotations.conceptual.items.push({ id: next('text'), kind: 'text', x, y, text, fontSize: 18, color: '#334155', ...options })
    },
    shape(shape, x1, y1, x2, y2, options = {}) {
      result.annotations.conceptual.items.push({ id: next(shape), kind: 'shape', shape, x1, y1, x2, y2, thickness: 2, color: '#dc2626', ...options })
    },
    stroke(points, options = {}) {
      result.annotations.conceptual.items.push({ id: next('stroke'), kind: 'stroke', tool: 'pen', points: points.map(([x, y]) => ({ x, y })), thickness: 3, color: '#2563eb', opacity: 1, ...options })
    },
    save(file, purpose) {
      result.edges = normalizeEdges(result.edges)
      result.annotations = normalizeAnnotations(result.annotations)
      // A loadable model, not an arbitrary JSON drawing or a different schema.
      parseModelFile(JSON.stringify(result))
      const serialized = `${JSON.stringify(result, null, 2)}\n`
      writeFileSync(`${directory}${file}`, serialized)
      manifests.push({ file, name, purpose, classes: result.nodes.filter(n => n.type === 'class').length,
        associations: result.edges.filter(e => e.type === 'association').length,
        compositions: result.edges.filter(e => e.type === 'composition').length,
        reflexive: result.edges.filter(e => e.type === 'reflexiveAssociation').length,
        associative: result.edges.filter(e => e.type === 'associativeAssociation').length,
        edges: result.edges.length, notes: result.nodes.filter(n => n.type === 'note').length,
        areas: result.nodes.filter(n => n.type === 'area').length,
        annotations: result.annotations.conceptual.items.length })
      Object.assign(manifests.at(-1), {
        largestParallelGroup: Math.max(0, ...result.edges.map(e => e.data?.parallelCount ?? 0)),
        mostReflexiveOnOneClass: Math.max(0, ...result.edges.map(e => e.data?.reflexiveCount ?? 0)),
      })
    },
  }
  return api
}

// 01: a small baseline that fits on a normal canvas at a useful zoom.
{
  const m = model('01 - Library basics')
  m.cls('reader', 'Reader', 0, 0, ['name', 'email'], colors[2])
  m.cls('loan', 'Loan', 500, 0, ['borrowedAt', 'dueAt'], colors[0])
  m.cls('copy', 'BookCopy', 500, 300, ['barcode', 'condition'], colors[1])
  m.cls('book', 'Book', 0, 300, ['title', 'isbn'], colors[3])
  m.edge('reader', 'loan', 'borrows', { roleA: 'borrower', roleB: 'loans' })
  m.edge('loan', 'copy', 'records', { roleA: 'loans', roleB: 'copy', multiplicityA: '0..*', multiplicityB: '1..1' })
  m.edge('book', 'copy', 'hasCopies', { roleA: 'edition', roleB: 'copies' })
  m.save('01-library-basics.mdlz', 'Baseline names, attributes, multiplicities and orthogonal routes.')
}

// 02: three left neighbours, two right, two above, two below and a parallel pair.
{
  const m = model('02 - Dispatch hub and border spacing')
  m.area('Dispatch', 430, 430, 330, 420, colors[0])
  m.cls('hub', 'DispatchCentre', 500, 500, 10, colors[0])
  const neighbours = [
    ['sender', 'Sender', -250, 230], ['warehouse', 'Warehouse', -250, 550], ['carrier', 'Carrier', -250, 870],
    ['route', 'Route', 1250, 370], ['delivery', 'Delivery', 1250, 750],
    ['contract', 'Contract', 240, -180], ['policy', 'Policy', 800, -180],
    ['audit', 'AuditEvent', 240, 1250], ['exception', 'Exception', 800, 1250],
  ]
  neighbours.forEach(([id, label, x, y], i) => {
    m.cls(id, label, x, y, i % 3, colors[(i + 1) % colors.length])
    m.edge(id, 'hub', ['requests', 'stocks', 'serves', 'plans', 'dispatches', 'governs', 'restricts', 'records', 'escalates'][i],
      { roleA: id, roleB: 'centre', multiplicityA: '0..*', multiplicityB: '1..1' })
  })
  m.edge('warehouse', 'hub', 'returnsTo', { roleA: 'returns', roleB: 'receivingCentre' })
  m.note('Distance regression', 'Move DispatchCentre farther right, then back. Left-border order and separation should stay stable. Repeat with Contract and Policy above the hub.', -280, -100)
  m.note('Small versus tall', 'Sender has no attributes. Add attributes to it, then undo. Endpoints must remain on borders without resizing other classes.', 1180, 1100)
  m.text('02 / all four borders', 460, -370, { fontSize: 26 })
  m.shape('arrow', 30, 1100, 430, 770)
  m.save('02-dispatch-border-spacing.mdlz', 'Stable all-side allocation, empty/tall classes, parallel plus other neighbours, negative coordinates.')
}

// 03: a meaningful domain with parallel links, four loops and association classes.
{
  const m = model('03 - University enrolment')
  const zones = [
    ['People', -650, -400, colors[2], ['Person', 'Student', 'Lecturer', 'Department', 'Address', 'EmergencyContact']],
    ['Teaching', 1150, -400, colors[1], ['Course', 'Module', 'Session', 'Room', 'Campus', 'Semester']],
    ['Assessment', -650, 1200, colors[3], ['Assessment', 'Submission', 'Grade', 'Qualification', 'Attendance']],
  ]
  zones.forEach(([label, x, y, color, names]) => {
    m.area(label, x - 60, y - 70, 1530, 1370, color)
    names.forEach((name, i) => m.cls(name, name, x + (i % 3) * 480, y + Math.floor(i / 3) * 650, i === 0 ? 7 : 2 + i % 3, color))
  })
  const links = [['Person','Student','studiesAs'],['Person','Lecturer','teachesAs'],['Person','Address','livesAt'],
    ['Person','EmergencyContact','nominates'],['Lecturer','Department','worksIn'],['Student','Course','enrolsIn'],
    ['Student','Course','waitsFor'],['Lecturer','Course','teaches'],['Course','Module','contains'],
    ['Module','Session','schedules'],['Session','Room','occupies'],['Room','Campus','locatedOn'],
    ['Session','Semester','occursDuring'],['Student','Submission','submits'],['Submission','Assessment','answers'],
    ['Assessment','Grade','awards'],['Grade','Qualification','contributesTo'],['Student','Attendance','attends'],
    ['Attendance','Session','recordsPresenceAt'],['Lecturer','Assessment','marks'],['Course','Assessment','requires']]
  let enrolment
  links.forEach(([a,b,name]) => {
    const id = m.edge(a,b,name, { roleA: a.toLowerCase(), roleB: b.toLowerCase(), ...(name === 'contains' ? { type: 'composition' } : {}) })
    if (name === 'enrolsIn') enrolment = id
  })
  m.associative('Enrolment', enrolment, 1100, 1400, ['registeredAt', 'attempt', 'status'])
  ;['mentors','delegatesTo','replaces','isRelatedTo'].forEach((name, i) => m.loop('Person', name, i))
  m.note('Four reflexive corners', 'Person has four reflexive associations. Inspect both roles, both multiplicities and each name; resize one loop, then undo.', -1000, -650)
  m.note('Association class', 'The Enrolment class attaches to enrolsIn. Move Student or Course and verify that the dashed link follows the base association.', 1470, 1400)
  m.note('Composition', 'Enable composite aggregations in View settings. The Course–Module diamond must remain attached and match its line colour.', 2700, 800)
  m.text('Teaching and assessment / UML review', 800, -650, { fontSize: 28 })
  m.shape('rectangle', 1050, 1300, 1350, 1660, { color: '#7c3aed' })
  m.shape('ellipse', -870, -600, -180, 50)
  m.shape('arrow', 1470, 1460, 1320, 1450)
  m.shape('line', 950, 1000, 2700, 1000, { color: '#94a3b8' })
  m.stroke([[1120,-480],[1300,-470],[1500,-475],[1700,-460]], { tool: 'marker', color: '#facc15', thickness: 18, opacity: 0.35 })
  m.stroke([[-1000,50],[-900,120],[-800,80],[-700,140]])
  m.text('Évaluation / Prüfung / 評価', 1000, 2300, { width: 300, padding: 12, border: true, background: '#fef3c7' })
  m.save('03-university-enrolment.mdlz', 'Parallel associations, four reflexive corners, association class, composition and every annotation shape.')
}

const domains = [
  ['Identity', ['Person','Organisation','Account','Membership','Role','Permission','Credential','Consent','Address','ContactPoint','Device','Session']],
  ['Commerce', ['Customer','Order','OrderLine','Product','Catalogue','Price','Promotion','Basket','Reservation','Subscription','Channel','Offer']],
  ['Fulfilment', ['Warehouse','Inventory','StockMovement','Shipment','Parcel','Carrier','Delivery','Route','Location','Return','Inspection','HandlingUnit']],
  ['Finance', ['Invoice','InvoiceLine','Payment','Refund','Ledger','LedgerEntry','TaxRule','Currency','Settlement','Payout','Dispute','ExchangeRate']],
  ['Trust', ['Policy','PolicyVersion','RiskAssessment','Approval','Case','Evidence','AuditEvent','RetentionRule','Jurisdiction','LegalBasis','Control','Exception']],
  ['Analytics', ['Event','Metric','Observation','Dataset','Report','Dashboard','Pipeline','Transformation','Experiment','Cohort','Attribution','QualityRule']],
]

// 04: medium production-style graph with a mix of deliberate routing choices.
{
  const m = model('04 - Commerce operations')
  const names = [...domains[1][1], ...domains[2][1], ...domains[3][1].slice(0, 5)]
  names.forEach((name, i) => m.cls(name, name, (i % 6) * 460 - 700, Math.floor(i / 6) * 440 - 450, i % 9, colors[Math.floor(i / 10)]))
  for(let i=0; i<names.length; i++) {
    m.edge(names[i], names[(i+1)%names.length], ['contains','requires','records','supplies'][i%4], { roleA: 'sourceRecord', roleB: 'relatedRecords', ...(i%7===0 ? { type:'composition' } : {}) })
    if(i%2===0) m.edge(names[i], names[(i+7)%names.length], 'references', { lineStyle: i%6===0 ? 'straight' : 'orthogonal' })
  }
  for(let i=0; i<4; i++) m.edge('Customer','Order',['places','approves','cancels','receives'][i], { roleA: ['buyer','approver','requester','recipient'][i], roleB:'orders' })
  for(let i=0; i<4; i++) m.loop('Order',['replaces','splitsInto','mergesWith','dependsOn'][i],i)
  for(let i=0; i<4; i++) m.loop('Warehouse',['supplies','backsUp','replenishes','isManagedBy'][i],i)
  const base=m.edge('Order','Shipment','fulfilledBy')
  m.associative('Fulfilment',base,2200,1200,['allocatedAt','quantity'])
  const price=m.edge('Product','Price','pricedAt')
  m.associative('PriceValidity',price,2200,1570,['fromDate','toDate'])
  const refund=m.edge('Payment','Refund','reversedBy')
  m.associative('RefundDecision',refund,2200,1950,['reason','authorisedAt'])
  m.edge('Return','Invoice','adjusts', { lineStyle:'manual',controlPoints:[{x:2100,y:1100},{x:2100,y:2050},{x:800,y:2050}] })
  m.edge('Inventory','Ledger','valuedBy', { lineStyle:'manual',controlPoints:[{x:-950,y:800},{x:-950,y:2200},{x:1500,y:2200}] })
  for(let i=0; i<3; i++) {
    m.area(['Sales','Fulfilment','Finance'][i],-780+i*920,-540,890,2250,colors[i])
    m.note(`Review ${i+1}`,['Compare two, three and four parallel connections. Keep every role and multiplicity visible.','Inspect dense crossings and dashed association-class attachments after dragging.','Try hiding notes and areas, then export with both included.'][i],-1050+i*1400,2300)
    m.text(['A / Sales','B / Operations','C / Accounting'][i],-650+i*900,-650,{fontSize:26})
    m.shape('arrow',-600+i*900,2220,-500+i*900,1860)
    m.stroke([[-600+i*900,-590],[-300+i*900,-580],[100+i*900,-590]],{tool:'marker',color:'#facc15',thickness:15,opacity:0.3})
  }
  m.area('Cross-domain audit boundary',-850,800,3100,360,'#94a3b8')
  m.shape('ellipse',-900,-700,-200,-180)
  m.text('Manual routes are intentional. Preserve their control points.',1900,-350,{width:340,padding:12,border:true,background:'#e0f2fe'})
  m.save('04-commerce-operations.mdlz', 'Dense mixed routing, five parallel lanes including composition, eight loops, three association classes and overlapping areas.')
}

// 05 deliberately exceeds comfortable editor limits. Preserve its data/complexity
// as an aspirational target; do not simplify it to make a screenshot pass.
{
  const m=model('05 - Global platform readability frontier')
  const origins=[]
  const named=[]
  domains.forEach(([label,names],d) => {
    const x=-2400+(d%3)*2280, y=-1800+Math.floor(d/3)*2580
    origins.push({x,y})
    m.area(`${d+1} / ${label}`,x,y,2080,1870,colors[d])
    names.forEach((name,i) => {
      named.push(name)
      m.cls(name, i===11 ? `${name}WithJurisdictionAndEffectivePeriod` : name,
        x+80+(i%4)*480,y+150+Math.floor(i/4)*520,
        [18,1,0,7,3,12,2,9,4,16,5,1][i],colors[d])
    })
    for(let i=0;i<12;i++) {
      m.edge(names[i],names[(i+1)%12],['owns','governs','records','requires','supersedes','validates'][i%6],
        {roleA:'responsibleParty',roleB:'applicableRecords'})
      m.edge(names[i],names[(i+4)%12],i%3===0?'isApplicableWithinEffectivePeriod':'references',
        {roleA:i%3===0?'authorisedPartyAtTimeOfDecision':'origin',roleB:i%3===0?'recordsApplicableInThisJurisdiction':'references',
          multiplicityA:i%2?'0..1':'1..*',multiplicityB:i%3?'0..*':'1..1',
          ...(i===4?{lineStyle:'straight'}:{})})
      if(i>0 && i%2===0) m.edge(names[i],names[0],'reportsTo',{roleA:'reportingRecord',roleB:'domainOwner'})
    }
    m.note(`${label}: local smoke check`,'Inspect all endpoint text at 100% zoom. Move the first class outward by 800px and back. Automatic slots should keep their order and spacing on each unchanged border.',x+70,y+1920)
    m.note(`${label}: long note`,'This domain intentionally mixes minimum-height and attribute-heavy classes.\n\nA good result keeps full names, multiplicities and both endpoint roles legible. Crossings should be traceable; route editing and undo must preserve every connection.\n\nUnicode: café, Straße, Ångström, 日本語.',x+460,y+1920)
    m.text(`${d+1} / ${label.toUpperCase()} — readability target`,x+70,y-85,{fontSize:30})
    m.shape('rectangle',x+30,y+90,x+450,y+620,{color:colors[d],thickness:1})
    m.shape('arrow',x+1260,y+1900,x+1250,y+1620,{color:colors[d]})
    m.stroke([[x+60,y-35],[x+420,y-20],[x+800,y-30],[x+1240,y-15]],{tool:'marker',color:colors[d],opacity:0.18,thickness:28})
    m.text('Zoom in to assess labels; fit view is for navigation.',x+1000,y+1970,{width:420,padding:10,background:'#f8fafc',border:true})
  })
  // Cross-domain fan-in/out, long diagonals, and routes through domain corridors.
  for(let d=0;d<6;d++) for(let i=0;i<8;i++) {
    const a=domains[d][1][i], b=domains[(d+1)%6][1][(i*5+3)%12]
    m.edge(a,b,i%2?'isReconciledAgainst':'isAuthorisedByPolicyVersion',{
      roleA:'requestingDomainRecord',roleB:'crossDomainReference',multiplicityA:'0..*',multiplicityB:'0..*',
      ...(i===7?{lineStyle:'manual',controlPoints:[{x:origins[d].x+2140,y:origins[d].y+500},{x:origins[d].x+2140,y:origins[(d+1)%6].y+2020},{x:origins[(d+1)%6].x+900,y:origins[(d+1)%6].y+2020}]}:{})})
  }
  for(let i=0;i<24;i++) m.edge(named[(i*7)%72] === 'Person' ? 'Organisation' : named[(i*7)%72],'Person',`isAccountableFor${i%3?'':'CrossBorderDataProcessing'}`,{
    roleA:i%4?'subject':'dataSubjectRepresentedByAuthorisedDelegate',roleB:'accountablePerson',
    ...(i%8===0?{lineStyle:'straight'}:{})})
  // Ten additional parallel connections between a tall and a small class; six vertically;
  // mixed styles coexist with a separate all-orthogonal group.
  for(let i=0;i<10;i++) m.edge('Person','Organisation',
    ['belongsTo','worksFor','represents','ownsSharesIn','audits','approves','delegatesAuthorityTo','receivesNotificationsFrom','isLegallyResponsibleFor','actsAsBeneficialOwnerOf'][i],
    {roleA:`personInCapacity${i+1}`,roleB:`organisationInCapacity${i+1}`,multiplicityA:i%2?'0..*':'1..1'})
  for(let i=0;i<6;i++) m.edge('Customer','Reservation',`reservationPolicy${i+1}`,{roleA:`customerRole${i+1}`,roleB:`reservationRole${i+1}`})
  for(let i=0;i<4;i++) m.edge('Invoice','Payment',`settlementStage${i+1}`,{lineStyle:i===2?'straight':'orthogonal',roleA:'invoice',roleB:'payments'})
  const loopBases=[]
  for(const [id,count] of [['Person',8],['Order',4],['Policy',4],['Metric',4]]) {
    for(let i=0;i<count;i++) loopBases.push(m.loop(id,
      ['delegatesAuthorityWithinJurisdiction','isSupersededByApprovedRevision','isDerivedFromAuditedSource','isTemporarilySubstitutedBy'][i%4]+(i>=4?'DuringExceptionalCircumstances':''),i,true))
  }
  for(let d=0;d<6;d++) {
    m.edge(domains[d][1][0],domains[d][1][3],'ownsLifecycleOf',{type:'composition'})
    m.edge(domains[d][1][4],domains[d][1][5],'containsVersionOf',{type:'composition'})
  }
  const bases=[['Person','Role','exercisesRole'],['Customer','Order','placesOrder'],['Shipment','Carrier','transportedBy'],
    ['Invoice','TaxRule','assessedUnder'],['Case','Evidence','supportedBy'],['Dataset','Pipeline','producedBy']]
  bases.forEach(([a,b,name],i)=>{
    const id=m.edge(a,b,name,{roleA:'subject',roleB:'governingRecord'})
    m.associative(`AssociationRecord${i+1}`,id,origins[i].x+1260,origins[i].y+1690,
      ['effectiveFrom','effectiveUntil','decisionReason','evidenceReference'])
  })
  m.associative('DelegationEvidence',loopBases[0],origins[0].x-580,origins[0].y+600,['authorisedAt','expiresAt','jurisdiction'])
  m.associative('PolicyLineageEvidence',loopBases[12],origins[4].x-500,origins[4].y+600,['signedBy','signedAt'])
  m.area('Cross-border retention jurisdiction',-2600,-550,6800,520,'#94a3b8')
  m.area('Shared audit and reconciliation corridor',-2600,290,6800,350,'#a855f7')
  m.area('Overlapping consent / legal-basis review',-2500,-300,750,1050,'#eab308')
  m.note('READABILITY FRONTIER — keep this difficult',
    'This is an end-goal fixture, not a claim of current visual correctness. Preserve all connections and complete labels. At useful local zoom, every line should be traceable and every annotation readable.\n\nPerson intentionally has EIGHT reflexive associations: this exceeds the current four-loop creation limit. Nested loop sizes are explicit. The file remains valid v2.',-3100,-2100)
  m.note('Long-label acceptance target','Do not pass by truncating names, hiding roles, removing multiplicities, dropping edges, shrinking text or deleting notes. Compare light and dark canvas; PNG exports currently use a light canvas.',4200,-1750)
  m.note('Negative-coordinate export','Export the entire diagram including annotations, notes and areas. The notes and annotations outside the class envelope must remain present and unclipped.',-3100,3000)
  m.note('Manual and transient smoke tests','Edit one manual route; undo once. Draw and erase one stroke; undo once. Use the laser, save and reopen: laser trails must never be saved. The fixture deliberately contains no persistent laser stroke.',4200,3100)
  m.text('05 / GLOBAL PLATFORM — ASPIRATIONAL READABILITY TARGET',-2400,-2140,{fontSize:38})
  m.text('Long text: authorisation across multiple jurisdictions\nÉchéance / Gültigkeit / 有効期間\nKeep full text legible at a useful local zoom.',4200,-1100,{fontSize:20,width:430,padding:16,border:true,background:'#fef3c7'})
  m.shape('ellipse',-2850,-2050,-1900,-1100,{color:'#ef4444',thickness:3})
  m.shape('line',-2700,500,4240,500,{color:'#64748b',thickness:1})
  m.shape('arrow',4300,-600,3750,-280,{color:'#dc2626',thickness:4})
  m.stroke([[-2750,400],[-2000,280],[-800,430],[400,260],[1700,400],[2900,280],[4200,430]],{color:'#ef4444',thickness:3})
  m.stroke([[-2340,-1600],[-2200,-1590],[-2080,-1580]],{color:'#ffffff',thickness:4})
  m.stroke([[4200,2700],[4270,2630],[4320,2720],[4410,2610]],{color:'#2563eb',thickness:2,linear:true})
  m.save('05-global-platform-frontier.mdlz','Aspirational extreme: large graph, twelve parallel links in the busiest pair, eight loops on one class, long labels, all annotation types, overlapping domains and mixed routing.')
}

writeFileSync(`${directory}manifest.json`, `${JSON.stringify(manifests,null,2)}\n`)
process.stdout.write(`${manifests.map(m=>`${m.file}: ${m.classes} classes, ${m.edges} edges, ${m.notes} notes, ${m.areas} areas, ${m.annotations} annotations`).join('\n')}\n`)
