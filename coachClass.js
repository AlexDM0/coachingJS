var mealTimeCoach = {};

// everything inside the state will be stored and persisted.
mealTimeCoach.state = {
  "id": "mealTimeCoach",
  "meal_time_breakfast": {value: 0, time: "07:30", active: true},
  "meal_time_lunch":     {value: 0, time: "12:30", active: true},
  "meal_time_dinner":    {value: 0, time: "18:00", active: true},
}

// setup will set all the requirements
mealTimeCoach.setup = function() {
  // this could be extended to have the FULL specification of the sensors. It would be the requirement definition.
  // binding the callback to the this with the state will be done here
  Notifications.listen("meal_time_breakfast", this.onSensorData);
  Notifications.listen("meal_time_lunch",     this.onSensorData);
  Notifications.listen("meal_time_dinner",    this.onSensorData);

  // will fire at the endtime regardless, triggerTimes are other times this will trigger at.
  // binding the callback to the this with the state will be done here
  CoachingEngine.addTask({messages: ["meal_time_breakfast"], repeat: "daily", startTime: "00:00", endTime: "23:59", triggerTimes: ["08:00"]}, {init: this.taskInit, trigger: this.evaluate});
  CoachingEngine.addTask({messages: ["meal_time_lunch"],     repeat: "daily", startTime: "00:00", endTime: "23:59", triggerTimes: ["13:00"]}, {init: this.taskInit, trigger: this.evaluate});
  CoachingEngine.addTask({messages: ["meal_time_dinner"],    repeat: "daily", startTime: "00:00", endTime: "23:59", triggerTimes: ["18:30"]}, {init: this.taskInit, trigger: this.evaluate});
}


/**
 * required for maintaining state.. ugly..
 * @param task
 */
mealTimeCoach.taskInit = function(task) {
  this.state[task.messages[0]].value = 0;
  this.state[task.messages[0]].active = true;

}

/**
 * This is an abitrarily named method that is bound in the setup on sensor updates
 * @param {String} sensor    | The name of the sensor that triggered this method.
 * @param {Object} data      | JSON object containing the data of the sensor as defined by the sensor profiles from the DSE.
 */
mealTimeCoach.onSensorData = function(sensor, data) {
  if (this.state[sensor].active === true) {
    this.state[sensor].value += 1;
    CoachingEngine.updateTaskForMessage(sensor, data);
  }
}


/**
 * This is an abitrarily named method that is bound in the setup to the task
 * @param {Object}  task      | A JSON object containing the information of the task as well as the initialization date of the task.
 * @param {Number}  time      | A timestamp of the time this method is invoked at.
 * @param {String}  [sensor]  | The name of the sensor that might have triggered this method. Can be empty.
 * @param {Object}  [data]    | The data of the sensor that might have triggered this method. Can be empty.
 */
mealTimeCoach.evaluate = function(task, time, sensor, data) {
  if (sensor === undefined) {sensor = task.messages[0];} // here we know that there is only one sensor so we can write it like this.

  // required to keep this from processing additional sensor notifications after it's finished.
  if (this.state[sensor].active === true) {
    var targetTime = util.timeToDailyTimestamp(this.state[sensor].time, task.originDate);
    var endTime = util.timeToDailyTimestamp(this.state[sensor].time, task.originDate);
    var offset = 30 * 60 * 1000; // 30 mins in milliseconds

    if (this.state[sensor].value == 0) {
      if (time > targetTime + offset) {
        Notifications.send(this.state.id, {message: "reminder"});
      }

      if (time > endTime) {
        Notifications.send(this.state.id, {message: "unknown"});
        // finish should recreate the task at the right time, calling the init and setting active to true.
        // It should be immidiately after this so there is no point setting active to false.
        CoachingEngine.finish(task);
      }
    }
    else {
      if (time <= targetTime + offset || time >= targetTime - offset) {
        Notifications.send(this.state.id, {message: "success"})
        CoachingEngine.finish(task);
      }
      else {
        Notifications.send(this.state.id, {message: "failure"})
        CoachingEngine.finish(task);
      }

      // stop listening to the sensors
      this.state[sensor].active = false;
    }
  }
}






// ********************** stubs for required support classes: ********************** //

// used to handle tasks. Tasks are automatically rescheduled based on their times and the finish method.
var CoachingEngine = {};
CoachingEngine.state = {}; // state will be persisted
/**
 * API suggestion:
 * CoachingEngine will handle tasks. A task is a maintained scheduled entity.
 * The task will always ALSO trigger on the endTime. At this point it is expected that finish will be called.
 *
 * @param {Object}   options    |  {
 *                              |    messages:   Array   // array of messages that will be triggering the callback. Not only sensors, could be manually triggered messages as well.
 *                              |    repeat:    String,  // "daily"/"weekly" which defines how often the task is repeated
 *                              |    startTime: String,  // "00:00" to indicate when the task starts. In case of weekly it will be for the first day.
 *                              |    endTime:   String,  // "23:59" to indicate when the task ends. In case of weekly it will be for the last day.
 *                              |    startDay:  String,  // day of the week, Monday, Tuesday etc. Only relevant for weekly. Default: Monday
 *                              |    endDay:    String,  // day of the week, Monday, Tuesday etc. Only relevant for weekly. Default: Sunday
 *                              |    triggers:  Object   // {days: [Monday, Tuesday, ..], times: ["00:24","8:30", ..]} Object that defines when triggers will be fired.
 *                              |  }
 * @param {Function} callback
 */
CoachingEngine.addTask = function(options, callback) {};

/**
 * Will fire a task with the callback if there exists a task with this sensor in the array of relevant sensors.
 * @param {String} message
 * @param {Object} data
 */
CoachingEngine.updateTaskForMessage = function(message, data) {};

/**
 * This should mark the task as finished, making sure it will ONLY start listening for new date when the new period has been started
 * This is the what makes the task system better than the normal usage of the Scheduler.
 * @param {Object} task         | JSON task description
 */
CoachingEngine.finish = function(task) {};



// used to send and listen to Notifications.
var Notifications = {};
/**
 * This will notify the phone app with a certain topic and data
 * @param {String} topic
 * @param {Object} data
 */
Notifications.send   = function(topic, data) {};
Notifications.listen = function(topic, callback) {};



// the Scheduler will be used by the coaching engine entity
var Scheduler = {};
Scheduler.state = {}; // this will store the scheduled things and will be persisted.
/**
 * API suggestion:
 * Scheduler would be able to schedule firing of a certain function after a certain time.
 * It would also be able to be triggered manually and removed
 *
 * @param {Object} options     |   {
 *                             |     fromNow: Number, // Number of seconds from current time.
 *                             |     atTime:  Number, // TimeStamp at which the callback will be executed.
 *                             |     daily:   String, // A time definition "08:30" which will fire every day
 *                             |     weekly:  Object, // {day:[Monday, ...], time: "08:30"} define a weekday as String and a time that day as String
 *                             |   }
 * @param {Function} callback
 * @return {String} UUID
 */
Scheduler.schedule  = function(options, callback) {}; // schedule a callback
Scheduler.remove    = function(uuid) {};              // remove callback with UUID
Scheduler.reset     = function() {};                  // resets all scheduled callbacks

// an object with util methods. Stateless.
var util = {};
util.timeToDailyTimestamp = function (timeString, originDateTimeStamp) {}; // convert a string time "08:30" to a timestamp in the day of the originDate
util.uuid                 = function () {};                                // generate an uuid-v4
