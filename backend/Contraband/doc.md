
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