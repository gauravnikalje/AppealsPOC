const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

// Define the Task Model
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('CKD Appeals AI Backend is running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

// POST /tasks - Create new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Title is required and cannot be empty'
      });
    }
    
    // Create the task
    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      completed: false
    });
    
    // Return the created task with 201 status
    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: 'Internal server error while creating task'
    });
  }
});

// GET /tasks - Retrieve all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      message: 'Tasks retrieved successfully',
      count: tasks.length,
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('Error retrieving tasks:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving tasks'
    });
  }
});

// GET /tasks/:id - Retrieve a specific task by ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID. Must be a number.'
      });
    }
    
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }
    
    res.status(200).json({
      message: 'Task retrieved successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error retrieving task:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving task'
    });
  }
});

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, completed } = req.body;
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID. Must be a number.'
      });
    }
    
    // Find the task
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }
    
    // Prepare update data (only update provided fields)
    const updateData = {};
    
    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({
          error: 'Title cannot be empty if provided'
        });
      }
      updateData.title = title.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }
    
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({
          error: 'Completed must be a boolean value'
        });
      }
      updateData.completed = completed;
    }
    
    // Update the task
    await task.update(updateData);
    
    // Return the updated task
    res.status(200).json({
      message: 'Task updated successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      error: 'Internal server error while updating task'
    });
  }
});

// Initialize database and start server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync();
    console.log('Database synced successfully. Tasks table created/updated.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Create task: POST http://localhost:${PORT}/tasks`);
      console.log(`Get all tasks: GET http://localhost:${PORT}/tasks`);
      console.log(`Get task by ID: GET http://localhost:${PORT}/tasks/:id`);
      console.log(`Update task: PUT http://localhost:${PORT}/tasks/:id`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
})();

module.exports = { sequelize, Task, app };
