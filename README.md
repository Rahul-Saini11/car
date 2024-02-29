# Backend RESTful API with Node.js and MongoDB

---

This project implements a backend server in Node.js using the MongoDB native driver to create RESTful APIs with authentication and asynchronous error handling using promises.

# API Documentation

---

## Authentication Endpoints

- api/v1/user/login: POST - user login.
- api/v1/user/signup: POST - user signup.
- api/v1/user/logout: GET - user logout.

- api/v1/dealer/login: POST - dealership login.
- api/v1/dealer/signup: POST - dealership signup.

## Car endpoints

- api/v1/cars: GET - get all the cars and also filter car by name.
- api/v1/get-cars/:id: GET - Get all cars under a dealership.
- api/v1/add-car: POST - Route restrict to dealer who can add car.
- api/v1//buy-car/:dealerId/:carId: GET - Route restrict to user, buy car.

# Dependencies

---

express: For creating the RESTful API.
jsonwebtoken: For generating and verifying JWT tokens.
bcryptjs: For hashing passwords.
mongodb: MongoDB native driver for Node.js.

# Conclusion

---

This backend server provides a robust and secure API for managing cars, dealerships, and deals. It implements authentication using JWT tokens, ensures data privacy, and handles errors gracefully. With proper documentation and structured code, it is ready to be integrated into any frontend application.
