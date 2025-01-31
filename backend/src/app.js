const express = require('express');
const app = express();
const userCollectionsRouter = require('./routes/userCollections');

// Register the new routes
app.use('/user', userCollectionsRouter);

// ... rest of your app configuration ... 