from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    '''

    :param exc
    :param context
    :return: response
    :operation: Generate a common response format: `{"message": "Error message",  "error": 0/1}`

    '''

    # Get the response from rest_framework.views.exception_handler
    response = exception_handler(exc=exc, context=context)

    if response is not None:
        if type(response.data) is list:
            error = 1
            message = response.data[0]
            custom_response = {'error': error, 'message': message}
            response.data = custom_response
            return response
        for key, value in response.data.items():
            if isinstance(value, str):
                error = value
            else:
                error = value[0]
            if key == 'non_field_errors' or key == 'detail':
                custom_response = {'message': error, 'error': 1}
            else:
                custom_response = {'message': key + ", " + error, 'error': 1}
            break
        response.data = custom_response
    return response
