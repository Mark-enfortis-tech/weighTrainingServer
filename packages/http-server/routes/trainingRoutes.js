const express = require('express');
const trainingController = require('../controllers/trainingController');
const router = express.Router();
const { verifyToken } = require('../../auth-service/tokenUtils');  // Import only the token function

console.log('running trainingRoutes.js');
router
  .route('/data')
  .get(verifyToken, trainingController.APIgetTrainingRecords)
  // .post(cmdInvController.APIupdateCmdInventoryRecords);
  .put(verifyToken, trainingController.APIupdateTrainingRecords)
  .post(verifyToken, trainingController.APIinsertTrainingRecord)
  .delete(verifyToken, trainingController.APIdeleteTrainingRecord)

module.exports = router;
