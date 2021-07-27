const { GraphQLServer, PubSub } = require("graphql-yoga");
const path = require("path");

const messages = [];

// this is to define the structure of the types. ID itself is already a type in graphql
// the ! refers to must have,
// we can see that we can use the type immediately in Query
//
const typeDefs = `
  type Message {
    id: ID!
    user: String!
    content: String!
    avatar: String!
  }
  type Query {
    messages: [Message!]
  }
  type Mutation {
    postMessage(user: String!, content: String!, avatar: String!): ID!
  }
  type Subscription {
    messages: [Message!]
  }
`;

const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

const resolvers = {
  Query: {
    messages: () => messages,
  },
  Mutation: {
    postMessage: (parent, { user, content, avatar }) => {
      const id = messages.length;
      messages.push({
        id,
        user,
        content,
        avatar,
      });
      // iterating through the subscribers to call its "fn" or normally callback function
      subscribers.forEach((fn) => fn());
      return id;
    },
  },
  Subscription: {
    messages: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, { messages }));
        setTimeout(() => pubsub.publish(channel, { messages }), 0);
        return pubsub.asyncIterator(channel);
      },
    },
  },
};

const options = {
  port: 4000,
  cors: {
    credentials: true,
    origin: ["*"],
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server
  .start(options, ({ port }) => {
    console.log(`Server on http://localhost:${port}/`);
  })
  .then((error) => console.log("error"));
