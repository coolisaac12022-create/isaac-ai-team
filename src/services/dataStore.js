const users = [
  {
    id: 1,
    name: 'Admin Demo',
    email: 'admin@demo.com',
    password: '123456',
    role: 'admin'
  }
];

const projects = [
  {
    id: 1,
    name: 'Projet IA de démonstration',
    description: 'Plateforme de gestion avec assistance AI.',
    ownerId: 1,
    createdAt: new Date().toISOString()
  }
];

const tasks = [
  {
    id: 1,
    projectId: 1,
    title: 'Préparer le plan du projet',
    description: 'Définir les objectifs et le périmètre',
    status: 'todo',
    assignedTo: 1,
    createdAt: new Date().toISOString()
  }
];

let nextIds = {
  user: 2,
  project: 2,
  task: 2
};

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}

function findUserById(id) {
  return users.find((user) => user.id === Number(id));
}

function listUsers() {
  return users.map(({ password, ...user }) => user);
}

function createUser({ name, email, password, role = 'user' }) {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('Un utilisateur avec cet email existe déjà.');
  }

  const user = {
    id: nextIds.user++,
    name,
    email,
    password,
    role
  };

  users.push(user);
  return { ...user, password: undefined };
}

function loginUser(email, password) {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    throw new Error('Identifiants invalides.');
  }

  return { ...user, password: undefined };
}

function listProjects() {
  return projects.map((project) => ({
    ...project,
    tasks: tasks.filter((task) => task.projectId === project.id)
  }));
}

function createProject({ name, description, ownerId }) {
  const project = {
    id: nextIds.project++,
    name,
    description: description || '',
    ownerId: Number(ownerId),
    createdAt: new Date().toISOString()
  };

  projects.push(project);
  return project;
}

function findProjectById(id) {
  return projects.find((project) => project.id === Number(id));
}

function listTasksForProject(projectId) {
  return tasks.filter((task) => task.projectId === Number(projectId));
}

function createTask({ projectId, title, description, status = 'todo', assignedTo }) {
  const task = {
    id: nextIds.task++,
    projectId: Number(projectId),
    title,
    description: description || '',
    status,
    assignedTo: assignedTo ? Number(assignedTo) : null,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  return task;
}

module.exports = {
  users,
  projects,
  tasks,
  createUser,
  listUsers,
  loginUser,
  listProjects,
  createProject,
  findProjectById,
  listTasksForProject,
  createTask,
  findUserById
};
