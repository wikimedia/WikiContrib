## Working with ElasticSearch (grimoirelab):

**url to the tool:** https://wikimedia.biterg.io
**Console(for testing):** https://wikimedia.biterg.io/app/kibana#/dev_tools/console?_g=()

**Getting info about the issues**:

**Common Request JSON format:**
```json
{
  "aggs":{
      "2":{
         "terms":{
            "field":"status",
            "size":100,
            "order":{
               "_count":"desc"
            }
         }
         }
      },
  "stored_fields": [
      "*"
    ],
  "query": {
   "query_string": {
            "query": "*Rammanojpotla"
          }
  }
}
```

**Phabricator:**
	
url to be requested: **GET maniphest/_search**


**Response format:**
```json
{
  "took": 88,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 17,
    "max_score": 1,
    "hits": [
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "e0497ffecab15a839c5856b2a10ee36254bebca5",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "e32edb9cf6fc779e5a7f30ae3ded6a36cd34e223",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "48ed03c5e8103b8adf03f6c166bfafe6f0b3dd0f",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "2e50b971249dc5b377ecd526cab6ba8b3bbbd1c2",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "7a49354c0ec1c0147e84bfadbf61eaf1e7eeb3b3",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "547e216751b85b8d3bab4bd72bead2fc194d1f8e",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "1287fa6f4b493428d7650dc6fed80c268a61e354",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "d7ed857843ace29fa08a2bfb71ca41e49daec6b7",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "c4bfeb1e037f75aa105921321a09ac35117b4931",
        "_score": 1
      },
      {
        "_index": "maniphest_wikimedia_180419_enriched_190430",
        "_type": "items",
        "_id": "8ea22c80a2ce65e00a052ef075326f2eab10026b",
        "_score": 1
      }
    ]
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

url to be requested: **GET gerrit/_search**

**Response format:**
```json
{
  "took": 422,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 198,
    "max_score": 1,
    "hits": [
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "dbf3c81a7b24f990d4246a44b8e9ab437aba4346_changeset_352120_patchset_1",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "8779b4a4406cd3a1eab364b4c0e896a44eb0c034_changeset_348222_patchset_7",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "383a235373831a130a06686ddca0a0a28306491a_changeset_348225_patchset_2",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "383a235373831a130a06686ddca0a0a28306491a_changeset_348225_patchset_5",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "399b12049c242b963f3d346508088f51e668be2c_changeset_348935",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "399b12049c242b963f3d346508088f51e668be2c_changeset_348935_patchset_1",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "399b12049c242b963f3d346508088f51e668be2c_changeset_348935_patchset_2",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "399b12049c242b963f3d346508088f51e668be2c_changeset_348935_patchset_7",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "243879548a18f81e6f77dfde20c47f536a069950_changeset_352121",
        "_score": 1
      },
      {
        "_index": "gerrit_wikimedia_180406b_enriched_190527",
        "_type": "items",
        "_id": "2e459df1dec807c9169ac9f5b51e85747b3f1cbb_changeset_408570",
        "_score": 1
      }
    ]
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



