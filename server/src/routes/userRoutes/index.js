const express = require("express");

const pool = require("../../config/db");
const UsersController = require("../../controllers/usersController");
const UsersService = require("../../services/usersService");
const UsersRepository = require("../../repositories/usersRepository");

const usersRepository = new UsersRepository({ pool });
const usersService = new UsersService({ usersRepository });
const controller = new UsersController({ usersService });

const router = express.Router();
router.get("/", controller.list);

module.exports = router;
