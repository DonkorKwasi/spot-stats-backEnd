
const express = require('express');
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");
dotenv.config();


const userService = require("./user-service.js");
const HTTP_PORT = process.env.PORT || 8000
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;
let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.JWT_SECRET 
let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        // The following will ensure that all routes using
        // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values
        // that matches the request payload data
        next(null, {
          _id: jwt_payload._id,
          userName: jwt_payload.userName,
        
        });
      } else {
        next(null, false);
      }
    });
    passport.use(strategy);
app.use(passport.initialize());
app.use(express.json());
app.use(cors());

app.post("/api/user/register", (req, res) => {
  userService.registerUser(req.body)
  .then((msg) => {
      res.json({ "message": msg });
  }).catch((msg) => {
      res.status(422).json({ "message": msg });
  });
});
app.post("/api/user/login", (req, res) => {
  userService.checkUser(req.body).then((user) => {
      console.log(user);
      let payload = {
          _id: user._id,
          userName: user.userName,
         
        };
        let token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.status(200).json({ "message": "login complete", token :token})
  }).catch(msg => {
      res.status(422).json({ error: msg });
  })
});

app.get("/api/user/reviews", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.getReviews(req.user._id)
  .then(data => {
      res.json(data);
  }).catch(msg => {
      res.status(422).json({ error: msg });
  })

});

app.put("/api/user/reviews", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.addReview(req.user._id, req.body)
  .then(data => {
      res.json(data)
  }).catch(msg => {
      res.status(422).json({ error: msg });
  })
});
app.delete("/api/user/reviews/", passport.authenticate('jwt', { session: false }), (req, res) => {
  userService.removeFavourite(req.user._id, req.body)
  .then(data => {
      res.json(data)
  }).catch(msg => {
      res.status(422).json({ error: msg });
  })
});


userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})