var mealTimeCoach = {};

// everything inside the state will be stored and persisted.
mealTimeCoach.state = {
  "id": "mealTimeCoach",
  "meal_time_breakfast": {value: 0, time: "07:30"},
  "meal_time_lunch":     {value: 0, time: "12:30"},
  "meal_time_dinner":    {value: 0, time: "18:00"},
}

// setup will set all the requirements
mealTimeCoach.setup = function() {
  // this could be extended to have the FULL specification of the sensors. It would be the requirement definition.
  // binding the callback to the this with the state will be done here
  notifications.listen("meal_time_breakfast", this.onSensorData);
  notifications.listen("meal_time_lunch",     this.onSensorData);
  notifications.listen("meal_time_dinner",    this.onSensorData);

  // will fire at the endtime regardless, triggerTimes are other times this will trigger at.
  // binding the callback to the this with the state will be done here
  coachingEngine.addTask({sensors: ["meal_time_breakfast"], repeat: "daily", startTime: "00:00", endTime: "23:59", triggerTimes: ["08:00"]}, this.evaluate);
  coachingEngine.addTask({sensors: ["meal_time_lunch"],     repeat: "daily", startTime: "00:00", endTime: "23:59", triggerTimes: ["13:00"]}, this.evaluate);
  coachingEngine.addTask({sensors: ["meal_time_dinner"],    repeat: "daily", startTime: "00:00", endTime: "23:59", triggerTimes: ["18:30"]}, this.evaluate);
}


/**
 * This is an abitrarily named method that is bound in the setup on sensor updates
 * @param {String} sensor    | The name of the sensor that triggered this method.
 * @param {Object} data      | JSON object containing the data of the sensor as defined by the sensor profiles from the DSE.
 */
mealTimeCoach.onSensorData = function(sensor, data) {
  this.state[sensor] += 1;
  coachingEngine.updateTaskForSensor(sensor, data);
}


/**
 * This is an abitrarily named method that is bound in the setup to the task
 * @param {Object}  task      | A JSON object containing the information of the task as well as the initialization date of the task.
 * @param {Number}  time      | A timestamp of the time this method is invoked at.
 * @param {String}  [sensor]  | The name of the sensor that might have triggered this method. Can be empty.
 * @param {Object}  [data ]   | The data of the sensor that might have triggered this method. Can be empty.
 */
mealTimeCoach.evaluate = function(task, time, sensor, data) {
  if (sensor === undefined) {sensor = task.sensors[0];} // here we know that there is only one sensor so we can write it like this.
  var stateData = this.state[sensor];
  var value = stateData.value;
  var targetTime = util.timeToDailyTimestamp(stateData.time, task.originDate);
  var endTime = util.timeToDailyTimestamp(stateData.time, task.originDate);
  var offset = 30 * 60 * 1000;

  if (value == 0) {
    if (time > targetTime + offset) {
      coachingEngine.send(this.state.id, "reminder");
    }

    if (time > endTime) {
      coachingEngine.send(this.state.id, "unknown");
      coachingEngine.finish(scheduleInformation);
    }
  }
  else {
    if (time <= targetTime + offset || time >= targetTime - offset) {
      coachingEngine.send(this.state.id, "success")
      coachingEngine.finish(scheduleInformation);
    }
    else {
      coachingEngine.send(this.state.id, "failure")
      coachingEngine.finish(scheduleInformation);
    }
  }
}






// ********************** stubs for required support classes: ********************** //

// used to handle tasks. Tasks are automatically rescheduled based on their times and the finish method.
var coachingEngine = {};
coachingEngine.state               = {}; // state will be persisted
coachingEngine.addTask             = function(options, callback) {};
coachingEngine.updateTaskForSensor = function(sensor, data) {};
coachingEngine.finish              = function(information) {};

// used to send and listen to notifications.
var notifications = {};
notifications.send   = function() {};
notifications.listen = function(topic, callback) {};

// the scheduler will be used by the coaching engine entity
var scheduler = {};
scheduler.state     = {}; // this will store the scheduled things and will be persisted.
scheduler.schedule  = function(options, callback) {};
scheduler.reset     = function() {}; // resets all scheduled callbacks

// an object with util methods. Stateless.
var util = {};
util.timeToDailyTimestamp = function (timeString, originDateTimeStamp) {}; // convert a string time "08:30" to a timestamp in the day of the originDate
