const express = require('express');
const TrainingModel = require('../../auth-service/models/userAuthModel');

const http = require('http');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const path = require('path');
const { error } = require('console');
require('dotenv').config({ path: path.resolve(__dirname, '../../../config.env') });



// controllers/eventController.js
const EventData = require('../models/eventModel');


// get events by by user and date
const getEventsByUserAndDate = async (req, res) => {
  try {
    const { user_id, date } = req.query;

    if (!user_id || !date) {
      return res.status(400).json({ message: 'Missing user_id or date' });
    }

    const userIdNum = parseInt(user_id);
    const day = new Date(date);

    if (isNaN(userIdNum) || isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid user_id or date format' });
    }

    // Build date range for the entire day (00:00:00 to 23:59:59.999)
    const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    const endOfDay = new Date(day.setHours(23, 59, 59, 999));

    const events = await EventData.find({
      user_id: userIdNum,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ date: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// create new event
const createEvent = async (req, res) => {
  try {
    const {
      user_id,
      date,
      exerType,
      set,
      weight,
      plannedReps,
      actualReps
    } = req.body;

    // Basic validation
    if (
      user_id === undefined || !date || !exerType ||
      set === undefined || weight === undefined || plannedReps === undefined
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newEvent = new EventData({
      user_id,
      date,
      exerType,
      set,
      weight,
      plannedReps,
      actualReps  // optional
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// update event fields - actualReps and/or weight
const updateEventFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { weight, actualReps } = req.body;

    if (weight === undefined && actualReps === undefined) {
      return res.status(400).json({ message: 'At least one of weight or actualReps must be provided' });
    }

    const updatedEvent = await EventData.findByIdAndUpdate(
      id,
      {
        ...(weight !== undefined && { weight }),
        ...(actualReps !== undefined && { actualReps })
      },
      { new: true } // Return updated document
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// delete events by user_id and date
const deleteEventsByUserAndDate = async (req, res) => {
  try {
    const { user_id, date } = req.query;

    if (!user_id || !date) {
      return res.status(400).json({ message: 'Missing user_id or date' });
    }

    const userIdNum = parseInt(user_id);
    const day = new Date(date);

    if (isNaN(userIdNum) || isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid user_id or date format' });
    }

    // Match full day
    const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    const endOfDay = new Date(day.setHours(23, 59, 59, 999));

    const result = await EventData.deleteMany({
      user_id: userIdNum,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No matching events found to delete' });
    }

    res.status(200).json({ message: `${result.deletedCount} event(s) deleted` });
  } catch (error) {
    console.error('Error deleting events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




module.exports = {
  getEventsByUserAndDate, createEvent, updateEventFields, deleteEventsByUserAndDate,
};














