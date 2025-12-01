const express = require('express');
const router = express.Router();
const requireLogin = require('../middleware/auth');

router.get("/", (req, res) => {
    if (req.session.user) {
        res.redirect("/menu");
    } else {
        res.redirect("/login");
    }
});

router.get("/login", (req, res) => {
    if (req.session.user) return res.redirect("/menu");
    res.render("login", { title: "Login - Pomodoro Plant" });
});

router.get("/register", (req, res) => {
    if (req.session.user) return res.redirect("/menu");
    res.render("register", { title: "Register - Pomodoro Plant" });
});

router.get("/menu", requireLogin, (req, res) => {
    res.render("menu", { title: "Menu - Pomodoro Plant" });
});

router.get("/timer", requireLogin, (req, res) => {
    res.render("timer", { title: "Timer - Pomodoro Plant" });
});

router.get("/ending", requireLogin, (req, res) => {
    res.render("ending", { title: "Done - Pomodoro Plant" });
});

router.get("/plants", requireLogin, (req, res) => {
    res.render("plants", { title: "My Garden - Pomodoro Plant" });
});

module.exports = router;
