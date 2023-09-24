const { Router } = require('express');
const productController = require('./product');

const router = Router();

router.get('/products', productController.getAllProducts);
router.post('/products', productController.addProduct);
router.delete('/products/:productId', productController.deleteProduct);
router.put('/products/:productId', productController.updateProduct);

module.exports = router;
