const express = require('express');
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../../auth-service/tokenUtils');
const router = express.Router();

console.log('running eventRoutes.js');
router
  .route('/')
  .get(verifyToken, eventController.getEventsByUserAndDate)
  .post(verifyToken, eventController.createEvent)
  .delete(verifyToken, eventController.deleteEvent)
  .patch(verifyToken, eventController.updateEventFields)


// NEW route for date range event fetch
router
  .route('/range')
  .get(verifyToken, eventController.getEventsByUserAndDateRange);

module.exports = router;
