def success_response(message, data=None, status_code=200):
    return {
        "success": True,
        "message": message,
        "data": data
    }, status_code


def error_response(message, status_code=400):
    return {
        "success": False,
        "message": message,
        "data": None
    }, status_code