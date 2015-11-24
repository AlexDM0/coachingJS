
// js mealtime coach



// variables
function outOfScope() {} // this would check if t is outside of the scope of the goal (ie. after the end time)
function getTime() {}


var mealtimeCoach = {
  constants: {
    breakfast: "07:30",
    lunch:     "12:30",
    dinner:    "18:30",
    offset:     30 * 60 // 30 minutes
  },
  sensors: ["meal_time_breakfast", "meal_time_lunch", "meal_time_dinner"],
  state: {
    meal_time_breakfast: 0,
    meal_time_lunch: 0,
    meal_time_dinner: 0
  },
  onTrigger: function(sensor, value) {
    if ( this.sensors.indexOf(sensor) !== -1 ) { this.state[value] += 1; }
  },
  goals:[
    {
      name: "breakfast",
      repeat: "daily",
      notifications: {
        reminder: function (t) {
          return this.state.meal_time_breakfast == 0 && t > getTime(this.constants.breakfast, this.constants.offset);
        },
        success: function (t) {
          return this.state.meal_time_breakfast != 0 && t <= getTime(this.constants.breakfast, this.constants.offset) || t >= getTime(this.constants.breakfast, -this.constants.offset);
        },
        fail: function (t) {
          return this.state.meal_time_breakfast != 0 && t > getTime(this.constants.breakfast, this.constants.offset) || t < getTime(this.constants.breakfast, -this.constants.offset);
        },
        unknown: function (t) {
          return this.state.meal_time_breakfast == 0 && outOfScope(t);
        }
      }
    },
    {
      name: "lunch",
      repeat: "daily",
      notifications: {
        reminder: function (t) {
          return this.state.meal_time_lunch == 0 && t > getTime(this.constants.lunch, this.constants.offset);
        },
        success: function (t) {
          return this.state.meal_time_lunch != 0 && t <= getTime(this.constants.lunch, this.constants.offset) || t >= getTime(this.constants.lunch, -this.constants.offset);
        },
        fail: function (t) {
          return this.state.meal_time_lunch != 0 && t > getTime(this.constants.lunch, this.constants.offset) || t < getTime(this.constants.lunch, -this.constants.offset);
        },
        unknown: function (t) {
          return this.state.meal_time_lunch == 0 && outOfScope(t);
        }
      }
    },
    {
      name: "dinner",
      repeat: "daily",
      notifications: {
        reminder: function (t) {
          return this.state.meal_time_dinner == 0 && t > getTime(this.constants.dinner, this.constants.offset);
        },
        success: function (t) {
          return this.state.meal_time_dinner != 0 && t <=  getTime(this.constants.dinner, this.constants.offset) || t >=  getTime(this.constants.dinner, -this.constants.offset);
        },
        fail: function (t) {
          return this.state.meal_time_dinner != 0 && t >  getTime(this.constants.dinner, this.constants.offset) || t <  getTime(this.constants.dinner, -this.constants.offset);
        },
        unknown: function (t) {
          return this.state.meal_time_dinner == 0 && outOfScope(t);
        }
      }
    }
  ]
}



console.log(mealtimeCoach)




