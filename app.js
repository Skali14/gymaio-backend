var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const e = require("express");

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.send(
    { message: "I am functioning correctly!" }
  )
})

//TODO Simon

let curID = 0
const exercises = []

function getAllExercises() {
    return exercises
}

function getExerciseByID(id) {
    return exercises.find(exercise => exercise.id === id)
}

function createNewExercise(exercise) {
    exercise.id = curID++
    exercises.push(exercise)
    return exercise
}

function changeFavorite(id, favorite) {
    const index = exercises.findIndex(e => e.id === id);
    if (index === -1) {
        return false;
    }
    getExerciseByID(id).favorite = favorite
    return true
}

function updateExercise(id, exercise) {
    const index = exercises.findIndex(e => e.id === id)
    console.log(index)
    if (index === -1) {
        return null;
    }
    exercise.id = id
    exercise.lastModified = new Date()
    exercises[index] = exercise;
    return exercise;
}

function deleteExercise(id) {
  // TODO: Delete from DB
  const index = exercises.findIndex(e => e.id === id);
  if (index === -1) {
    return false;
  }
  exercises.splice(index, 1);
  return true;
}

// Get exercises

app.get("/api/exercises", (req, res) => {
    res.json({dishes: getAllExercises()})
})

app.get("/api/exercise", (req, res) => {
    const id = req.query.id

    if(!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }
})

//Post exercises (create new)

app.post("/api/exercise/create", (req, res) => {
    const newExercise = req.body
    const newExerciseWithID = createNewExercise(newExercise)

    res.status(201).json(newExerciseWithID)
})

//Put exercise (update exercise)

app.put("/api/exercise/update", (req, res) => {
    const exercise = req.body
    const id = req.query["id"]

    if(!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }
    if (typeof id !== "number") {
        res.status(400).json({error: "ID must be a number"})
        return;
    }

    const updatedExercise = updateExercise(id, exercise)

    if (!updatedExercise) {
        res.status(404).send()
        return
    }
})

//Patch exercise (favorite exercise)

app.patch("/api/exercise/favorite", (req, res) => {
    const id = req.query["id"]
    const favorite = req.query["favorite"]

    if(!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }
    if (typeof id !== "number") {
        res.status(400).json({error: "ID must be a number"})
        return;
    }

    const success = changeFavorite(id, favorite)

    if(success) {
        res.status(200).send({kind: "Confirmation", message: "Favoriting successful", id: id})
    } else {
        res.status(404).send({kind: "Error", message: "Favoriting not successful", id: id})
    }


})

//Delete exercise (delete exercise)

app.delete("/api/exercise/delete", (req, res) => {
    const id = req.query["id"]

    if (!id) {
        res.status(400).send({error: "Request must contain an ID query parameter"})
        return
  }
    if (typeof id !== "number") {
        res.status(400).json({error: "ID must be a number"})
        return;
    }

    const success = deleteExercise(id)

    if(success) {
        res.status(200).send({kind: "Confirmation", message: "Deletion successful", id: id})
    } else {
        res.status(404).send({kind: "Error", message: "Deletion not successful", id: id})
    }
})

//-------------------------------------------------------------------------------------------------------

//TODO Michi

module.exports = app;
