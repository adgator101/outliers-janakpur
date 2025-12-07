from enum import Enum

class Role (str , Enum):
    user = 'user'
    reviewers = 'reviewers'
    bureaucrat = 'bureaucrat'
