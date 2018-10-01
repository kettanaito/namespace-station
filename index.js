const R = require('ramda')
const natural = require('natural')
const prompt = require('prompt')
const chalk = require('chalk')

const tokenizer = new natural.WordTokenizer()
const nounInflector = new natural.NounInflector()
const verbInflector = new natural.PresentVerbInflector()
const actionClassifier = new natural.BayesClassifier()

const baseFolder = './node_modules/natural/lib/natural/brill_pos_tagger'
const rulesFilename = baseFolder + '/data/English/tr_from_posjs.txt'
const lexiconFilename = baseFolder + '/data/English/lexicon_from_posjs.json'
const defaultCategory = 'N'

const lexicon = new natural.Lexicon(lexiconFilename, defaultCategory)
const rules = new natural.RuleSet(rulesFilename)
const tagger = new natural.BrillPOSTagger(lexicon, rules)

const singularizeToken = ({ token }) => {
  return nounInflector.singularize(token)
}

const singularizeVerbToken = ({ token }) => {
  return verbInflector.pluralize(token)
}

const neutralizeTags = R.compose(
  R.map(
    R.cond([
      [R.propEq('tag', 'NNS'), singularizeToken],
      [R.propEq('tag', 'VBZ'), singularizeVerbToken],
      [R.T, R.prop('token')]
    ]),
  ),
  R.reject(R.propEq('tag', 'DT')),
)

/* Array */
/* Array: Common */
actionClassifier.addDocument('join array', 'join')
actionClassifier.addDocument('merge entry together into one', 'merge')
actionClassifier.addDocument('combine entry array', 'merge')
actionClassifier.addDocument('combine merge array', 'merge')
actionClassifier.addDocument('add entry to array', 'push')
actionClassifier.addDocument('add anything to', 'push')
actionClassifier.addDocument('add insert to beginning of array', 'prepend')
actionClassifier.addDocument('add insert to end of array', 'append')
actionClassifier.addDocument('append to array', 'append')
actionClassifier.addDocument('add insert specific position index', 'append')
actionClassifier.addDocument('add list to array', 'concat')
actionClassifier.addDocument('find look up array', 'find')
actionClassifier.addDocument('iterate over array', 'forEach')
actionClassifier.addDocument('create return list from array', 'map')
actionClassifier.addDocument('map array into', 'map')
actionClassifier.addDocument('create map list from array', 'map')
actionClassifier.addDocument('remove anything from array', 'slice')
actionClassifier.addDocument('check know find if includes array', 'includes')
actionClassifier.addDocument('check find tell position index entry element in array', 'indexOf')

/* Array: Ramda */
actionClassifier.addDocument('get take return first from array list collection', 'head')
actionClassifier.addDocument('get take return last from array list collection', 'tail')
actionClassifier.addDocument('know tell find common same entry in two multiple array', 'intersection')
actionClassifier.addDocument('apply list of functions to list of values', 'juxt')

/* Functions */
actionClassifier.addDocument('combine function', 'compose')
actionClassifier.addDocument('chain function', 'compose')
actionClassifier.addDocument('return another function', 'curry')
actionClassifier.addDocument('add between each list', 'intersperse')

actionClassifier.train()

const getAction = (string) => {
  const tokens = tokenizer.tokenize(string)
  const tags = tagger.tag(tokens)
  const neutralWords = neutralizeTags(tags.taggedWords)
  const neutralSentence = neutralWords.join(' ')

  console.log(actionClassifier.getClassifications(neutralSentence))
  
  return actionClassifier.classify(neutralSentence)
}

prompt.start()
prompt.get([{
  name: 'sentence',
  description: 'i want my function to',
  type: 'string',
}], (_, result) => {
  if (!result) {
    return
  }

  const actionName = getAction(result.sentence)

  console.log('i think you need:', chalk.magenta(actionName))
  console.log(' ')
})
