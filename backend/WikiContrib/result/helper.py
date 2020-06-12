import pandas as pd
from django.utils.text import slugify
from hashlib import sha256
from django.utils.crypto import get_random_string
from query.models import Query


def get_prev_user(file, ind):
    prev_user = None
    while True:
        if ind != 0:
            temp = file.iloc[ind - 1, :]
            if pd.isnull(temp['fullname']) or (pd.isnull(temp['Gerrit']) and pd.isnull(temp['Phabricator'])):
                ind -= 1
            else:
                prev_user = temp['fullname']
                break
        else:
            break

    return prev_user


def get_next_user(file, ind):
    next_user = None
    while True:
        if ind != len(file) - 1:
            temp = file.iloc[ind+1, :]
            if pd.isnull(temp['fullname']) or (pd.isnull(temp['Gerrit']) and pd.isnull(temp['Phabricator'])):
                ind += 1
            else:
                next_user = temp['fullname']
                break
        else:
            break

    return next_user



def create_hash(usersArr=None):
    """
    :return: hash code to create the Query.
    """
    hash_code = ""
    if usersArr == None:
        hash_code = get_random_string(64)
        while Query.objects.filter(hash_code=hash_code).exists():
            hash_code = get_random_string(64)
    else:
        fullname_slug = ""
        for dict in usersArr:
            hash_code + dict["fullname"].lower() + dict["gerrit_username"].lower() + dict["phabricator_username"].lower()
        if len(usersArr) == 1:
            fullname_slug = slugify(usersArr[0]["fullname"].lower())
            hash_code = fullname_slug +"-"+ sha256(hash_code.encode("utf-8")).hexdigest()[:9]
        else:
            hash_code = sha256(hash_code.encode("utf-8")).hexdigest()

    return hash_code
