const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// ================= middleware =====================
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zjphxo3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db("chemistryCorner").collection("users");
    const loveStoriesCollection = client
      .db("chemistryCorner")
      .collection("loveStories");
    const membersCollection = client
      .db("chemistryCorner")
      .collection("members");

    // ==============users db create====================
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send("user already exists");
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // ================= love stories get==========================
    app.get("/loveStories", async (req, res) => {
      const result = await loveStoriesCollection.find().toArray();
      res.send(result);
    });

    // ============= all members ==================
    app.get("/members", async (req, res) => {
      const cursor = membersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/male", async (req, res) => {
      const query = { gender: "male" };
      const options = {
        projection: {
          _id: 1,
          photo: 1,
          name: 1,
          
          age: 1,
          location: 1,
          bio: 1,
        },
      };
      const cursor = membersCollection.find(query, options).limit(4);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/female", async (req, res) => {
      const query = { gender: "female" };
      const options = {
        projection: {
          _id: 1,
          photo: 1,
          name: 1,
          
          age: 1,
          location: 1,
          bio: 1,
        },
      };
      const cursor = membersCollection.find(query, options).limit(4);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/non-binary", async (req, res) => {
      const query = { gender: "non-binary" };
      const options = {
        projection: {
          _id: 1,
          photo: 1,
          name: 1,
          
          age: 1,
          location: 1,
          bio: 1,
        },
      };
      const cursor = membersCollection.find(query, options).limit(4);
      const result = await cursor.toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("chemistry corner test runing");
});

app.listen(port, () => {
  console.log(`chemistry corner is runing on port ${port}`);
});
