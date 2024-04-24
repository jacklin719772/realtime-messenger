import * as channels from "controllers/channels";
import * as directs from "controllers/directs";
import * as messages from "controllers/messages";
import * as users from "controllers/users";
import * as workspaces from "controllers/workspaces";
import cors from "cors";
import express from "express";
import { verifyToken } from "utils/auth";
import nodemailer from 'nodemailer';
import amqp from 'amqplib';
import WebSocket from 'ws';

const app = express();

app.set("json spaces", 2);
app.use(cors({ origin: "*", methods: "GET,POST,HEAD,OPTIONS,DELETE" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get(
  "/warm",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    return res.status(200).json({
      success: true,
    });
  }
);

const authMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    if (!(req.headers && req.headers.authorization))
      throw new Error("The function must be called by an authenticated user.");

    const token = req.headers.authorization.split("Bearer ")[1];
    if (!token)
      throw new Error("The function must be called by an authenticated user.");

    const decodedToken = (await verifyToken(token)) as any;

    res.locals.uid = decodedToken.uid;
    res.locals.token = token;
    return next();
  } catch (err) {
    return next(err);
  }
};

const channelsRouter = express.Router();
channelsRouter.use(authMiddleware);
channelsRouter.post("/", channels.createChannel);
channelsRouter.post("/:id", channels.updateChannel);
channelsRouter.post("/:id/members", channels.addMember);
channelsRouter.delete("/:id/members/:userId", channels.deleteMember);
channelsRouter.delete("/:id", channels.deleteChannel);
channelsRouter.post("/:id/archive", channels.archiveChannel);
channelsRouter.post("/:id/unarchive", channels.unarchiveChannel);
channelsRouter.post("/:id/typing_indicator", channels.typingIndicator);
channelsRouter.post("/:id/reset_typing", channels.resetTyping);

const directsRouter = express.Router();
directsRouter.use(authMiddleware);
directsRouter.post("/", directs.createDirect);
directsRouter.post("/:id/close", directs.closeDirect);
directsRouter.post("/:id/typing_indicator", directs.typingIndicator);
directsRouter.post("/:id/reset_typing", directs.resetTyping);

const workspacesRouter = express.Router();
workspacesRouter.use(authMiddleware);
workspacesRouter.post("/", workspaces.createWorkspace);
workspacesRouter.post("/:id", workspaces.updateWorkspace);
workspacesRouter.delete("/:id", workspaces.deleteWorkspace);
workspacesRouter.post("/:id/members", workspaces.addTeammate);
workspacesRouter.delete("/:id/members/:userId", workspaces.deleteTeammate);

const messagesRouter = express.Router();
messagesRouter.use(authMiddleware);
messagesRouter.post("/", messages.createMessage);
messagesRouter.post("/get/:id", messages.getMessage);
messagesRouter.post("/:id", messages.editMessage);
messagesRouter.delete("/:id", messages.deleteMessage);
messagesRouter.post("/:id/reactions", messages.editMessageReaction);
messagesRouter.post("/:id/notifications", messages.editMessageNotification);
messagesRouter.post("/:id/favorites", messages.addFavorite);
messagesRouter.post("/:id/favorites/:userId", messages.addFavorite);

const usersRouter = express.Router();
usersRouter.post("/", users.createUser);
usersRouter.post("/:id", authMiddleware, users.updateUser);
usersRouter.post("/:id/presence", authMiddleware, users.updatePresence);
usersRouter.post("/:id/read", authMiddleware, users.read);

const server = app.listen(4001, () => {
  console.log('Server running on port 4001');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: any) => {
  console.log('Client connected');

  // Handle messages from the client (React frontend)
  ws.on('message', (message: any) => {
    console.log(`Received message from client: ${message}`);
  });

  // You can also send messages to the client
  // ws.send('Welcome to WebSocket!');
});

async function connect() {
  try {
    const connection = await amqp.connect('amqp://admin:password@117.21.178.36:5672');
    const channel = await connection.createChannel();

    // Create a queue for receiving messages
    const queueName = 'messages';
    await channel.assertQueue(queueName, { durable: false });

    // Consume messages from the queue
    channel.consume(queueName, (message: any) => {
      console.log('Received message:', message.content.toString());
      // Handle the incoming message here
      // You can emit this message to your React frontend via WebSocket or other means
    }, { noAck: true });

    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Error connecting to RabbitMQ', error);
  }
}

connect();

app.post('/send-message', async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const message = req.body;
  
  try {
    const connection = await amqp.connect('amqp://admin:password@117.21.178.36:5672');
    const channel = await connection.createChannel();
    const queueName = 'messages';

    // Send message to the queue
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    console.log('Message sent:', message);

    res.locals.data = { message: 'Message sent successfully' };
    return next();
  } catch (error) {
    console.error('Error sending message', error);
    return next(error);
  }
});

const mailRouter = express.Router();
mailRouter.post("/", async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { from, to, subject, html } = req.body;

  const transporter = nodemailer.createTransport({
    host: "mail.uteamwork.com",
    port: 587,
    secure: false,
    auth: {
      user: "dalianjx@mail.uteamwork.com",
      pass: "wn719772"
    }
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    res.locals.data = {
      success: true,
    };
    return next();
  } catch (error) {
    console.error('Error sending email:', error);
    return next(error);
  }
});

app.use("/users", usersRouter);
app.use("/messages", messagesRouter);
app.use("/channels", channelsRouter);
app.use("/workspaces", workspacesRouter);
app.use("/directs", directsRouter);
app.use("/mail", mailRouter);

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!res.locals.data) throw new Error("The requested URL was not found.");
    res.statusCode = 200;
    if (res.locals.data === true) return res.end();
    res.set("Content-Type", "application/json");
    return res.json(res.locals.data);
  }
);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.set("Content-Type", "application/json");
    res.statusCode = 400;
    console.error(err.message);
    return res.json({
      error: {
        message: err.message,
      },
    });
  }
);

app.listen(4001, () =>
  console.log("🚀 Related:Chat API is listening on port 4001...")
);
