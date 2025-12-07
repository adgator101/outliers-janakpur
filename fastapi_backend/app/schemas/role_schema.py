from enum import Enum

class Role(str, Enum):
    user = 'user'
    ngo = 'ngo'
    admin = 'admin'
