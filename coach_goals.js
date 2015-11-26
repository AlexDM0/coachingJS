
var ID = 'MealTimeCoach';

// everything inside the state will be stored and persisted.
var state = {}

// setup will set all the requirements
function setup(config) {
  state.config = config;

  CoachingEngine.addGoal({
    subscribe: ['meal_time_breakfast'],
    triggerTimes: {recurrence: "daily", time: ['09:00']},
    callback: {trigger:'onTrigger', destroy: 'onDestroy'},

    sensorName: 'meal_time_breakfast',
    startTime: '08:00',
    endTime: '09:00'
  });

  CoachingEngine.addGoal({
    subscribe: ['meal_time_lunch'],
    triggerTimes: {recurrence: "daily", time: ['13:00']},
    callback: {trigger:'onTrigger', destroy: 'onDestroy'},

    sensorName: 'meal_time_lunch',
    startTime: '12:00',
    endTime: '13:00'
  });

  CoachingEngine.addGoal({
    subscribe: ['meal_time_dinner'],
    triggerTimes: {recurrence: "daily", time: ['19:00']},
    callback: {trigger:'onTrigger', destroy: 'onDestroy'},

    sensorName: 'meal_time_dinner',
    startTime: '18:00',
    endTime: '19:00'
  });
}


function onTrigger(goal, time, sender, data) {
  var sensorPoints = Database.getDataPoints(
    {
      sensorName: goal.sensorName,
      fromTime: CoachingEngine.getTime("00:00", time),
      toTime: CoachingEngine.getTime(goal.endTime, time)
    },
    {
      sender: sender, data:data
    }
  );

  success(goal,time,sensorPoints);
  failure(goal,time,sensorPoints);
  reminder(goal,time,sensorPoints);
}


function success(goal, time, sensorPoints) {
  if (sensorPoints == 1 && CoachingEngine.inTimeRange(time, goal.startTime, goal.endTime) === true) {
    Notifications.send(ID, {message: 'success', goal: goal});
    CoachingEngine.goalReached(goal);
  }
}

function failure(goal, time, sensorPoints) {
  if (sensorPoints == 1 && CoachingEngine.inTimeRange(time, goal.startTime, goal.endTime) === false) {
    Notifications.send(ID, {message: 'failure', goal: goal});
    CoachingEngine.goalReached(goal);
  }
}

function reminder(goal, time, sensorPoints) {
  if (sensorPoints == 0 && CoachingEngine.afterTime(time, goal.endTime) === true) {
    Notifications.send(ID, {message: 'reminder', goal: goal});
  }
}

function onDestroy(goal, time) {
  var sensorPoints = Database.getDataPoints(goal.sensorName, CoachingEngine.getTime("00:00",time), CoachingEngine.getTime(goal.endTime,time)).length;
  if (sensorPoints == 0) {
    Notifications.send(ID, {message: 'unknown', goal: goal});
  }
}





// ********************** stubs for required support classes: ********************** //

// used to handle goals. Goals are automatically rescheduled based on their times and the finish method.
var CoachingEngine = {};
CoachingEngine.state = {}; // state will be persisted
/**
 * API suggestion:
 * CoachingEngine will handle goals. A goal is a maintained scheduled entity.
 * GOALS ARE ALWAYS RECURRING!
 * The goal will always ALSO trigger on the endTime. At this point it is expected that finish will be called.
 *
 * @param {Object}   options    |  {
 *                              |    messages:  Array    // array of messages that will be triggering the callback. Not only sensors, could be manually triggered messages as well.
 *                              |    repeat:    String,  // 'daily'/'weekly' which defines how often the goal is repeated
 *                              |    startTime: String,  // '00:00' to indicate when the goal starts. In case of weekly it will be for the first day.
 *                              |    endTime:   String,  // '23:59' to indicate when the goal ends. In case of weekly it will be for the last day.
 *                              |    startDay:  String,  // day of the week, Monday, Tuesday etc. Only relevant for weekly. Default: Monday
 *                              |    endDay:    String,  // day of the week, Monday, Tuesday etc. Only relevant for weekly. Default: Sunday
 *                              |    triggers:  Object   // {days: [Monday, Tuesday, ..], times: ['00:24','8:30', ..]} Object that defines when triggers will be fired.
 *                              |    ... whatever else you'd like
 *                              |    callbacks: {
 *                              |      init:    [string], // optional: the method fired when the goal is initialized
 *                              |      trigger: string,   // the method fired when the trigger is fired
 *                              |      finish:  [string]  // optional: the method fired when the goal is finished. Creation of new goal will be done automatically.
 *                              |    }
 *                                }
 */
CoachingEngine.addGoal = function(options, callback) {};

/**
 * This should mark the goal as finished, making sure it will ONLY start listening for new date when the new period has been started
 * This is the what makes the goal system better than the normal usage of the Scheduler.
 * @param {Object} goal         | JSON goal description
 */
CoachingEngine.goalReached = function(goal) {};


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
 *                             |     daily:   String, // A time definition '08:30' which will fire every day
 *                             |     weekly:  Object, // {day:[Monday, ...], time: '08:30'} define a weekday as String and a time that day as String
 *                             |   }
 * @param {string} callback   Function name of the callback. Can be a path to a method like 'myObject.myFunction'
 * @return {String} UUID
 */
Scheduler.schedule  = function(options, callback) {}; // schedule a callback
Scheduler.remove    = function(uuid) {};              // remove callback with UUID
Scheduler.reset     = function() {};                  // resets all scheduled callbacks

// an object with util methods. Stateless.
var util = {};
util.timeToDailyTimestamp = function (timeString, originDateTimeStamp) {}; // convert a string time '08:30' to a timestamp in the day of the originDate
util.uuid                 = function () {};                                // generate an uuid-v4