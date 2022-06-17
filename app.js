var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const crypto = require('crypto')

var app = express();

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

async function registerUserData (userData) {
  //
  const uri = "mongodb+srv://ceci:<password>@cluster0.oor3e.mongodb.net/?retryWrites=true&w=majority";
  //
  const client = new MongoClient(uri);
  //
  try {
    //
    await client.connect();
    //
    const result = await client.db("authentication").collection("users").insertOne(userData);

    if(result.acknowledged === true ) {
      return true
    } else {
      return false
    }
  } finally {
    // Close the connection to the MongoDB cluster
    await client.close();
  }
}

async function checkUserIsRegistred (email) {
  //
  const uri = "mongodb+srv://ceci:<password>@cluster0.oor3e.mongodb.net/?retryWrites=true&w=majority";
  //
  const client = new MongoClient(uri);
  //
  try {
    //
    await client.connect();
    //
    const cursor = client.db("authentication").collection("users").find({"email" : email});

    const result = await cursor.toArray()

    if(result.length > 0 ) {
      return true
    } else {
      return false
    }
  } finally {
    // Close the connection to the MongoDB cluster
    await client.close();
  }
}
//var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// view engine setup
app.engine('hbs', hbs.engine({extname : '.hbs'}));
app.set('view engine', 'hbs');

app.get('/', function(req, res) {
  res.render('home');
});

app.get('/register', function(req, res) {
  res.render('register');
});

/*const users = [
    // This user is added to the array to avoid creating a new user on each restart
    {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@email.com',
        // This is the SHA256 hash for value of `password`
        password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg='
    }
];*/

app.post('/register', (req, res) => {
  const { email, firstName, lastName, password, confirmPassword } = req.body;
  console.log(firstName)
  console.log(lastName)
  console.log(email)
    // Check if the password and confirm password fields match
    if (password === confirmPassword) {

        // Check if user  is already registered
        //if (users.find(user => user.email === email)) {
        if (checkUserIsRegistred(email) ) {

            res.render('register', {
                message: 'User already registered.',
                messageClass: 'alert-danger'
            });

            return;
        }

        const hashedPassword = getHashedPassword(password);

        // Store user into the database if you are using one
        if (registerUserData(
          {
            "firstName":  firstName,
            "lastName": lastName,
            "email": email,
            "password": hashedPassword
          }
        ) === true ) {
          res.render('login', {
            message: 'Registration Complete. Please login to continue.',
            messageClass: 'alert-success'
          });
        } else {
          res.render('register', {
            message: 'Database failure.',
            messageClass: 'alert-danger'
          });
        }
                     
    } else {
        res.render('register', {
            message: 'Password does not match.',
            messageClass: 'alert-danger'
        });
    }
});

app.get('/login', (req, res) => {
  res.render('login');
});

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

const authTokens = {};

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = getHashedPassword(password);

    const user = users.find(u => {
        return u.email === email && hashedPassword === u.password
    });

    if (user) {
        const authToken = generateAuthToken();

        // Store authentication token
        authTokens[authToken] = user;

        // Setting the auth token in cookies
        res.cookie('AuthToken', authToken);

        // Redirect user to the protected page
        res.redirect('/protected');
    } else {
        res.render('login', {
            message: 'Invalid username or password',
            messageClass: 'alert-danger'
        });
    }
});

app.use((req, res, next) => {
  const authToken = req.cookies['AuthToken'];
  req.user = authTokens[authToken];
  next();
});

app.get('/protected', (req, res) => {
    if (req.user) {
        res.render('protected');
    } else {
        res.render('login', {
            message: 'Please login to continue',
            messageClass: 'alert-danger'
        });
    }
    console.log(JSON.stringify(users));
});


module.exports = app;
