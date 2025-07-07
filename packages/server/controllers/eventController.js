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
    const { userId, date } = req.query;

    if (!userId || !date) {
      return res.status(400).json({ message: 'Missing userId or date' });
    }

    const userIdNum = parseInt(userId);
    const day = new Date(date);

    if (isNaN(userIdNum) || isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid userId or date format' });
    }

    // Build date range for the entire day (00:00:00 to 23:59:59.999)
    const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    const endOfDay = new Date(day.setHours(23, 59, 59, 999));

    const events = await EventData.find({
      userId: userIdNum,
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

// get events by user and range of dates: 
const getEventsByUserAndDateRange = async (req, res) => {
  console.log('running getEventsByUserAndDateRange()');
  try {
    const { userId, startDate, endDate } = req.query;

    // Validate presence of required query parameters
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing userId, startDate, or endDate' });
    }

    // Convert user_id to integer
    const userIdNum = parseInt(userId);
    // Convert query parameters to Date objects
    const _startDate = new Date(startDate);
    const _endDate = new Date(endDate);

    console.log(`received params: userId: ${userId}, startDate: ${startDate}, endDate" ${endDate}`);

    // Validate parsed values
    if (isNaN(userIdNum) || isNaN(_startDate.getTime()) || isNaN(_endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid userId or date format' });
    }

    // Normalize dates to include the full range of days
    const startOfRange = new Date(_startDate.setHours(0, 0, 0, 0));
    const endOfRange = new Date(_endDate.setHours(23, 59, 59, 999));

    // Query the database for events within the date range
    const events = await EventData.find({
      userId: userIdNum,
      date: {
        $gte: startOfRange,
        $lte: endOfRange
      }
    }).sort({ date: 1 });

    // Respond with the retrieved events
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
      userId,
      date,
      exerType,
      set,
      weight,
      plannedReps,
      actualReps
    } = req.body;

    // Basic validation
    if (
      userId === undefined || !date || !exerType ||
      set === undefined || weight === undefined || plannedReps === undefined
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert string to Date and normalize to midnight
    const [year, month, day] = date.split('-').map(Number);
    const normalizedDate = new Date(year, month - 1, day); // Interpreted as local midnight

    if (isNaN(normalizedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    normalizedDate.setHours(0, 0, 0, 0);

    const newEvent = new EventData({
      userId,
      date: normalizedDate,
      exerType,
      set,
      weight,
      plannedReps,
      actualReps // optional
    });

    const savedEvent = await newEvent.save();
    console.log('Saved event:', savedEvent); // Optional: debug log
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// update event fields - actualReps and/or weight
const updateEventFields = async (req, res) => {
  try {
    const { userId, date, exerType, set, actualReps, weight } = req.body;
    console.log(`received updateEventFields(): userId: ${userId}, date: ${date}, exerType: ${exerType}, set: ${set}, weight: ${weight}, actualReps: ${actualReps}`);

    if (!userId || !date || !exerType || set === undefined) {
      return res.status(400).json({ message: 'Missing required identifying fields: userId, date, exerType, set' });
    }

    if (actualReps === undefined && weight === undefined) {
      return res.status(400).json({ message: 'At least one of actualReps or weight must be provided' });
    }

    const updateFields = {};
    if (actualReps !== undefined) updateFields.actualReps = actualReps;
    if (weight !== undefined) updateFields.weight = weight;

    const updatedEvent = await EventData.findOneAndUpdate(
      {
        userId: parseInt(userId),
        date: new Date(date), // 🔍 Exact match
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
    const { userId, date, exerType, set } = req.query;

    // Validate required query params
    if (!userId || !date || !exerType || set === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: userId, date, exerType, or set'
      });
    }

    const userIdNum = parseInt(userId);
    const setNum = parseInt(set);
    const day = new Date(date);

    if (isNaN(userIdNum) || isNaN(setNum) || isNaN(day.getTime())) {
      return res.status(400).json({ message: 'Invalid userId, set, or date format' });
    }

    // Match exact date (range from 00:00 to 23:59:59)
    const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    const endOfDay = new Date(day.setHours(23, 59, 59, 999));

    const result = await EventData.deleteOne({
      userId: userIdNum,
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
  getEventsByUserAndDate,
  getEventsByUserAndDateRange, // ✅ include the new function here
  createEvent,
  updateEventFields,
  deleteEvent
};













