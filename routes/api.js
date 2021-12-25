const express = require("express");
const router = express.Router();
const { apiAuthRetailer } = require("../config/authentication");
const indexCon = require("../controller/apiController/indexCon");
const masterCon = require("../controller/apiController/masterCon");
const subscriptionsCon = require("../controller/apiController/subscriptionCon");
const orders = require("../controller/apiController/ordersConf");
// const testCon = require('../controller/apiController/testCon');
const invoice = require("../controller/apiController/invoiceCon");
const dataStats = require("../controller/apiController/dataStatsCon");

////////////// Firebase idToken verify /////////
router.post("/fbToken-verify", indexCon.idTokenVerify);

// Retailer
router.post("/retailer-sign-up", indexCon.retailerRegistration);
router.post("/retailerLogin", indexCon.retailerLogin);
router.post("/retailer-login-with-phone", indexCon.loginWithPhoneRetailer);
router.patch(
  "/retailer-edit-profile",
  apiAuthRetailer,
  indexCon.editRetailerProfile
);
router.patch("/addStoreLocation", apiAuthRetailer, indexCon.addStoreLocation);
router.delete("/delete-retailer/:phone", indexCon.deleteRetailerProfile);

router.get("/allretailer", indexCon.getAllRetailer);
// router.get("/allRiders", indexCon.getAllRiders);

//Product
router.post("/add-product-category", masterCon.addCategory);
router.post("/retailer-add-product", apiAuthRetailer, masterCon.addProduct);
router.get("/product-list/:retailerId", apiAuthRetailer, masterCon.getProducts);
router.get("/get-product/:productId", apiAuthRetailer, masterCon.getProduct);
router.post("/linkUPI", masterCon.linkUPI);

router.patch("/update-product", apiAuthRetailer, masterCon.editProduct);
router.delete(
  "/delete-product/:productId",
  apiAuthRetailer,
  masterCon.deleteProduct
);
//Service
// router.post("/add-product-category", masterCon.addCategory);
router.post("/retailer-add-service", apiAuthRetailer, masterCon.addServices);
router.get("/service-list/:retailerId", apiAuthRetailer, masterCon.getServices);
router.get("/get-service/:serviceId", apiAuthRetailer, masterCon.getService);
router.patch("/update-service", apiAuthRetailer, masterCon.editService);
router.delete(
  "/delete-service/:serviceId",
  apiAuthRetailer,
  masterCon.deleteService
);

//subscription
// router.post("/plans", subscriptionsCon.createPlan);
router.get("/plans", subscriptionsCon.fetchPlan);

router.post("/subscriptions", apiAuthRetailer, subscriptionsCon.subscriptions);
router.post("/verification", apiAuthRetailer, subscriptionsCon.verification);
router.post(
  "/subscriptions/:sub_id/cancel",
  apiAuthRetailer,
  subscriptionsCon.cancelSubscriptions
);

//orders
// test
// router.get("/fetchOrders", orders.fetchOrders);

router.post("/fetchAllOrders", apiAuthRetailer, orders.fetchAllOrders);
router.post("/fetchNewOrders", apiAuthRetailer, orders.fetchNewOrders);
router.post(
  "/fetchCompletedOrders",
  apiAuthRetailer,
  orders.fetchCompletedOrders
);
router.post(
  "/fetchRejectedOrders",
  apiAuthRetailer,
  orders.fetchRejectedOrders
);
router.post("/fetchOrder", apiAuthRetailer, orders.fetchOrder);

router.post("/acceptOrder", apiAuthRetailer, orders.acceptOrder);
router.post("/declineOrder", apiAuthRetailer, orders.declineOrder);
router.post("/markAsPaid", apiAuthRetailer, orders.markAsPaid);
router.post("/acceptedOrder", apiAuthRetailer, orders.acceptedOrder);

//generateinvoice
router.post("/generateInvoice", apiAuthRetailer, invoice.generateInvoice);
router.post("/getInvoice", invoice.getInvoice);

//generate Stats
router.post("/generateStatus", apiAuthRetailer, dataStats.genStats);

//Nearest stores
router.post("/findNearbyStores", apiAuthRetailer, indexCon.findNearbyStores);

router.post("/get-new-token", indexCon.getNewTokens);

router.get("/phone-no-check-retailer/:phone", masterCon.checkPhoneNo);

// router.post('/file-upload-test', testCon.fileUploadDemo);
// router.get('/get-file', testCon.getFileFromBucket);

router.get("*", async (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Sorry! API your are looking for has not been found",
  });
});
router.post("*", async (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Sorry! API your are looking for has not been found",
  });
});

module.exports = router;
