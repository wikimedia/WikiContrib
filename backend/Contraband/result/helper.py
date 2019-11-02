import pandas as pd


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
