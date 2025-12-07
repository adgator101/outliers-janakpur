# FastAPI MongoDB Project

This project is a simple FastAPI application that uses MongoDB as its backend. It provides user-related functionalities such as registration, login, and profile management.

## Project Structure

```
fastapi-mongodb-project
├── app
│   ├── main.py                # Initializes the FastAPI application and includes routers
│   ├── models
│   │   └── user.py            # Defines the user model for MongoDB
│   ├── routes
│   │   └── user_routes.py      # Contains user-related endpoints
│   ├── schemas
│   │   └── user_schema.py      # Exports Pydantic models for validation
│   ├── services
│   │   └── database.py         # Handles MongoDB connection and operations
│   └── utils
│       └── __init__.py        # Contains utility functions or classes
├── requirements.txt            # Lists Python dependencies
├── .env                        # Contains environment variables
└── README.md                   # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd fastapi-mongodb-project
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the required dependencies:**
   ```
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the root directory and add your MongoDB URI and any other necessary environment variables.

5. **Run the application:**
   ```
   uvicorn app.main:app --reload
   ```

## Usage

- The application exposes various endpoints for user operations. You can access the API documentation at `http://localhost:8000/docs` after running the application.

## Contributing

Feel free to fork the repository and submit pull requests for any improvements or features.