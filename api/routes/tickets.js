const router = require('express').Router();
const Ticket = require('../models/ticket.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const verify = require('../middleware/auth');

// @route  GET tickets/:projectId
// @desc   Get tickets overview collection of the project.
// @access Private 
router.get('/:projectId', verify, (req, res) => {
  Ticket.find({ projectId: req.params.projectId })
    .then(tickets => res.json(tickets))
    .catch(err => res.status(400).json('Error: ' + err));
});

// @route  POST tickets/create
// @desc   Create a new ticket of the project.
// @access Private
router.post('/create', verify, async (req, res) => {
  const {
    projectId,
    issueType,
    issuePriority,
    summary,
    description,
    assigneeId,
    reporterId,
  } = req.body;

  const newTicket = new Ticket({
    projectId,
    issueType,
    issuePriority,
    summary,
    description,
    assigneeId,
    reporterId,
    linkedEpic: null
  });

  try {
    //Create a new ticket
    const savedNewTicket = await newTicket.save();
    // Get a project key name which is a base of ticket key. ex: DEMO-001.
    const project = await Project.findById(projectId);
    const keyBase = project.key;
    // Create a key for the ticket based on project key name and global count number.
    const savedNewTicketWithKey = await Ticket.findOneAndUpdate(
      { _id: savedNewTicket._id },
      { $set: { key: `${keyBase}-${savedNewTicket.count}` } },
      { new: true, runValidator: true }
    )
    res.json(savedNewTicketWithKey)
  } catch (err) {
    res.status(400).send(err);
  }
});

// @route  POST tickets/create/epic
// @desc   Create a new epic ticket of the project.
// @access Private
router.post('/create/epic', verify, async (req, res) => {
  const {
    projectId,
    issueType,
    issuePriority,
    summary,
    description,
    assigneeId,
    reporterId,
    issueColor,
    dateRange,
  } = req.body;

  const newTicket = new Ticket({
    projectId,
    issueType,
    issuePriority,
    summary,
    description,
    assigneeId,
    reporterId,
    issueColor,
    dateRange,
  });

  try {
    //Create a new ticket
    const savedNewTicket = await newTicket.save();
    // Get a project key name which is a base of ticket key. ex: DEMO-001.
    const project = await Project.findById(projectId);
    const keyBase = project.key;
    // Create a key for the ticket based on project key name and global count number.
    const savedNewTicketWithKey = await Ticket.findOneAndUpdate(
      { _id: savedNewTicket._id },
      { $set: { key: `${keyBase}-${savedNewTicket.count}` } },
      { new: true, runValidator: true }
    )
    res.json(savedNewTicketWithKey)
  } catch (err) {
    res.status(400).send(err);
  }
});


// @route  DELETE tickets/:ticketId/
// @desc   Delete a ticket of the id
// @access Public
router.delete('/:ticketId', verify, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.ticketId);
    res.json(ticket);
  } catch (err) {
    res.status(400).send(err);
  }
});

// @route  POST tickets/update
// @desc   Update an existing ticket of the project.
// @access Private
router.post('/update/:id', verify, async (req, res) => {
  const ticketId = req.params.id;
  const { issueType, issuePriority, summary, description, assigneeId, reporterId } = req.body;
  try {
    const updatedData = {
      issueType,
      issuePriority,
      summary,
      description,
      assigneeId,
      reporterId,
    };
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      { $set: updatedData },
      { new: true, runValidator: true }
    );
    res.json(updatedTicket)
  } catch (err) {
    res.status(400).send(err);
  }
});

// @route  POST tickets/update/epic/:ticektId
// @desc   Update an existing epic ticket of the project.
// @access Private
router.post('/update/epic/:id', verify, async (req, res) => {
  const ticketId = req.params.id;
  const {
    issueType,
    issuePriority,
    summary,
    description,
    assigneeId,
    reporterId,
    issueColor,
    isEpicDone,
    dateRange
  } = req.body;

  try {
    const updatedData = {
      issueType,
      issuePriority,
      summary,
      description,
      assigneeId,
      reporterId,
      issueColor,
      isEpicDone,
      dateRange
    };
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      { $set: updatedData },
      { new: true, runValidator: true }
    );
    res.json(updatedTicket)
  } catch (err) {
    res.status(400).send(err);
  }
});

// @route  Post tickets/edit/link_epic/:id
// @desc   Link an epic with existing child issues.
// @access Private
router.post('/edit/link_epic/:id', verify, async (req, res) => {
  const ticketId = req.params.id;
  const { epicId } = req.body;
  try {
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      { $set: { linkedEpic: epicId } },
      { new: true, runValidator: true }
    );
    res.json(updatedTicket)
  } catch (err) {
    res.status(400).send(err);
  }
});

// @route  POST tickets/comment/:id
// @desc   Comment on a ticket.
// @access Private
router.post('/comment/:id', verify, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ticket = await Ticket.findById(req.params.id);

    const newComment = {
      user: user._id,
      text: req.body.text,
      name: user.name,
      pictureUrl: user.pictureUrl,
    };

    ticket.comments.unshift(newComment);

    await ticket.save();

    res.json(ticket.comments);
  } catch (err) {
    res.status(400).send(err);
  }
});

// @route  DELETE tickets/comment/:id/:comment_id
// @desc   Delete comment
// @access Private
router.delete('/comment/:id/:comment_id', verify, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    // Pull out comment
    const comment = ticket.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // Check user
    if (comment.user.toString() !== req.user._id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    ticket.comments = ticket.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await ticket.save();

    res.json(ticket.comments)
  } catch (err) {
    res.status(400).send(err);
  }
});



module.exports = router;