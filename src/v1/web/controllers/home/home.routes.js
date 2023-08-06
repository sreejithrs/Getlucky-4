const { Router } = require('express');
const homeController = require('./home');

const router = Router();

router.get('/home/product', homeController.getAllProducts);

module.exports = router;
