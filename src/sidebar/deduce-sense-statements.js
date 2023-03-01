import { sparqlQuery } from '../sqarql-query.js';
import { userLanguagesWithFallbacks } from '../wd-get-entity.js'


const mapping = {
  translations: {
    from: {
      sense: [
        'P8471',
      ],
      item: [
        'P5137',
        'P9970',
        'P6271'
      ],
    },
    to: 'P5972',
    lang: 'exclude',
  },
  synonyms: {
    from: {
      sense: [
        'P8471',
      ],
      item: [
        'P5137',
        'P9970',
        'P6271'
      ],
    },
    to: 'P5973',
    lang: 'require',
  },
};

async function getDeducedSenseClaims(props, id, lang, sense) {
  
  const userLanguages = await userLanguagesWithFallbacks()

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
      for (let scope in mapping[m].from) {
        if (mapping[m].from[scope].includes(prop)) {
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
                    ${ scope == 'item' ? `?sense wdt:${prop} wd:${qid}.` : '' }
                    ${ scope == 'sense' ? 
                      `wd:${qid} wdt:P5137 ?item.
                       { ${ mapping[m].from.item.map(p => `?othersense wdt:${p} ?item. ?sense wdt:${prop} ?othersense.`).join('} UNION {') } }
                      ` : ''
                    }
                    {
                      ?language wdt:P218 ?code.
                    } UNION {
                      ?language wdt:P424 ?code.
                    }
                    FILTER (?code IN ("${userLanguages.join('", "')}"))

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
                let results = await sparqlQuery(query, null, true);
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
  }
  return props;
}

async function getReverseLinks(object) {
  const query = `
  SELECT ?id ?p ?l WHERE {
    ${ ['P5238', 'P5191', 'P7706'].map((p) => `{
      BIND (wdt:${p} as ?prop).
      ?lexeme ?prop wd:${object}.
      ?lexeme dct:language ?language;
    }
    `).join(' UNION ') }
    BIND(REPLACE(STR(?lexeme), 'http://www.wikidata.org/entity/', '')  AS ?id ).
    BIND(REPLACE(STR(?prop), 'http://www.wikidata.org/prop/direct/', '')  AS ?p ).
    BIND(REPLACE(STR(?language), 'http://www.wikidata.org/entity/', '')  AS ?l ).
  }
  `
  let results = await sparqlQuery(query, null, true)
  const output = {}

  if (results.length > 0) {
    for (const result of results) {
      const language = result.l.value
      const lexeme = result.id.value
      const property = result.p.value
      if (!(property in output)) {
        output[property] = {}
      }
      if (!(language in output[property])) {
        output[property][language] = {}
      }
      if (!(object in output[property][language])) {
        output[property][language][object] = {
          senses: [],
        }
      }
      output[property][language][object].senses.push({
        id: lexeme
      })
    }
  }
  return output
}

export { getDeducedSenseClaims, getReverseLinks }