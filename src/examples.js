import blogRaw from '../examples/blog.mdlz?raw'
import storeRaw from '../examples/store.mdlz?raw'
import schoolRaw from '../examples/school.mdlz?raw'
import hrRaw from '../examples/hr.mdlz?raw'
import libraryRaw from '../examples/library.mdlz?raw'

const parseExample = (raw) => JSON.parse(raw)

export const MODEL_EXAMPLES = [
  { id: 'blog', label: 'Blog', model: parseExample(blogRaw) },
  { id: 'store', label: 'Store', model: parseExample(storeRaw) },
  { id: 'school', label: 'School', model: parseExample(schoolRaw) },
  { id: 'hr', label: 'HR', model: parseExample(hrRaw) },
  { id: 'library', label: 'Library', model: parseExample(libraryRaw) },
]
