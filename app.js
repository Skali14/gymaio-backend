var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

//TODO Simon

//-------------------------------------------------------------------------------------------------------

//TODO Michi

//Goals get

//Goals update


//Meals get

//Meals create

//Meals update
app.put("/api/meals/:id", (req, res) => {
  const meal = req.body

  const id = req.params["id"]
  // Additional verification possible (e.g., check that id is a number)

  // We should validate dish here (does it contain all necessary fields, etc.).
  // We could use a validation library for that, which could check the object agains a specified schema.

  const updatedMeal = updateMeal(id, meal)

  if (!updatedMeal) {
    res.status(404).send()
    return
  }

  // Explicit status 200 (OK) not necessary
  res.status(200).json(updatedMeal)
})

//Meals delete



module.exports = app;
