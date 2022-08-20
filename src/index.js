const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

const findUsers = (username) =>
  users.find((user) => user.username === username);

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const userExists = findUsers(username);

  if (!userExists) {
    response.status(400).json({ error: "Usuário não encontrado" });
    return;
  }

  request.user = userExists;

  next();
}

function checkExistsTodoInUser(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    response.status(404).json({ error: "Todo não encontrado" });
    return;
  }

  request.todo = todo;

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userExists = findUsers(username);

  if (userExists) {
    response.status(400).json({ error: "Usuário não pode ser utilizado" });
    return;
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const todos = user.todos;

  response.json(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checkExistsTodoInUser,
  (request, response) => {
    const { title, deadline } = request.body;
    const { todo } = request;

    todo.title = title;
    todo.deadline = new Date(deadline);

    response.json(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checkExistsTodoInUser,
  (request, response) => {
    const { todo } = request;

    todo.done = true;

    response.json(todo);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checkExistsTodoInUser,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;

    user.todos = user.todos.filter((todo) => todo.id !== id);

    response.status(204).json();
  }
);

module.exports = app;
