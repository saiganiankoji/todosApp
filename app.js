const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  {
    switch (true) {
      case hasPriorityAndStatusProperties(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
       status = '${status}'
        AND priority = '${priority}';`;

        data = await database.all(getTodosQuery);
        response.send(data);

        break;

      case hasPriorityProperty(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
       priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        if (data.length === 0) {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        response.send(data);
        break;
      case hasStatusProperty(request.query):
        getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        status = '${status}';`;

        data = await database.all(getTodosQuery);
        if (data.length === 0) {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        response.send(data);
        break;
      case hasCategoryAndStatusProperty(request.query):
        getTodosQuery = `
        SELECT
        *
      FROM
        todo
      WHERE
        status = '${status}'
        AND category = '${category}'`;

        data = await database.all(getTodosQuery);
        response.send(data);
        break;

      case hasCategoryProperty(request.query):
        getTodosQuery = `
        SELECT
        *
      FROM
        todo
      WHERE
         category = '${category}'`;
        data = await database.all(getTodosQuery);
        if (data.length === 0) {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        response.send(data);

        break;
      case hasCategoryAndPriorityProperty(request.query):
        getTodosQuery = `
        SELECT
        *
      FROM
        todo
      WHERE
         priority = '${priority}'
        AND category = '${category}'`;
        data = await database.all(getTodosQuery);
        response.send(data);
        break;

      default:
        getTodosQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%';`;
        data = await database.all(getTodosQuery);
        response.send(data);
    }
  }
});

const camelCase = (body) => {
  return {
    id: body.id,
    todo: body.todo,
    priority: body.priority,
    category: body.category,
    dueDate: body.due_date,
  };
};

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(camelCase(todo));
});

// app.get("/agenda/", async (request, response) => {});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status,category,due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}','${category}','${dueDate}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
