import {sparqlQuery} from '../sqarql-query.js';

const mapping = {
  translations: {
    from: ['P5137', 'P9970'],
    to: 'P5972',
    lang: 'exclude',
  },
  synonyms: {
    from: ['P5137', 'P9970'],
    to: 'P5973',
    lang: 'require',
  },
};

async function getDeducedSenseClaims(props, id, lang, sense) {
  for (let prop in props) {
    for (let m in mapping) {
      if (mapping[m].from.includes(prop)) {
        const fromValues = props?.[prop]?.claims?.[id]?.claim;
        if (fromValues) {
          for (const value of fromValues) {
            const qid = value.mainsnak?.datavalue?.value?.id;
            if (qid) {
              let query = `
                SELECT DISTINCT ?id WHERE {
                  ?lexeme rdf:type ontolex:LexicalEntry;
                    ontolex:sense ?sense;
                    dct:language ?language;
                    wikibase:lemma ?lemma.
                  ?sense wdt:${prop} wd:${qid}.
                  FILTER (?language ${mapping[m].lang === 'exclude' ? 'NOT ' : ''}IN (wd:${lang} ) )
                  FILTER (?sense NOT IN (wd:${id} ) )
                  BIND(REPLACE(STR(?sense), 'http://www.wikidata.org/entity/', '')  AS ?id ).
                }
                ORDER BY (LCASE(?language))
              `;
              let results = await sparqlQuery(query);
              if (results.length > 0) {
                if (!props.hasOwnProperty(mapping[m].to)) {
                  props[mapping[m].to] = {
                    claims: {},
                    datatype: 'wikibase-sense',
                    sense: sense,
                  }
                }
                if (!props[mapping[m].to].claims.hasOwnProperty(id)) {
                  props[mapping[m].to].claims[id] = {
                    claim: [],
                    sense: sense,
                  };
                }
                for (const result of results) {
                  props[mapping[m].to].claims[id].claim.push({
                    mainsnak: {
                      datavalue: {
                        value: {
                          id: result.id.value,
                        }
                      }
                    }
                  })
                }
              }
            }
          }
        }
      }
    }
  }
  return props;
}

export { getDeducedSenseClaims }