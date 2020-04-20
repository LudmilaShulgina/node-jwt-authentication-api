const express = require('express');
const router = express.Router();
const userService = require('./user.service');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
       .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
       .catch(err => next(err));
}

function register(req, res, next) {
    userService.register(req.body)
        .then(user => user ? (user.error? res.status(400).json({ message: user.error }):res.json(user)) : res.status(403).json({ message: 'Forbidden' }))
        .catch(err => next(err));
}

