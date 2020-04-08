from WikiContrib.settings import BASE_URL

"""
This file contains the sample data to run tests.
"""

query_create_url = BASE_URL + "query/add/user/"

query_create_data = {
    "file": -1,
    "users": [
        {
            "fullname": "test_user_1",
            "gerrit_username": "test_gerrit_user_1",
            "phabricator_username": "test_phab_user_1"
        },
        {
            "fullname": "test_user_2",
            "gerrit_username": "test_gerrit_user_2",
            "phabricator_username": "test_phab_user_2"
        }
    ]
}

query_create_csv = {
    "complete": 0,
    "file": 0,
    "chunk": 1
}

query_update_url = BASE_URL + 'query/<hash>/update/user/'


query_update_data = {
    "file": -1,
    "users": [
        {
            "fullname": "update_test_user_1",
            "gerrit_username": "update_test_gerrit_user_1",
            "phabricator_username": "update_test_phab_user_1"
        },
        {
            "fullname": "update_user_2",
            "gerrit_username": "update_test_gerrit_user_2",
            "phabricator_username": "update_test_phab_user_2"
        },
        {
            "fullname": "update_user_3",
            "gerrit_username": "update_test_gerrit_user_2",
            "phabricator_username": "update_test_phab_user_3"
        }
    ]
}


query_filter_url = BASE_URL + 'query/<hash>/update/filter/'

query_filter_data = {
    "status": "p-open,merged,closed,abandoned",
    "username": "test_user_1",
    "start_time": "2015-04-01",
    "end_time": "2016-02-01"
}
