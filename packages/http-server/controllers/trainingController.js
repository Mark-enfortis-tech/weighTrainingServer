const express = require('express');
const TrainingInventory = require('../models/trainingInvModel');

const http = require('http');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const path = require('path');
const { error } = require('console');
require('dotenv').config({ path: path.resolve(__dirname, '../../../config.env') });


// fetch all command inventory records
exports.APIgetTrainingRecords = async (req, res) => {
  const _user_id = req.body.user_id
  console.log(`APIgetTrainingRecords() req.body: ${JSON.stringify(req.body)}`);
  onsole.log(`APIgetTrainingRecords() _user_id: ${_user_id}`);

  // // If it comes in as a quoted string like '"NEL"', remove quotes safely
  // if (_platform?.startsWith('"') && _platform.endsWith('"')) {
  //   _platform = _platform.slice(1, -1);
  // }

  // try {
  //   let _cmdInv;
  //   if (_platform === 'all') {
  //     console.log('fetch all');
  //     _cmdInv = await CmdInventory.find({});
  //   } else {
  //     console.log('fetch by platform: ', _platform);
  //     _cmdInv = await CmdInventory.find({ platform: _platform });
  //   }

  //   res.set({
  //     "Content-Type": "application/json",
  //     "Access-Control-Allow-Origin": "*",
  //   });

  //   res.status(200).json(_cmdInv);
  //   console.log("Fetched cmdInv: ", _cmdInv.map(c => ({ cmd_id: c.cmd_id, platform: c.platform })));

  // } catch (err) {
  //   console.error('Error fetching CmdInventory:', err);
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err.message || err
  //   });
  // }
};




function stripQuotes(inString){
  //console.log("stripQuotes, inString:", inString);
  const _retString = inString.slice(1, inString.length-1);
  return _retString;
}

// update the record if it exists - works




// this version updates based upon cmd_id. But if the cmd_id is changed 
// a new record will be created leaving the other untouched.
exports.APIupdateTrainingRecords = async (req, res) => {
  const _user_id = req.body.user_id
  console.log(`APIupdateTrainingRecords() req.body: ${JSON.stringify(req.body)}`);
  onsole.log(`APIupdateTrainingRecords() _user_id: ${_user_id}`);


  // try {
  //   // Check if another record exists with the same cmd_id and platform but a different _id
  //   const duplicate = await CmdInventory.findOne({
  //     cmd_id: _cmd_id,
  //     platform: _platform,
  //     _id: { $ne: _id }  // exclude the current record being updated
  //   });

  //   if (duplicate) {
  //     return res.status(400).json({
  //       status: "fail",
  //       message: "Another record with this cmd_id and platform already exists"
  //     });
  //   }

  //   // Proceed with update by _id
  //   const updateData = {
  //     cmd_id: _cmd_id,
  //     cmd_name: _cmd_name,
  //     cmd_string: _cmd_string,
  //     remarks: _remarks,
  //     hazlock: _hazlock,
  //     target_ip: _target_ip,
  //     target_port: _target_port,
  //     platform: _platform,
  //     command_protocol: _command_protocol
  //   };
  
    
  //   const updatedRecord = await CmdInventory.findOneAndUpdate(
  //     { _id },
  //     { $set: updateData },
  //     { new: true, runValidators: true }
  //   );

  //   console.log("APIupdateCmdInventoryRecords result: ", updatedRecord);

  //   if (!updatedRecord) {
  //     return res.status(404).json({ status: "fail", message: "Record not found" });
  //   }

  //   res.set({
  //     "Content-Type": "application/json",
  //     "Access-Control-Allow-Origin": "*",
  //   });

  //   res.status(200).json(updatedRecord);

  // } catch (err) {
  //   console.error("Error:", err);
  //   res.status(500).json({
  //     status: "fail",
  //     message: err.message || "Internal Server Error",
  //   });
  // }
};




exports.APIinsertTrainingRecord = async (req, res) => {
  console.log("APIinsertTrainingRecord()");
  console.log("Received req.body:", req.body);

  try {
      // Destructure and sanitize input
      const { cmd_id, cmd_name, cmd_string, remarks, hazlock, target_ip, target_port, platform, cmd_protocol } = req.body;

      // Convert `hazlock` to boolean if it's a string
      const parsedHazlock = typeof hazlock === "string" ? hazlock.toLowerCase() === "true" : hazlock;

      console.log(`Processing cmd_id: ${cmd_id}`);

      // Check if the record already exists
      const existingRecord = await CmdInventory.findOne({ cmd_id, platform: platform?.trim() });
      if (existingRecord) {
          return res.status(400).json({ status: "fail", message: "Record with this cmd_id and platform already exists" });
      }

      // Create new record
      const newRecord = await CmdInventory.create({
          cmd_id,
          cmd_name: cmd_name?.trim(),
          cmd_string: cmd_string?.trim(),
          remarks: remarks?.trim(),
          hazlock: parsedHazlock,
          // target_ip: target_ip?.trim(),
          // target_port: target_port?.trim(),
          platform: platform?.trim(),
          cmd_protocol: cmd_protocol?.trim()
      });

      console.log("Record inserted successfully:", newRecord);

      res.status(201).json(newRecord); // 201 for successful creation

  } catch (err) {
      console.error("Error inserting record:", err);
      res.status(500).json({ status: "fail", message: err.message || "Internal Server Error" });
  }
};


exports.APIdeleteTrainingRecord = async (req, res) => {
  const _cmd_id = req.query.cmd_id; // Get cmd_id from query parameters
  console.log("APIdeleteTrainingRecord()");
  console.log("Received req.query:", req.query.cmd_id);
  

  // if (!_cmd_id) {
  //   return res.status(400).json({ status: "fail", message: "cmd_id is required" });
  // }

  // try {
  //   const deletedRecord = await CmdInventory.findOneAndDelete({ cmd_id: _cmd_id });

  //   if (!deletedRecord) {
  //     return res.status(404).json({ status: "fail", message: "Record not found" });
  //   }

  //   console.log("Deleted record:", deletedRecord);
  //   res.status(200).json({ status: "success", data: deletedRecord });

  // } catch (err) {
  //   console.error("Error deleting record:", err);
  //   res.status(500).json({ status: "fail", message: err.message || "Internal Server Error" });
  // }
};














