# CS308 Store API Documentation

This document provides details about the available endpoints in the CS308 Store API.

## Base URL

All endpoints are relative to the base URL: `http://localhost:8000/`

## Authentication

Most endpoints require authentication. Send credentials using session cookies or Basic Auth. 
Authentication-required endpoints are marked with 🔒.

## Products

### Get All Products
- **URL**: `/api/products/all/`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Retrieves a list of all available products
- **Response**: Array of product objects
- **Example Response**:
  ```json
  [
    {
      "id": 1,
      "title": "MacBook Pro",
      "model": "M2 Pro",
      "serial_number": "12345",
      "description": "Powerful laptop for professionals",
      "quantity_in_stock": 10,
      "stock": 10,
      "price": 1999.99,
      "cost": 999.99,
      "warranty_status": true,
      "distributor_info": "Apple Distribution Inc., 123 Apple Way, Cupertino CA, contact@appledist.com",
      "category": {
        "id": 1,
        "name": "Laptops"
      },
      "is_available": true,
      "rating": 4.5,
      "total_ratings": 42,
      "image": "/media/products/macbook.jpg"
    }
  ]
  ```

### Get Product Detail
- **URL**: `/api/products/{id}/`
- **Method**: `GET`
- **URL Parameters**: `id` - Product ID
- **Auth Required**: No
- **Description**: Retrieves detailed information about a specific product
- **Response**: Single product object
- **Example Response**: Same structure as above, for a single product

## Categories

### Get All Categories
- **URL**: `/api/categories/`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Retrieves a list of all product categories
- **Response**: Array of category objects
- **Example Response**:
  ```json
  [
    {
      "id": 1,
      "name": "Laptops"
    },
    {
      "id": 2,
      "name": "Smartphones"
    }
  ]
  ```

## Orders

### Create Order
- **URL**: `/api/orders/`
- **Method**: `POST`
- **Auth Required**: 🔒
- **Description**: Creates a new order
- **Request Body**:
  ```json
  {
    "order_items": [
      {
        "product": 1,
        "quantity": 2,
        "price_at_purchase": 1999.99
      }
    ],
    "delivery_address": "123 Main St, Anytown, USA",
    "total_price": 3999.98
  }
  ```
- **Response**: Order object with status
- **Example Response**:
  ```json
  {
    "order": {
      "id": 1,
      "total_price": 3999.98,
      "status": "processing",
      "created_at": "2023-05-15T10:30:00Z"
    },
    "message": "Order created successfully"
  }
  ```

### Get Order History
- **URL**: `/api/orders/history/`
- **Method**: `GET`
- **Auth Required**: 🔒
- **Description**: Retrieves order history for the authenticated user
- **Response**: Array of order objects
- **Example Response**:
  ```json
  [
    {
      "id": 1,
      "created_at": "2023-05-15T10:30:00Z",
      "status": "delivered",
      "total_price": 3999.98,
      "items": [
        {
          "id": 1,
          "product": {
            "id": 1,
            "title": "MacBook Pro",
            "model": "M2 Pro"
          },
          "quantity": 2,
          "price_at_purchase": 1999.99
        }
      ],
      "invoice_pdf": "/media/invoices/invoice_1.pdf"
    }
  ]
  ```

### Cancel Order
- **URL**: `/api/orders/{order_id}/cancel/`
- **Method**: `POST`
- **URL Parameters**: `order_id` - Order ID
- **Auth Required**: 🔒
- **Description**: Cancels an order that is still in processing status
- **Response**: Success message
- **Example Response**:
  ```json
  {
    "message": "Order cancelled successfully"
  }
  ```

### Refund Order
- **URL**: `/api/orders/{order_id}/refund/`
- **Method**: `POST`
- **URL Parameters**: `order_id` - Order ID
- **Auth Required**: 🔒
- **Description**: Requests a refund for a delivered order
- **Response**: Success message
- **Example Response**:
  ```json
  {
    "message": "Order refunded successfully"
  }
  ```

### Download Invoice
- **URL**: `/api/orders/{order_id}/invoice/`
- **Method**: `GET`
- **URL Parameters**: `order_id` - Order ID
- **Auth Required**: 🔒
- **Description**: Downloads the PDF invoice for an order
- **Response**: PDF file

## Authentication

### Register
- **URL**: `/api/auth/register/`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Registers a new user
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "confirm_password": "securepassword",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
- **Response**: User object with success message
- **Example Response**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_staff": false
    }
  }
  ```

### Login
- **URL**: `/api/auth/login/`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Authenticates a user and creates a session
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: User object with success message
- **Example Response**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_staff": false
    }
  }
  ```

### Logout
- **URL**: `/api/auth/logout/`
- **Method**: `POST`
- **Auth Required**: 🔒
- **Description**: Logs out the current user and destroys the session
- **Response**: Success message
- **Example Response**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### Check Authentication
- **URL**: `/api/auth/check/`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Checks if the current user is authenticated
- **Response**: Authentication status and user data if authenticated
- **Example Response**:
  ```json
  {
    "authenticated": true,
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_staff": false
    }
  }
  ```

### Get User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `GET`
- **Auth Required**: 🔒
- **Description**: Retrieves the profile of the authenticated user
- **Response**: User object
- **Example Response**:
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_staff": false
  }
  ```

### Update User Profile
- **URL**: `/api/auth/profile/`
- **Method**: `PUT`
- **Auth Required**: 🔒
- **Description**: Updates the profile of the authenticated user
- **Request Body**:
  ```json
  {
    "first_name": "Jonathan",
    "last_name": "Doe"
  }
  ```
- **Response**: Updated user object
- **Example Response**:
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "Jonathan",
    "last_name": "Doe",
    "is_staff": false
  }
  ```

### Change Password
- **URL**: `/api/auth/change-password/`
- **Method**: `POST`
- **Auth Required**: 🔒
- **Description**: Changes the password of the authenticated user
- **Request Body**:
  ```json
  {
    "old_password": "securepassword",
    "new_password": "newsecurepassword",
    "confirm_password": "newsecurepassword"
  }
  ```
- **Response**: Success message
- **Example Response**:
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

### Forgot Password
- **URL**: `/api/auth/forgot-password/`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Sends a password reset email to the user
- **Request Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response**: Success message
- **Example Response**:
  ```json
  {
    "message": "Password reset email sent successfully"
  }
  ```

### Reset Password
- **URL**: `/api/auth/reset-password/`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Resets a user's password using a token
- **Request Body**:
  ```json
  {
    "token": "reset-token-from-email",
    "new_password": "newsecurepassword"
  }
  ```
- **Response**: Success message
- **Example Response**:
  ```json
  {
    "message": "Password reset successfully"
  }
  ```

## Error Responses

All endpoints can return error responses in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error