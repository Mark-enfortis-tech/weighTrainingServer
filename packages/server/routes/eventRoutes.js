const express = require('express');
const eventController = require('../controllers/eventController');
const router = express.Router();
const { verifyToken } = require('../../auth-service/tokenUtils');  // Import only the token function

console.log('running eventRoutes.js');
router
  .route('/events')
  .get(verifyToken, eventController.getEventsByUserAndDate)
  .put(verifyToken, eventController.APIupdateTrainingRecords)
  .post(verifyToken, eventController.createEvent)
  .delete(verifyToken, eventController.APIdeleteTrainingRecord)

module.exports = router;
