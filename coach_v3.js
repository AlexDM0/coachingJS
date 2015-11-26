
var COACH_ID = 'MealTimeCoach';
var MINUTE = 60 * 1000;

// "state" will be persisted automatically
var state = {};

/**
 * Initialize state and tasks for the mealtime coach.
 * This method is only executed once in the lifetime of a coach
 * @param {Object} config   An object containing:
 *                          {
 *                            breakfast: '07:00',
 *                            lunch:     '12:30',
 *                            dinner:    '18:00'
 *                          }
 */
function init(config) {
  // initialize a state for the coach
  state = {
    config: config,
    meal_time_breakfast: {value: 0, time: '07:30'},
    meal_time_lunch:     {value: 0, time: '12:30'},
    meal_time_dinner:    {value: 0, time: '18:00'}
  };

  // will fire at the endtime regardless, triggerTimes are other times this will trigger at.
  // binding the callback to the this with the state will be done here
  CoachingEngine.addTask({
    id: 'meal_time_breakfast',
    messages: ['meal_time_breakfast'],
    recurrence: 'daily',
    startTime: '00:00',
    endTime: '23:59',
    triggerTimes: [time(config.breakfast).add('00:30')],
    callbacks: {
      init: 'taskInit',
      trigger: 'taskEvaluate',
      finish: 'taskFinish'
    }
  });

  CoachingEngine.addTask({
    id: 'meal_time_lunch',
    messages: ['meal_time_lunch'],
    recurrence: 'daily',
    startTime: '00:00',
    endTime: '23:59',
    triggerTimes: [time(config.lunch).add('00:30')],
    callbacks: {
      init: 'taskInit',
      trigger: 'taskEvaluate',
      finish: 'taskFinish'
    }
  });

  CoachingEngine.addTask({
    id: 'meal_time_dinner',
    messages: ['meal_time_dinner'],
    recurrence: 'daily',
    startTime: '00:00',
    endTime: '23:59',
    triggerTimes: [time(config.dinner).add('00:30')],
    callbacks: {
      init: 'taskInit',
      trigger: 'taskEvaluate',
      finish: 'taskFinish'
    }
  });
}

function finish () {
  // ... do something at the end of the coaches life, say goodbye
}

function taskInit(task) {
  state[task.messages[0]].value = 0;
}

function taskFinish(task) {}


/**
 * This is an abitrarily named method that is bound in the setup to the task
 * @param {Object}  task      | A JSON object containing the information of the task as well as the initialization date of the task.
 * @param {Number}  time      | A timestamp of the time this method is invoked at.
 * @param {String}  [sender]  | The name of the sender that might have triggered this method. Can be empty if it was a clock tick instead of a sensor tick.
 * @param {Object}  [data]    | The data the sender supplied. Can be empty.
 */
function taskEvaluate(task, time, sender, data) {
  var stateData;
  // get the relevant state data
  if (sender === undefined) {
    stateData = state[task.id];
  }
  else {
    stateData = state[sender];
    stateData.value += 1;  // this is where the sensor data is processed into the state!
  }

  var targetTime = util.timeToDailyTimestamp(stateData.time, task.originDate);
  var endTime    = util.timeToDailyTimestamp(task.endTime, task.originDate);
  var offset = 30 * MINUTE;

  if (stateData.value === 0) {
    if (time > targetTime + offset) {
      Notifications.send(COACH_ID, {message: 'reminder', task: task});
    }
    if (time > endTime) {
      Notifications.send(COACH_ID, {message: 'unknown', task: task});
      CoachingEngine.finish(task);
    }
  }
  else {
    if (time <= targetTime + offset || time >= targetTime - offset) {
      Notifications.send(COACH_ID, {message: 'success', task: task});
      CoachingEngine.finishTask(task);
    }
    else {
      Notifications.send(COACH_ID, {message: 'failure', task: task});
      CoachingEngine.finishTask(task);
    }
  }
}






// ********************** stubs for required support classes: ********************** //

// used to handle tasks. Tasks are automatically rescheduled based on their times and the finish method.
// It persists the running tasks and related listeners
var CoachingEngine = {};

/**
 * Add a coach to the coaching engine. Will override old
 * @param {string} id      An identifier for the coach, for example "MealTimeCoach"
 * @param {Object} config  Configuration, containing:
 *                         {
 *                           init: function (config)    Initialization function for the coach
 *                         }
 */
CoachingEngine.registerCoach = function (id, config) {};

/**
 * API suggestion:
 * CoachingEngine will handle tasks. A task is a maintained scheduled entity.
 * TASKS ARE ALWAYS RECURRING!
 * The task will always ALSO trigger on the endTime. At this point it is expected that finish will be called.
 *
 * @param {Object}   config    |  {
 *                              |    messages:  Array    // array of messages that will be triggering the callback. Not only sensors, could be manually triggered messages as well.
 *                              |    repeat:    String,  // 'daily'/'weekly' which defines how often the task is repeated
 *                              |    startTime: String,  // '00:00' to indicate when the task starts. In case of weekly it will be for the first day.
 *                              |    endTime:   String,  // '23:59' to indicate when the task ends. In case of weekly it will be for the last day.
 *                              |    startDay:  String,  // day of the week, Monday, Tuesday etc. Only relevant for weekly. Default: Monday
 *                              |    endDay:    String,  // day of the week, Monday, Tuesday etc. Only relevant for weekly. Default: Sunday
 *                              |    triggers:  Object   // {days: [Monday, Tuesday, ..], times: ['00:24','8:30', ..]} Object that defines when triggers will be fired.
 *                              |    ... whatever else you'd like
 *                              |    callbacks: {
 *                              |      init:    [string], // optional: the method fired when the task is initialized
 *                              |      trigger: string,   // the method fired when the trigger is fired
 *                              |      finish:  [string]  // optional: the method fired when the task is finished. Creation of new task will be done automatically.
 *                              |    }
 *                                }
 */
CoachingEngine.addTask = function(config) {};

/**
 * This should mark the task as finished, making sure it will ONLY start listening for new date when the new period has been started
 * This is the what makes the task system better than the normal usage of the Scheduler.
 * @param {Object} task         | JSON task description
 */
CoachingEngine.finishTask = function(task) {};


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
// It persists the scheduled events
var Scheduler = {};

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
util.uuid = function () {}; // generate an uuid-v4
util.time = function () {   // creates a time object containing utilities to add/subtract an offset, like util.time('12:00').add('03:00').toString()
  return {
    add: function () {},
    subtract: function () {},
    toString: function () {}
  }
};