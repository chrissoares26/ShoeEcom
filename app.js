const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const cors = require("cors");
const multer = require("multer");

const errorController = require("./Ecom/controllers/error");
const User = require("./Ecom/models/user");

const PORT = process.env.PORT || 8080;

const corsOptions = {
  origin: "https://ecom-chrissoares.herokuapp.com/",
  optionsSuccessStatus: 200,
};

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  family: 4,
};

const MONGODB_URL =
  process.env.MONGODB_URL ||
  "mongodb+srv://chrissoares26:password123_@cluster0.12eur.mongodb.net/shop?retryWrites=true&w=majority";

const MONGODB_URI =
  "mongodb+srv://chrissoares26:password123_@cluster0.12eur.mongodb.net/shop";

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(cors(corsOptions));

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./Ecom/routes/admin");
const shopRoutes = require("./Ecom/routes/shop");
const authRoutes = require("./Ecom/routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(PORT);
  })
  .catch((err) => {
    console.log(err);
  });
