const express = require('express');

const http = require('http');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const path = require('path');
const { error } = require('console');

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
    const { user_id, date, exerType, set, actualReps, weight } = req.body;

    // Validate identifying fields
    if (!user_id || !date || !exerType || set === undefined) {
      return res.status(400).json({ message: 'Missing required identifying fields: user_id, date, exerType, set' });
    }

    // At least one of the fields to update must be present
    if (actualReps === undefined && weight === undefined) {
      return res.status(400).json({ message: 'At least one of actualReps or weight must be provided' });
    }

    // Normalize date to start of day range
    const day = new Date(date);
    const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    const endOfDay = new Date(day.setHours(23, 59, 59, 999));

    // Build dynamic update object
    const updateFields = {};
    if (actualReps !== undefined) updateFields.actualReps = actualReps;
    if (weight !== undefined) updateFields.weight = weight;

    const updatedEvent = await EventData.findOneAndUpdate(
      {
        user_id: parseInt(user_id),
        date: { $gte: startOfDay, $lte: endOfDay },
        exerType,
        set: parseInt(set)
      },
      updateFields,
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found for given user/date/exercise/set' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




// delete event
const deleteEvent = async (req, res) => {
  try {
    const { user_id, date, exerType, set } = req.query;

    // Validate required query params
    if (!user_id || !date || !exerType || set === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: user_id, date, exerType, or set'
      });
    }

    const userIdNum = parseInt(user_id);
    const setNum = parseInt(set);
    const day = new Date(date);

    if (isNaN(userIdNum) || isNaN(setNum) || isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid user_id, set, or date format' });
    }

    // Match exact date (range from 00:00 to 23:59:59)
    const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    const endOfDay = new Date(day.setHours(23, 59, 59, 999));

    const result = await EventData.deleteOne({
      user_id: userIdNum,
      date: { $gte: startOfDay, $lte: endOfDay },
      exerType,
      set: setNum
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No matching event found to delete' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};





module.exports = {
  getEventsByUserAndDate, createEvent, updateEventFields, deleteEvent,
};














