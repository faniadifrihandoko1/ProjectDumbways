const express = require("express");
const path = require("path");
const { Query } = require("pg");
const { config } = require("process");
const app = express();
const port = 5000;
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const session = require("express-session");

// Setting if condition hbs
hbs.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "==":
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case "===":
      return options.inverse(this);
  }
});
// Import Sequelize
const { Sequelize, QueryTypes } = require("sequelize");
// const sequelize = new Sequelize(config.development);
const sequelize = new Sequelize("personal_web", "postgres", "1234", {
  host: "localhost",
  dialect: "postgres",
});

// app.set = buat setting variabel global, configuration dll
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src/views"));

// menampung midlleware
app.use("/assets", express.static("src/assets"));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "masasih",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.get("/home", home);

app.get("/project", project);

app.get("/add-project", addProjectView);
app.post("/add-project", addProject);

app.get("/update-project/:id", updateProjectView);
app.post("/update-project", updateProject);

app.post("/project/:id", deleteProject);
app.get("/detail-project/:id", detailProject);
app.get("/contact-me", contactMe);
app.get("/testimonials", testimonials);

app.get("/login", loginView);
app.post("/login", login);
app.get("/register", registerView);
app.post("/register", register);
app.post("/logout", logout);
const data = [];

async function home(req, res) {
  const query = "SELECT * FROM projects";
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });
  obj.forEach(function (data) {
    data.duration = difference(data.start_date, data.end_date);
    data.techo = technologies(data.tech);
  });
  // console.log("ini data dari database", obj);
  // console.log("ini data dari database", obj);
  res.render("index", {
    data: obj,
    user: req.session.user,
    isLogin: req.session.isLogin,
  });
}

async function project(req, res) {
  res.render("project");
}

function addProjectView(req, res) {
  res.render("add-project", {
    user: req.session.user,
    isLogin: req.session.isLogin,
  });
}

async function addProject(req, res) {
  const {
    name,
    startDate,
    endDate,
    description,
    html5,
    css3,
    js,
    react,
    image,
  } = req.body;

  const tech = [];
  if (html5 == "true") {
    tech.push("'html5'");
  }
  if (css3 == "true") {
    tech.push("'css3'");
  }
  if (js == "true") {
    tech.push("'js'");
  }
  if (react == "true") {
    tech.push("'react'");
  }

  const query = `INSERT INTO projects(name,"start_date","end_date",description,tech,image) VALUES ('${name}','${startDate}','${endDate}','${description}',ARRAY [${tech}],'${image}')`;
  const obj = await sequelize.query(query, { type: QueryTypes.INSERT });
  obj.forEach(function (data) {
    data.duration = difference(data.start_date, data.end_date);
  });
  console.log("data berhasil di insert", obj);
  res.redirect("home");
}

async function updateProjectView(req, res) {
  const { id } = req.params;
  const query = `SELECT * FROM projects WHERE id=${id}`;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });

  res.render("update-project", {
    data: obj[0],
    user: req.session.user,
    isLogin: req.session.isLogin,
  });
}

async function updateProject(req, res) {
  const {
    id,
    name,
    startDate,
    endDate,
    description,
    html5,
    css3,
    js,
    react,
    image,
  } = req.body;

  const tech = [];
  if (html5 == "true") {
    tech.push("'html5'");
  }
  if (css3 == "true") {
    tech.push("'css3'");
  }
  if (js == "true") {
    tech.push("'js'");
  }
  if (react == "true") {
    tech.push("'react'");
  }

  const query = `UPDATE projects SET name='${name}',"start_date"='${startDate}',"end_date"='${endDate}',description='${description}', tech=ARRAY [${tech}],image='${image}' WHERE id=${id}`;
  const obj = await sequelize.query(query, { type: QueryTypes.UPDATE });
  console.log("DATA BARU DONG", obj);
  res.redirect("home");
}

async function deleteProject(req, res) {
  const { id } = req.params;

  // data.splice(id, 1)
  const query = `DELETE FROM projects WHERE id=${id}`;
  const obj = await sequelize.query(query, { type: QueryTypes.DELETE });
  res.redirect("/home");
}

async function detailProject(req, res) {
  const { id } = req.params;
  const query = `SELECT * FROM projects WHERE id=${id}`;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });
  // const waktu = difference(obj[0].start_date, obj[0].end_date);
  // Object.assign(obj[0], { duration: waktu });

  console.log("detail :", obj);
  // console.log("test", dataDetail.id);
  res.render("detail-project", {
    data: obj[0],
    user: req.session.user,
    isLogin: req.session.isLogin,
  });
}
function contactMe(req, res) {
  res.render("contact", {
    user: req.session.user,
    isLogin: req.session.isLogin,
  });
}

function testimonials(req, res) {
  res.render("testimonials", {
    user: req.session.user,
    isLogin: req.session.isLogin,
  });
}

function loginView(req, res) {
  res.render("login");
}
async function login(req, res) {
  const { email, password } = req.body;
  const query = `SELECT * FROM users WHERE email='${email}'`;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });

  if (obj.length == 0) {
    console.error("user not registered");
    return res.redirect("/login");
  }

  bcrypt.compare(password, obj[0].password, (err, result) => {
    if (result == 0) {
      console.error("Password is Wrong");
      return res.redirect("/login");
    }
    req.session.isLogin = true;
    // kirim data ke coockies saat login berhasil dan kita gunakan di hbs untuk perkondisian 
    req.session.user = {
      name: obj[0].name,
      email: obj[0].email,
    };
    res.redirect("/home");
  });
}
function registerView(req, res) {
  res.render("register");
}
async function register(req, res) {
  const { name, email, password } = req.body;
  const salt = 10;
  bcrypt.hash(password, salt, async (err, hash) => {
    const query = `INSERT INTO users(name,email,password) VALUES ('${name}','${email}','${hash}')`;
    const obj = await sequelize.query(query, { type: QueryTypes.INSERT });
    res.render("register");
  });
}

function logout(req, res) {
  req.session.destroy();
  res.redirect("/home");
}
// Function Durasi Waktu
function difference(start, end) {
  var time_difference = new Date(end) - new Date(start);

  let days_difference = time_difference / (1000 * 3600 * 24);
  let Month_difference = Math.floor(
    time_difference / (1000 * 3600 * 24 * 7 * 4)
  );
  let Years_difference = Math.floor(
    time_difference / (1000 * 3600 * 24 * 7 * 4 * 12)
  );

  if (Years_difference > 0) {
    return ` ${Years_difference} Tahun`;
  } else if (Month_difference > 0) {
    return ` ${Month_difference} Bulan`;
  } else {
    return ` ${days_difference} Hari`;
  }
}

function technologies(item) {
  if (item == undefined) {
    item.value = "false";
  }
}

console.log(difference("2023-10-26", "2023-11-15"));

app.listen(port, () => {
  console.log(`Server Berjalan di port${port}`);
});
