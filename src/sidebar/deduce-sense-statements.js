import { sparqlQuery } from '../sqarql-query.js';
import { userLanguagesWithFallbacks } from '../wd-get-entity.js'

const userLanguages = userLanguagesWithFallbacks()

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

  let myGenders = []
  if (sense?.sense?.claims?.P10339) {
    for (const gender of sense.sense.claims.P10339) {
      if (gender?.mainsnak?.datavalue?.value?.id) {
        myGenders.push(gender.mainsnak.datavalue.value.id)
      }
    }
  }

  for (let prop in props) {
    for (let m in mapping) {
      if (mapping[m].from.includes(prop)) {
        const fromValues = props?.[prop]?.claims?.[id]?.claim;
        if (fromValues) {
          for (const value of fromValues) {
            const qid = value.mainsnak?.datavalue?.value?.id;
            if (qid) {
              let query = `
                SELECT DISTINCT ?id ?g WHERE {
                  ?lexeme rdf:type ontolex:LexicalEntry;
                    ontolex:sense ?sense;
                    dct:language ?language;
                    wikibase:lemma ?lemma.
                  ?sense wdt:${prop} wd:${qid}.
                  ?language wdt:P218 ?lcode.
                  FILTER (CONTAINS("${userLanguages.join('|')}", ?lcode))

                  OPTIONAL {
                    ?sense wdt:P10339 ?gender.
                    BIND(REPLACE(STR(?gender), "http://www.wikidata.org/entity/", "") as ?g)
                  }
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
                  let qualifiers = {};
                  if (result?.g && (myGenders.length == 0 || !myGenders.includes(result.g.value))) {
                    qualifiers.P10339 = []
                    qualifiers.P10339.push({
                      datavalue: {
                        value: {
                          id: result.g.value
                        },
                      },
                    })
                  }
                  props[mapping[m].to].claims[id].claim.push({
                    mainsnak: {
                      datavalue: {
                        value: {
                          id: result.id.value,
                        }
                      }
                    },
                    qualifiers: qualifiers,
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