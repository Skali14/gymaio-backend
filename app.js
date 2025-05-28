var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const e = require("express");
var cors = require('cors');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret_here';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalid or expired' });
    }

    req.user = decoded; // You now have the payload (e.g., user ID, roles)
    next();
  });
};

var app = express();

app.use(cors()); // Enable CORS for all routes - good for development
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

const users = [
  { email: 'test@gmail.com', password: 'password123' },
  { email: 'test2@gmail.com', password: 'secret456' },
];

// Simple Login Endpoint (Typically POST)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body; // Assuming email and password in request body

  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: "Login successful", token: token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Register endpoint
app.post('/api/register', (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // Basic validation
  if (!firstname || !lastname ||!email ||!password) {
    return res.status(400).json({ message: 'firstname, lastname, email and password required' });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  // Add new user
  const newUser = { email, password }; // NOTE: password should be hashed in real apps
  users.push(newUser);

  // Optional: return JWT on signup
  //const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

  res.status(201).json({ message: 'User registered'});
});



//TODO Simon

let curID = 1
const exercises = []

function getAllExercises() {
    return exercises
}

function getExerciseByID(id) {
    const index = exercises.findIndex(e => e.id == id);
    if (index === -1) {
        return false;
    }

    return exercises[index]
}

function createNewExercise(exercise) {
    exercise.id = curID++
    exercise.lastModified = new Date()
    exercises.push(exercise)
    return exercise
}

function changeFavorite(id, favorite) {
    const index = exercises.findIndex(e => e.id == id);
    if (index === -1) {
        return false;
    }
    getExerciseByID(id).favorite = favorite
    return true
}

function updateExercise(id, exercise) {
    const index = exercises.findIndex(e => e.id == id)
    if (index === -1) {
        return null;
    }
    exercise.id = id
    exercise.lastModified = new Date()
    exercises[index] = exercise;
    return exercise;
}

function deleteExercise(id) {
  const index = exercises.findIndex(e => e.id == id);
  if (index === -1) {
    return false;
  }
  exercises.splice(index, 1);
  return true;
}

// Get exercises

app.get("/api/exercises", (req, res) => {
    res.json({exercises: getAllExercises()})
})

app.get("/api/exercises/:id", (req, res) => {
    const id = req.params.id
    if(!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }
    if (isNaN(id)) {
        res.status(400).json({error: "ID must be a number"})
        return;
    }
    const exercise = getExerciseByID(id)
    if(!exercise) {
        res.status(404).json({error: "Element with given ID does not exist"})
    } else {
        res.json(exercise)
    }
})

//Post exercises (create new)

app.post("/api/exercises", (req, res) => {
    const newExercise = req.body
    const newExerciseWithID = createNewExercise(newExercise)

    res.status(201).json({kind: "Confirmation", message: "Creation successful", exercise: newExerciseWithID})
})

//Put exercise (update exercise)

app.put("/api/exercises/:id", (req, res) => {
    const exercise = req.body
    const id = req.params.id

    if(!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }
    if (isNaN(id)) {
        res.status(400).json({error: "ID must be a number"})
        return;
    }

    const updatedExercise = updateExercise(id, exercise)

    if (!updatedExercise) {
        res.status(404).send()
        return
    }
    res.json({kind: "Confirmation", message: "Updating successful", updatedExercise: updatedExercise, })
})

//Patch exercise (favorite exercise)

app.patch("/api/exercises/:id", (req, res) => {
    const id = req.params.id
    const favorite = req.query.favorite

    if(!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }
    if (isNaN(id)) {
        res.status(400).json({error: "ID must be a number"})
        return;
    }

    const success = changeFavorite(id, favorite)

    if(success) {
        res.status(200).send({kind: "Confirmation", message: "Favoriting successful", id: id, favorite: favorite})
    } else {
        res.status(404).send({kind: "Error", message: "Favoriting not successful", id: id})
    }


})

//Delete exercise (delete exercise)

app.delete("/api/exercises/:id", (req, res) => {
    const id = req.params.id

    if (!id) {
        res.status(400).send({error: "Request must contain an ID query parameter"})
        return
  }
    if (isNaN(id)) {
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




const meals = []

const goals = {
  calories: 3000,
  proteins: 150,
  fats: 70,
  carbohydrates: 200
};

function getAllMeals() {
  // TODO: Perform DB search
  return meals
}

function createNewMeal(meal) {
  // TODO: Insert into DB
  meal.id = curID++
  meals.push(meal)
  return meal
}

function updateMeal(id, meal) {
  // TODO: Search and update in DB
  const index = meals.findIndex(meal => meal.id == id)
  console.log(index)
  if (index === -1) {
    // Meal not found
    return null
  }
  meal.id = id
  meals[index] = meal
  return meal
}

function deleteMeal(id) {
  // TODO: Delete from DB
  const index = meals.findIndex(meal => meal.id == id)
  if (index === -1) {
    //Meal not found
    return false 
  }
  meals.splice(index, 1)
  return true // Deletion successful
}

function getAllGoals() {
  // TODO: Perform DB search
  return goals
}

function getGoalByType(goalType) {
  // TODO: Perform DB search
  return goals[goalType] ?? null;
}

function updateGoal(goalType, value) {
  if (!(goalType in goals)) {
    return false;  // goalType not found
  }
  
  goals[goalType] = value;
  return true;
}

function deleteGoal(goalType) {
  return updateGoal(goalType, 0)
}



//Goals get
app.get("/api/goals", (req, res) => {
  res.json({goals: getAllGoals()})
})

//Goals get by type
app.get("/api/goals/:goalType", (req, res) => {
  const goalType = req.params.goalType;

  const goal = getGoalByType(goalType);

  if (goal === null || goal === undefined) {
    return res.status(404).json({ error: "Goal not found" });
  }

  res.json({ goal });
})


//Goals update
app.put("/api/goals", (req, res) => {
  const { goalType, value } = req.body

  if (typeof goalType !== "string" || typeof value !== "number" || value < 0) {
    return res.status(400).json({ error: "Invalid goalType or value" });
  }
  const success = updateGoal(goalType, value)
  if (!success) {
    res.status(404).json({ error: "Goal type not found" });
  }
  res.status(200).json({ message: "Goal updated successfully", goals });
})


//Meals get
app.get("/api/meals", (_req, res) => {
  res.json({ meals: getAllMeals() })
})

//Meals create
app.post("/api/meals", (req, res) => {
  const meal = req.body 
  //TODO validate meal

  const newMealWithId = createNewMeal(meal)
  res.status(201).json(newMealWithId)
})


//Meals update
app.put("/api/meals/:id", (req, res) => {
  const meal = req.body

  const idParam = req.params["id"];
  const id = Number(idParam);

  if (!idParam || isNaN(id)) {
    res.status(400).json({ error: "ID must be a valid number" });
    return;
  }

  const updatedMeal = updateMeal(id, meal)

  if (!updatedMeal) {
    res.status(404).send()
    return
  }

  // Explicit status 200 (OK) not necessary
  res.status(200).json(updatedMeal)
})

//Meals delete
app.delete("/api/meals/:id" , (req, res) => {
  const idParam = req.params["id"];
  const id = Number(idParam);

  if (!idParam || isNaN(id)) {
    res.status(400).json({ error: "ID must be a valid number" });
    return;
  }

  const success = deleteMeal(id)
  if (success) {
    res.status(204).send()
  } else {
    res.status(404).json({ kind: "Error", message: "Deletion not successful", id: id })
  }
})


module.exports = app;
