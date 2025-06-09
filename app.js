var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const e = require("express");
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
var cors = require('cors');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret_here';
const uri = 'mongodb+srv://admin:GymAIO123@gymaio.fzchvtj.mongodb.net/?retryWrites=true&w=majority&appName=GymAIO';

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const dbName = "gymaio";
const exercisesCollectionName = "exercises";
const mealsCollectionName = "goals";
const goalsCollectionName = "meals";
const plansCollectionName = "plans";
const recentWorkoutsCollectionName = "recentWorkouts";
const usersCollectionName = "users";

async function connectDB() {
    try {
        await client.connect();
        // Ping the 'foodioo' database to confirm connection
        await client.db(dbName).command({ ping: 1 });
        console.log("Connection to DB successful");
    } catch (err) {
        console.error("Error during DB connection: ", err);
        // Critical error: If the database isn't available, the app can't function.
        // Consider exiting the process or implementing a retry mechanism for production.
        process.exit(1); // Exit if DB connection fails on startup
    }
}

connectDB(); // Call connectDB to establish the connection when the app starts

function exercises() {
    return client.db(dbName).collection(exercisesCollectionName);
}

function meals() {
    return client.db(dbName).collection(mealsCollectionName);
}

function goals() {
    return client.db(dbName).collection(goalsCollectionName);
}

function plans() {
    return client.db(dbName).collection(plansCollectionName);
}

function recentWorkouts() {
    return client.db(dbName).collection(recentWorkoutsCollectionName);
}

function users() {
    return client.db(dbName).collection(usersCollectionName);
}

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token invalid or expired' });
    }
    console.log('Decoded user:', decoded);
    req.user = decoded; // You now have the payload (e.g., user ID, roles)
    next();
  });
};

var app = express();

app.use(cors()); // Enable CORS for all routes - good for development
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

//app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.send(
    { message: "I am functioning correctly!" }
  )
})

// Simple Login Endpoint (Typically POST)
app.post("/api/login", async (req, res) => {
    const {email, password} = req.body; // Assuming email and password in request body

    const user = await users().findOne({email: email, password: password});
    if (user) {
        const token = jwt.sign({email: user.email, id: user._id.toString()}, JWT_SECRET, {expiresIn: '1h'});
        res.json({message: "Login successful", token: token});
    } else {
        res.status(401).json({error: "Invalid credentials"});
    }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    const {firstname, lastname, email, password} = req.body;

    // Basic validation
    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({message: 'firstname, lastname, email and password required'});
    }

    // Check if user already exists
    const existingUser = await users().findOne({email: email});
    if (existingUser) {
        return res.status(409).json({message: 'User already exists'});
    }

    // Add new user
    const newUser = {email, password, admin: false}; // NOTE: password should be hashed in real apps
    await users().insertOne(newUser);

    // Optional: return JWT on signup
    //const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({message: 'User registered'});
});

//get user
app.get("/api/user", verifyToken, async (req, res) => {
    // Find user by email from the decoded token
    const user = await users().findOne({email: req.user.email});

    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }

    // Return user data without sensitive information (password)
    const userData = {
        id: user._id.toString(),
        email: user.email,
        admin: user.admin,
        // Add other user fields as needed
    };
    res.json({user: userData});
})


let curID = 1

async function getAllExercises(userId) {
    if (!ObjectId.isValid(userId)) {
        console.error("UserId is not valid for getAllExercises");
        return null; // Return null if ID is not valid, leading to a 404 in the route
    }

    return await exercises().find({userId: new ObjectId(userId)}).toArray()
}

async function getExerciseByID(userId, exerciseId) {

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(exerciseId)) {
        console.error("UserId or ExerciseId is not valid for getExerciseByID");
        return null; // Return null if ID is not valid, leading to a 404 in the route
    }

    return await exercises().findOne({_id: new ObjectId(exerciseId), userId: new ObjectId(userId)})
}

async function createNewExercise(userId, exercise) {
    if (!ObjectId.isValid(userId)) {
        console.error("UserId is not valid for createNewExercise");
        return null; // Return null if ID is not valid
    }

    exercise.lastModified = new Date()
    exercise.userId = new ObjectId(userId)
    await exercises().insertOne(exercise)
    return exercise
}

async function changeFavorite(userId, exerciseId, favorite) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(exerciseId)) {
        console.error("UserId or ExerciseId is not valid for changeFavorite");
        return null; // Return null if ID is not valid
    }
    let test = await exercises().findOneAndUpdate(
        {userId: new ObjectId(userId), _id: new ObjectId(exerciseId)}, // Filter by ID
        {
            $set: {
                favorite: favorite, // Apply updates from dishData
                lastModified: new Date() // Update the lastModified timestamp
            }
        },
        {returnDocument: 'after'} // Options: return the modified document
    );
    return true
}

async function updateExercise(userId, exerciseId, exercise) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(exerciseId)) {
        console.error("UserId or ExerciseId is not valid for updateExercise");
        return null; // Return null if ID is not valid
    }

    // Otherwise we get an error because _id is immutable
    if ('_id' in exercise ||'userId' in exercise) {
        delete exercise._id;
        delete exercise.userId;
    }

    return await exercises().findOneAndUpdate(
        {userId: new ObjectId(userId), _id: new ObjectId(exerciseId)}, // Filter by ID
        {
            $set: {
                ...exercise, // Apply updates from dishData
                lastModified: new Date() // Update the lastModified timestamp
            }
        },
        {returnDocument: 'after'} // Options: return the modified document
    );
}

async function deleteExercise(userId, exerciseId) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(exerciseId)) {
        console.error("UserId or ExerciseId is not valid for updateExercise");
        return null; // Return null if ID is not valid
    }

    const result = await exercises().deleteOne({_id: new ObjectId(exerciseId), userId: new ObjectId(userId)});
    return result.deletedCount > 0;
}

// Get exercises

app.get("/api/exercises", verifyToken, async (req, res) => {
    res.json({exercises: await getAllExercises(req.user.id)})
})

app.get("/api/exercises/:id", verifyToken, async (req, res) => {
    const id = req.params.id
    if (!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }

    const exercise = await getExerciseByID(req.user.id, id)
    if (!exercise) {
        res.status(404).json({error: "Element with given ID does not exist"})
    } else {
        res.json(exercise)
    }
})

//Post exercises (create new)

app.post("/api/exercises", verifyToken, async (req, res) => {
    const newExercise = req.body
    const newExerciseWithID = await createNewExercise(req.user.id, newExercise)

    res.status(201).json({kind: "Confirmation", message: "Creation successful", exercise: newExerciseWithID})
})

//Put exercise (update exercise)

app.put("/api/exercises/:id", verifyToken, async (req, res) => {
    const exercise = req.body
    const id = req.params.id

    if (!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }

    const updatedExercise = await updateExercise(req.user.id, id, exercise)

    if (!updatedExercise) {
        res.status(404).send()
        return
    }
    res.json({kind: "Confirmation", message: "Updating successful", updatedExercise: updatedExercise,})
})

//Patch exercise (favorite exercise)

app.patch("/api/exercises/:id", verifyToken, async (req, res) => {
    const id = req.params.id
    const favorite = req.query.favorite === 'true'

    if (!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }
    const success = await changeFavorite(req.user.id, id, favorite)

    if (success) {
        res.status(200).send({kind: "Confirmation", message: "Favoriting successful", id: id, favorite: favorite})
    } else {
        res.status(404).send({kind: "Error", message: "Favoriting not successful", id: id})
    }


})

//Delete exercise (delete exercise)

app.delete("/api/exercises/:id", verifyToken, async (req, res) => {
    const id = req.params.id

    if (!id) {
        res.status(400).send({error: "Request must contain an ID query parameter"})
        return
    }

    const success = await deleteExercise(req.user.id, id)

    if (success) {
        res.status(200).send({kind: "Confirmation", message: "Deletion successful", id: id})
    } else {
        res.status(404).send({kind: "Error", message: "Deletion not successful", id: id})
    }
})

//-------------------------------------------------------------------------------------------------------

async function getAllPlans(userId) {
    if (!ObjectId.isValid(userId)) {
        console.error("UserId is not valid for getAllPlans");
        return null; // Return null if ID is not valid, leading to a 404 in the route
    }

    return await plans().find({userId: new ObjectId(userId)}).toArray()
}

async function getPlanByID(userId, planId) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(planId)) {
        console.error("UserId or planId is not valid for getPlanByID");
        return null; // Return null if ID is not valid, leading to a 404 in the route
    }

    return await plans().findOne({_id: new ObjectId(planId), userId: new ObjectId(userId)})
}

async function createNewPlan(userId, plan) {
    if (!ObjectId.isValid(userId)) {
        console.error("UserId is not valid for createNewPlan");
        return null; // Return null if ID is not valid
    }

    plan.lastModified = new Date()
    plan.userId = new ObjectId(userId)
    await plans().insertOne(plan)
    return plan
}

async function updatePlan(userId, planId, plan) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(planId)) {
        console.error("UserId or planId is not valid for updatePlan");
        return null; // Return null if ID is not valid
    }

    // Otherwise we get an error because _id is immutable
    if ('_id' in plan || 'userId' in plan) {
        delete plan._id;
        delete plan.userId;
    }

    return await plans().findOneAndUpdate(
        {userId: new ObjectId(userId), _id: new ObjectId(planId)}, // Filter by ID
        {
            $set: {
                ...plan, // Apply updates from dishData
                lastModified: new Date() // Update the lastModified timestamp
            }
        },
        {returnDocument: 'after'} // Options: return the modified document
    );
}

async function deletePlan(userId, planId) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(planId)) {
        console.error("UserId or planId is not valid for deletePlan");
        return null; // Return null if ID is not valid
    }

    const result = await plans().deleteOne({_id: new ObjectId(planId), userId: new ObjectId(userId)});
    return result.deletedCount > 0;
}

// Get plans

app.get("/api/plans", verifyToken, async (req, res) => {
    res.json({plans: await getAllPlans(req.user.id)})
})

app.get("/api/plans/:id", verifyToken, async (req, res) => {
    const id = req.params.id
    if (!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }

    const plan = await getPlanByID(req.user.id, id)
    if (!plan) {
        res.status(404).json({error: "Element with given ID does not exist"})
    } else {
        res.json(plan)
    }
})

//Post Plans (create new)

app.post("/api/plans", verifyToken, async (req, res) => {
    const newPlan = req.body
    const newPlanWithID = await createNewPlan(req.user.id, newPlan)

    res.status(201).json({kind: "Confirmation", message: "Creation successful", plan: newPlanWithID})
})

//Put Plan (update plan)

app.put("/api/plans/:id", verifyToken, async (req, res) => {
    const plan = req.body
    const id = req.params.id

    if (!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }

    const updatedPlan = await updatePlan(req.user.id, id, plan)

    if (!updatedPlan) {
        res.status(404).send()
        return
    }
    res.json({kind: "Confirmation", message: "Updating successful", updatedPlan: updatedPlan})
})

//Delete plan

app.delete("/api/plans/:id", verifyToken, async (req, res) => {
    const id = req.params.id

    if (!id) {
        res.status(400).send({error: "Request must contain an ID query parameter"})
        return
    }

    const success = await deletePlan(req.user.id, id)

    if (success) {
        res.status(200).send({kind: "Confirmation", message: "Deletion successful", id: id})
    } else {
        res.status(404).send({kind: "Error", message: "Deletion not successful", id: id})
    }
})

//-------------------------------------------------------------------------------------------------------

//const recentWorkouts = new Map()

async function getAllRecentWorkouts(userId) {
    if (!ObjectId.isValid(userId)) {
        console.error("UserId is not valid for getAllRecentWorkouts");
        return null; // Return null if ID is not valid, leading to a 404 in the route
    }

    return await recentWorkouts().find({userId: new ObjectId(userId)}).toArray()
}

async function getRecentWorkoutByID(userId, recentWorkoutId) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(recentWorkoutId)) {
        console.error("UserId or recentWorkoutId is not valid for getRecentWorkoutByID");
        return null; // Return null if ID is not valid, leading to a 404 in the route
    }

    return await recentWorkouts().findOne({_id: new ObjectId(recentWorkoutId), userId: new ObjectId(userId)})
}

async function createNewRecentWorkout(userId, recentWorkout) {
    if (!ObjectId.isValid(userId)) {
        console.error("UserId is not valid for createNewRecentWorkout");
        return null; // Return null if ID is not valid
    }

    recentWorkout.lastModified = new Date()
    recentWorkout.userId = new ObjectId(userId)
    await recentWorkouts().insertOne(recentWorkout)
    return recentWorkout
}

// Get plans

app.get("/api/recentworkouts", verifyToken, async (req, res) => {
    res.json({workouts: await getAllRecentWorkouts(req.user.id)})
})

app.get("/api/recentworkouts/:id", verifyToken, async (req, res) => {
    const id = req.params.id
    if (!id) {
        res.status(400).json({error: "Request must contain an ID query parameter"})
        return
    }

    const recentWorkout = await getRecentWorkoutByID(req.user.id, id)
    if (!recentWorkout) {
        res.status(404).json({error: "Element with given ID does not exist"})
    } else {
        res.json(recentWorkout)
    }
})

//Post Plans (create new)

app.post("/api/recentworkouts", verifyToken, async (req, res) => {
    const newRecentWorkout = req.body
    const newRecentWorkoutWithID = await createNewRecentWorkout(req.user.id, newRecentWorkout)

    res.status(201).json({kind: "Confirmation", message: "Creation successful", workout: newRecentWorkoutWithID})
})

//-------------------------------------------------------------------------------------------------------


//const meals = []

/*const goals = {
  calories: 3000,
  proteins: 150,
  fats: 70,
  carbohydrates: 200
};*/

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
app.get("/api/goals", verifyToken, (req, res) => {
  res.json({goals: getAllGoals()})
})

//Goals get by type
app.get("/api/goals/:goalType", verifyToken, (req, res) => {
  const goalType = req.params.goalType;

  const goal = getGoalByType(goalType);

  if (goal === null || goal === undefined) {
    return res.status(404).json({ error: "Goal not found" });
  }

  res.json({ goal });
})


//Goals update
app.put("/api/goals", verifyToken, (req, res) => {
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
app.get("/api/meals", verifyToken, (_req, res) => {
  res.json({ meals: getAllMeals() })
})

//Meals create
app.post("/api/meals", verifyToken, (req, res) => {
  const meal = req.body 
  //TODO validate meal

  const newMealWithId = createNewMeal(meal)
  res.status(201).json(newMealWithId)
})


//Meals update
app.put("/api/meals/:id", verifyToken, (req, res) => {
  const meal = req.body

  const idParam = req.params["id"];
  const id = Number(idParam);

  if (!idParam) {
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
app.delete("/api/meals/:id", verifyToken, (req, res) => {
  const idParam = req.params["id"];
  const id = Number(idParam);

  if (!idParam) {
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
