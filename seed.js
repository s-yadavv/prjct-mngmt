process.env.NODE_PATH = require('path').join(__dirname, 'server', 'node_modules');
require('module').Module._initPaths();

require('dotenv').config({ path: './server/.env' });

const mongoose = require('./server/node_modules/mongoose');
const bcrypt   = require('./server/node_modules/bcryptjs');

const MONGO_URI = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace('localhost', '127.0.0.1')
  : 'mongodb://127.0.0.1:27017/pm_dashboard';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin','manager','member'], default: 'member' },
  avatar:   { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const boardSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  color:       { type: String, default: '#6366f1' },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, default: 'member' } }],
  isArchived:  { type: Boolean, default: false },
}, { timestamps: true });

const listSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  board:      { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  position:   { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  list:        { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  board:       { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  position:    { type: Number, default: 0 },
  assignees:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  dueDate:     { type: Date, default: null },
  labels:      [{ type: String }],
  checklist:   [{ text: String, completed: { type: Boolean, default: false } }],
  isArchived:  { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const User  = mongoose.model('User',  userSchema);
const Board = mongoose.model('Board', boardSchema);
const List  = mongoose.model('List',  listSchema);
const Task  = mongoose.model('Task',  taskSchema);

const seed = async () => {
  console.log('Connecting to:', MONGO_URI);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });
  console.log('Connected!\n');

  await User.deleteMany({});
  await Board.deleteMany({});
  await List.deleteMany({});
  await Task.deleteMany({});
  console.log('Cleared existing data');

  const hash = await bcrypt.hash('password123', 12);
  console.log('Password hash sample:', hash.slice(0, 20) + '...');

  const verify = await bcrypt.compare('password123', hash);
  console.log('Hash self-check:', verify ? 'PASS' : 'FAIL');

  const [admin, manager, member1, member2] = await User.insertMany([
    { name: 'Alex Admin',      email: 'admin@demo.com',   password: hash, role: 'admin' },
    { name: 'Maria Manager',   email: 'manager@demo.com', password: hash, role: 'manager' },
    { name: 'Sam Developer',   email: 'sam@demo.com',     password: hash, role: 'member' },
    { name: 'Jordan Designer', email: 'jordan@demo.com',  password: hash, role: 'member' },
  ]);
  console.log('Users inserted (raw, no pre-save hook)');

  const savedAdmin = await User.findById(admin._id).lean();
  const loginCheck = await bcrypt.compare('password123', savedAdmin.password);
  console.log('Login pre-check (admin):', loginCheck ? 'PASS — login will work' : 'FAIL — password mismatch');

  const [board, board2] = await Board.insertMany([
    {
      title: 'Product Launch Q3',
      description: 'Track all tasks for the Q3 product launch',
      color: '#7c6ff7',
      owner: admin._id,
      members: [
        { user: admin._id,   role: 'admin' },
        { user: manager._id, role: 'manager' },
        { user: member1._id, role: 'member' },
        { user: member2._id, role: 'member' },
      ],
    },
    {
      title: 'Design System',
      description: 'Component library and design tokens',
      color: '#34d399',
      owner: manager._id,
      members: [
        { user: manager._id, role: 'admin' },
        { user: member2._id, role: 'member' },
      ],
    },
  ]);

  const [list1, list2, list3, list4] = await List.insertMany([
    { title: 'Backlog',     board: board._id, position: 0 },
    { title: 'In Progress', board: board._id, position: 1 },
    { title: 'Review',      board: board._id, position: 2 },
    { title: 'Done',        board: board._id, position: 3 },
  ]);

  const [ds1, ds2] = await List.insertMany([
    { title: 'To Do',       board: board2._id, position: 0 },
    { title: 'In Progress', board: board2._id, position: 1 },
  ]);

  await Task.insertMany([
    { title: 'Define launch goals',       description: 'Set OKRs for Q3',                    list: list1._id, board: board._id,  position: 0, priority: 'high',     assignees: [admin._id],                labels: ['strategy'],          createdBy: admin._id },
    { title: 'Competitor analysis',       description: 'Research top 5 competitors',          list: list1._id, board: board._id,  position: 1, priority: 'medium',   assignees: [manager._id],              labels: ['research'],          createdBy: admin._id },
    { title: 'Landing page redesign',     description: 'Redesign marketing landing page',     list: list2._id, board: board._id,  position: 0, priority: 'critical', assignees: [member2._id],              labels: ['design','frontend'], createdBy: manager._id, dueDate: new Date(Date.now()+3*86400000), checklist: [{text:'Wireframes',completed:true},{text:'High-fidelity mockups',completed:true},{text:'Developer handoff',completed:false}] },
    { title: 'API performance audit',     description: 'Profile and optimize slow endpoints', list: list2._id, board: board._id,  position: 1, priority: 'high',     assignees: [member1._id],              labels: ['backend'],           createdBy: admin._id },
    { title: 'Email campaign copy',       description: '',                                    list: list3._id, board: board._id,  position: 0, priority: 'medium',   assignees: [manager._id],              labels: ['marketing'],         createdBy: manager._id },
    { title: 'Beta user onboarding',      description: '',                                    list: list4._id, board: board._id,  position: 0, priority: 'high',     assignees: [member1._id, member2._id], labels: ['ux'],                createdBy: admin._id },
    { title: 'Set up CI/CD pipeline',     description: '',                                    list: list4._id, board: board._id,  position: 1, priority: 'medium',   assignees: [member1._id],              labels: ['devops'],            createdBy: member1._id },
    { title: 'Button component variants', description: '',                                    list: ds1._id,   board: board2._id, position: 0, priority: 'high',     assignees: [member2._id],              labels: ['components'],        createdBy: manager._id },
    { title: 'Typography scale',          description: '',                                    list: ds2._id,   board: board2._id, position: 0, priority: 'medium',   assignees: [member2._id],              labels: ['tokens'],            createdBy: manager._id },
  ]);

  console.log('\nSeed complete!');
  console.log('='.repeat(48));
  console.log('  admin@demo.com    / password123  (Admin)');
  console.log('  manager@demo.com  / password123  (Manager)');
  console.log('  sam@demo.com      / password123  (Member)');
  console.log('  jordan@demo.com   / password123  (Member)');
  console.log('='.repeat(48));

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('\nSeed failed:', err.message);
  if (err.name === 'MongooseServerSelectionError' || err.message.includes('timed out') || err.message.includes('ECONNREFUSED')) {
    console.error('\nCannot reach MongoDB. Try these steps:');
    console.error('  1. Open a new terminal and run:  mongod');
    console.error('     (or: mongod --dbpath C:\\data\\db)');
    console.error('  2. Wait for "Waiting for connections on port 27017"');
    console.error('  3. Run seed again: node seed.js');
  }
  process.exit(1);
});