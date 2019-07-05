
## Working with ElasticSearch (grimoirelab):  
  
**url to the tool:** https://wikimedia.biterg.io  

**Console(for testing):** https://wikimedia.biterg.io/app/kibana#/dev_tools/console?_g=()  
  
## section I: Gett count of user commits:  
  
**Common Request JSON format:**  
```json  
{
  "aggs":{
      "2":{
         "terms":{
            "field":"status",
            "order":{
               "_count":"desc"
            }
         }
      }
    
  },
  "query": {
   "query_string": {
            "query": "*Rammanojpotla"
    }
        
  }
}
 
```  
  
**Phabricator:**  
  url to be requested: **GET maniphest/_search?filter_path=took,hits.total,aggregations**  
  
  
**Response format:**  
```json  
{
  "took": 89,
  "hits": {
    "total": 17
  },
  "aggregations": {
    "2": {
      "doc_count_error_upper_bound": 0,
      "sum_other_doc_count": 0,
      "buckets": [
        {
          "key": "Resolved",
          "doc_count": 10
        },
        {
          "key": "Open",
          "doc_count": 4
        },
        {
          "key": "Declined",
          "doc_count": 1
        },
        {
          "key": "Duplicate",
          "doc_count": 1
        },
        {
          "key": "Stalled",
          "doc_count": 1
        }
      ]
    }
  }
}
```  
  
In the above **json format**,  ```total``` keyword indicates the total number of commits a user made. The ```aggregations``` object has the commits that belong to the different categories.  
  
**Gerrit:**  
  
url to be requested: **GET gerrit/_search?filter_path=took,hits.total,aggregations**

  
**Response format:**  
```json  
{
  "took": 442,
  "hits": {
    "total": 198
  },
  "aggregations": {
    "2": {
      "doc_count_error_upper_bound": 0,
      "sum_other_doc_count": 0,
      "buckets": [
        {
          "key": "MERGED",
          "doc_count": 18
        },
        {
          "key": "ABANDONED",
          "doc_count": 17
        },
        {
          "key": "NEW",
          "doc_count": 3
        }
      ]
    }
  }
}
```  
  
In the above format, the sum of all the ```doc_count``` in ```aggregations``` gives the total count of commits.


## section II: Get data date wise

To get the user contributions(date wise) this is how we need to access the it.

**REQUEST URI:** GET gerrit/_search?filter_path=took,hits.total,aggregations


**REQUEST JSON Payload:**
```json
{
"aggs":{
      "2":{
         "date_histogram":{
            "field":"grimoire_creation_date",
            "interval":"1D",
            "time_zone":"Asia/Kolkata",
            "min_doc_count":1
         },
         "aggs":{
            "3":{
               "terms":{
                  "field":"status",
                  "size":4,
                  "order":{
                     "_count":"desc"
                  }
               }
            }
         }
      }
   },
  "query": {
   "query_string": {
            "query": "*Rammanojpotla"
    }
        
  }
}
```

**JSON Response:**

```json
{
   "took":468,
   "hits":{
      "total":198
   },
   "aggregations":{
      "2":{
         "buckets":[
            {
               "3":{
                  "doc_count_error_upper_bound":0,
                  "sum_other_doc_count":0,
                  "buckets":[
                     {
                        "key":"MERGED",
                        "doc_count":1
                     }
                  ]
               },
               "key_as_string":"2017-03-27T00:00:00.000+05:30",
               "key":1490553000000,
               "doc_count":2
            },
            {
               "3":{
                  "doc_count_error_upper_bound":0,
                  "sum_other_doc_count":0,
                  "buckets":[

                  ]
               },
               "key_as_string":"2017-03-28T00:00:00.000+05:30",
               "key":1490639400000,
               "doc_count":3
            },
            {
               "3":{
                  "doc_count_error_upper_bound":0,
                  "sum_other_doc_count":0,
                  "buckets":[
                     {
                        "key":"MERGED",
                        "doc_count":2
                     }
                  ]
               },
               "key_as_string":"2017-04-14T00:00:00.000+05:30",
               "key":1492108200000,
               "doc_count":13
            }
         ]
      }
   }
}
```

Using the above API to fetch the results from three platforms can help in performing 2 different functions: 
1. plot graphs (both histogram and pie chart)
2. Display the user activity (alike github).


## Section III: Get details of all commits on a specifc date

View list of all commits on selecting a specific date: 

**REQUEST URI:** **GET gerrit/_search**

**JSON Request Payload:**

```json
{
   "query":{
      "bool":{
         "must":[
            {
               "query_string":{
                  "query":"*rammanoj"
               }
            },
            {
               "match_phrase":{
                  "created_on":{
                     "query":"2017-04-14"
                  }
               }
            }
         ]
      }
   }
}
```

**JSON response:**
```json
{
  "took": 396,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 2,
    "max_score": 2,
    "hits": [
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "383a235373831a130a06686ddca0a0a28306491a_changeset_348225",
        "_score": 2,
        "_source": {
          "changeset_author_org_name": "Independent",
          "author_name": "Rammanoj",
          "timeopen": "21.00",
          "grimoire_creation_date": "2017-04-14T14:21:12+00:00",
          "patchsets": 5,
          "closed": "2017-05-05T14:24:07+00:00",
          "owner_bot": false,
          "owner_uuid": "1a76fb77b4bd3fcbda44de685cf4a0739dfe37fe",
          "changeset_author_uuid": "1a76fb77b4bd3fcbda44de685cf4a0739dfe37fe",
          "type": "changeset",
          "demography_min_date": "2017-03-27T18:02:55.000Z",
          "name": "Rammanojpotla",
          "author_bot": false,
          "changeset_author_gender": "Unknown",
          "project": "Wikimedia",
          "githash": "Icc487bc6932027e4652dc24743c664c245e0222b",
          "owner_domain": "gmail.com",
          "opened": "2017-04-14T14:21:12+00:00",
          "owner_id": "bdc986f25cd05e52add2651b214c3f7a22ac5d3a",
          "last_updated": "2017-05-05T14:24:07+00:00",
          "metadata__filter_raw": null,
          "cm_title": "wikimedia",
          "author_id": "bdc986f25cd05e52add2651b214c3f7a22ac5d3a",
          "changeset_author_user_name": "",
          "is_gerrit_review": 1,
          "owner_org_name": "Independent",
          "author_gender_acc": 0,
          "author_user_name": "",
          "author_uuid": "1a76fb77b4bd3fcbda44de685cf4a0739dfe37fe",
          "origin": "gerrit.wikimedia.org",
          "metadata__timestamp": "2017-05-05T14:26:51.023552+00:00",
          "changeset_author_id": "bdc986f25cd05e52add2651b214c3f7a22ac5d3a",
          "uuid": "383a235373831a130a06686ddca0a0a28306491a",
          "changeset_author_bot": false,
          "summary_analyzed": "Ruby gem documentation should state license",
          "created_on": "2017-04-14T14:21:12+00:00",
          "owner_gender_acc": 0,
          "changeset_author_gender_acc": 0,
          "is_gerrit_changeset": 1,
          "changeset_author_domain": "gmail.com",
          "domain": "gmail.com",
          "url": "https://gerrit.wikimedia.org/r/348225",
          "changeset_author_name": "Rammanoj",
          "summary": "Ruby gem documentation should state license",
          "status": "MERGED",
          "changeset_number": "348225",
          "metadata__enriched_on": "2019-05-28T03:58:21.723693+00:00",
          "offset": null,
          "metadata__gelk_backend_name": "GerritEnrich",
          "demography_max_date": "2019-03-19T05:29:56.000Z",
          "author_gender": "Unknown",
          "metadata__gelk_version": "0.54.0",
          "owner_gender": "Unknown",
          "author_org_name": "Independent",
          "repository": "mediawiki/ruby/api",
          "owner_user_name": "rammanoj",
          "owner_name": "Rammanoj",
          "metadata__updated_on": "2017-05-05T14:24:07+00:00",
          "project_1": "Wikimedia",
          "tag": "gerrit.wikimedia.org",
          "branch": "master",
          "id": "383a235373831a130a06686ddca0a0a28306491a_changeset_348225",
          "author_domain": "gmail.com"
        }
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "8779b4a4406cd3a1eab364b4c0e896a44eb0c034_changeset_348222",
        "_score": 2,
        "_source": {
          "changeset_author_org_name": "Independent",
          "author_name": "Rammanoj",
          "timeopen": "13.02",
          "grimoire_creation_date": "2017-04-14T13:47:12+00:00",
          "patchsets": 7,
          "closed": "2017-04-27T14:18:09+00:00",
          "owner_bot": false,
          "owner_uuid": "1a76fb77b4bd3fcbda44de685cf4a0739dfe37fe",
          "changeset_author_uuid": "1a76fb77b4bd3fcbda44de685cf4a0739dfe37fe",
          "type": "changeset",
          "demography_min_date": "2017-03-27T18:02:55.000Z",
          "name": "Rammanojpotla",
          "author_bot": false,
          "changeset_author_gender": "Unknown",
          "project": "Wikimedia",
          "githash": "Icc487bc6932027e4652dc24743c664c245e0222b",
          "owner_domain": "gmail.com",
          "opened": "2017-04-14T13:47:12+00:00",
          "owner_id": "bdc986f25cd05e52add2651b214c3f7a22ac5d3a",
          "last_updated": "2017-04-27T14:18:09+00:00",
          "metadata__filter_raw": null,
          "cm_title": "wikimedia",
          "author_id": "bdc986f25cd05e52add2651b214c3f7a22ac5d3a",
          "changeset_author_user_name": "",
          "is_gerrit_review": 1,
          "owner_org_name": "Independent",
          "author_gender_acc": 0,
          "author_user_name": "",
          "author_uuid": "1a76fb77b4bd3fcbda44de685cf4a0739dfe37fe",
          "origin": "gerrit.wikimedia.org",
          "metadata__timestamp": "2017-05-04T13:29:57.904712+00:00",
          "changeset_author_id": "bdc986f25cd05e52add2651b214c3f7a22ac5d3a",
          "uuid": "8779b4a4406cd3a1eab364b4c0e896a44eb0c034",
          "changeset_author_bot": false,
          "summary_analyzed": "Ruby gem documentation should state license",
          "created_on": "2017-04-14T13:47:12+00:00",
          "owner_gender_acc": 0,
          "changeset_author_gender_acc": 0,
          "is_gerrit_changeset": 1,
          "changeset_author_domain": "gmail.com",
          "domain": "gmail.com",
          "url": "https://gerrit.wikimedia.org/r/348222",
          "changeset_author_name": "Rammanoj",
          "summary": "Ruby gem documentation should state license",
          "status": "MERGED",
          "changeset_number": "348222",
          "metadata__enriched_on": "2019-05-28T03:55:14.587800+00:00",
          "offset": null,
          "metadata__gelk_backend_name": "GerritEnrich",
          "demography_max_date": "2019-03-19T05:29:56.000Z",
          "author_gender": "Unknown",
          "metadata__gelk_version": "0.54.0",
          "owner_gender": "Unknown",
          "author_org_name": "Independent",
          "repository": "mediawiki/selenium",
          "owner_user_name": "rammanoj",
          "owner_name": "Rammanoj",
          "metadata__updated_on": "2017-04-27T14:18:09+00:00",
          "project_1": "Wikimedia",
          "tag": "gerrit.wikimedia.org",
          "branch": "master",
          "id": "8779b4a4406cd3a1eab364b4c0e896a44eb0c034_changeset_348222",
          "author_domain": "gmail.com"
        }
      }
    ]
  }
}
```

